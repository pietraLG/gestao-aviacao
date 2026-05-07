import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plane, Plus, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";

export default function AdminFlights() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);

  const { data: flights, isLoading, refetch } = trpc.flights.list.useQuery();
  const { data: aircraft } = trpc.aircraft.list.useQuery();

  const createFlightMutation = trpc.flights.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      refetch();
    },
  });

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-red-600">Acesso negado</p>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Voos</h1>
            <p className="text-slate-600">Cadastre e gerencie voos</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Voo
          </Button>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card className="p-6 bg-white">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Criar Novo Voo</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createFlightMutation.mutate({
                  flightNumber: formData.get("flightNumber") as string,
                  aircraftId: parseInt(formData.get("aircraftId") as string),
                  origin: (formData.get("origin") as string).toUpperCase(),
                  destination: (formData.get("destination") as string).toUpperCase(),
                  departureTime: new Date(formData.get("departureTime") as string).toISOString(),
                  arrivalTime: new Date(formData.get("arrivalTime") as string).toISOString(),
                  pricePerSeat: Math.round(parseFloat(formData.get("pricePerSeat") as string) * 100),
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="flightNumber"
                  placeholder="Número do Voo (ex: TP123)"
                  required
                  className="px-3 py-2 border border-slate-300 rounded-md"
                />
                <select
                  name="aircraftId"
                  required
                  className="px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value="">Selecione uma Aeronave</option>
                  {aircraft?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="origin"
                  placeholder="Origem (ex: LIS)"
                  maxLength={3}
                  required
                  className="px-3 py-2 border border-slate-300 rounded-md uppercase"
                />
                <input
                  type="text"
                  name="destination"
                  placeholder="Destino (ex: NYC)"
                  maxLength={3}
                  required
                  className="px-3 py-2 border border-slate-300 rounded-md uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="datetime-local"
                  name="departureTime"
                  required
                  className="px-3 py-2 border border-slate-300 rounded-md"
                />
                <input
                  type="datetime-local"
                  name="arrivalTime"
                  required
                  className="px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <input
                type="number"
                name="pricePerSeat"
                placeholder="Preço por Assento (€)"
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createFlightMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createFlightMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Voo"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Flights List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : flights && flights.length > 0 ? (
          <Card className="p-6 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">
                    Voo
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">
                    Rota
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">
                    Saída
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">
                    Preço
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {flights.map((flight) => (
                  <tr key={flight.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {flight.flightNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {flight.origin} → {flight.destination}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(flight.departureTime).toLocaleString("pt-PT")}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-semibold">
                      €{(flight.pricePerSeat / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          flight.status === "scheduled"
                            ? "bg-blue-100 text-blue-800"
                            : flight.status === "boarding"
                            ? "bg-yellow-100 text-yellow-800"
                            : flight.status === "departed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {flight.status === "scheduled"
                          ? "Agendado"
                          : flight.status === "boarding"
                          ? "Embarque"
                          : flight.status === "departed"
                          ? "Partiu"
                          : "Cancelado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Card className="p-6 text-center bg-white">
            <Plane className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Nenhum voo cadastrado</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
