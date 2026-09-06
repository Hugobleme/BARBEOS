import { describe, it, expect, beforeEach } from "vitest";

/**
 * ============================================================================
 * ATOMIC RESERVATION PRE-FLIGHT REHEARSAL TEST SUITE
 * ============================================================================
 *
 * NOTE ON ENVIRONMENT & CONCURRENCY:
 * This test suite executes in the local test environment using in-memory state
 * fixtures and transactional simulation. No production database mutations are
 * performed. Concurrency and isolation semantics (such as PostgreSQL partial
 * GiST exclusion constraint and advisory transaction locking) are simulated
 * deterministically via cooperative serialization barriers to verify expected
 * single-winner semantics without altering production data.
 */

// ----------------------------------------------------------------------------
// Types & Domain Entities
// ----------------------------------------------------------------------------

export type AppointmentStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";

export interface BarbershopFixture {
  id: string;
  name: string;
  active: boolean;
}

export interface ProfessionalFixture {
  id: string;
  barbershop_id: string;
  name: string;
  active: boolean;
}

export interface ServiceFixture {
  id: string;
  barbershop_id: string;
  name: string;
  price: number;
  duration_min: number;
  active: boolean;
}

export interface ShopBusinessHoursFixture {
  id: string;
  barbershop_id: string;
  weekday: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  opens_at: string; // "09:00"
  closes_at: string; // "19:00"
  closed: boolean;
}

export interface ProfessionalWorkingHoursFixture {
  id: string;
  professional_id: string;
  weekday: number;
  start_time: string; // "09:00"
  end_time: string; // "18:00"
  break_start?: string | null; // "12:00"
  break_end?: string | null; // "13:00"
  is_working: boolean;
}

export interface TimeOffFixture {
  id: string;
  professional_id: string;
  start_at: string; // ISO string
  end_at: string; // ISO string
}

export interface AppointmentRecord {
  id: string;
  barbershop_id: string;
  customer_id: string;
  professional_id: string;
  scheduled_start: string; // ISO string
  scheduled_end: string; // ISO string
  status: AppointmentStatus;
  total_amount: number;
  source: string;
}

export interface AppointmentServiceRecord {
  id: string;
  appointment_id: string;
  service_id: string;
  price_snapshot: number;
  duration_snapshot: number;
}

export interface CustomerRecord {
  id: string;
  barbershop_id: string;
  profile_id?: string | null;
  full_name: string;
  phone?: string | null;
  email?: string | null;
}

export interface CreateBookingRequest {
  barbershopId: string;
  professionalId: string;
  serviceIds: string[];
  scheduledStart: string; // ISO string
  customer: {
    id?: string;
    profileId?: string | null;
    fullName: string;
    phone?: string;
    email?: string;
  };
}

// ----------------------------------------------------------------------------
// Simulated Atomic Engine (rehearsing target create_public_booking RPC logic)
// ----------------------------------------------------------------------------

export class SimulatedAtomicBookingDatabase {
  public barbershops: BarbershopFixture[] = [];
  public professionals: ProfessionalFixture[] = [];
  public services: ServiceFixture[] = [];
  public shopBusinessHours: ShopBusinessHoursFixture[] = [];
  public workingHours: ProfessionalWorkingHoursFixture[] = [];
  public timeOffs: TimeOffFixture[] = [];
  public customers: CustomerRecord[] = [];
  public appointments: AppointmentRecord[] = [];
  public appointmentServices: AppointmentServiceRecord[] = [];

  // Simulated per-professional advisory lock mutex to test serialization
  private professionalLocks = new Map<string, Promise<void>>();

  public injectServiceFailure = false;

