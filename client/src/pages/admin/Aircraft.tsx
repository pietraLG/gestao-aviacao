import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plane, Plus, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";

export default function AdminAircraft() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { data: aircraft, isLoading, refetch } = trpc.aircraft.list.useQuery();

  const createAircraftMutation = trpc.aircraft.create.useMutation({
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
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Aeronaves</h1>
            <p className="text-slate-600">Cadastre e gerencie aeronaves</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Aeronave
          </Button>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card className="p-6 bg-white">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Criar Nova Aeronave</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const rows = parseInt(formData.get("rows") as string);
                const seatsPerRow = parseInt(formData.get("seatsPerRow") as string);
                
                createAircraftMutation.mutate({
                  name: formData.get("name") as string,
                  manufacturer: formData.get("manufacturer") as string,
                  totalSeats: rows * seatsPerRow,
                  rows,
                  seatsPerRow,
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Nome (ex: Boeing 737)"
                  required
                  className="px-3 py-2 border border-slate-300 rounded-md"
                />
                <input
                  type="text"
                  name="manufacturer"
                  placeholder="Fabricante"
                  required
                  className="px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  name="rows"
                  placeholder="Número de Fileiras"
                  min="1"
                  required
                  className="px-3 py-2 border border-slate-300 rounded-md"
                />
                <input
                  type="number"
                  name="seatsPerRow"
                  placeholder="Assentos por Fileira"
                  min="1"
                  max="6"
                  required
                  className="px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createAircraftMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createAircraftMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Aeronave"
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

        {/* Aircraft List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : aircraft && aircraft.length > 0 ? (
          <Card className="p-6 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">
                    Nome
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">
                    Fabricante
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">
                    Total de Assentos
                  </th>
                </tr>
              </thead>
              <tbody>
                {aircraft.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {a.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {a.manufacturer}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-semibold">
                      {a.totalSeats}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Card className="p-6 text-center bg-white">
            <Plane className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Nenhuma aeronave cadastrada</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
