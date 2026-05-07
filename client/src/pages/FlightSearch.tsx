import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plane, ArrowRight, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useSearchParams } from "@/hooks/useSearchParams";
import { useState } from "react";

export default function FlightSearch() {
  const [, setLocation] = useLocation();
  const params = useSearchParams();
  const [selectedFlightId, setSelectedFlightId] = useState<number | null>(null);

  const origin = params.get("origin") || "";
  const destination = params.get("destination") || "";
  const date = params.get("date") || "";

  const { data: flights, isLoading, error } = trpc.flights.search.useQuery(
    {
      origin,
      destination,
      departureDate: new Date(date).toISOString(),
    },
    {
      enabled: !!origin && !!destination && !!date,
    }
  );

  const handleSelectFlight = (flightId: number) => {
    setSelectedFlightId(flightId);
    setLocation(`/seats/${flightId}`);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-PT");
  };

  const calculateDuration = (departure: Date, arrival: Date) => {
    const diff = new Date(arrival).getTime() - new Date(departure).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

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

      {/* Search Info */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-4 text-lg font-semibold text-slate-900">
            <span>{origin}</span>
            <ArrowRight className="w-5 h-5 text-blue-600" />
            <span>{destination}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-600">{formatDate(new Date(date))}</span>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <Card className="p-6 bg-red-50 border-red-200">
            <p className="text-red-700">Erro ao buscar voos. Tente novamente.</p>
          </Card>
        )}

        {flights && flights.length === 0 && !isLoading && (
          <Card className="p-6 text-center bg-white">
            <p className="text-slate-600">Nenhum voo disponível para esta rota.</p>
          </Card>
        )}

        {flights && flights.length > 0 && (
          <div className="space-y-4">
            {flights.map((flight) => (
              <Card
                key={flight.id}
                className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSelectFlight(flight.id)}
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  {/* Flight Number */}
                  <div>
                    <p className="text-sm text-slate-500">Voo</p>
                    <p className="text-lg font-bold text-slate-900">
                      {flight.flightNumber}
                    </p>
                  </div>

                  {/* Departure */}
                  <div>
                    <p className="text-sm text-slate-500">Saída</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatTime(flight.departureTime)}
                    </p>
                    <p className="text-xs text-slate-500">{flight.origin}</p>
                  </div>

                  {/* Duration */}
                  <div className="text-center">
                    <p className="text-sm text-slate-500">Duração</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {calculateDuration(flight.departureTime, flight.arrivalTime)}
                    </p>
                  </div>

                  {/* Arrival */}
                  <div>
                    <p className="text-sm text-slate-500">Chegada</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatTime(flight.arrivalTime)}
                    </p>
                    <p className="text-xs text-slate-500">{flight.destination}</p>
                  </div>

                  {/* Price and Availability */}
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Preço</p>
                    <p className="text-2xl font-bold text-blue-600">
                      €{(flight.pricePerSeat / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-green-600 font-semibold">
                      {flight.availableSeats} assentos disponíveis
                    </p>
                    <Button
                      className="mt-2 w-full bg-blue-600 hover:bg-blue-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectFlight(flight.id);
                      }}
                    >
                      Selecionar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
