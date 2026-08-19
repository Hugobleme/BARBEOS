import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];

export interface CreateProductInput {
  barbershop_id: string;
  name: string;
  price_cents?: number;
  price?: number;
  cost?: number;
  stock_qty?: number;
  min_stock?: number;
  description?: string | null;
  sku?: string | null;
  unit?: string;
  active?: boolean;
}

export const productService = {
  /**
   * Lista todos os produtos ativos de uma barbearia
   */
  async getProducts(barbershopId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .eq("active", true)
      .order("name");

    if (error) throw error;
    return (data as Product[]) ?? [];
  },

  /**
   * Cadastra um novo produto (aceita preço em centavos ou reais)
   */
  async createProduct(data: CreateProductInput): Promise<Product> {
    const finalPrice = data.price ?? (data.price_cents ? data.price_cents / 100 : 0);

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        barbershop_id: data.barbershop_id,
        name: data.name,
        price: finalPrice,
        cost: data.cost ?? 0,
        stock_qty: data.stock_qty ?? 0,
        min_stock: data.min_stock ?? 0,
        description: data.description || null,
        sku: data.sku || null,
        unit: data.unit || "un",
        active: data.active ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return product;
  },

  /**
   * Atualiza dados de um produto existente
   */
  async updateProduct(id: string, data: Database["public"]["Tables"]["products"]["Update"] & { price_cents?: number }): Promise<Product> {
    const updatePayload: any = { ...data };
    if (data.price_cents !== undefined) {
      updatePayload.price = data.price_cents / 100;
      delete updatePayload.price_cents;
    }

    const { data: updated, error } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  /**
   * Exclusão suave (desativação) de produto
   */
  async deleteProduct(id: string) {
    const { error } = await supabase
      .from("products")
      .update({ active: false })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Movimenta o estoque de um produto e registra em stock_movements
   */
  async updateStock(productId: string, quantityDelta: number, reason: string = "Ajuste manual", userId?: string) {
    // 1. Obter estoque atual
    const { data: prod, error: pErr } = await supabase
      .from("products")
      .select("stock_qty, barbershop_id")
      .eq("id", productId)
      .single();

    if (pErr || !prod) throw pErr || new Error("Produto não encontrado.");

    const newStock = Number(prod.stock_qty || 0) + quantityDelta;
    if (newStock < 0) {
      throw new Error(`Estoque insuficiente. Saldo atual: ${prod.stock_qty}`);
    }

    // 2. Atualizar produto
    const { data: updated, error: uErr } = await supabase
      .from("products")
      .update({ stock_qty: newStock })
      .eq("id", productId)
      .select()
      .single();

    if (uErr) throw uErr;

    // 3. Registrar movimentação de estoque
    const kind = quantityDelta >= 0 ? "in" : "out";
    await supabase.from("stock_movements").insert({
      barbershop_id: prod.barbershop_id,
      product_id: productId,
      quantity: Math.abs(quantityDelta),
      kind,
      notes: reason,
      created_by: userId || null,
    });

    return updated;
  },
};
