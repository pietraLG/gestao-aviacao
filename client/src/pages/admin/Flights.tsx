import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function AdminFlights() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    flightNumber: "",
    origin: "",
    destination: "",
    departureTime: "",
    arrivalTime: "",
    aircraftType: "Boeing 737",
    totalSeats: 180,
    price: 150,
  });

  const { data: flights, isLoading, refetch } = trpc.admin.getFlights.useQuery();
  const createFlight = trpc.flights.create.useMutation();

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-red-600">Acesso negado. Apenas administradores.</p>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createFlight.mutateAsync({
        flightNumber: formData.flightNumber,
        origin: formData.origin.toUpperCase(),
        destination: formData.destination.toUpperCase(),
        departureTime: new Date(formData.departureTime),
        arrivalTime: new Date(formData.arrivalTime),
        aircraftType: formData.aircraftType,
        totalSeats: formData.totalSeats,
        price: formData.price,
      });

      toast.success("Voo criado com sucesso!");
      setFormData({
        flightNumber: "",
        origin: "",
        destination: "",
        departureTime: "",
        arrivalTime: "",
        aircraftType: "Boeing 737",
        totalSeats: 180,
        price: 150,
      });
      setShowForm(false);
      refetch();
    } catch (error) {
      toast.error("Erro ao criar voo");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Voos</h1>
          <p className="text-slate-600">Crie e gerencie voos</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Voo
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Número do Voo (ex: AA123)"
                value={formData.flightNumber}
                onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                required
              />
              <Input
                placeholder="Origem (ex: LIS)"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                required
              />
              <Input
                placeholder="Destino (ex: NYC)"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                required
              />
              <Input
                type="datetime-local"
                value={formData.departureTime}
                onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                required
              />
              <Input
                type="datetime-local"
                value={formData.arrivalTime}
                onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                required
              />
              <Input
                placeholder="Tipo de Aeronave"
                value={formData.aircraftType}
                onChange={(e) => setFormData({ ...formData, aircraftType: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Total de Assentos"
                value={formData.totalSeats}
                onChange={(e) => setFormData({ ...formData, totalSeats: parseInt(e.target.value) })}
              />
              <Input
                type="number"
                placeholder="Preço"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createFlight.isPending}>
                {createFlight.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Voo"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : flights && flights.length > 0 ? (
        <div className="grid gap-4">
          {flights.map((flight) => (
            <Card key={flight.id} className="p-4 hover:shadow-lg transition">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Voo</p>
                  <p className="font-bold">{flight.flightNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Rota</p>
                  <p className="font-bold">{flight.origin} → {flight.destination}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Assentos</p>
                  <p className="font-bold">{flight.availableSeats}/{flight.totalSeats}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Preço</p>
                  <p className="font-bold">€{flight.price}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <p className="font-bold text-green-600">{flight.status}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center text-slate-500">
          Nenhum voo cadastrado
        </Card>
      )}
    </div>
  );
}
