import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, MessageCircle, Phone, Mail, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const faqs = [
  { q: "How do I cancel a booking?", a: "Go to My Bookings, select the booking, and tap 'Cancel Booking'. Cancellations made 2+ hours before the slot are fully refunded." },
  { q: "What happens if I'm late?", a: "Your slot is held for 15 minutes. After that, the slot may be given to walk-in customers. No refund for no-shows." },
  { q: "Can I reschedule a booking?", a: "Yes! Open the booking from My Bookings, tap 'Reschedule', and choose a new date/time. Rescheduling is free up to 1 hour before the slot." },
  { q: "How does Pay at Venue work?", a: "You pay 30% online to confirm. The remaining 70% is paid directly at the turf before your game." },
  { q: "How do I add a turf as favourite?", a: "On any turf's booking page, tap the heart ♥ icon in the top-right corner. Find all saved turfs under the Favorites tab." },
  { q: "The QR code isn't scanning — what do I do?", a: "Make sure your screen brightness is high. Show the QR code from your Booking confirmation page directly instead of a screenshot." },
  { q: "How is my rating calculated?", a: "Turf ratings are based on verified reviews left by users after completing a booking. New turfs show 'New' until they receive their first review." },
];

export default function HelpSupport() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button size="icon" variant="ghost" onClick={() => navigate("/profile")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Help & Support</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-5">

        {/* Contact options */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Contact Us</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: MessageCircle, label: "Live Chat", action: () => toast({ title: "Live Chat", description: "Connecting you to support..." }) },
              { icon: Phone, label: "Call Us", action: () => toast({ title: "Call Us", description: "+91 98765 43210" }) },
              { icon: Mail, label: "Email", action: () => toast({ title: "Email Us", description: "support@turftime.app" }) },
            ].map(c => (
              <button key={c.label} onClick={c.action}
                className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-accent/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <c.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Frequently Asked Questions</p>
          <Card className="divide-y divide-border overflow-hidden">
            {faqs.map((faq, i) => (
              <div key={i}>
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors gap-4"
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span className="font-medium text-foreground text-sm">{faq.q}</span>
                  {open === i
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </button>
                {open === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </Card>
        </div>

        {/* Quick links */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Quick Links</p>
          <Card className="divide-y divide-border">
            {[
              { label: "Terms of Service", sub: "Our terms and conditions" },
              { label: "Privacy Policy", sub: "How we handle your data" },
              { label: "Cancellation Policy", sub: "Refund and cancellation rules" },
            ].map(link => (
              <button key={link.label}
                className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors text-left"
                onClick={() => toast({ title: link.label, description: "Opening document..." })}>
                <div>
                  <p className="font-medium text-foreground text-sm">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.sub}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground">TurfTime v1.0.1 · support@turftime.app</p>
      </main>
    </div>
  );
}
