import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import FlightSearch from "./pages/FlightSearch";
import SeatSelection from "./pages/SeatSelection";
import BookingConfirmation from "./pages/BookingConfirmation";
import MyBookings from "./pages/MyBookings";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminFlights from "./pages/admin/Flights";
import AdminAircraft from "./pages/admin/Aircraft";

function Router() {
  return (
    <Switch>
      {/* Client Portal */}
      <Route path={"/"} component={Home} />
      <Route path={"/search"} component={FlightSearch} />
      <Route path={"/seats/:flightId"} component={SeatSelection} />
      <Route path={"/booking-confirmation"} component={BookingConfirmation} />
      <Route path={"/bookings"} component={MyBookings} />

      {/* Admin Panel */}
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/flights"} component={AdminFlights} />
      <Route path={"/admin/aircraft"} component={AdminAircraft} />

      {/* 404 */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
