import { describe, it, expect, beforeEach } from "vitest";

/**
 * ============================================================================
 * ATOMIC RESERVATION PRE-FLIGHT & PRODUCTION REHEARSAL TEST SUITE
 * ============================================================================
 *
 * NOTE ON ENVIRONMENT & CONCURRENCY:
 * This test suite executes in the local test environment using in-memory state
 * fixtures and transactional simulation. Concurrency and isolation semantics
 * (such as PostgreSQL partial GiST exclusion constraint and advisory transaction
 * locking) are simulated deterministically via cooperative serialization barriers
 * to verify expected single-winner semantics without mutating production data.
 */

// ----------------------------------------------------------------------------
// Types & Domain Entities
// ----------------------------------------------------------------------------

export type AppointmentStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";

export interface BarbershopFixture {
  id: string;
  name: string;
  active: boolean;
  settings?: Record<string, any> | null;
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
  notes?: string | null;
  created_by?: string | null;
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
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  notes?: string | null;
  authenticatedProfileId?: string | null;
}

export interface MinimalBookingResult {
  appointment_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
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
   * Executes the exact logic implemented in `public.create_public_booking(...)`
   */
  public async createPublicBooking(req: CreateBookingRequest): Promise<MinimalBookingResult> {
    // 1. Basic input validation
    if (!req.barbershopId || !req.professionalId || !req.serviceIds || !req.scheduledStart) {
      throw new Error("BOOKING_INVALID_INPUT");
    }

    if (req.serviceIds.length === 0) {
      throw new Error("BOOKING_INVALID_INPUT");
    }

    // Check duplicate services
    const uniqueServices = new Set(req.serviceIds);
    if (uniqueServices.size !== req.serviceIds.length) {
      throw new Error("BOOKING_DUPLICATE_SERVICES");
    }

    const cleanName = (req.customerName || "").trim();
    const cleanPhone = (req.customerPhone || "").replace(/\D/g, "");
    const cleanEmail = req.customerEmail ? req.customerEmail.trim() : null;
    const cleanNotes = req.notes ? req.notes.trim() : null;

    if (cleanName.length === 0 || cleanName.length > 100) {
      throw new Error("BOOKING_INVALID_CUSTOMER_NAME");
    }

    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      throw new Error("BOOKING_INVALID_CUSTOMER_PHONE");
    }

    if (cleanEmail && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(cleanEmail)) {
      throw new Error("BOOKING_INVALID_CUSTOMER_EMAIL");
    }

    const startDate = new Date(req.scheduledStart);
    if (isNaN(startDate.getTime())) throw new Error("BOOKING_INVALID_INPUT");

    const now = new Date();
    // 5-minute tolerance for clock skew
    if (startDate.getTime() < now.getTime() - 5 * 60 * 1000) {
      throw new Error("BOOKING_PAST_DATE");
    }

    if (startDate.getTime() > now.getTime() + 180 * 24 * 60 * 60 * 1000) {
      throw new Error("BOOKING_HORIZON_EXCEEDED");
    }

    // Acquire transaction lock on professional to serialize concurrent requests
    const releaseLock = await this.acquireProfessionalLock(req.professionalId);

    // Savepoint for rollback simulation
    const snapshotCustomers = [...this.customers];
    const snapshotAppointments = [...this.appointments];
    const snapshotApptServices = [...this.appointmentServices];

