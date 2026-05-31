import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentService, AppointmentStatus } from "@/services/appointment.service";
import { toast } from "sonner";

export function useAppointments(shopId: string | null, date: Date) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["appointments", shopId, date.toISOString().slice(0, 10)],
    enabled: !!shopId,
    queryFn: () => appointmentService.getByDate(shopId!, date),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => 
      appointmentService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Status atualizado");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar status");
    }
  });

  return {
    ...query,
    updateStatus: updateStatusMutation.mutateAsync,
  };
}
