import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, Calendar, Clock, MapPin, IndianRupee, Hash } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TurfTimeLogo } from "@/components/TurfTimeLogo";
import type { Booking } from "@shared/schema";
import { format, parseISO } from "date-fns";

export default function VerifyBooking() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();

  const { data: booking, isLoading, isError } = useQuery<Booking>({
    queryKey: [`/api/bookings/verify/${code}`],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Verifying booking...</p>
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center space-y-4">
        <XCircle className="w-20 h-20 text-destructive" />
        <h1 className="text-2xl font-bold text-foreground">Invalid Booking</h1>
        <p className="text-muted-foreground">No booking found with code <span className="font-mono font-bold text-foreground">{code}</span>.</p>
        <Button onClick={() => setLocation("/")} className="green-glow">Go Home</Button>
      </div>
    );
  }

  const formattedDate = (() => {
    try { return format(parseISO(booking.date), "EEEE, dd MMMM yyyy"); }
    catch { return booking.date; }
  })();

  const to12h = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h < 12 ? "AM" : "PM";
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4 flex items-center justify-between">
        <TurfTimeLogo size="sm" />
        <Badge variant="outline" className="text-primary border-primary">Venue Check-in</Badge>
      </div>

      <div className="px-4 pt-6 space-y-5 max-w-md mx-auto">
        {/* Valid badge */}
        <div className="flex flex-col items-center py-4 space-y-2">
          <CheckCircle className="w-16 h-16 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Booking Verified ✓</h1>
          <p className="text-sm text-muted-foreground">This ticket is valid for entry</p>
        </div>

        <Card className="p-5 space-y-4">
          {/* Booking code */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Booking ID</p>
              <p className="text-xl font-bold text-primary font-mono">{booking.bookingCode}</p>
            </div>
            <Badge className={booking.status === "confirmed" ? "bg-primary text-black" : "bg-destructive"}>{booking.status.toUpperCase()}</Badge>
          </div>

          <Separator />

          {/* Turf */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Venue</p>
            <p className="text-lg font-bold text-foreground">{booking.turfName}</p>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span>{booking.turfAddress}</span>
            </div>
          </div>

          <Separator />

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-semibold text-foreground text-sm">{formattedDate}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="font-semibold text-foreground text-sm">{to12h(booking.startTime)} – {to12h(booking.endTime)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Payment</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-medium">₹{booking.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid Online</span>
                <span className="font-medium text-primary">₹{booking.paidAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance at Venue</span>
                <span className="font-semibold text-foreground">₹{booking.balanceAmount}</span>
              </div>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Verified by TurfTime · Booking #{booking.bookingCode}
        </p>
      </div>
    </div>
  );
}
