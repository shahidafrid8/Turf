import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { ArrowLeft, PlusCircle, MapPin, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Turf } from '@shared/schema';

export default function OwnerMyTurfs() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: turfs = [], isLoading } = useQuery<Turf[]>({
    queryKey: [`/api/owner/turfs/${user?.id}`],
    enabled: !!user?.id,
  });

  const statusColor = (status: string) => {
    if (status === 'approved') return 'default';
    if (status === 'rejected') return 'destructive';
    return 'secondary';
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => navigate('/owner')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">My Turfs</h1>
        </div>
        <Button size="sm" onClick={() => navigate('/owner/add-turf')} className="gap-1">
          <PlusCircle className="w-4 h-4" /> Add
        </Button>
      </header>

      <main className="px-4 pt-6 space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))
        ) : turfs.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto">
              <DollarSign className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">No turfs yet</h3>
            <p className="text-sm text-muted-foreground">Add your first turf to start receiving bookings</p>
            <Button onClick={() => navigate('/owner/add-turf')}>Add Your First Turf</Button>
          </div>
        ) : (
          turfs.map(turf => (
            <Card key={turf.id} className="overflow-hidden">
              <div className="flex gap-3 p-4">
                <img
                  src={turf.imageUrl}
                  alt={turf.name}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground text-sm leading-tight">{turf.name}</h3>
                    <Badge variant={statusColor(turf.approvalStatus)} className="capitalize text-xs flex-shrink-0">
                      {turf.approvalStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{turf.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-primary font-semibold">₹{turf.pricePerHour}/hr</span>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{turf.openingTime} – {turf.closingTime}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {turf.sportTypes.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
              {turf.approvalStatus === 'pending' && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                    ⏳ Waiting for admin approval before this turf goes live.
                  </p>
                </div>
              )}
              {turf.approvalStatus === 'rejected' && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                    ✗ This turf was rejected. Please contact support or resubmit.
                  </p>
                </div>
              )}
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
