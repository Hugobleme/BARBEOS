import { PublicLayout } from "@/components/site/PublicLayout";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";
import { Crown, Check } from "lucide-react";

export const Route = createFileRoute("/clube")({
  head: () => ({
    meta: [
      { title: "Clube VIP — BarberOS" },
      {
        name: "description",
        content:
          "Assine nossos pacotes e garanta um visual impecável o mês inteiro com descontos exclusivos.",
      },
    ],
  }),
  component: ClubePage,
});

function ClubePage() {
  const { data: pkgs, isLoading } = useQuery({
    queryKey: ["public-packages"],
    queryFn: async () => {
      const { data } = await supabase
        .from("packages")
        .select("*, barbershops(name, phone)")
        .eq("active", true)
        .order("price", { ascending: true });
      return data ?? [];
    },
  });

  return (
    <PublicLayout>
      <section className="relative min-h-[80vh]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_70%)]"
        />
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-accent">
              Exclusivo
            </p>
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight md:text-5xl flex items-center justify-center gap-3">
              <Crown className="h-8 w-8 text-accent" /> Clube VIP
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-sm text-muted-foreground">
              Garanta o seu estilo o mês todo. Assine nossos pacotes, economize e não se preocupe
              mais com pagamento a cada visita.
            </p>
          </div>

          {isLoading ? (
            <div className="mt-16 text-center text-muted-foreground">Carregando pacotes...</div>
          ) : (
            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pkgs?.map((pkg: any) => {
                // Remove caracteres não numéricos do telefone da barbearia
                const phone = pkg.barbershops?.phone?.replace(/\D/g, "") || "";
                // Monta o link do WhatsApp (se não tiver telefone, manda para #)
                const waLink = phone
                  ? `https://wa.me/55${phone}?text=${encodeURIComponent(`Olá, tenho interesse em assinar o pacote *${pkg.name}*!`)}`
                  : "#";

                return (
                  <article
                    key={pkg.id}
                    className="flex flex-col border border-border/60 bg-card/40 backdrop-blur-sm p-8 transition-all hover:border-accent/40 hover:-translate-y-1"
                  >
                    <h3 className="font-serif text-xl font-bold">{pkg.name}</h3>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="font-serif text-4xl font-bold">
                        {brl(Number(pkg.price))}
                      </span>
                    </div>
                    {pkg.description && (
                      <p className="mt-4 text-sm text-muted-foreground">{pkg.description}</p>
                    )}

                    <ul className="mt-6 space-y-3 flex-1">
                      <li className="flex items-center gap-3 text-sm">
                        <div className="grid h-5 w-5 place-items-center rounded-full bg-accent/20 text-accent">
                          <Check className="h-3 w-3" />
                        </div>
                        <span>
                          Direito a <strong>{pkg.sessions_total} sessões</strong>
                        </span>
                      </li>
                      {pkg.validity_days && (
                        <li className="flex items-center gap-3 text-sm">
                          <div className="grid h-5 w-5 place-items-center rounded-full bg-accent/20 text-accent">
                            <Check className="h-3 w-3" />
                          </div>
                          <span>
                            Válido por <strong>{pkg.validity_days} dias</strong>
                          </span>
                        </li>
                      )}
                    </ul>

                    <Button
                      asChild
                      className="mt-8 w-full rounded-none uppercase tracking-[0.15em] bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <a href={waLink} target="_blank" rel="noopener noreferrer">
                        Quero Assinar
                      </a>
                    </Button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
