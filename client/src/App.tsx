import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNavigation } from "@/components/BottomNavigation";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import Home from "@/pages/Home";
import Search from "@/pages/Search";
import Bookings from "@/pages/Bookings";
import Favorites from "@/pages/Favorites";
import Profile from "@/pages/Profile";
import Booking from "@/pages/Booking";
import Payment from "@/pages/Payment";
import Confirmation from "@/pages/Confirmation";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={Search} />
      <Route path="/bookings">
        {() => (
          <AuthGuard>
            <Bookings />
          </AuthGuard>
        )}
      </Route>
      <Route path="/favorites">
        {() => (
          <AuthGuard>
            <Favorites />
          </AuthGuard>
        )}
      </Route>
      <Route path="/profile">
        {() => (
          <AuthGuard>
            <Profile />
          </AuthGuard>
        )}
      </Route>
      <Route path="/booking/:id">
        {() => (
          <AuthGuard>
            <Booking />
          </AuthGuard>
        )}
      </Route>
      <Route path="/payment">
        {() => (
          <AuthGuard>
            <Payment />
          </AuthGuard>
        )}
      </Route>
      <Route path="/confirmation">
        {() => (
          <AuthGuard>
            <Confirmation />
          </AuthGuard>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  
  const hideBottomNav = 
    location.startsWith("/booking/") || 
    location === "/payment" || 
    location === "/confirmation";

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-background">
      <Router />
      {!hideBottomNav && <BottomNavigation />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
