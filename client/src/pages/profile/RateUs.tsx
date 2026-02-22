import { useState } from "react";
import { ArrowLeft, Star, Send, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";

const aspects = [
  { id: "ease", label: "Ease of Booking" },
  { id: "ui", label: "App Experience" },
  { id: "turfs", label: "Turf Quality" },
  { id: "support", label: "Customer Support" },
];

export default function RateUs() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?.id ?? "";

  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [aspectRatings, setAspectRatings] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");

  // Check if user already reviewed
  const { data: existingReview, isLoading } = useQuery<{ overallStars: number } | null>({
    queryKey: ["/api/reviews", userId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/${userId}`);
      const json = await res.json();
      return json ?? null;
    },
    enabled: !!userId,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/reviews", {
        userId,
        overallStars: stars,
        aspectRatings,
        feedback: feedback.trim() || null,
      });
    },
    onError: (e: any) => toast({ title: "Submit failed", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Already submitted (either from this session or previously)
  if (submitMutation.isSuccess || (existingReview && existingReview.overallStars > 0)) {
    const displayStars = submitMutation.isSuccess ? stars : existingReview!.overallStars;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
          <Star className="w-10 h-10 text-black fill-black" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Thanks for rating us!</h2>
        <div className="flex gap-2">
          {[1,2,3,4,5].map(s => (
            <Star key={s} className={`w-7 h-7 ${s <= displayStars ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
          ))}
        </div>
        <p className="text-muted-foreground">Your {displayStars}-star review is saved to your account.</p>
        <Button className="green-glow mt-4" onClick={() => navigate("/profile")}>Back to Profile</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button size="icon" variant="ghost" onClick={() => navigate("/profile")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Rate Us</h1>
        </div>
      </header>

      <main className="px-4 py-8 space-y-6">
        <Card className="p-6 flex flex-col items-center gap-4">
          <p className="text-lg font-semibold text-foreground">How would you rate TurfTime?</p>
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)} onClick={() => setStars(s)}>
                <Star className={`w-9 h-9 transition-colors ${s <= (hovered || stars) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {stars === 0 ? "Tap a star to rate" : ["", "Poor", "Fair", "Good", "Very Good", "Excellent!"][stars]}
          </p>
        </Card>

        <Card className="p-4 space-y-4">
          <p className="font-semibold text-foreground text-sm">Rate specific aspects</p>
          {aspects.map(a => (
            <div key={a.id} className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground flex-1">{a.label}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setAspectRatings(r => ({ ...r, [a.id]: s }))}>
                    <Star className={`w-5 h-5 transition-colors ${s <= (aspectRatings[a.id] || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Card>

        <Card className="p-4 space-y-3">
          <p className="font-semibold text-foreground text-sm">Any additional feedback?</p>
          <Textarea
            placeholder="Tell us what you love or what we can improve..."
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            className="min-h-[100px] resize-none bg-secondary border-0"
          />
        </Card>

        <Button className="w-full green-glow" size="lg"
          disabled={stars === 0 || submitMutation.isPending}
          onClick={() => {
            if (stars === 0) { toast({ title: "Please select a rating", variant: "destructive" }); return; }
            submitMutation.mutate();
          }}>
          {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
          Submit Feedback
        </Button>
      </main>
    </div>
  );
}