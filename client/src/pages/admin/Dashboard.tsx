import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Plane, Users, TrendingUp, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

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
                  <p className="text-sm text-green-600 font-medium">Total de Reservas</p>
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
                    €{stats.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-300" />
              </div>
            </Card>
          </div>

          {/* Occupancy Rate */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Taxa de Ocupação</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full bg-slate-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all"
                    style={{ width: `${Math.min(parseFloat(stats.occupancyRate), 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-600">{stats.occupancyRate}%</span>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
