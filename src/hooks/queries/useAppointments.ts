import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentService, AppointmentStatus } from "@/services/appointment.service";
import { toast } from "sonner";

export function useAppointments(shopId: string | null, date: Date) {
  const queryClient = useQueryClient();
  const dateKey = date.toISOString().slice(0, 10);

  const query = useQuery({
    queryKey: ["appointments", shopId, dateKey],
    enabled: !!shopId,
    queryFn: () => appointmentService.getByDate(shopId!, date),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => 
      appointmentService.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["appointments", shopId, dateKey] });

      // Snapshot the previous value
      const previousAppointments = queryClient.getQueryData<any[]>(["appointments", shopId, dateKey]);

      // Optimistically update to the new value
      if (previousAppointments) {
        queryClient.setQueryData(["appointments", shopId, dateKey], (old: any[]) => 
          old.map(appt => appt.id === id ? { ...appt, status } : appt)
        );
      }

      return { previousAppointments };
    },
    onError: (error: any, _variables, context) => {
      // Rollback to previous state if mutation fails
      if (context?.previousAppointments) {
        queryClient.setQueryData(["appointments", shopId, dateKey], context.previousAppointments);
      }
      toast.error(error.message || "Erro ao atualizar status");
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we are in sync with server
      queryClient.invalidateQueries({ queryKey: ["appointments", shopId, dateKey] });
    },
    onSuccess: () => {
      toast.success("Status atualizado");
    },
  });

  return {
    ...query,
    updateStatus: updateStatusMutation.mutateAsync,
  };
}
