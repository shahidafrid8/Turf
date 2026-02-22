import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNavigation } from "@/components/BottomNavigation";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { AuthForm } from "@/components/AuthForm";
import ProfileSetup from "@/pages/ProfileSetup";
import OwnerPendingApproval from "@/pages/owner/OwnerPendingApproval";
import { useState, useEffect, Component, ReactNode } from "react";

// ── Global Error Boundary ────────────────────────────────────────────────────
// Prevents uncaught JS errors from turning the whole screen black.
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-3xl">⚠️</div>
          <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">Please check your internet connection and try again.</p>
          <button
            className="mt-2 px-6 py-2 rounded-xl bg-primary text-black font-semibold text-sm"
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
          >Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// User pages
import Home from "@/pages/Home";
import Search from "@/pages/Search";
import Bookings from "@/pages/Bookings";
import Favorites from "@/pages/Favorites";
import Profile from "@/pages/Profile";
import Booking from "@/pages/Booking";
import Payment from "@/pages/Payment";
import Confirmation from "@/pages/Confirmation";
import VerifyBooking from "@/pages/VerifyBooking";
import NotFound from "@/pages/not-found";
// Profile sub-pages
import ProfileNotifications from "@/pages/profile/Notifications";
import ProfilePaymentMethods from "@/pages/profile/PaymentMethods";
import ProfilePrivacySecurity from "@/pages/profile/PrivacySecurity";
import ProfileRateUs from "@/pages/profile/RateUs";
import ProfileHelpSupport from "@/pages/profile/HelpSupport";
// Owner pages
import OwnerDashboard from "@/pages/owner/OwnerDashboard";
import AddTurf from "@/pages/owner/AddTurf";
import OwnerMyTurfs from "@/pages/owner/OwnerMyTurfs";
import OwnerBookings from "@/pages/owner/OwnerBookings";
// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminPendingApprovals from "@/pages/admin/AdminPendingApprovals";
import AdminAllBookings from "@/pages/admin/AdminAllBookings";
import AdminCities from "@/pages/admin/AdminCities";

function Router() {
  return (
    <Switch>
      {/* User Routes — all protected by global auth gate in AppContent */}
      <Route path="/" component={Home} />
      <Route path="/search" component={Search} />
      <Route path="/bookings" component={Bookings} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/profile" component={Profile} />
      <Route path="/booking/:id" component={Booking} />
      <Route path="/payment" component={Payment} />
      <Route path="/confirmation" component={Confirmation} />
      <Route path="/verify/:code" component={VerifyBooking} />
      <Route path="/profile/notifications" component={ProfileNotifications} />
      <Route path="/profile/payment-methods" component={ProfilePaymentMethods} />
      <Route path="/profile/privacy-security" component={ProfilePrivacySecurity} />
      <Route path="/profile/rate-us" component={ProfileRateUs} />
      <Route path="/profile/help-support" component={ProfileHelpSupport} />

      {/* Owner Routes */}
      <Route path="/owner">
        {() => <AuthGuard requireRole="owner"><OwnerDashboard /></AuthGuard>}
      </Route>
      <Route path="/owner/add-turf">
        {() => <AuthGuard requireRole="owner"><AddTurf /></AuthGuard>}
      </Route>
      <Route path="/owner/my-turfs">
        {() => <AuthGuard requireRole="owner"><OwnerMyTurfs /></AuthGuard>}
      </Route>
      <Route path="/owner/bookings">
        {() => <AuthGuard requireRole="owner"><OwnerBookings /></AuthGuard>}
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        {() => <AuthGuard requireRole="admin"><AdminDashboard /></AuthGuard>}
      </Route>
      <Route path="/admin/approvals">
        {() => <AuthGuard requireRole="admin"><AdminPendingApprovals /></AuthGuard>}
      </Route>
      <Route path="/admin/bookings">
        {() => <AuthGuard requireRole="admin"><AdminAllBookings /></AuthGuard>}
      </Route>
      <Route path="/admin/cities">
        {() => <AuthGuard requireRole="admin"><AdminCities /></AuthGuard>}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location, navigate] = useLocation();
  const { userRole, ownerStatus, user, loading, profileComplete } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const isOwnerRoute = location.startsWith("/owner");
  const isAdminRoute = location.startsWith("/admin");
  const isDetailRoute =
    location.startsWith("/booking/") ||
    location === "/payment" ||
    location === "/confirmation";

  // Auto-redirect after login based on role
  useEffect(() => {
    if (!loading && user && profileComplete) {
      if (userRole === 'admin' && !isAdminRoute) {
        navigate('/admin');
      } else if (userRole === 'owner' && ownerStatus === 'approved' && !isOwnerRoute) {
        navigate('/owner');
      }
    }
  }, [loading, user, profileComplete, userRole, ownerStatus]);

  // Global loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in → show auth form for the whole app
  if (!user) {
    return <AuthForm mode={authMode} onToggleMode={() => setAuthMode(m => m === 'login' ? 'register' : 'login')} />;
  }

  // Profile not set up → force profile setup
  if (!profileComplete) {
    return <ProfileSetup />;
  }

  // Owner pending/rejected → show pending screen
  if (userRole === 'owner' && (ownerStatus === 'pending' || ownerStatus === 'rejected')) {
    return <OwnerPendingApproval />;
  }

  const showBottomNav = !isOwnerRoute && !isAdminRoute && !isDetailRoute;

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-background">
      <Router />
      {showBottomNav && <BottomNavigation />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
