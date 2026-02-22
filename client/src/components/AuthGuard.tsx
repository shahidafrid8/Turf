import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/AuthForm';
import { useState } from 'react';
import ProfileSetup from '@/pages/ProfileSetup';
import OwnerPendingApproval from '@/pages/owner/OwnerPendingApproval';

interface AuthGuardProps {
  children: ReactNode;
  requireRole?: 'user' | 'owner' | 'admin';
}

export function AuthGuard({ children, requireRole }: AuthGuardProps) {
  const { user, loading, userRole, ownerStatus, profileComplete } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

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

  // Not logged in → show auth form
  if (!user) {
    return <AuthForm mode={mode} onToggleMode={() => setMode(mode === 'login' ? 'register' : 'login')} />;
  }

  // Logged in but profile not set up yet → show profile setup
  if (!profileComplete) {
    return <ProfileSetup />;
  }

  // Owner pending/rejected → show pending approval screen
  if (userRole === 'owner' && (ownerStatus === 'pending' || ownerStatus === 'rejected')) {
    return <OwnerPendingApproval />;
  }

  // Role-gated route check
  if (requireRole && userRole !== requireRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 text-center">
        <div className="space-y-3">
          <p className="text-2xl font-bold text-foreground">Access Denied</p>
          <p className="text-muted-foreground text-sm">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
