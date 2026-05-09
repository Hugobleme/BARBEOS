export const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n ?? 0);

export const minutes = (n: number) => {
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h}h${m}` : `${h}h`;
};

export const phoneMask = (v: string) => {
  const d = (v ?? "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_,a,b,c)=>[a&&`(${a}`,a?.length===2?") ":"",b,c&&`-${c}`].filter(Boolean).join(""));
  return d.replace(/(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
};

export const DEMO_BARBERSHOP_ID = "11111111-1111-1111-1111-111111111111";