    try {
      // 2. Barbershop validation
      const shop = this.barbershops.find((b) => b.id === req.barbershopId);
      if (!shop || !shop.active) {
        throw new Error("BOOKING_INVALID_SHOP");
      }

      // 3. Professional validation
      const pro = this.professionals.find((p) => p.id === req.professionalId);
      if (!pro || pro.barbershop_id !== req.barbershopId || !pro.active) {
        throw new Error("BOOKING_INVALID_PROFESSIONAL");
      }

      // 4. Services validation & totals calculation
      const selectedServices: ServiceFixture[] = [];
      let totalDuration = 0;
      let totalAmount = 0;

      for (const sId of req.serviceIds) {
        const s = this.services.find(
          (serv) => serv.id === sId && serv.barbershop_id === req.barbershopId && serv.active,
        );
        if (!s) {
          throw new Error("BOOKING_INVALID_SERVICES");
        }
        selectedServices.push(s);
        totalDuration += s.duration_min;
        totalAmount += s.price;
      }

      if (totalDuration <= 0) totalDuration = 30;
      const endDate = new Date(startDate.getTime() + totalDuration * 60000);

      // 5. Working-hours & schedule validation
      const weekday = startDate.getUTCDay();
      const shopHours = this.shopBusinessHours.find(
        (sh) => sh.barbershop_id === req.barbershopId && sh.weekday === weekday,
      );
      if (!shopHours) {
        throw new Error("BOOKING_OUTSIDE_BUSINESS_HOURS");
      }

      const startHM = startDate.toISOString().slice(11, 16);
      const endHM = endDate.toISOString().slice(11, 16);

      if (startHM < shopHours.opens_at || endHM > shopHours.closes_at) {
        throw new Error("BOOKING_OUTSIDE_BUSINESS_HOURS");
      }

      const proHours = this.workingHours.find(
        (wh) => wh.professional_id === req.professionalId && wh.weekday === weekday,
      );
      if (!proHours || !proHours.is_working) {
        throw new Error("BOOKING_OUTSIDE_PROFESSIONAL_HOURS");
      }

      if (startHM < proHours.start_time || endHM > proHours.end_time) {
        throw new Error("BOOKING_OUTSIDE_PROFESSIONAL_HOURS");
      }

      // Check Break
      if (proHours.break_start && proHours.break_end) {
        if (startHM < proHours.break_end && endHM > proHours.break_start) {
          throw new Error("BOOKING_PROFESSIONAL_ON_BREAK");
        }
      }

      // Check Time-Off
      const timeOffConflict = this.timeOffs.find((to) => {
        if (to.professional_id !== req.professionalId) return false;
        const toStart = new Date(to.start_at).getTime();
        const toEnd = new Date(to.end_at).getTime();
        return startDate.getTime() < toEnd && endDate.getTime() > toStart;
      });
      if (timeOffConflict) {
        throw new Error("BOOKING_PROFESSIONAL_UNAVAILABLE");
      }

      // 6. Overlap Exclusion Check (PostgreSQL GiST simulation)
      // Active blocking statuses: 'scheduled', 'in_progress'
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
        const err: any = new Error("BOOKING_SLOT_TAKEN");
        err.code = "23P01";
        throw err;
      }

      // 7. Customer resolution or creation
      let customerId: string | null = null;
      if (req.authenticatedProfileId) {
        const existingByProfile = this.customers.find(
          (c) =>
            c.barbershop_id === req.barbershopId && c.profile_id === req.authenticatedProfileId,
        );
        if (existingByProfile) customerId = existingByProfile.id;
      }

      if (!customerId) {
        const existingByPhone = this.customers.find(
          (c) =>
            c.barbershop_id === req.barbershopId &&
            (c.phone || "").replace(/\D/g, "") === cleanPhone,
        );
        if (existingByPhone) customerId = existingByPhone.id;
      }

      if (!customerId) {
        customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        this.customers.push({
          id: customerId,
          barbershop_id: req.barbershopId,
          profile_id: req.authenticatedProfileId || null,
          full_name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
        });
      }

