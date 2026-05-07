import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plane, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function SeatSelection() {
  const { flightId } = useParams<{ flightId: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [passengerName, setPassengerName] = useState("");
  const [passengerEmail, setPassengerEmail] = useState("");

  const flightIdNum = parseInt(flightId || "0");

  const { data: flight, isLoading: flightLoading } = trpc.flights.getById.useQuery(
    { flightId: flightIdNum },
    { enabled: !!flightId }
  );

  const { data: seats, isLoading: seatsLoading } = trpc.seats.getFlightSeats.useQuery(
    { flightId: flightIdNum },
    { enabled: !!flightId }
  );

  const createBookingMutation = trpc.bookings.create.useMutation({
    onSuccess: (data) => {
      setLocation(`/booking-confirmation?code=${data.bookingCode}`);
    },
  });

  const handleReserve = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    if (!selectedSeatId || !passengerName || !passengerEmail) {
      alert("Por favor, preencha todos os campos");
      return;
    }

    createBookingMutation.mutate({
      flightId: flightIdNum,
      seatId: selectedSeatId,
      passengerName,
      passengerEmail,
    });
  };

  if (flightLoading || seatsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-6 bg-red-50 border-red-200">
          <p className="text-red-700">Voo não encontrado</p>
        </Card>
      </div>
    );
  }

  // Agrupar assentos por fileira
  const seatsByRow = seats?.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<number, typeof seats>) || {};

  const getSeatColor = (seatId: number, status: string) => {
    if (selectedSeatId === seatId) return "bg-blue-600 text-white";
    if (status === "available") return "bg-green-100 hover:bg-green-200 cursor-pointer border-green-300";
    if (status === "reserved") return "bg-orange-100 cursor-not-allowed border-orange-300";
    if (status === "occupied") return "bg-red-100 cursor-not-allowed border-red-300";
    return "bg-slate-100";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
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
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seat Map */}
          <div className="lg:col-span-2">
            <Card className="p-8 bg-white">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {flight.flightNumber}
              </h2>
              <p className="text-slate-600 mb-6">
                {flight.origin} → {flight.destination}
              </p>

              {/* Seat Grid */}
              <div className="space-y-4 mb-8">
                {Object.entries(seatsByRow)
                  .sort(([rowA], [rowB]) => parseInt(rowA) - parseInt(rowB))
                  .map(([row, rowSeats]) => (
                    <div key={row} className="flex items-center gap-4">
                      <span className="w-8 text-center font-semibold text-slate-600">
                        {row}
                      </span>
                      <div className="flex gap-2">
                        {rowSeats
                          .sort((a, b) => a.column.localeCompare(b.column))
                          .map((seat) => (
                            <button
                              key={seat.id}
                              onClick={() => {
                                if (seat.status === "available") {
                                  setSelectedSeatId(seat.id);
                                }
                              }}
                              disabled={seat.status !== "available"}
                              className={`w-10 h-10 rounded border-2 font-semibold text-sm transition-colors ${getSeatColor(
                                seat.id,
                                seat.status
                              )}`}
                            >
                              {seat.column}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Legend */}
              <div className="flex gap-6 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded" />
                  <span className="text-sm text-slate-600">Disponível</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 rounded" />
                  <span className="text-sm text-slate-600">Selecionado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-100 border-2 border-orange-300 rounded" />
                  <span className="text-sm text-slate-600">Reservado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-100 border-2 border-red-300 rounded" />
                  <span className="text-sm text-slate-600">Ocupado</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Booking Summary */}
          <div>
            <Card className="p-6 bg-white sticky top-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Resumo da Reserva
              </h3>

              {/* Flight Info */}
              <div className="space-y-3 pb-4 border-b border-slate-200">
                <div>
                  <p className="text-xs text-slate-500">Voo</p>
                  <p className="font-semibold text-slate-900">
                    {flight.flightNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Assento</p>
                  <p className="font-semibold text-slate-900">
                    {selectedSeatId
                      ? seats?.find((s) => s.id === selectedSeatId)?.seatNumber
                      : "Não selecionado"}
                  </p>
                </div>
              </div>

              {/* Passenger Info */}
              <div className="space-y-4 py-4 border-b border-slate-200">
                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Nome do Passageiro
                  </label>
                  <input
                    type="text"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={passengerEmail}
                    onChange={(e) => setPassengerEmail(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {/* Price */}
              <div className="py-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Preço por assento</span>
                  <span className="font-semibold">
                    €{(flight.pricePerSeat / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span className="text-blue-600">
                    €{(flight.pricePerSeat / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Reserve Button */}
              <Button
                onClick={handleReserve}
                disabled={!selectedSeatId || !passengerName || !passengerEmail || createBookingMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 mt-4"
              >
                {createBookingMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Confirmar Reserva"
                )}
              </Button>

              {createBookingMutation.error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">
                    {(createBookingMutation.error as any).message || "Erro ao criar reserva"}
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
