import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plane, MapPin, Calendar, Users } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (origin && destination && departureDate) {
      setLocation(
        `/search?origin=${origin}&destination=${destination}&date=${departureDate}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Plane className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">SkyReserve</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-600">Bem-vindo, {user?.name}</span>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/bookings")}
                >
                  Minhas Reservas
                </Button>
                {user?.role === "admin" && (
                  <Button
                    variant="default"
                    onClick={() => setLocation("/admin")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Painel Admin
                  </Button>
                )}
              </>
            ) : (
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Voe com Elegância e Confiança
          </h2>
          <p className="text-xl text-slate-600">
            Encontre e reserve seus voos com a melhor experiência de usuário
          </p>
        </div>

        {/* Search Card */}
        <Card className="bg-white shadow-lg p-8 mb-12">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Origin */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  De (Origem)
                </label>
                <Input
                  placeholder="Ex: LIS, NYC, LAX"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                  className="uppercase"
                  maxLength={3}
                />
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Para (Destino)
                </label>
                <Input
                  placeholder="Ex: LIS, NYC, LAX"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value.toUpperCase())}
                  className="uppercase"
                  maxLength={3}
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data
                </label>
                <Input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  <Plane className="w-4 h-4 mr-2" />
                  Buscar Voos
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Plane className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Milhares de Voos
            </h3>
            <p className="text-slate-600">
              Acesso a uma vasta rede de voos internacionais e domésticos
            </p>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Melhor Preço
            </h3>
            <p className="text-slate-600">
              Garantia de preços competitivos e sem taxas ocultas
            </p>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Flexibilidade
            </h3>
            <p className="text-slate-600">
              Cancele ou modifique suas reservas facilmente
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2026 SkyReserve. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
