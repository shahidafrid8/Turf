import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Booking } from '@shared/schema';

export default function AdminAllBookings() {
  const [, navigate] = useLocation();

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ['/api/admin/bookings'],
  });

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={() => navigate('/admin')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">All Bookings</h1>
          <p className="text-xs text-muted-foreground">{bookings.length} total</p>
        </div>
      </header>

      <main className="px-4 pt-6 space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">No bookings yet</h3>
            <p className="text-sm text-muted-foreground">Bookings will appear here once users start booking turfs.</p>
          </div>
        ) : (
          bookings.map(booking => (
            <Card key={booking.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{booking.turfName}</p>
                  <p className="text-xs text-muted-foreground font-mono">#{booking.bookingCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-primary font-bold">₹{booking.totalAmount}</p>
                  <Badge
                    variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                    className="text-xs capitalize"
                  >
                    {booking.status}
                  </Badge>
                </div>
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

              <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                <span>Paid: <span className="text-primary">₹{booking.paidAmount}</span></span>
                <span>Balance: <span className="text-foreground">₹{booking.balanceAmount}</span></span>
                <span>Method: <span className="text-foreground capitalize">{booking.paymentMethod}</span></span>
              </div>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
