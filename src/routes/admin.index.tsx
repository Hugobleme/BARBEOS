import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { appointmentService, Appointment } from "@/services/appointment.service";
import { reportService } from "@/services/report.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { brl } from "@/lib/format";
import { KPISkeleton } from "@/components/site/LoadingState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  ChevronRight,
  ArrowUpRight,
  Plus,
  UserPlus,
  ShoppingBag,
  Receipt,
  Scissors,
  CheckCircle2,
} from "lucide-react";
import { startOfDay, endOfDay, format, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Agendado", className: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
  in_progress: { label: "Em atendimento", className: "border-amber-500/30 bg-amber-500/10 text-amber-400 animate-pulse" },
  completed: { label: "Concluído", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  cancelled: { label: "Cancelado", className: "border-border bg-muted/40 text-muted-foreground line-through" },
  no_show: { label: "Falta", className: "border-destructive/30 bg-destructive/10 text-destructive" },
};

function Dashboard() {
  const { shopId, shop } = useCurrentShop();

  // 1. Unauthorized State
  if (!shopId) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        Nenhuma barbearia selecionada.
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight">Visão geral</h1>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
            {shop?.name || "Barbearia"}
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <Card className="rounded-none border border-border bg-card/50 p-5 backdrop-blur-md">
          <p className="font-serif text-lg text-foreground">Painel carregado com sucesso</p>
          <p className="mt-1 text-sm text-muted-foreground">O dashboard minimalista está ativo em modo de segurança.</p>
        </Card>
      </div>
    </div>
  );
}
