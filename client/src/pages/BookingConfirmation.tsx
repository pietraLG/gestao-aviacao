import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plane, CheckCircle, Download } from "lucide-react";
import { useSearchParams } from "@/hooks/useSearchParams";
import { trpc } from "@/lib/trpc";

export default function BookingConfirmation() {
  const [, setLocation] = useLocation();
  const params = useSearchParams();
  const bookingCode = params.get("code") || "";

  const { data: booking } = trpc.bookings.getByCode.useQuery(
    { bookingCode },
    { enabled: !!bookingCode }
  );

  const handlePrint = () => {
    window.print();
  };

  const handleBackHome = () => {
    setLocation("/");
  };

  const handleViewBookings = () => {
    setLocation("/bookings");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
          <Plane className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-900">SkyReserve</h1>
        </div>
      </header>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Reserva Confirmada!
          </h2>
          <p className="text-lg text-slate-600">
            Sua reserva foi criada com sucesso
          </p>
        </div>

        {/* Ticket Card */}
        {booking && (
          <Card className="p-8 bg-white shadow-lg mb-8">
            {/* Booking Code */}
            <div className="text-center mb-8 pb-8 border-b-2 border-dashed border-slate-300">
              <p className="text-sm text-slate-500 mb-2">Código de Reserva</p>
              <p className="text-4xl font-bold text-blue-600 font-mono">
                {booking.bookingCode}
              </p>
            </div>

            {/* Passenger Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-xs text-slate-500 mb-1">Passageiro</p>
                <p className="text-lg font-semibold text-slate-900">
                  {booking.passengerName}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Email</p>
                <p className="text-lg font-semibold text-slate-900">
                  {booking.passengerEmail}
                </p>
              </div>
            </div>

            {/* Flight Details */}
            <div className="bg-slate-50 p-6 rounded-lg mb-8">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                Detalhes do Voo
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Voo</p>
                  <p className="font-semibold text-slate-900">
                    {booking.flight?.flightNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Rota</p>
                  <p className="font-semibold text-slate-900">
                    {booking.flight?.origin} → {booking.flight?.destination}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Saída</p>
                  <p className="font-semibold text-slate-900">
                    {booking.flight?.departureTime &&
                      new Date(booking.flight.departureTime).toLocaleTimeString(
                        "pt-PT",
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Data</p>
                  <p className="font-semibold text-slate-900">
                    {booking.flight?.departureTime &&
                      new Date(booking.flight.departureTime).toLocaleDateString(
                        "pt-PT"
                      )}
                  </p>
                </div>
              </div>
            </div>

            {/* Seat and Price */}
            <div className="grid grid-cols-2 gap-8 pb-8 border-b border-slate-200">
                <div>
                  <p className="text-xs text-slate-500">Assento</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {booking.seatId ? `Assento #${booking.seatId}` : "Confirmado"}
                  </p>
                </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-1">Preço Total</p>
                <p className="text-2xl font-bold text-slate-900">
                  €{(booking.totalPrice / 100).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Important Info */}
            <div className="bg-blue-50 p-4 rounded-lg mt-8 border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Importante:</strong> Guarde este código de reserva. Você
                precisará dele para fazer check-in no aeroporto. Recomendamos
                imprimir ou guardar este bilhete.
              </p>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Imprimir Bilhete
          </Button>
          <Button
            onClick={handleViewBookings}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Ver Minhas Reservas
          </Button>
          <Button
            onClick={handleBackHome}
            variant="outline"
          >
            Voltar ao Início
          </Button>
        </div>
      </section>
    </div>
  );
}