  private async acquireProfessionalLock(professionalId: string): Promise<() => void> {
    while (this.professionalLocks.has(professionalId)) {
      await this.professionalLocks.get(professionalId);
    }
    let release!: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      release = () => {
        this.professionalLocks.delete(professionalId);
        resolve();
      };
    });
    this.professionalLocks.set(professionalId, lockPromise);
    return release;
  }

  /**
   * Executes the exact logic planned for `public.create_public_booking(...)`
   */
  public async createPublicBooking(req: CreateBookingRequest): Promise<{
    appointment: AppointmentRecord;
    appointmentServices: AppointmentServiceRecord[];
  }> {
    // Acquire transaction lock on professional to serialize concurrent requests
    const releaseLock = await this.acquireProfessionalLock(req.professionalId);

    // Savepoint for rollback simulation
    const snapshotCustomers = [...this.customers];
    const snapshotAppointments = [...this.appointments];
    const snapshotApptServices = [...this.appointmentServices];

    try {
      // 1. Verify Barbershop
      const shop = this.barbershops.find((b) => b.id === req.barbershopId);
      if (!shop) throw new Error("Barbearia não encontrada.");
      if (!shop.active) throw new Error("Barbearia inativa não aceita agendamentos.");

      // 2. Verify Professional
      const pro = this.professionals.find((p) => p.id === req.professionalId);
      if (!pro) throw new Error("Profissional não encontrado.");
      if (pro.barbershop_id !== req.barbershopId) {
        throw new Error("Profissional não pertence a esta barbearia.");
      }
      if (!pro.active) throw new Error("Profissional inativo.");

      // 3. Verify Services
      if (!req.serviceIds || req.serviceIds.length === 0) {
        throw new Error("Nenhum serviço selecionado.");
      }
      const selectedServices: ServiceFixture[] = [];
      let totalDuration = 0;
      let totalAmount = 0;

      for (const sId of req.serviceIds) {
        const s = this.services.find((serv) => serv.id === sId);
        if (!s) throw new Error(`Serviço ${sId} não encontrado.`);
        if (s.barbershop_id !== req.barbershopId) {
          throw new Error("Serviço não pertence a esta barbearia.");
        }
        if (!s.active) throw new Error(`Serviço ${s.name} está inativo.`);
        selectedServices.push(s);
        totalDuration += s.duration_min;
        totalAmount += s.price;
      }

      // 4. Calculate Times
      const startDate = new Date(req.scheduledStart);
      if (isNaN(startDate.getTime())) throw new Error("Data de início inválida.");
      const endDate = new Date(startDate.getTime() + totalDuration * 60000);

      if (endDate <= startDate) {
        throw new Error("Duração inválida do agendamento.");
      }

      // 5. Operating Hours Verification
      const weekday = startDate.getUTCDay();
      const shopHours = this.shopBusinessHours.find(
        (sh) => sh.barbershop_id === req.barbershopId && sh.weekday === weekday,
      );
      if (!shopHours || shopHours.closed) {
        throw new Error("A barbearia está fechada nesta data.");
      }

      const startHM = startDate.toISOString().slice(11, 16);
      const endHM = endDate.toISOString().slice(11, 16);

      if (startHM < shopHours.opens_at || endHM > shopHours.closes_at) {
        throw new Error("Horário fora do expediente da barbearia.");
      }

      // 6. Professional Working Hours Verification
      const proHours = this.workingHours.find(
        (wh) => wh.professional_id === req.professionalId && wh.weekday === weekday,
      );
      if (!proHours || !proHours.is_working) {
        throw new Error("Profissional não atende nesta data.");
      }
      if (startHM < proHours.start_time || endHM > proHours.end_time) {
        throw new Error("Horário fora do expediente do profissional.");
      }

      // 7. Professional Break Verification
      if (proHours.break_start && proHours.break_end) {
        const hasBreakOverlap = startHM < proHours.break_end && endHM > proHours.break_start;
        if (hasBreakOverlap) {
          throw new Error("Horário coincide com o intervalo do profissional.");
        }
      }

      // 8. Time-Off Verification
      const timeOffConflict = this.timeOffs.find((to) => {
        if (to.professional_id !== req.professionalId) return false;
        const toStart = new Date(to.start_at).getTime();
        const toEnd = new Date(to.end_at).getTime();
        return startDate.getTime() < toEnd && endDate.getTime() > toStart;
      });
      if (timeOffConflict) {
        throw new Error("Profissional em período de folga/afastamento.");
      }

      // 9. Concurrency & Overlap Exclusion Check (PostgreSQL GiST simulation)
      // Blocking statuses: scheduled, in_progress
      const hasOverlap = this.appointments.some((a) => {
        if (a.professional_id !== req.professionalId) return false;
        if (!["scheduled", "in_progress"].includes(a.status)) return false;

        const aStart = new Date(a.scheduled_start).getTime();
        const aEnd = new Date(a.scheduled_end).getTime();
        const nStart = startDate.getTime();
        const nEnd = endDate.getTime();

        // Half-open interval [start, end) overlap: aStart < nEnd AND aEnd > nStart
        return aStart < nEnd && aEnd > nStart;
      });

      if (hasOverlap) {
        const err: any = new Error(
          "Conflito de agendamento: o profissional já possui compromisso neste horário.",
        );
        err.code = "23P01"; // exclusion_violation
        throw err;
      }

      // 10. Customer Resolution or Creation
      let customerId = req.customer.id;
      if (!customerId) {
        const existing = this.customers.find(
          (c) =>
            c.barbershop_id === req.barbershopId &&
            ((req.customer.profileId && c.profile_id === req.customer.profileId) ||
              (req.customer.phone && c.phone === req.customer.phone)),
        );
        if (existing) {
          customerId = existing.id;
        } else {
          customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          this.customers.push({
            id: customerId,
            barbershop_id: req.barbershopId,
            profile_id: req.customer.profileId || null,
            full_name: req.customer.fullName,
            phone: req.customer.phone || null,
            email: req.customer.email || null,
          });
        }
      }

      // 11. Insert Appointment
      const apptId = `appt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newAppt: AppointmentRecord = {
        id: apptId,
        barbershop_id: req.barbershopId,
        customer_id: customerId,
        professional_id: req.professionalId,
        scheduled_start: startDate.toISOString(),
        scheduled_end: endDate.toISOString(),
        status: "scheduled",
        total_amount: totalAmount,
        source: "web",
      };
      this.appointments.push(newAppt);

      // 12. Insert Appointment Services (with failure injection check)
      if (this.injectServiceFailure) {
        throw new Error("Erro simulado ao vincular serviços do agendamento");
      }

      const createdServices: AppointmentServiceRecord[] = [];
      for (const s of selectedServices) {
        const asRec: AppointmentServiceRecord = {
          id: `as_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          appointment_id: apptId,
          service_id: s.id,
          price_snapshot: s.price,
          duration_snapshot: s.duration_min,
        };
        this.appointmentServices.push(asRec);
        createdServices.push(asRec);
      }

      return {
        appointment: newAppt,
        appointmentServices: createdServices,
      };
    } catch (error) {
      // Transaction Rollback simulation
      this.customers = snapshotCustomers;
      this.appointments = snapshotAppointments;
      this.appointmentServices = snapshotApptServices;
      throw error;
    } finally {
      releaseLock();
    }
  }
}

