import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type CashSession = Database["public"]["Tables"]["cash_sessions"]["Row"];
export type CashTransaction = Database["public"]["Tables"]["cash_transactions"]["Row"] & {
  professional?: { display_name: string } | null;
  customer?: { full_name: string } | null;
};

export type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export const cashService = {
  /**
   * Valida se o usuário pertence à equipe da barbearia
   */
  async validateUserMembership(barbershopId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("barbershop_members")
      .select("id")
      .eq("barbershop_id", barbershopId)
      .eq("profile_id", userId)
      .eq("active", true)
      .maybeSingle();

    if (error || !data) {
      throw new Error(
        "Acesso negado: você não possui permissão para movimentar o caixa desta barbearia.",
      );
    }

    return true;
  },

  async getOpenSession(shopId: string) {
    const { data, error } = await supabase
      .from("cash_sessions")
      .select("*")
      .eq("barbershop_id", shopId)
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async openSession(shopId: string, userId: string, amount: number = 0) {
    await this.validateUserMembership(shopId, userId);

    const { data, error } = await supabase
      .from("cash_sessions")
      .insert({ barbershop_id: shopId, opened_by: userId, opening_amount: amount })
      .select("id")
      .single();

    if (error) throw error;
    return data;
  },

  async closeSession(sessionId: string, userId: string, amount: number) {
    const { error } = await supabase
      .from("cash_sessions")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
        closed_by: userId,
        closing_amount: amount,
      })
      .eq("id", sessionId);

    if (error) throw error;
  },

  async getTransactionsByDate(shopId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("cash_transactions")
      .select("*, professional:professionals(display_name), customer:customers(full_name)")
      .eq("barbershop_id", shopId)
      .gte("created_at", startOfDay.toISOString())
      .lte("created_at", endOfDay.toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as CashTransaction[]) ?? [];
  },

  /**
   * Busca lançamentos do caixa em um intervalo de datas
   */
  async getCashEntries(
    barbershopId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CashTransaction[]> {
    const { data, error } = await supabase
      .from("cash_transactions")
      .select("*, professional:professionals(display_name), customer:customers(full_name)")
      .eq("barbershop_id", barbershopId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as CashTransaction[]) ?? [];
  },

  async createTransaction(params: {
    barbershop_id: string;
    session_id: string;
    kind: string;
    method: PaymentMethod;
    amount: number;
    description: string;
    created_by: string;
    appointment_id?: string;
    customer_id?: string;
    professional_id?: string;
  }) {
    if (params.created_by) {
      await this.validateUserMembership(params.barbershop_id, params.created_by);
    }

    const { data, error } = await supabase
      .from("cash_transactions")
      .insert(params)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Registra um lançamento avulso no caixa (entrada ou saída)
   */
  async createCashEntry(params: {
    barbershop_id: string;
    description: string;
    amount?: number;
    amount_cents?: number;
    type?: "entrada" | "saída" | "in" | "out" | "sale" | "withdraw";
    kind?: string;
    payment_method?: PaymentMethod | string;
    method?: PaymentMethod;
    created_by?: string;
    session_id?: string;
  }) {
    const finalAmount = params.amount ?? (params.amount_cents ? params.amount_cents / 100 : 0);
    const kind =
      params.kind ??
      (params.type === "saída" || params.type === "out" || params.type === "withdraw"
        ? "withdraw"
        : "in");

    const method: PaymentMethod =
      params.method ??
      (params.payment_method === "PIX"
        ? "pix"
        : params.payment_method === "Cartão"
          ? "credit"
          : params.payment_method === "Dinheiro"
            ? "cash"
            : (params.payment_method as PaymentMethod) || "cash");

    let sessionId = params.session_id;
    if (!sessionId) {
      const openSession = await this.getOpenSession(params.barbershop_id);
      sessionId = openSession?.id;
      if (!sessionId && params.created_by) {
        const newSession = await this.openSession(params.barbershop_id, params.created_by, 0);
        sessionId = newSession.id;
      }
    }

    if (!sessionId) {
      throw new Error("Não foi possível encontrar ou abrir uma sessão de caixa ativa.");
    }

    return this.createTransaction({
      barbershop_id: params.barbershop_id,
      session_id: sessionId,
      kind,
      method,
      amount: finalAmount,
      description: params.description.trim(),
      created_by: params.created_by || "",
    });
  },

  /**
   * Obtém resumo da carteira/saldo acumulado da barbearia
   */
  async getWalletSummary(barbershopId: string) {
    const { data: transactions, error: txErr } = await supabase
      .from("cash_transactions")
      .select("amount, kind, method, created_at")
      .eq("barbershop_id", barbershopId);

    if (txErr) throw txErr;

    let balance = 0;
    (transactions ?? []).forEach((t) => {
      if (t.kind === "sale" || t.kind === "in" || t.kind === "deposit") {
        balance += Number(t.amount || 0);
      } else if (t.kind === "withdraw" || t.kind === "fee" || t.kind === "out") {
        balance -= Number(t.amount || 0);
      }
    });

    const { data: pendingAppts, error: apptErr } = await supabase
      .from("appointments")
      .select("total_amount")
      .eq("barbershop_id", barbershopId)
      .in("status", ["scheduled", "in_progress"]);

    if (apptErr) throw apptErr;

    const pendingReceivables = (pendingAppts ?? []).reduce(
      (sum, a) => sum + Number(a.total_amount || 0),
      0,
    );

    return {
      balance,
      pendingReceivables,
      transactionsCount: transactions?.length ?? 0,
    };
  },

  /**
   * Atualiza um lançamento do caixa
   */
  async updateCashEntry(
    id: string,
    data: Database["public"]["Tables"]["cash_transactions"]["Update"],
  ) {
    const { data: updated, error } = await supabase
      .from("cash_transactions")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  /**
   * Exclui um lançamento do caixa
   */
  async deleteCashEntry(id: string) {
    const { error } = await supabase.from("cash_transactions").delete().eq("id", id);

    if (error) throw error;
  },
};
