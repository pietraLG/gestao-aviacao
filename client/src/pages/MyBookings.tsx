import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function MyBookings() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data: bookings, isLoading, refetch } = trpc.bookings.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const cancelMutation = trpc.bookings.cancel.useMutation({
    onSuccess: () => {
      toast.success("Reserva cancelada");
      refetch();
    },
  });

  const handleCancel = (bookingId: number) => {
    if (confirm("Tem certeza que deseja cancelar esta reserva?")) {
      cancelMutation.mutate(bookingId);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-slate-600 mb-4">Você precisa estar autenticado</p>
          <Button
            onClick={() => setLocation("/")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Voltar ao Início
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Voltar
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Minhas Reservas</h1>
          <p className="text-slate-600">Gerencie suas reservas de voos</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="p-6 hover:shadow-lg transition">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="text-xs text-slate-500">Código</p>
                    <p className="font-bold text-lg text-blue-600">{booking.bookingCode}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Voo</p>
                    <p className="font-bold">{booking.flight?.flightNumber}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Rota</p>
                    <p className="font-bold">
                      {booking.flight?.origin} → {booking.flight?.destination}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Assento</p>
                    <p className="font-bold">{booking.seatNumber}</p>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancelMutation.isPending || booking.status === "cancelled"}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-slate-600 text-lg mb-4">Nenhuma reserva encontrada</p>
            <Button
              onClick={() => setLocation("/")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Buscar Voos
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
