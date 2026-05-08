import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function FlightSearch() {
  const [, setLocation] = useLocation();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const { data: flights, isLoading } = trpc.flights.search.useQuery(
    { origin, destination },
    { enabled: !!origin && !!destination }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Trigger search by setting state
  };

  const handleSelectFlight = (flightId: number) => {
    setLocation(`/seats/${flightId}?flightId=${flightId}`);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDuration = (departure: Date, arrival: Date) => {
    const diff = new Date(arrival).getTime() - new Date(departure).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Voltar
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-6 mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Buscar Voos</h1>

          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                De (Origem)
              </label>
              <input
                type="text"
                placeholder="Ex: LIS"
                value={origin}
                onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Para (Destino)
              </label>
              <input
                type="text"
                placeholder="Ex: NYC"
                value={destination}
                onChange={(e) => setDestination(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Buscar
              </Button>
            </div>
          </form>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : flights && flights.length > 0 ? (
          <div className="space-y-4">
            {flights.map((flight) => (
              <Card key={flight.id} className="p-6 hover:shadow-lg transition">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="text-xs text-slate-500">Voo</p>
                    <p className="font-bold text-lg">{flight.flightNumber}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Saída</p>
                    <p className="font-bold">{formatTime(flight.departureTime)}</p>
                    <p className="text-sm text-slate-600">{flight.origin}</p>
                  </div>

                  <div className="flex justify-center">
                    <div className="text-center">
                      <ArrowRight className="w-6 h-6 text-slate-400" />
                      <p className="text-xs text-slate-500 mt-1">
                        {calculateDuration(flight.departureTime, flight.arrivalTime)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Chegada</p>
                    <p className="font-bold">{formatTime(flight.arrivalTime)}</p>
                    <p className="text-sm text-slate-600">{flight.destination}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-500">Preço</p>
                    <p className="font-bold text-xl text-blue-600">€{flight.price}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {flight.availableSeats} assentos
                    </p>
                    <Button
                      onClick={() => handleSelectFlight(flight.id)}
                      className="mt-3 w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Selecionar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : origin && destination ? (
          <Card className="p-12 text-center">
            <p className="text-slate-600 text-lg">Nenhum voo encontrado</p>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-slate-600 text-lg">Preencha os campos para buscar voos</p>
          </Card>
        )}
      </main>
    </div>
  );
}
