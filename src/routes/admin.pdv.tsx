import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { useAuth } from "@/hooks/use-auth";
import { cashService, PaymentMethod } from "@/services/cash.service";
import { barbershopService } from "@/services/barbershop.service";
import { productService } from "@/services/product.service";
import { customerService } from "@/services/customer.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brl } from "@/lib/format";
import { toast } from "sonner";
import { 
  ShoppingCart, Trash2, Package, Scissors, Plus, Minus, 
  Search, X, User, QrCode, Banknote, CreditCard, ArrowLeftRight, CheckCircle2 
} from "lucide-react";

export const Route = createFileRoute("/admin/pdv")({ component: PDV });

type CartItem = {
  id: string;
  type: "product" | "service";
  name: string;
  price: number;
  quantity: number;
  maxStock?: number;
};

function PDV() {
  const { shopId, shop } = useCurrentShop();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState("services");
  const [search, setSearch] = useState("");
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<string>("avulso");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Queries
  const { data: services = [], isLoading: loadingSvc } = useQuery({
    queryKey: ["admin-services", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getServices(shopId!),
  });

  const { data: products = [], isLoading: loadingProd } = useQuery({
    queryKey: ["admin-products", shopId],
    enabled: !!shopId,
    queryFn: () => productService.getProducts(shopId!),
  });

  const { data: customers = [], isLoading: loadingCust } = useQuery({
    queryKey: ["admin-customers", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const res = await customerService.getCustomers(shopId!, { limit: 1000 });
      return res.data;
    },
  });

  // Derived state
  const filteredServices = useMemo(() => {
    return services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) && s.active);
  }, [services, search]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && p.active && (p.stock_qty || 0) > 0);
  }, [products, search]);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const discountAmount = useMemo(() => {
    const val = parseFloat(discountValue) || 0;
    if (val <= 0) return 0;
    if (discountType === "percent") {
      return subtotal * (val / 100);
    }
    return val;
  }, [discountValue, discountType, subtotal]);

  const total = Math.max(0, subtotal - discountAmount);

  // Actions
  const addToCart = (item: any, type: "product" | "service") => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.type === type);
      if (existing) {
        if (type === "product" && existing.quantity >= (item.stock_qty || 0)) {
          toast.error("Estoque insuficiente.");
          return prev;
        }
        return prev.map(i => i.id === item.id && i.type === type ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        id: item.id,
        type,
        name: item.name,
        price: Number(item.price || 0),
        quantity: 1,
        maxStock: type === "product" ? item.stock_qty : undefined
      }];
    });
    toast.success(`${item.name} adicionado ao carrinho.`);
  };

  const updateQuantity = (id: string, type: "product" | "service", delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id && i.type === type) {
        const nq = i.quantity + delta;
        if (nq < 1) return i;
        if (i.type === "product" && i.maxStock !== undefined && nq > i.maxStock) {
          toast.error("Limite de estoque atingido.");
          return i;
        }
        return { ...i, quantity: nq };
      }
      return i;
    }));
  };

  const removeItem = (id: string, type: "product" | "service") => {
    setCart(prev => prev.filter(i => !(i.id === id && i.type === type)));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Carrinho vazio.");
    if (total < 0) return toast.error("O total não pode ser negativo.");

    setIsProcessing(true);
    try {
      // Create cash entry
      const description = `Venda PDV: ` + cart.map(i => `${i.quantity}x ${i.name}`).join(", ");
      
      const transactionParams: any = {
        barbershop_id: shopId,
        description,
        amount: total,
        kind: "sale",
        method: paymentMethod,
        created_by: user?.id,
      };

      if (customerId !== "avulso") {
        transactionParams.customer_id = customerId;
      }

      await cashService.createCashEntry(transactionParams);

      // Decrement product stock
      const productsInCart = cart.filter(i => i.type === "product");
      for (const p of productsInCart) {
        // use -quantity to decrease
        await productService.updateStock(p.id, -p.quantity, "Venda via PDV", user?.id);
      }

      // Refresh queries
      qc.invalidateQueries({ queryKey: ["admin-products", shopId] });
      qc.invalidateQueries({ queryKey: ["admin-cash", shopId] });
      
      setShowMobileCart(false);
      setShowSuccess(true);
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar venda.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCart = () => {
    setCart([]);
    setCustomerId("avulso");
    setDiscountValue("");
    setPaymentMethod("pix");
    setShowSuccess(false);
  };

  if (!shopId) return null;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-background overflow-hidden">
      
      {/* LEFT: CATALOG */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border/40">
        
        {/* Search Header */}
        <div className="flex flex-col gap-3 p-4 border-b border-border/40 bg-card/40 shrink-0">
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-foreground">Ponto de Venda</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Registre serviços e produtos diretamente no caixa</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar item..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-11 bg-background"
            />
            {search && (
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground" onClick={() => setSearch("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs & Items */}
        <div className="flex-1 flex flex-col min-h-0 bg-background/50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
            <div className="px-4 pt-3 shrink-0">
              <TabsList className="w-full grid grid-cols-2 h-11">
                <TabsTrigger value="services" className="font-semibold"><Scissors className="h-4 w-4 mr-2" /> Serviços</TabsTrigger>
                <TabsTrigger value="products" className="font-semibold"><Package className="h-4 w-4 mr-2" /> Produtos</TabsTrigger>
              </TabsList>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-4">
                <TabsContent value="services" className="m-0 border-none outline-none">
                  {loadingSvc ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[1,2,3,4].map(i => <Card key={i} className="h-24 animate-pulse bg-muted/30" />)}
                    </div>
                  ) : filteredServices.length === 0 ? (
                    <EmptyCatalog title="Nenhum serviço encontrado." />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredServices.map(s => (
                        <ItemCard key={s.id} item={s} type="service" onAdd={() => addToCart(s, "service")} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="products" className="m-0 border-none outline-none">
                  {loadingProd ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[1,2,3,4].map(i => <Card key={i} className="h-24 animate-pulse bg-muted/30" />)}
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <EmptyCatalog title="Nenhum produto em estoque encontrado." />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredProducts.map(p => (
                        <ItemCard key={p.id} item={p} type="product" onAdd={() => addToCart(p, "product")} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>
      </div>

      {/* RIGHT: DESKTOP CART */}
      <div className="hidden lg:flex w-[400px] xl:w-[450px] flex-col bg-card shrink-0">
        <CartContent 
          cart={cart}
          customerId={customerId}
          setCustomerId={setCustomerId}
          customers={customers}
          loadingCust={loadingCust}
          updateQuantity={updateQuantity}
          removeItem={removeItem}
          discountType={discountType}
          setDiscountType={setDiscountType}
          discountValue={discountValue}
          setDiscountValue={setDiscountValue}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          subtotal={subtotal}
          discountAmount={discountAmount}
          total={total}
          isProcessing={isProcessing}
          onCheckout={handleCheckout}
        />
      </div>

      {/* BOTTOM: MOBILE STICKY CART STRIP */}
      {cart.length > 0 && !showMobileCart && (
        <div className="lg:hidden p-4 border-t border-border/40 bg-accent text-accent-foreground flex items-center justify-between shrink-0" onClick={() => setShowMobileCart(true)}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              <Badge className="absolute -top-2 -right-2 bg-background text-foreground hover:bg-background border-none px-1.5 min-w-[20px] flex justify-center">
                {cart.reduce((a,b) => a+b.quantity, 0)}
              </Badge>
            </div>
            <span className="font-bold">Ver Carrinho</span>
          </div>
          <span className="font-mono font-bold text-xl">{brl(total)}</span>
        </div>
      )}

      {/* MOBILE DRAWER CART */}
      <Drawer open={showMobileCart} onOpenChange={setShowMobileCart}>
        <DrawerContent className="max-h-[90vh]">
          <div className="flex flex-col h-full overflow-hidden">
            <DrawerHeader className="border-b border-border/40 text-left shrink-0">
              <DrawerTitle>Carrinho</DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-hidden">
              <CartContent 
                cart={cart}
                customerId={customerId}
                setCustomerId={setCustomerId}
                customers={customers}
                loadingCust={loadingCust}
                updateQuantity={updateQuantity}
                removeItem={removeItem}
                discountType={discountType}
                setDiscountType={setDiscountType}
                discountValue={discountValue}
                setDiscountValue={setDiscountValue}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                subtotal={subtotal}
                discountAmount={discountAmount}
                total={total}
                isProcessing={isProcessing}
                onCheckout={handleCheckout}
                isMobile
              />
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* SUCCESS DIALOG */}
      <Dialog open={showSuccess} onOpenChange={(o) => !o && resetCart()}>
        <DialogContent className="max-w-sm rounded-xl text-center">
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <DialogTitle className="text-2xl font-serif">Venda Finalizada!</DialogTitle>
            <DialogDescription>
              O lançamento foi registrado no caixa e o estoque atualizado.
            </DialogDescription>
            <div className="bg-muted/20 p-4 rounded-xl w-full flex justify-between items-center border border-border/40 mt-2">
              <span className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Total Pago</span>
              <span className="font-mono font-bold text-accent text-xl">{brl(total)}</span>
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button className="w-full bg-accent text-accent-foreground font-bold h-11" onClick={resetCart}>
              Nova Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// -----------------------------------------------------------------------------
// INTERNAL COMPONENTS
// -----------------------------------------------------------------------------

function ItemCard({ item, type, onAdd }: any) {
  const Icon = type === "service" ? Scissors : Package;
  
  return (
    <Card className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card hover:border-accent/40 transition-colors cursor-pointer" onClick={onAdd}>
      <div className="flex items-center gap-3 truncate pr-3">
        <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex flex-col truncate">
          <span className="font-bold text-sm text-foreground truncate">{item.name}</span>
          <span className="text-xs text-muted-foreground font-mono">{brl(Number(item.price || 0))}</span>
        </div>
      </div>
      <Button size="icon" variant="ghost" className="shrink-0 h-8 w-8 rounded-full text-accent hover:bg-accent/10">
        <Plus className="h-4 w-4" />
      </Button>
    </Card>
  );
}

function EmptyCatalog({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border/50 rounded-xl bg-card/20">
      <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
      <h3 className="font-semibold text-foreground">{title}</h3>
    </div>
  );
}

// -----------------------------------------------------------------------------
// CART CONTENT
// -----------------------------------------------------------------------------

function CartContent({
  cart, customerId, setCustomerId, customers, loadingCust, 
  updateQuantity, removeItem, discountType, setDiscountType, discountValue, setDiscountValue,
  paymentMethod, setPaymentMethod, subtotal, discountAmount, total, isProcessing, onCheckout, isMobile = false
}: any) {

  return (
    <div className="flex flex-col h-full bg-card/50">
      
      {/* CUSTOMER SELECTOR */}
      <div className="p-4 border-b border-border/40 shrink-0 space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <User className="h-3.5 w-3.5" /> Cliente
        </Label>
        <Select value={customerId} onValueChange={setCustomerId}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Selecione o cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="avulso" className="font-semibold text-accent">Nenhum (Venda Avulsa)</SelectItem>
            {customers.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* CART ITEMS */}
      <ScrollArea className="flex-1">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <ShoppingCart className="h-12 w-12 mb-3" />
            <p className="text-sm font-semibold">O carrinho está vazio.</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {cart.map((item: CartItem) => (
              <div key={`${item.type}-${item.id}`} className="flex flex-col gap-2 p-3 border border-border/40 rounded-xl bg-background">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col truncate">
                    <span className="font-bold text-sm truncate">{item.name}</span>
                    <span className="text-xs text-muted-foreground uppercase">{item.type === "service" ? "Serviço" : "Produto"}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0 -mr-1" onClick={() => removeItem(item.id, item.type)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-sm font-bold text-accent">{brl(item.price * item.quantity)}</span>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center bg-muted/40 rounded-lg border border-border/40">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none rounded-l-lg" onClick={() => updateQuantity(item.id, item.type, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <div className="w-8 text-center text-xs font-bold">{item.quantity}</div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none rounded-r-lg" onClick={() => updateQuantity(item.id, item.type, 1)} disabled={item.type === "product" && item.maxStock !== undefined && item.quantity >= item.maxStock}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* CHECKOUT SECTION */}
      <div className="border-t border-border/40 shrink-0 bg-card p-4 space-y-4">
        
        {/* Discount */}
        {cart.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
              <SelectTrigger className="w-[100px] h-9 text-xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Desc. %</SelectItem>
                <SelectItem value="fixed">Desc. R$</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              type="number" 
              min="0"
              step={discountType === "percent" ? "1" : "0.01"}
              placeholder="0"
              value={discountValue}
              onChange={e => setDiscountValue(e.target.value)}
              className="h-9 flex-1 text-sm"
            />
          </div>
        )}

        {/* Totals */}
        <div className="space-y-1.5 pt-2 border-t border-border/20">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono">{brl(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-destructive font-medium">
              <span>Desconto</span>
              <span className="font-mono">-{brl(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-lg font-bold text-foreground pt-1">
            <span>Total</span>
            <span className="font-mono text-accent text-2xl">{brl(total)}</span>
          </div>
        </div>

        {/* Payment Method */}
        {cart.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <PaymentBtn id="pix" icon={QrCode} label="PIX" selected={paymentMethod} onSelect={setPaymentMethod} />
            <PaymentBtn id="cash" icon={Banknote} label="Dinheiro" selected={paymentMethod} onSelect={setPaymentMethod} />
            <PaymentBtn id="credit" icon={CreditCard} label="Crédito" selected={paymentMethod} onSelect={setPaymentMethod} />
            <PaymentBtn id="debit" icon={CreditCard} label="Débito" selected={paymentMethod} onSelect={setPaymentMethod} />
            <PaymentBtn id="other" icon={ArrowLeftRight} label="Outro" selected={paymentMethod} onSelect={setPaymentMethod} className="col-span-2" />
          </div>
        )}

        {/* Finalize Button */}
        <Button 
          className="w-full h-12 text-base font-bold bg-accent text-accent-foreground hover:bg-accent/90 mt-2"
          disabled={cart.length === 0 || isProcessing || total < 0}
          onClick={onCheckout}
        >
          {isProcessing ? "Processando..." : "Finalizar Venda"}
        </Button>
      </div>

    </div>
  );
}

function PaymentBtn({ id, icon: Icon, label, selected, onSelect, className = "" }: any) {
  const isSelected = selected === id;
  return (
    <Button
      type="button"
      variant="outline"
      className={`h-10 px-2 flex items-center justify-center gap-1.5 ${isSelected ? 'border-accent bg-accent/10 text-accent ring-1 ring-accent' : 'bg-background hover:bg-muted'} ${className}`}
      onClick={() => onSelect(id)}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="text-xs font-semibold">{label}</span>
    </Button>
  );
}
