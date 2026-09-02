import { supabase } from "@/integrations/supabase/client";

export const reportService = {
  /**
   * Relatório de faturamento consolidado (Vendas no Caixa + Agendamentos Concluídos)
   */
  async getRevenueReport(barbershopId: string, startDate: Date, endDate: Date) {
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();

    // 1. Transações de venda no caixa
    const { data: cashSales, error: cashErr } = await supabase
      .from("cash_transactions")
      .select("amount, kind, method, created_at")
      .eq("barbershop_id", barbershopId)
      .eq("kind", "sale")
      .gte("created_at", startStr)
      .lte("created_at", endStr);

    if (cashErr) throw cashErr;

    // 2. Agendamentos concluídos
    const { data: completedAppts, error: apptErr } = await supabase
      .from("appointments")
      .select("total_amount, scheduled_start, status")
      .eq("barbershop_id", barbershopId)
      .eq("status", "completed")
      .gte("scheduled_start", startStr)
      .lte("scheduled_start", endStr);

    if (apptErr) throw apptErr;

    const totalCashRevenue = (cashSales ?? []).reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const totalApptRevenue = (completedAppts ?? []).reduce(
      (acc, a) => acc + Number(a.total_amount || 0),
      0,
    );

    const byPaymentMethod: Record<string, number> = {};
    (cashSales ?? []).forEach((t) => {
      byPaymentMethod[t.method] = (byPaymentMethod[t.method] || 0) + Number(t.amount || 0);
    });

    return {
      totalCashRevenue,
      totalApptRevenue,
      totalRevenue: totalCashRevenue + totalApptRevenue,
      transactionsCount: (cashSales?.length ?? 0) + (completedAppts?.length ?? 0),
      byPaymentMethod,
    };
  },

  /**
   * Relatório de agendamentos agrupados por status
   */
  async getAppointmentsReport(barbershopId: string, startDate: Date, endDate: Date) {
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();

    const { data: appts, error } = await supabase
      .from("appointments")
      .select("id, status, scheduled_start, total_amount")
      .eq("barbershop_id", barbershopId)
      .gte("scheduled_start", startStr)
      .lte("scheduled_start", endStr);

    if (error) throw error;

    const byStatus: Record<string, number> = {
      scheduled: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    };

    let totalAmount = 0;
    (appts ?? []).forEach((a) => {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      if (a.status === "completed") {
        totalAmount += Number(a.total_amount || 0);
      }
    });

    return {
      totalAppointments: appts?.length ?? 0,
      byStatus,
      completedRevenue: totalAmount,
    };
  },

  /**
   * Clientes com maior frequência e volume de gastos
   */
  async getTopCustomers(barbershopId: string, limit: number = 10) {
    const { data: appts, error } = await supabase
      .from("appointments")
      .select("customer_id, total_amount, status, customer:customers(id, full_name, phone)")
      .eq("barbershop_id", barbershopId)
      .eq("status", "completed");

    if (error) throw error;

    const customerMap: Record<
      string,
      { customer: any; totalSpent: number; appointmentsCount: number }
    > = {};

    (appts ?? []).forEach((a: any) => {
      const cid = a.customer_id;
      if (!customerMap[cid]) {
        customerMap[cid] = {
          customer: a.customer,
          totalSpent: 0,
          appointmentsCount: 0,
        };
      }
      customerMap[cid].totalSpent += Number(a.total_amount || 0);
      customerMap[cid].appointmentsCount += 1;
    });

    const sorted = Object.values(customerMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);

    return sorted;
  },

  /**
   * Serviços mais agendados na barbearia
   */
  async getTopServices(barbershopId: string, limit: number = 10) {
    const { data: items, error } = await supabase
      .from("appointment_services")
      .select(
        `
        service_id,
        price_snapshot,
        service:services(id, name),
        appointment:appointments!inner(barbershop_id, status)
      `,
      )
      .eq("appointment.barbershop_id", barbershopId)
      .eq("appointment.status", "completed");

    if (error) throw error;

    const serviceMap: Record<
      string,
      { id: string; name: string; bookingsCount: number; totalRevenue: number }
    > = {};

    (items ?? []).forEach((item: any) => {
      const sid = item.service_id;
      if (!serviceMap[sid]) {
        serviceMap[sid] = {
          id: sid,
          name: item.service?.name ?? "Serviço",
          bookingsCount: 0,
          totalRevenue: 0,
        };
      }
      serviceMap[sid].bookingsCount += 1;
      serviceMap[sid].totalRevenue += Number(item.price_snapshot || 0);
    });

    const sorted = Object.values(serviceMap)
      .sort((a, b) => b.bookingsCount - a.bookingsCount)
      .slice(0, limit);

    return sorted;
  },
};
