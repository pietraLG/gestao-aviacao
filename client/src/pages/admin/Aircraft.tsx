import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminAircraft() {
  const { user } = useAuth();

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
        <h1 className="text-3xl font-bold text-slate-900">Gestão de Aeronaves</h1>
        <p className="text-slate-600">Gerencie as aeronaves disponíveis</p>
      </div>

      <Card className="p-6 text-center text-slate-500">
        <p>Funcionalidade em desenvolvimento</p>
      </Card>
    </div>
  );
}
