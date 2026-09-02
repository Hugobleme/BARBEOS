import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cashService } from "@/services/cash.service";
import { toast } from "sonner";

export function useCash(shopId: string | null) {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ["cash-session", shopId],
    enabled: !!shopId,
    queryFn: () => cashService.getOpenSession(shopId!),
  });

  const transactionsQuery = (date: Date) =>
    useQuery({
      queryKey: ["cash-transactions", shopId, date.toISOString().slice(0, 10)],
      enabled: !!shopId,
      queryFn: () => cashService.getTransactionsByDate(shopId!, date),
    });

  const openSessionMutation = useMutation({
    mutationFn: ({ userId, amount }: { userId: string; amount: number }) =>
      cashService.openSession(shopId!, userId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-session"] });
      toast.success("Caixa aberto com sucesso");
    },
  });

  const closeSessionMutation = useMutation({
    mutationFn: ({
      sessionId,
      userId,
      amount,
    }: {
      sessionId: string;
      userId: string;
      amount: number;
    }) => cashService.closeSession(sessionId, userId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-session"] });
      toast.success("Caixa fechado com sucesso");
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: (params: Parameters<typeof cashService.createTransaction>[0]) =>
      cashService.createTransaction(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      toast.success("Lançamento realizado");
    },
  });

  return {
    session: sessionQuery.data,
    isLoadingSession: sessionQuery.isLoading,
    refetchSession: sessionQuery.refetch,
    useTransactions: transactionsQuery,
    openSession: openSessionMutation.mutateAsync,
    closeSession: closeSessionMutation.mutateAsync,
    createTransaction: createTransactionMutation.mutateAsync,
  };
}
