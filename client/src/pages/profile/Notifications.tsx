import { useState, useEffect } from "react";
import { ArrowLeft, Bell, BellOff, Smartphone, Mail, Tag, Calendar, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Toggle {
  id: string;
  icon: typeof Bell;
  label: string;
  description: string;
  defaultOn: boolean;
}

const SECTION_DEFS: { title: string; items: { id: string; icon: typeof Bell; label: string; description: string; defaultOn: boolean }[] }[] = [
  {
    title: "Booking Alerts",
    items: [
      { id: "booking_confirm", icon: Calendar, label: "Booking Confirmed", description: "When a booking is successfully made", defaultOn: true },
      { id: "booking_reminder", icon: Bell, label: "Game Reminders", description: "1 hour before your game starts", defaultOn: true },
      { id: "booking_cancel", icon: BellOff, label: "Cancellations", description: "When a booking is cancelled", defaultOn: true },
    ],
  },
  {
    title: "Promotions",
    items: [
      { id: "promo_offers", icon: Tag, label: "Offers & Deals", description: "Special discounts and promo codes", defaultOn: false },
      { id: "promo_new", icon: Smartphone, label: "New Turfs Nearby", description: "When new turfs are added in your city", defaultOn: false },
    ],
  },
  {
    title: "Channels",
    items: [
      { id: "channel_push", icon: Smartphone, label: "Push Notifications", description: "Receive alerts on your device", defaultOn: true },
      { id: "channel_email", icon: Mail, label: "Email Notifications", description: "Receive alerts via email", defaultOn: true },
    ],
  },
];

function defaultPrefs() {
  const d: Record<string, boolean> = {};
  SECTION_DEFS.forEach(s => s.items.forEach(i => { d[i.id] = i.defaultOn; }));
  return d;
}

export default function Notifications() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";

  // Load from server
  const { data, isLoading } = useQuery<{ notifPrefs: Record<string, boolean> }>({
    queryKey: ["/api/preferences", userId],
    queryFn: async () => {
      const res = await fetch(`/api/preferences/${userId}`);
      return res.json();
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  // Local optimistic state — starts from server data or defaults
  const [prefs, setPrefs] = useState<Record<string, boolean>>(defaultPrefs);
  useEffect(() => {
    if (data?.notifPrefs && Object.keys(data.notifPrefs).length > 0) {
      setPrefs(data.notifPrefs);
    }
  }, [data]);

  // Save to server
  const saveMutation = useMutation({
    mutationFn: async (notifPrefs: Record<string, boolean>) => {
      await apiRequest("PUT", `/api/preferences/${userId}`, { notifPrefs });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/preferences", userId] }),
    onError: () => toast({ title: "Failed to save", description: "Could not save preference.", variant: "destructive" }),
  });

  const toggle = (id: string) => {
    const updated = { ...prefs, [id]: !prefs[id] };
    setPrefs(updated);
    saveMutation.mutate(updated);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button size="icon" variant="ghost" onClick={() => navigate("/profile")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          {(isLoading || saveMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />}
        </div>
      </header>

      <main className="px-4 py-6 space-y-5">
        {SECTION_DEFS.map(section => (
          <div key={section.title} className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">{section.title}</p>
            <Card className="divide-y divide-border">
              {section.items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(item.id)}
                    disabled={saveMutation.isPending}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-60 ${prefs[item.id] ? "bg-primary" : "bg-secondary"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${prefs[item.id] ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              ))}
            </Card>
          </div>
        ))}
        <p className="text-xs text-muted-foreground text-center">
          Preferences are synced to your account across devices.
        </p>
      </main>
    </div>
  );
}
