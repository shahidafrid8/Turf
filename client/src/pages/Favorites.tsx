import { useState } from "react";
import { Heart, Plus, MapPin, Star, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueries } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import type { Turf } from "@shared/schema";

function useFavIds() {
  return JSON.parse(localStorage.getItem("favIds") || "[]") as string[];
}

export default function Favorites() {
  const [, setLocation] = useLocation();
  const [favIds, setFavIds] = useState<string[]>(useFavIds);

  const turfQueries = useQueries({
    queries: favIds.map(id => ({
      queryKey: [`/api/turfs/${id}`],
      enabled: !!id,
    })),
  });

  const removeFav = (id: string) => {
    localStorage.removeItem(`fav_${id}`);
    const updated = favIds.filter(f => f !== id);
    localStorage.setItem("favIds", JSON.stringify(updated));
    setFavIds(updated);
  };

  const isLoading = turfQueries.some(q => q.isLoading);
  const turfs = turfQueries.map(q => q.data as Turf | undefined).filter(Boolean) as Turf[];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Favorites</h1>
        {favIds.length > 0 && (
          <Badge variant="secondary" className="text-primary">{favIds.length}</Badge>
        )}
      </header>

      <main className="px-4 py-6">
        {favIds.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-card flex items-center justify-center">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">No favorites yet</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Tap the ♥ heart button on any turf to save it here for quick booking.
            </p>
            <Link href="/">
              <Button className="green-glow mt-2" data-testid="button-browse-turfs">
                <Plus className="w-4 h-4 mr-2" />
                Browse Turfs
              </Button>
            </Link>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {favIds.map(id => (
              <Skeleton key={id} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {turfs.map(turf => (
              <Card key={turf.id} className="overflow-hidden flex gap-0">
                {/* Image */}
                <div className="w-28 h-28 flex-shrink-0 relative">
                  <img
                    src={turf.imageUrl}
                    alt={turf.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Info */}
                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-1">{turf.name}</h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {turf.rating > 0 ? (
                          <>
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs font-medium text-muted-foreground">{turf.rating}</span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">New</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="line-clamp-1">{turf.location}, {turf.city}</span>
                    </div>
                    <div className="flex gap-1 flex-wrap mt-1.5">
                      {turf.sportTypes.slice(0, 2).map(s => (
                        <Badge key={s} variant="secondary" className="text-xs px-1.5 py-0">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-primary font-bold text-sm">₹{turf.pricePerHour}<span className="text-xs font-normal text-muted-foreground">/hr</span></span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => removeFav(turf.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                      <Button size="sm" className="green-glow h-7 text-xs px-3" onClick={() => setLocation(`/booking/${turf.id}`)}>
                        Book
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
