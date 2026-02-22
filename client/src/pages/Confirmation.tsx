import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Check, Calendar, Clock, MapPin, Download, Home, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TurfTimeLogo } from "@/components/TurfTimeLogo";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { format, parseISO } from "date-fns";
import type { Booking } from "@shared/schema";

function to12h(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function Confirmation() {
  const [, setLocation] = useLocation();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [downloading, setDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const stored = sessionStorage.getItem("confirmedBooking");
    if (stored) {
      setBooking(JSON.parse(stored));
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  const copyBookingCode = () => {
    if (booking) {
      navigator.clipboard.writeText(booking.bookingCode);
      toast({ title: "Copied!", description: "Booking code copied to clipboard" });
    }
  };

  const downloadReceipt = async () => {
    if (!booking || !receiptRef.current) return;
    setDownloading(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF } = await import("jspdf");

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: "#0a0a0a",
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = (canvas.height * pageW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pageW, pageH);
      pdf.save(`TurfTime-Receipt-${booking.bookingCode}.pdf`);

      toast({ title: "Downloaded!", description: "Receipt saved as PDF" });
    } catch {
      toast({ title: "Error", description: "Failed to download receipt", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  if (!booking) return null;

  const verifyUrl = `${window.location.origin}/verify/${booking.bookingCode}`;

  const formattedDate = (() => {
    try { return format(parseISO(booking.date), "EEEE, dd MMMM yyyy"); }
    catch { return booking.date; }
  })();

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Success Animation */}
      <div className="flex flex-col items-center justify-center pt-12 pb-8 px-4">
        <div className="relative mb-6">
          <div className="absolute inset-0 w-28 h-28 rounded-full bg-primary/20 animate-success-pulse" />
          <div className="relative w-28 h-28 rounded-full bg-primary flex items-center justify-center animate-circle-expand green-glow">
            <svg className="w-14 h-14 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path className="animate-draw-check" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground text-center animate-fade-in">Booking Confirmed!</h1>
        <p className="text-muted-foreground text-center mt-2 animate-fade-in">Your turf has been successfully booked</p>
      </div>

      <main className="px-4 space-y-6" data-testid="section-confirmation">
        {/* Receipt card — this is what gets captured for PDF */}
        <div ref={receiptRef}>
          <Card className="p-5 animate-slide-up bg-card" data-testid="card-booking-details">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Booking ID</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-primary font-mono">{booking.bookingCode}</span>
                  <button onClick={copyBookingCode} className="p-1 rounded hover:bg-secondary">
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <TurfTimeLogo size="sm" showText={false} />
                <Badge className="bg-primary text-black text-xs">CONFIRMED</Badge>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Turf info */}
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-foreground text-lg">{booking.turfName}</h3>
                <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{booking.turfAddress}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium text-foreground text-sm">{formattedDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Clock className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-medium text-foreground text-sm">{to12h(booking.startTime)} – {to12h(booking.endTime)}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Real QR Code */}
            <div className="flex flex-col items-center py-4 space-y-3">
              <div className="bg-white p-3 rounded-xl shadow-md">
                <QRCodeSVG
                  value={verifyUrl}
                  size={160}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: "/icon.png",
                    x: undefined,
                    y: undefined,
                    height: 28,
                    width: 28,
                    excavate: true,
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">Scan at venue for check-in</p>
            </div>

            <Separator className="my-4" />

            {/* Payment summary inside receipt */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium text-foreground">₹{booking.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid Online</span>
                  <span className="font-medium text-primary">₹{booking.paidAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance Due at Venue</span>
                  <span className="font-semibold text-foreground">₹{booking.balanceAmount}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">Generated by TurfTime · {new Date().toLocaleDateString()}</p>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <Button className="w-full green-glow" size="lg" onClick={() => setLocation("/bookings")} data-testid="button-view-details">
            <Calendar className="w-5 h-5 mr-2" />
            View Booking Details
          </Button>
          <Button variant="outline" className="w-full" size="lg" onClick={() => setLocation("/")} data-testid="button-book-another">
            <Home className="w-5 h-5 mr-2" />
            Book Another Turf
          </Button>
        </div>

        {/* Download Receipt */}
        <div className="flex justify-center pt-2 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <Button
            variant="ghost"
            className="text-primary"
            onClick={downloadReceipt}
            disabled={downloading}
            data-testid="button-download-receipt"
          >
            <Download className="w-4 h-4 mr-2" />
            {downloading ? "Generating PDF..." : "Download Receipt"}
          </Button>
        </div>
      </main>
    </div>
  );
}