// ----------------------------------------------------------------------------
// Test Suites
// ----------------------------------------------------------------------------

describe("Atomic Booking Pre-Flight Rehearsal (Local Simulation)", () => {
  let db: SimulatedAtomicBookingDatabase;

  const SHOP_ID = "shop_prestige_1";
  const SHOP_INACTIVE_ID = "shop_inactive_2";
  const OTHER_SHOP_ID = "shop_other_3";

  const PRO_ACTIVE_ID = "pro_lucas_1";
  const PRO_INACTIVE_ID = "pro_inactive_2";
  const PRO_OTHER_SHOP_ID = "pro_other_3";

  const SRV_HAIRCUT_ID = "srv_haircut_30m";
  const SRV_BEARD_ID = "srv_beard_20m";
  const SRV_INACTIVE_ID = "srv_inactive";
  const SRV_OTHER_SHOP_ID = "srv_other_shop";

  // Reference date: Wednesday 2026-09-09 (UTC weekday = 3)
  const BASE_DATE_PREFIX = "2026-09-09T";

  beforeEach(() => {
    db = new SimulatedAtomicBookingDatabase();

    // 1. Barbershops
    db.barbershops = [
      { id: SHOP_ID, name: "Barbeos Prestige", active: true },
      { id: SHOP_INACTIVE_ID, name: "Barbeos Fechada", active: false },
      { id: OTHER_SHOP_ID, name: "Outra Barbearia", active: true },
    ];

    // 2. Professionals
    db.professionals = [
      { id: PRO_ACTIVE_ID, barbershop_id: SHOP_ID, name: "Lucas Barber", active: true },
      { id: PRO_INACTIVE_ID, barbershop_id: SHOP_ID, name: "Inativo Barber", active: false },
      { id: PRO_OTHER_SHOP_ID, barbershop_id: OTHER_SHOP_ID, name: "Outro Barber", active: true },
    ];

    // 3. Services
    db.services = [
      {
        id: SRV_HAIRCUT_ID,
        barbershop_id: SHOP_ID,
        name: "Corte Degradê",
        price: 50,
        duration_min: 30,
        active: true,
      },
      {
        id: SRV_BEARD_ID,
        barbershop_id: SHOP_ID,
        name: "Barba Terapia",
        price: 35,
        duration_min: 20,
        active: true,
      },
      {
        id: SRV_INACTIVE_ID,
        barbershop_id: SHOP_ID,
        name: "Serviço Descontinuado",
        price: 20,
        duration_min: 15,
        active: false,
      },
      {
        id: SRV_OTHER_SHOP_ID,
        barbershop_id: OTHER_SHOP_ID,
        name: "Serviço Outra Barbearia",
        price: 60,
        duration_min: 40,
        active: true,
      },
    ];

    // 4. Shop Operating Hours (Wednesday = 3, 09:00 - 19:00)
    db.shopBusinessHours = [
      {
        id: "sh_wed",
        barbershop_id: SHOP_ID,
        weekday: 3,
        opens_at: "09:00",
        closes_at: "19:00",
        closed: false,
      },
    ];

    // 5. Professional Working Hours (Wednesday = 3, 09:00 - 18:00, break 12:00 - 13:00)
    db.workingHours = [
      {
        id: "wh_pro_wed",
        professional_id: PRO_ACTIVE_ID,
        weekday: 3,
        start_time: "09:00",
        end_time: "18:00",
        break_start: "12:00",
        break_end: "13:00",
        is_working: true,
      },
    ];

    // 6. Existing Time-Off (14:00 - 15:00 UTC)
    db.timeOffs = [
      {
        id: "to_1",
        professional_id: PRO_ACTIVE_ID,
        start_at: `${BASE_DATE_PREFIX}14:00:00.000Z`,
        end_at: `${BASE_DATE_PREFIX}15:00:00.000Z`,
      },
    ];

    // 7. Existing Appointments
    db.appointments = [
      // Blocking appointment: 10:00 - 10:30 (scheduled)
      {
        id: "appt_existing_scheduled",
        barbershop_id: SHOP_ID,
        customer_id: "cust_1",
        professional_id: PRO_ACTIVE_ID,
        scheduled_start: `${BASE_DATE_PREFIX}10:00:00.000Z`,
        scheduled_end: `${BASE_DATE_PREFIX}10:30:00.000Z`,
        status: "scheduled",
        total_amount: 50,
        source: "web",
      },
      // Cancelled appointment: 11:00 - 11:30 (cancelled - must NOT block)
      {
        id: "appt_existing_cancelled",
        barbershop_id: SHOP_ID,
        customer_id: "cust_2",
        professional_id: PRO_ACTIVE_ID,
        scheduled_start: `${BASE_DATE_PREFIX}11:00:00.000Z`,
        scheduled_end: `${BASE_DATE_PREFIX}11:30:00.000Z`,
        status: "cancelled",
        total_amount: 50,
        source: "web",
      },
      // No-show appointment: 11:30 - 12:00 (no_show - must NOT block)
      {
        id: "appt_existing_no_show",
        barbershop_id: SHOP_ID,
        customer_id: "cust_3",
        professional_id: PRO_ACTIVE_ID,
        scheduled_start: `${BASE_DATE_PREFIX}11:30:00.000Z`,
        scheduled_end: `${BASE_DATE_PREFIX}12:00:00.000Z`,
        status: "no_show",
        total_amount: 50,
        source: "web",
      },
    ];
  });

  // --------------------------------------------------------------------------
  // Case 1: Valid Booking Creation
  // --------------------------------------------------------------------------
  it("1. creates a valid booking and links appointment_services with correct snapshots", async () => {
    const res = await db.createPublicBooking({
      barbershopId: SHOP_ID,
      professionalId: PRO_ACTIVE_ID,
      serviceIds: [SRV_HAIRCUT_ID, SRV_BEARD_ID], // 30m + 20m = 50m
      scheduledStart: `${BASE_DATE_PREFIX}09:00:00.000Z`,
      customer: {
        fullName: "Carlos Silva",
        phone: "11999998888",
        email: "carlos@teste.com",
      },
    });

    expect(res.appointment).toBeDefined();
    expect(res.appointment.status).toBe("scheduled");
    expect(res.appointment.scheduled_start).toBe(`${BASE_DATE_PREFIX}09:00:00.000Z`);
    expect(res.appointment.scheduled_end).toBe(`${BASE_DATE_PREFIX}09:50:00.000Z`);
    expect(res.appointment.total_amount).toBe(85); // 50 + 35

    expect(res.appointmentServices).toHaveLength(2);
    expect(res.appointmentServices[0].price_snapshot).toBe(50);
    expect(res.appointmentServices[0].duration_snapshot).toBe(30);
    expect(res.appointmentServices[1].price_snapshot).toBe(35);
    expect(res.appointmentServices[1].duration_snapshot).toBe(20);

    // Customer created in database
    const cust = db.customers.find((c) => c.phone === "11999998888");
    expect(cust).toBeDefined();
    expect(cust?.full_name).toBe("Carlos Silva");
  });

  // --------------------------------------------------------------------------
  // Case 2: Overlapping Booking Rejected
  // --------------------------------------------------------------------------
  it("2. rejects an overlapping booking for the same professional", async () => {
    // Existing is 10:00 - 10:30. Attempt 10:15 - 10:45
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_HAIRCUT_ID], // 30m
        scheduledStart: `${BASE_DATE_PREFIX}10:15:00.000Z`,
        customer: { fullName: "Cliente Conflito" },
      }),
    ).rejects.toThrow(/Conflito de agendamento/);
  });

  // --------------------------------------------------------------------------
  // Case 3: Back-to-Back Bookings Allowed
  // --------------------------------------------------------------------------
  it("3. allows back-to-back bookings exactly touching boundaries", async () => {
    // Existing is 10:00 - 10:30.
    // Booking A: 09:30 - 10:00 (ends exactly when existing begins)
    const before = await db.createPublicBooking({
      barbershopId: SHOP_ID,
      professionalId: PRO_ACTIVE_ID,
      serviceIds: [SRV_HAIRCUT_ID], // 30m
      scheduledStart: `${BASE_DATE_PREFIX}09:30:00.000Z`,
      customer: { fullName: "Cliente Antes" },
    });
    expect(before.appointment.scheduled_end).toBe(`${BASE_DATE_PREFIX}10:00:00.000Z`);

    // Booking B: 10:30 - 11:00 (starts exactly when existing ends)
    const after = await db.createPublicBooking({
      barbershopId: SHOP_ID,
      professionalId: PRO_ACTIVE_ID,
      serviceIds: [SRV_HAIRCUT_ID], // 30m
      scheduledStart: `${BASE_DATE_PREFIX}10:30:00.000Z`,
      customer: { fullName: "Cliente Depois" },
    });
    expect(after.appointment.scheduled_start).toBe(`${BASE_DATE_PREFIX}10:30:00.000Z`);
  });

  // --------------------------------------------------------------------------
  // Case 4: Cancelled Appointments Do Not Block
  // --------------------------------------------------------------------------
  it("4. allows booking in a slot vacated by a cancelled appointment", async () => {
    // Cancelled appointment is 11:00 - 11:30
    const res = await db.createPublicBooking({
      barbershopId: SHOP_ID,
      professionalId: PRO_ACTIVE_ID,
      serviceIds: [SRV_HAIRCUT_ID], // 30m
      scheduledStart: `${BASE_DATE_PREFIX}11:00:00.000Z`,
      customer: { fullName: "Cliente Slot Cancelado" },
    });
    expect(res.appointment.scheduled_start).toBe(`${BASE_DATE_PREFIX}11:00:00.000Z`);
    expect(res.appointment.status).toBe("scheduled");
  });

  // --------------------------------------------------------------------------
  // Case 5: No-Show Appointments Do Not Block
  // --------------------------------------------------------------------------
  it("5. allows booking in a slot previously occupied by a no_show appointment", async () => {
    // No-show appointment is 11:30 - 12:00
    const res = await db.createPublicBooking({
      barbershopId: SHOP_ID,
      professionalId: PRO_ACTIVE_ID,
      serviceIds: [SRV_HAIRCUT_ID], // 30m
      scheduledStart: `${BASE_DATE_PREFIX}11:30:00.000Z`,
      customer: { fullName: "Cliente Slot NoShow" },
    });
    expect(res.appointment.scheduled_start).toBe(`${BASE_DATE_PREFIX}11:30:00.000Z`);
    expect(res.appointment.status).toBe("scheduled");
  });

  // --------------------------------------------------------------------------
  // Case 6: Cross-Tenant IDs Rejected
  // --------------------------------------------------------------------------
  it("6. rejects cross-tenant professional or service IDs", async () => {
    // Foreign professional from other shop
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_OTHER_SHOP_ID,
        serviceIds: [SRV_HAIRCUT_ID],
        scheduledStart: `${BASE_DATE_PREFIX}13:00:00.000Z`,
        customer: { fullName: "Cliente Teste" },
      }),
    ).rejects.toThrow(/Profissional não pertence a esta barbearia/);

    // Foreign service from other shop
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_OTHER_SHOP_ID],
        scheduledStart: `${BASE_DATE_PREFIX}13:00:00.000Z`,
        customer: { fullName: "Cliente Teste" },
      }),
    ).rejects.toThrow(/Serviço não pertence a esta barbearia/);
  });

  // --------------------------------------------------------------------------
  // Case 7: Inactive Shop/Professional/Service Rejected
  // --------------------------------------------------------------------------
  it("7. rejects bookings with inactive shop, professional, or service", async () => {
    // Inactive shop
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_INACTIVE_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_HAIRCUT_ID],
        scheduledStart: `${BASE_DATE_PREFIX}09:00:00.000Z`,
        customer: { fullName: "Cliente Inativo" },
      }),
    ).rejects.toThrow(/Barbearia inativa/);

    // Inactive professional
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_INACTIVE_ID,
        serviceIds: [SRV_HAIRCUT_ID],
        scheduledStart: `${BASE_DATE_PREFIX}09:00:00.000Z`,
        customer: { fullName: "Cliente Inativo" },
      }),
    ).rejects.toThrow(/Profissional inativo/);

    // Inactive service
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_INACTIVE_ID],
        scheduledStart: `${BASE_DATE_PREFIX}09:00:00.000Z`,
        customer: { fullName: "Cliente Inativo" },
      }),
    ).rejects.toThrow(/está inativo/);
  });

  // --------------------------------------------------------------------------
  // Case 8: Outside Operating Hours Rejected
  // --------------------------------------------------------------------------
  it("8. rejects booking outside barbershop business hours", async () => {
    // Shop opens at 09:00. Attempt 08:30
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_HAIRCUT_ID],
        scheduledStart: `${BASE_DATE_PREFIX}08:30:00.000Z`,
        customer: { fullName: "Cliente Cedo Demais" },
      }),
    ).rejects.toThrow(/Horário fora do expediente da barbearia/);

    // Shop closes at 19:00. Attempt 18:45 for 30m service (ends at 19:15)
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_HAIRCUT_ID],
        scheduledStart: `${BASE_DATE_PREFIX}18:45:00.000Z`,
        customer: { fullName: "Cliente Tarde Demais" },
      }),
    ).rejects.toThrow(/Horário fora do expediente da barbearia/);
  });

  // --------------------------------------------------------------------------
  // Case 9: Outside Professional Hours Rejected
  // --------------------------------------------------------------------------
  it("9. rejects booking outside professional working hours", async () => {
    // Pro finishes at 18:00 (while shop is open until 19:00). Attempt 18:00
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_HAIRCUT_ID], // ends at 18:30
        scheduledStart: `${BASE_DATE_PREFIX}18:00:00.000Z`,
        customer: { fullName: "Cliente Fora Turno Pro" },
      }),
    ).rejects.toThrow(/Horário fora do expediente do profissional/);
  });

  // --------------------------------------------------------------------------
  // Case 10: Break Time Overlap Rejected
  // --------------------------------------------------------------------------
  it("10. rejects booking overlapping with professional break/lunch", async () => {
    // Pro break is 12:00 - 13:00. Attempt 12:15 - 12:45
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_HAIRCUT_ID],
        scheduledStart: `${BASE_DATE_PREFIX}12:15:00.000Z`,
        customer: { fullName: "Cliente No Almoço" },
      }),
    ).rejects.toThrow(/intervalo do profissional/);
  });

  // --------------------------------------------------------------------------
  // Case 11: Time-Off Overlap Rejected
  // --------------------------------------------------------------------------
  it("11. rejects booking during professional time-off", async () => {
    // Time off is 14:00 - 15:00. Attempt 14:15 - 14:45
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_HAIRCUT_ID],
        scheduledStart: `${BASE_DATE_PREFIX}14:15:00.000Z`,
        customer: { fullName: "Cliente Na Folga" },
      }),
    ).rejects.toThrow(/período de folga/);
  });

  // --------------------------------------------------------------------------
  // Case 12: Rollback Atomicity (No Orphaned Records)
  // --------------------------------------------------------------------------
  it("12. rolls back entire transaction if appointment_services insertion fails", async () => {
    const initialApptCount = db.appointments.length;
    const initialCustCount = db.customers.length;
    const initialApptServicesCount = db.appointmentServices.length;

    db.injectServiceFailure = true;

    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_HAIRCUT_ID],
        scheduledStart: `${BASE_DATE_PREFIX}16:00:00.000Z`,
        customer: {
          fullName: "Cliente Rollback Test",
          phone: "11988887777",
        },
      }),
    ).rejects.toThrow(/Erro simulado ao vincular serviços/);

    // Assert zero partial mutations remained
    expect(db.appointments.length).toBe(initialApptCount);
    expect(db.customers.length).toBe(initialCustCount);
    expect(db.appointmentServices.length).toBe(initialApptServicesCount);
    expect(db.customers.find((c) => c.phone === "11988887777")).toBeUndefined();
  });

  // --------------------------------------------------------------------------
  // Case 13: Parallel Concurrent Attempts (Exactly 1 Success, 1 Conflict)
  // --------------------------------------------------------------------------
  it("13. guarantees exactly one success and one conflict on concurrent parallel bookings", async () => {
    const slot = `${BASE_DATE_PREFIX}16:30:00.000Z`;

    const requestA = db.createPublicBooking({
      barbershopId: SHOP_ID,
      professionalId: PRO_ACTIVE_ID,
      serviceIds: [SRV_HAIRCUT_ID],
      scheduledStart: slot,
      customer: { fullName: "Cliente Paralelo A", phone: "11911111111" },
    });

    const requestB = db.createPublicBooking({
      barbershopId: SHOP_ID,
      professionalId: PRO_ACTIVE_ID,
      serviceIds: [SRV_HAIRCUT_ID],
      scheduledStart: slot,
      customer: { fullName: "Cliente Paralelo B", phone: "11922222222" },
    });

    const results = await Promise.allSettled([requestA, requestB]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // Exactly 1 winner, exactly 1 conflict
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const winnerResult = (fulfilled[0] as PromiseFulfilledResult<any>).value;
    expect(winnerResult.appointment.scheduled_start).toBe(slot);

    const errorResult = (rejected[0] as PromiseRejectedResult).reason;
    expect(errorResult.message).toMatch(/Conflito de agendamento/);
    expect(errorResult.code).toBe("23P01");
  });
});
