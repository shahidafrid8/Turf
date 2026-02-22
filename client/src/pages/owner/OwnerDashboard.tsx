import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Store, CalendarCheck, PlusCircle, ChevronRight, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Turf } from '@shared/schema';

export default function OwnerDashboard() {
  const { user, fullName, signOut } = useAuth();
  const [, navigate] = useLocation();

  const { data: myTurfs = [] } = useQuery<Turf[]>({
    queryKey: [`/api/owner/turfs/${user?.id}`],
    enabled: !!user?.id,
  });

  const approvedTurfs = myTurfs.filter(t => t.approvalStatus === 'approved');
  const pendingTurfs = myTurfs.filter(t => t.approvalStatus === 'pending');
  const initials = fullName ? fullName.substring(0, 2).toUpperCase() : 'OW';

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Owner Portal</p>
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          </div>
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-primary text-black font-bold text-sm">{initials}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <main className="px-4 pt-6 space-y-6">
        {/* Welcome */}
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            Welcome back, <span className="text-primary">{fullName || 'Owner'}</span>!
          </h2>
          <p className="text-sm text-muted-foreground">Manage your turfs and bookings here.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">My Turfs</p>
              <Store className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{myTurfs.length}</p>
            <p className="text-xs text-muted-foreground">{approvedTurfs.length} live · {pendingTurfs.length} pending</p>
          </Card>
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Revenue</p>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">₹0</p>
            <p className="text-xs text-muted-foreground">This month</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Quick Actions</h3>

          <button
            onClick={() => navigate('/owner/add-turf')}
            className="w-full flex items-center gap-4 p-4 bg-primary rounded-xl text-left transition-opacity active:opacity-80"
          >
            <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0">
              <PlusCircle className="w-5 h-5 text-black" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-black">Add New Turf</p>
              <p className="text-xs text-black/70">Submit for admin approval</p>
            </div>
            <ChevronRight className="w-5 h-5 text-black/70" />
          </button>

          <button
            onClick={() => navigate('/owner/my-turfs')}
            className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border text-left transition-colors hover:border-primary/40"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">My Turfs</p>
              <p className="text-xs text-muted-foreground">View & manage your listings</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate('/owner/bookings')}
            className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border text-left transition-colors hover:border-primary/40"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Bookings</p>
              <p className="text-xs text-muted-foreground">See who booked your turfs</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Recent Turfs */}
        {myTurfs.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">My Turfs</h3>
            {myTurfs.slice(0, 3).map(turf => (
              <Card key={turf.id} className="p-4 flex items-center gap-3">
                <img src={turf.imageUrl} alt={turf.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{turf.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{turf.location}</p>
                </div>
                <Badge
                  variant={turf.approvalStatus === 'approved' ? 'default' : turf.approvalStatus === 'rejected' ? 'destructive' : 'secondary'}
                  className="capitalize text-xs flex-shrink-0"
                >
                  {turf.approvalStatus}
                </Badge>
              </Card>
            ))}
          </div>
        )}

        {/* Sign Out */}
        <Button variant="outline" onClick={signOut} className="w-full">
          Sign Out
        </Button>
      </main>
    </div>
  );
}
