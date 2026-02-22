import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck, Store, CalendarCheck, Clock, ChevronRight, Users, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Turf, Booking } from '@shared/schema';

export default function AdminDashboard() {
  const { signOut, fullName } = useAuth();
  const [, navigate] = useLocation();

  const { data: pendingTurfs = [] } = useQuery<Turf[]>({ queryKey: ['/api/admin/turfs/pending'] });
  const { data: allTurfs = [] } = useQuery<Turf[]>({ queryKey: ['/api/admin/turfs'] });
  const { data: allBookings = [] } = useQuery<Booking[]>({ queryKey: ['/api/admin/bookings'] });

  const approvedTurfs = allTurfs.filter(t => t.approvalStatus === 'approved');

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-black" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
              <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 pt-6 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Welcome, <span className="text-primary">{fullName || 'Admin'}</span>
          </h2>
          <p className="text-sm text-muted-foreground">Manage turfs and bookings across the platform.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Turfs</p>
              <Store className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{approvedTurfs.length}</p>
            <p className="text-xs text-muted-foreground">{approvedTurfs.length} live</p>
          </Card>
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Bookings</p>
              <CalendarCheck className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{allBookings.length}</p>
            <p className="text-xs text-muted-foreground">All time</p>
          </Card>
        </div>

        {/* Pending Alert */}
        {pendingTurfs.length > 0 && (
          <button
            onClick={() => navigate('/admin/approvals')}
            className="w-full flex items-center gap-3 p-4 bg-primary/10 border border-primary/30 rounded-xl text-left"
          >
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-black" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-primary">{pendingTurfs.length} Turf{pendingTurfs.length > 1 ? 's' : ''} Pending Approval</p>
              <p className="text-xs text-muted-foreground">Review and approve or reject</p>
            </div>
            <Badge className="bg-primary text-black">{pendingTurfs.length}</Badge>
          </button>
        )}

        {/* Navigation Cards */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Admin Actions</h3>

          <button
            onClick={() => navigate('/admin/approvals')}
            className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-xl text-left hover:border-primary/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Pending Approvals</p>
              <p className="text-xs text-muted-foreground">Review turf applications</p>
            </div>
            {pendingTurfs.length > 0 && (
              <Badge className="bg-primary text-black mr-1">{pendingTurfs.length}</Badge>
            )}
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate('/admin/bookings')}
            className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-xl text-left hover:border-primary/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">All Bookings</p>
              <p className="text-xs text-muted-foreground">View all platform bookings</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate('/admin/cities')}
            className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-xl text-left hover:border-primary/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Manage Cities</p>
              <p className="text-xs text-muted-foreground">Add or remove cities for owners</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <Button variant="outline" onClick={signOut} className="w-full">
          Sign Out
        </Button>
      </main>
    </div>
  );
}