      // 8. Insert Appointment
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
        notes: cleanNotes,
        created_by: req.authenticatedProfileId || null,
      };
      this.appointments.push(newAppt);

      // 9. Insert Appointment Services (with failure injection check)
      if (this.injectServiceFailure) {
        throw new Error("Simulated failure inserting appointment_services");
      }

      for (const s of selectedServices) {
        this.appointmentServices.push({
          id: `as_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          appointment_id: apptId,
          service_id: s.id,
          price_snapshot: s.price,
          duration_snapshot: s.duration_min,
        });
      }

      // Return minimal safe payload (zero PII)
      return {
        appointment_id: apptId,
        scheduled_start: startDate.toISOString(),
        scheduled_end: endDate.toISOString(),
        status: "scheduled",
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

describe("Atomic Booking RPC Invariants (Complete 19 Rehearsal Scenarios)", () => {
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

  // Dynamic future date: next Wednesday at 10:00 UTC
  // Ensures test is always in the future
  const getFutureWednesdayISO = (timeHM: string): string => {
    const d = new Date();
    d.setDate(d.getDate() + ((3 - d.getDay() + 7) % 7 || 7)); // Next Wednesday (weekday=3)
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${timeHM}:00.000Z`;
  };

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
        start_at: getFutureWednesdayISO("14:00"),
        end_at: getFutureWednesdayISO("15:00"),
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
        scheduled_start: getFutureWednesdayISO("10:00"),
        scheduled_end: getFutureWednesdayISO("10:30"),
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
        scheduled_start: getFutureWednesdayISO("11:00"),
        scheduled_end: getFutureWednesdayISO("11:30"),
        status: "cancelled",
        total_amount: 50,
        source: "web",
      },
      // Completed appointment: 11:30 - 12:00 (completed in the past / does not block if non-overlapping)
      {
        id: "appt_existing_completed",
        barbershop_id: SHOP_ID,
        customer_id: "cust_3",
        professional_id: PRO_ACTIVE_ID,
        scheduled_start: getFutureWednesdayISO("11:30"),
        scheduled_end: getFutureWednesdayISO("12:00"),
        status: "completed",
        total_amount: 50,
        source: "web",
      },
      // No-show appointment: 13:00 - 13:30 (no_show - must NOT block)
      {
        id: "appt_existing_no_show",
        barbershop_id: SHOP_ID,
        customer_id: "cust_4",
        professional_id: PRO_ACTIVE_ID,
        scheduled_start: getFutureWednesdayISO("13:00"),
        scheduled_end: getFutureWednesdayISO("13:30"),
        status: "no_show",
        total_amount: 50,
        source: "web",
      },
    ];
  });

  // 1. Valid anonymous/guest booking
  it("1. creates a valid anonymous/guest booking", async () => {
    const res = await db.createPublicBooking({
      barbershopId: SHOP_ID,
      professionalId: PRO_ACTIVE_ID,
      serviceIds: [SRV_HAIRCUT_ID],
      scheduledStart: getFutureWednesdayISO("09:00"),
      customerName: "Visitante Anonimo",
      customerPhone: "11999991111",
      customerEmail: "anonimo@teste.com",
    });

    expect(res.appointment_id).toBeDefined();
    expect(res.status).toBe("scheduled");
    expect(res.scheduled_start).toBe(getFutureWednesdayISO("09:00"));
    expect(res.scheduled_end).toBe(getFutureWednesdayISO("09:30"));

    const cust = db.customers.find((c) => c.phone === "11999991111");
    expect(cust).toBeDefined();
    expect(cust?.profile_id).toBeNull();
  });

  // 2. Valid authenticated customer booking
  it("2. creates a valid authenticated customer booking and attaches profile_id", async () => {
    const res = await db.createPublicBooking({
      barbershopId: SHOP_ID,
      professionalId: PRO_ACTIVE_ID,
      serviceIds: [SRV_HAIRCUT_ID],
      scheduledStart: getFutureWednesdayISO("09:30"),
      customerName: "Cliente Logado",
      customerPhone: "11999992222",
      authenticatedProfileId: "profile_uuid_123",
    });

    expect(res.appointment_id).toBeDefined();
    const cust = db.customers.find((c) => c.profile_id === "profile_uuid_123");
    expect(cust).toBeDefined();
    expect(cust?.full_name).toBe("Cliente Logado");
  });

  // 3. Inactive barbershop rejection
  it("3. rejects booking for inactive barbershop with BOOKING_INVALID_SHOP", async () => {
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_INACTIVE_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_HAIRCUT_ID],
        scheduledStart: getFutureWednesdayISO("09:00"),
        customerName: "Teste Inativo",
        customerPhone: "11999993333",
      }),
    ).rejects.toThrow("BOOKING_INVALID_SHOP");
  });

  // 4. Inactive professional rejection
  it("4. rejects booking for inactive professional with BOOKING_INVALID_PROFESSIONAL", async () => {
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_INACTIVE_ID,
        serviceIds: [SRV_HAIRCUT_ID],
        scheduledStart: getFutureWednesdayISO("09:00"),
        customerName: "Teste Inativo",
        customerPhone: "11999993333",
      }),
    ).rejects.toThrow("BOOKING_INVALID_PROFESSIONAL");
  });

  // 5. Inactive service rejection
  it("5. rejects booking with inactive service with BOOKING_INVALID_SERVICES", async () => {
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_INACTIVE_ID],
        scheduledStart: getFutureWednesdayISO("09:00"),
        customerName: "Teste Inativo",
        customerPhone: "11999993333",
      }),
    ).rejects.toThrow("BOOKING_INVALID_SERVICES");
  });

  // 6. Cross-tenant professional rejection
  it("6. rejects professional belonging to another barbershop", async () => {
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_OTHER_SHOP_ID,
        serviceIds: [SRV_HAIRCUT_ID],
        scheduledStart: getFutureWednesdayISO("09:00"),
        customerName: "Teste Cross",
        customerPhone: "11999993333",
      }),
    ).rejects.toThrow("BOOKING_INVALID_PROFESSIONAL");
  });

  // 7. Cross-tenant service rejection
  it("7. rejects service belonging to another barbershop", async () => {
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_OTHER_SHOP_ID],
        scheduledStart: getFutureWednesdayISO("09:00"),
        customerName: "Teste Cross",
        customerPhone: "11999993333",
      }),
    ).rejects.toThrow("BOOKING_INVALID_SERVICES");
  });

  // 8. Duplicate service ID rejection
  it("8. rejects duplicate service IDs with BOOKING_DUPLICATE_SERVICES", async () => {
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_HAIRCUT_ID, SRV_HAIRCUT_ID],
        scheduledStart: getFutureWednesdayISO("09:00"),
        customerName: "Teste Duplicado",
        customerPhone: "11999993333",
      }),
    ).rejects.toThrow("BOOKING_DUPLICATE_SERVICES");
  });

  // 9. Past booking rejection
  it("9. rejects booking in the past with BOOKING_PAST_DATE", async () => {
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_HAIRCUT_ID],
        scheduledStart: "2020-01-01T10:00:00.000Z",
        customerName: "Teste Passado",
        customerPhone: "11999993333",
      }),
    ).rejects.toThrow("BOOKING_PAST_DATE");
  });

  // 10. Booking outside barbershop hours
  it("10. rejects booking outside barbershop business hours", async () => {
    // Shop opens at 09:00. Attempt 08:30
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_HAIRCUT_ID],
        scheduledStart: getFutureWednesdayISO("08:30"),
        customerName: "Teste Horario",
        customerPhone: "11999993333",
      }),
    ).rejects.toThrow("BOOKING_OUTSIDE_BUSINESS_HOURS");
  });

  // 11. Booking outside professional hours
  it("11. rejects booking outside professional working hours", async () => {
    // Pro ends at 18:00, shop open until 19:00. 30m haircut at 18:00 ends at 18:30
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_HAIRCUT_ID],
        scheduledStart: getFutureWednesdayISO("18:00"),
        customerName: "Teste Horario",
        customerPhone: "11999993333",
      }),
    ).rejects.toThrow("BOOKING_OUTSIDE_PROFESSIONAL_HOURS");
  });

  // 12. Booking during break
  it("12. rejects booking overlapping professional lunch/break", async () => {
    // Break is 12:00 - 13:00. Attempt 12:15 - 12:45
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_HAIRCUT_ID],
        scheduledStart: getFutureWednesdayISO("12:15"),
        customerName: "Teste Break",
        customerPhone: "11999993333",
      }),
    ).rejects.toThrow("BOOKING_PROFESSIONAL_ON_BREAK");
  });

  // 13. Booking during time off
  it("13. rejects booking during professional time-off", async () => {
    // Time-off is 14:00 - 15:00. Attempt 14:15 - 14:45
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_HAIRCUT_ID],
        scheduledStart: getFutureWednesdayISO("14:15"),
        customerName: "Teste Folga",
        customerPhone: "11999993333",
      }),
    ).rejects.toThrow("BOOKING_PROFESSIONAL_UNAVAILABLE");
  });

  // 14. Back-to-back appointments allowed
  it("14. allows back-to-back appointments touching exact interval boundaries", async () => {
    // Existing is 10:00 - 10:30.
    // Booking A: 09:30 - 10:00 (ends exactly when existing starts)
    const before = await db.createPublicBooking({
      barbershopId: SHOP_ID,
      professionalId: PRO_ACTIVE_ID,
      serviceIds: [SRV_HAIRCUT_ID],
      scheduledStart: getFutureWednesdayISO("09:30"),
      customerName: "Cliente Antes",
      customerPhone: "11999994444",
    });
    expect(before.scheduled_end).toBe(getFutureWednesdayISO("10:00"));

    // Booking B: 10:30 - 11:00 (starts exactly when existing ends)
    const after = await db.createPublicBooking({
      barbershopId: SHOP_ID,
      professionalId: PRO_ACTIVE_ID,
      serviceIds: [SRV_HAIRCUT_ID],
      scheduledStart: getFutureWednesdayISO("10:30"),
      customerName: "Cliente Depois",
      customerPhone: "11999995555",
    });
    expect(after.scheduled_start).toBe(getFutureWednesdayISO("10:30"));
  });

  // 15. Overlapping intervals are rejected
  it("15. rejects overlapping intervals with BOOKING_SLOT_TAKEN", async () => {
    // Existing is 10:00 - 10:30. Attempt 10:15 - 10:45
    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_HAIRCUT_ID],
        scheduledStart: getFutureWednesdayISO("10:15"),
        customerName: "Cliente Conflito",
        customerPhone: "11999996666",
      }),
    ).rejects.toThrow("BOOKING_SLOT_TAKEN");
  });

  // 16. cancelled, completed, and no_show appointments do not block a new slot
  it("16. allows booking over slots vacated by cancelled, completed, or no_show appointments", async () => {
    // Cancelled slot: 11:00 - 11:30
    const overCancelled = await db.createPublicBooking({
      barbershopId: SHOP_ID,
      professionalId: PRO_ACTIVE_ID,
      serviceIds: [SRV_HAIRCUT_ID],
      scheduledStart: getFutureWednesdayISO("11:00"),
      customerName: "Cliente Reocupou Cancelado",
      customerPhone: "11999997777",
    });
    expect(overCancelled.status).toBe("scheduled");

    // No-show slot: 13:00 - 13:30
    const overNoShow = await db.createPublicBooking({
      barbershopId: SHOP_ID,
      professionalId: PRO_ACTIVE_ID,
      serviceIds: [SRV_HAIRCUT_ID],
      scheduledStart: getFutureWednesdayISO("13:00"),
      customerName: "Cliente Reocupou NoShow",
      customerPhone: "11999998888",
    });
    expect(overNoShow.status).toBe("scheduled");
  });

  // 17. Failure inserting appointment_services rolls back the full operation
  it("17. rolls back the entire operation if appointment_services insertion fails", async () => {
    const initialAppts = db.appointments.length;
    const initialCusts = db.customers.length;
    const initialServices = db.appointmentServices.length;

    db.injectServiceFailure = true;

    await expect(
      db.createPublicBooking({
        barbershopId: SHOP_ID,
        professionalId: PRO_ACTIVE_ID,
        serviceIds: [SRV_HAIRCUT_ID],
        scheduledStart: getFutureWednesdayISO("16:00"),
        customerName: "Cliente Rollback",
        customerPhone: "11999999999",
      }),
    ).rejects.toThrow("Simulated failure inserting appointment_services");

    // Zero partial records remained
    expect(db.appointments.length).toBe(initialAppts);
    expect(db.customers.length).toBe(initialCusts);
    expect(db.appointmentServices.length).toBe(initialServices);
  });

  // 18. Two parallel requests produce exactly one success and one BOOKING_SLOT_TAKEN
  it("18. guarantees exactly one success and one BOOKING_SLOT_TAKEN on concurrent parallel requests", async () => {
    const slot = getFutureWednesdayISO("16:30");

    const reqA = db.createPublicBooking({
      barbershopId: SHOP_ID,
      professionalId: PRO_ACTIVE_ID,
      serviceIds: [SRV_HAIRCUT_ID],
      scheduledStart: slot,
      customerName: "Concorrente A",
      customerPhone: "11911112222",
    });

    const reqB = db.createPublicBooking({
      barbershopId: SHOP_ID,
      professionalId: PRO_ACTIVE_ID,
      serviceIds: [SRV_HAIRCUT_ID],
      scheduledStart: slot,
      customerName: "Concorrente B",
      customerPhone: "11933334444",
    });

    const results = await Promise.allSettled([reqA, reqB]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const winner = (fulfilled[0] as PromiseFulfilledResult<MinimalBookingResult>).value;
    expect(winner.scheduled_start).toBe(slot);

    const loser = (rejected[0] as PromiseRejectedResult).reason;
    expect(loser.message).toMatch("BOOKING_SLOT_TAKEN");
  });

  // 19. RPC response does not expose unrelated customer data
  it("19. ensures RPC returns only minimal scheduling fields without exposing customer PII", async () => {
    const res = await db.createPublicBooking({
      barbershopId: SHOP_ID,
      professionalId: PRO_ACTIVE_ID,
      serviceIds: [SRV_HAIRCUT_ID, SRV_BEARD_ID],
      scheduledStart: getFutureWednesdayISO("17:00"),
      customerName: "Cliente Seguro",
      customerPhone: "11955556666",
      customerEmail: "seguro@teste.com",
      notes: "Nota confidencial",
    });

    // Valid fields
    expect(res).toHaveProperty("appointment_id");
    expect(res).toHaveProperty("scheduled_start");
    expect(res).toHaveProperty("scheduled_end");
    expect(res).toHaveProperty("status");

    // Zero PII exposed in returned payload
    expect(res).not.toHaveProperty("customer_name");
    expect(res).not.toHaveProperty("customer_phone");
    expect(res).not.toHaveProperty("customer_email");
    expect(res).not.toHaveProperty("notes");
    expect(res).not.toHaveProperty("total_amount");
  });
});
