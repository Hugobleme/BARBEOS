import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Shop = { id: string; name: string; role: string };
type Ctx = {
  shopId: string | null;
  shop: Shop | null;
  shops: Shop[];
  setShopId: (id: string) => void;
  refresh: () => void;
};

const ShopCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "barberos.currentShopId";

export function ShopProvider({
  shops,
  refresh,
  children,
}: {
  shops: Shop[];
  refresh: () => void;
  children: ReactNode;
}) {
  const [shopId, setShopIdState] = useState<string | null>(() => {
    return shops.length > 0 ? shops[0].id : null;
  });

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored && shops.some((s) => s.id === stored)) {
      if (stored !== shopId) {
        setShopIdState(stored);
      }
    } else if (shops.length > 0 && shopId !== shops[0].id) {
      setShopIdState(shops[0].id);
      localStorage.setItem(STORAGE_KEY, shops[0].id);
    }
  }, [shops]);

  const setShopId = (id: string) => {
    setShopIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const shop = shops.find((s) => s.id === shopId) ?? null;

  return (
    <ShopCtx.Provider value={{ shopId, shop, shops, setShopId, refresh }}>
      {children}
    </ShopCtx.Provider>
  );
}

export function useCurrentShop() {
  const ctx = useContext(ShopCtx);
  if (!ctx) throw new Error("useCurrentShop must be used within ShopProvider");
  return ctx;
}

export function useCurrentShopId(): string {
  const { shopId } = useCurrentShop();
  return shopId ?? "";
}
