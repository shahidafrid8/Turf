import { useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Store } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { TurfTimeLogo } from '@/components/TurfTimeLogo';

export default function OwnerPendingApproval() {
  const { ownerStatus, signOut, fullName, updateOwnerStatus, user } = useAuth();

  const isRejected = ownerStatus === 'rejected';

  // Poll server every 5 seconds to check if admin has approved/rejected
  useEffect(() => {
    if (!user?.id) return;

    // Self-register in server storage in case this owner signed up before the fix
    const register = async () => {
      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: user.id,
            password: user.id,
            fullName: fullName || 'Turf Owner',
            role: 'owner',
            ownerStatus: 'pending',
          }),
        });
      } catch { /* ignore */ }
    };
    register();

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/users/status/${user.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.ownerStatus === 'approved' && ownerStatus !== 'approved') {
          await updateOwnerStatus('approved');
        } else if (data.ownerStatus === 'rejected' && ownerStatus !== 'rejected') {
          await updateOwnerStatus('rejected');
        }
      } catch {
        // ignore network errors during polling
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.id, ownerStatus, updateOwnerStatus]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <TurfTimeLogo size="lg" />
      </div>

      {/* Status Icon */}
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
        isRejected ? 'bg-destructive/10' : 'bg-primary/10'
      }`}>
        {isRejected ? (
          <XCircle className="w-12 h-12 text-destructive" />
        ) : (
          <Clock className="w-12 h-12 text-primary" />
        )}
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">
        {isRejected ? 'Application Rejected' : 'Awaiting Approval'}
      </h1>
      
      <p className="text-muted-foreground mb-2">Hi, {fullName || 'there'}!</p>
      
      <p className="text-muted-foreground text-sm max-w-xs mb-8">
        {isRejected
          ? "We're sorry, your turf owner application was not approved at this time. Please contact support for more details."
          : "Your turf owner application is under review. Our admin team will approve your account shortly. You'll be notified once approved."
        }
      </p>

      {/* Status Stepper */}
      {!isRejected && (
        <div className="w-full max-w-xs bg-card rounded-2xl p-5 mb-8 text-left space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-black" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">Profile Created</p>
              <p className="text-xs text-muted-foreground">Account registered successfully</p>
            </div>
          </div>
          <div className="ml-4 w-px h-4 bg-border" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center flex-shrink-0 animate-pulse">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">Admin Review</p>
              <p className="text-xs text-muted-foreground">Waiting for approval</p>
            </div>
          </div>
          <div className="ml-4 w-px h-4 bg-border" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Store className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-muted-foreground text-sm">Access Granted</p>
              <p className="text-xs text-muted-foreground">Manage your turfs</p>
            </div>
          </div>
        </div>
      )}

      <Button variant="outline" onClick={signOut} className="w-full max-w-xs">
        Sign Out
      </Button>
    </div>
  );
}
