import { useState } from "react";
import { Bell, Check, Clock, Info, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  description: string;
  type: "info" | "success" | "warning" | "error";
  time: string;
  read: boolean;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Novo Agendamento",
    description: "Carlos Silva agendou Corte de Cabelo para às 14:00.",
    type: "success",
    time: "5 min atrás",
    read: false,
  },
  {
    id: "2",
    title: "Estoque Baixo",
    description: "Pomada Modeladora Matte está com apenas 2 unidades.",
    type: "warning",
    time: "1 hora atrás",
    read: false,
  },
  {
    id: "3",
    title: "Relatório Mensal",
    description: "Seu relatório de faturamento de Maio está pronto.",
    type: "info",
    time: "2 horas atrás",
    read: true,
  },
];

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success": return <Check className="h-4 w-4 text-green-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "error": return <X className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="relative rounded-xl text-muted-foreground hover:bg-accent/10 hover:text-accent"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-2xl border-border/40 bg-background/95 backdrop-blur-xl" align="end">
        <div className="flex items-center justify-between border-b border-border/40 p-4">
          <h4 className="font-display font-bold tracking-tight">Notificações</h4>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[10px] font-bold uppercase tracking-widest text-accent hover:underline"
            >
              Ler todas
            </button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          <div className="flex flex-col">
            <AnimatePresence initial={false}>
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={cn(
                      "group relative flex gap-3 border-b border-border/20 p-4 transition-colors hover:bg-muted/30",
                      !n.read && "bg-accent/5"
                    )}
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/40">
                      {getTypeIcon(n.type)}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold tracking-tight leading-none">{n.title}</span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{n.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {n.description}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(n.id);
                      }}
                      className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">Nenhuma notificação por enquanto.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
        <div className="border-t border-border/40 p-2">
          <Button variant="ghost" className="w-full text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
            Ver todas as atividades
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
