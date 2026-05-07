import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plane, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";

export default function MyBookings() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  const { data: bookings, isLoading, refetch } = trpc.bookings.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const cancelMutation = trpc.bookings.cancel.useMutation({
    onSuccess: () => {
      setCancelingId(null);
      refetch();
    },
  });

  const handleCancel = (bookingId: number) => {
    if (confirm("Tem certeza que deseja cancelar esta reserva?")) {
      setCancelingId(bookingId);
      cancelMutation.mutate({ bookingId });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Plane className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">SkyReserve</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">
          Minhas Reservas
        </h2>

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {!isLoading && bookings && bookings.length === 0 && (
          <Card className="p-8 text-center bg-white">
            <Plane className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">Você ainda não tem reservas</p>
            <Button
              onClick={() => setLocation("/")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Buscar Voos
            </Button>
          </Card>
        )}

        {!isLoading && bookings && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="p-6 bg-white hover:shadow-lg transition-shadow">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                  {/* Booking Code */}
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Código de Reserva</p>
                    <p className="text-lg font-bold text-blue-600 font-mono">
                      {booking.bookingCode}
                    </p>
                  </div>

                  {/* Flight Info */}
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Voo</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {booking.flight?.flightNumber}
                    </p>
                    <p className="text-sm text-slate-600">
                      {booking.flight?.origin} → {booking.flight?.destination}
                    </p>
                  </div>

                  {/* Passenger */}
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Passageiro</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {booking.passengerName}
                    </p>
                  </div>

                  {/* Status and Price */}
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {booking.status === "confirmed"
                          ? "Confirmada"
                          : booking.status === "cancelled"
                          ? "Cancelada"
                          : "Completa"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/booking/${booking.bookingCode}`)}
                    >
                      Detalhes
                    </Button>
                    {booking.status === "confirmed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancelingId === booking.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {cancelingId === booking.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {cancelMutation.error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              Erro ao cancelar reserva. Tente novamente.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
