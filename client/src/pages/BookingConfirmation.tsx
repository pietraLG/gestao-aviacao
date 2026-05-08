import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function BookingConfirmation() {
  const [, setLocation] = useLocation();
  const [bookingCode, setBookingCode] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setBookingCode(code);
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  if (!bookingCode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4 flex items-center justify-center">
      <Card className="max-w-md w-full p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Reserva Confirmada!</h1>
        <p className="text-slate-600 mb-6">Sua reserva foi realizada com sucesso</p>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
          <p className="text-sm text-slate-600 mb-2">Código de Reserva</p>
          <p className="text-3xl font-bold text-blue-600 font-mono">{bookingCode}</p>
        </div>

        <p className="text-sm text-slate-600 mb-6">
          Guarde este código para o check-in e confirmação da sua reserva.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => setLocation("/bookings")}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Ver Minhas Reservas
          </Button>
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="w-full"
          >
            Voltar ao Início
          </Button>
        </div>
      </Card>
    </div>
  );
}
