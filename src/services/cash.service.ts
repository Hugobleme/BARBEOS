import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type CashSession = Database["public"]["Tables"]["cash_sessions"]["Row"];
export type CashTransaction = Database["public"]["Tables"]["cash_transactions"]["Row"] & {
  professional?: { display_name: string } | null;
  customer?: { full_name: string } | null;
};

export type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export const cashService = {
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
      .update({ status: "closed", closed_at: new Date().toISOString(), closed_by: userId, closing_amount: amount })
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
    const { data, error } = await supabase
      .from("cash_transactions")
      .insert(params)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
