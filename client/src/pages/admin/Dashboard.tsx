import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart3, Plane, Users, TrendingUp, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = trpc.admin.getDashboardStats.useQuery();

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-red-600">Acesso negado. Apenas administradores.</p>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Bem-vindo ao painel administrativo</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : stats ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total de Voos</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">
                      {stats.totalFlights}
                    </p>
                  </div>
                  <Plane className="w-12 h-12 text-blue-300" />
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">
                      Total de Reservas
                    </p>
                    <p className="text-3xl font-bold text-green-900 mt-2">
                      {stats.totalBookings}
                    </p>
                  </div>
                  <Users className="w-12 h-12 text-green-300" />
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Receita Total</p>
                    <p className="text-3xl font-bold text-purple-900 mt-2">
                      €{(stats.totalRevenue / 100).toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-purple-300" />
                </div>
              </Card>
            </div>

            {/* Flights Table */}
            <Card className="p-6 bg-white">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Estatísticas por Voo
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Voo
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Reservas
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Receita
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.flightStats.map((flight) => (
                      <tr key={flight.flightId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {flight.flightNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {flight.bookingCount}
                        </td>
                        <td className="py-3 px-4 text-slate-900 font-semibold">
                          €{(flight.revenue / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={() => setLocation("/admin/flights")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Gerenciar Voos
              </Button>
              <Button
                onClick={() => setLocation("/admin/aircraft")}
                variant="outline"
              >
                Gerenciar Aeronaves
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
