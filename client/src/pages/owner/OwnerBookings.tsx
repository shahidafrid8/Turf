import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Turf, Booking } from '@shared/schema';

export default function OwnerBookings() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: myTurfs = [] } = useQuery<Turf[]>({
    queryKey: [`/api/owner/turfs/${user?.id}`],
    enabled: !!user?.id,
  });

  const approvedTurfs = myTurfs.filter(t => t.approvalStatus === 'approved');

  // Fetch bookings for each approved turf
  const bookingQueries = approvedTurfs.map(turf => ({
    turfId: turf.id,
    turfName: turf.name,
  }));

  const { data: allBookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
  });

  const myBookings = allBookings.filter(b =>
    approvedTurfs.some(t => t.id === b.turfId)
  );

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={() => navigate('/owner')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Turf Bookings</h1>
          <p className="text-xs text-muted-foreground">{myBookings.length} total bookings</p>
        </div>
      </header>

      <main className="px-4 pt-6 space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : myBookings.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">No bookings yet</h3>
            <p className="text-sm text-muted-foreground">
              {approvedTurfs.length === 0
                ? 'Get your turfs approved first to start receiving bookings'
                : 'Bookings will appear here once players book your turfs'}
            </p>
          </div>
        ) : (
          myBookings.map(booking => {
            const turf = approvedTurfs.find(t => t.id === booking.turfId);
            return (
              <Card key={booking.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{booking.turfName}</p>
                    <p className="text-xs text-muted-foreground font-mono">#{booking.bookingCode}</p>
                  </div>
                  <span className="text-primary font-bold text-sm">₹{booking.totalAmount}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{booking.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{booking.startTime} – {booking.endTime}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{booking.turfAddress}</span>
                </div>
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
}
