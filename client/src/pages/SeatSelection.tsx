import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function SeatSelection() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

  const params = new URLSearchParams(window.location.search);
  const flightId = parseInt(params.get("flightId") || "0");

  const { data: flight, isLoading: flightLoading } = trpc.flights.getById.useQuery(flightId, {
    enabled: !!flightId,
  });

  const { data: seatsData, isLoading: seatsLoading } = trpc.seats.getAvailable.useQuery(flightId, {
    enabled: !!flightId,
  });

  const createBooking = trpc.bookings.create.useMutation();

  if (!flightId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-red-600">Voo não encontrado</p>
        </Card>
      </div>
    );
  }

  if (flightLoading || seatsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-red-600">Voo não encontrado</p>
        </Card>
      </div>
    );
  }

  const handleReserve = async () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    if (!selectedSeat) {
      toast.error("Selecione um assento");
      return;
    }

    try {
      const result = await createBooking.mutateAsync({
        flightId,
        seatNumber: selectedSeat,
      });

      toast.success("Reserva realizada com sucesso!");
      setLocation(`/booking-confirmation?code=${result.bookingCode}`);
    } catch (error) {
      toast.error("Erro ao realizar reserva");
    }
  };

  const generateSeats = (rows: number = 10, cols: number = 6) => {
    const seats = [];
    for (let i = 1; i <= rows; i++) {
      for (let j = 0; j < cols; j++) {
        seats.push(`${i}${String.fromCharCode(65 + j)}`);
      }
    }
    return seats;
  };

  const allSeats = generateSeats();
  const bookedSeats = seatsData?.booked || [];
  const availableSeats = seatsData?.available || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Seleção de Assentos</h1>
          <p className="text-slate-600">
            {flight.flightNumber} - {flight.origin} → {flight.destination}
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Preço: €{flight.price} | Assentos disponíveis: {availableSeats.length}/{allSeats.length}
          </p>
        </Card>

        <Card className="p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Mapa da Aeronave</h2>
            <div className="flex justify-center gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
                <span className="text-sm">Disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
                <span className="text-sm">Selecionado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 rounded"></div>
                <span className="text-sm">Ocupado</span>
              </div>
            </div>
          </div>

          <div className="grid gap-2 max-w-md mx-auto">
            {Array.from({ length: 10 }).map((_, row) => (
              <div key={row} className="flex gap-2 justify-center">
                {Array.from({ length: 6 }).map((_, col) => {
                  const seatNum = `${row + 1}${String.fromCharCode(65 + col)}`;
                  const isBooked = bookedSeats.includes(seatNum);
                  const isSelected = selectedSeat === seatNum;

                  return (
                    <button
                      key={seatNum}
                      onClick={() => !isBooked && setSelectedSeat(seatNum)}
                      disabled={isBooked}
                      className={`w-10 h-10 rounded font-bold text-sm transition ${
                        isBooked
                          ? "bg-red-500 text-white cursor-not-allowed"
                          : isSelected
                          ? "bg-blue-500 text-white"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                    >
                      {seatNum}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>

        {selectedSeat && (
          <Card className="p-6 bg-blue-50 border-blue-200 mb-6">
            <p className="text-lg font-bold text-slate-900">
              Assento selecionado: <span className="text-blue-600">{selectedSeat}</span>
            </p>
            <p className="text-slate-600 mt-2">Preço: €{flight.price}</p>
          </Card>
        )}

        <div className="flex gap-4">
          <Button
            onClick={() => setLocation("/search")}
            variant="outline"
            className="flex-1"
          >
            Voltar
          </Button>
          <Button
            onClick={handleReserve}
            disabled={!selectedSeat || createBooking.isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {createBooking.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Reservando...
              </>
            ) : (
              "Confirmar Reserva"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
