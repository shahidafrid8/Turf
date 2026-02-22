import { useState } from "react";
import { Star, MapPin, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Turf } from "@shared/schema";
import { Link } from "wouter";

interface TurfCardProps {
  turf: Turf;
  variant?: "featured" | "list";
}

function useFav(id: string) {
  const [isFav, setIsFav] = useState(() => localStorage.getItem(`fav_${id}`) === "1");
  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !isFav;
    setIsFav(next);
    localStorage.setItem(`fav_${id}`, next ? "1" : "0");
    const favList: string[] = JSON.parse(localStorage.getItem("favIds") || "[]");
    if (next) {
      if (!favList.includes(id)) { favList.push(id); }
    } else {
      const idx = favList.indexOf(id);
      if (idx !== -1) favList.splice(idx, 1);
    }
    localStorage.setItem("favIds", JSON.stringify(favList));
  };
  return { isFav, toggle };
}

export function TurfCard({ turf, variant = "list" }: TurfCardProps) {
  const { isFav, toggle } = useFav(turf.id);

  if (variant === "featured") {
    return (
      <Link href={`/booking/${turf.id}`}>
        <Card 
          className="relative overflow-hidden rounded-xl min-w-[280px] h-[200px] flex-shrink-0 group cursor-pointer hover-elevate"
          data-testid={`card-turf-featured-${turf.id}`}
        >
          <img
            src={turf.imageUrl}
            alt={turf.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 turf-card-gradient" />
          
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-2">
              {turf.isAvailable && (
                <Badge className="bg-primary text-primary-foreground text-xs font-semibold">
                  Available Now
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{turf.name}</h3>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span>{turf.location}</span>
            </div>
          </div>
          
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={toggle}
              className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center"
            >
              <Heart className={`w-3.5 h-3.5 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </button>
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-white text-xs font-medium">{turf.rating > 0 ? turf.rating : 'New'}</span>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/booking/${turf.id}`}>
      <Card 
        className="flex gap-4 p-3 hover-elevate cursor-pointer"
        data-testid={`card-turf-${turf.id}`}
      >
        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={turf.imageUrl}
            alt={turf.name}
            className="w-full h-full object-cover"
          />
          {turf.isAvailable && (
            <div className="absolute top-1.5 left-1.5">
              <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground truncate">{turf.name}</h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={toggle} className="p-1">
                <Heart className={`w-4 h-4 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
              </button>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-muted-foreground">{turf.rating > 0 ? turf.rating : 'New'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{turf.location}</span>
          </div>
          
          <div className="flex items-center gap-3 mt-2">
            <div className="flex gap-1.5">
              {turf.sportTypes.slice(0, 2).map((sport) => (
                <Badge 
                  key={sport} 
                  variant="secondary"
                  className="text-xs px-2 py-0.5"
                >
                  {sport}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-primary font-semibold">
              <span className="text-sm">From</span>
              <span className="text-base">₹{turf.pricePerHour}/hr</span>
            </div>
            <Button size="sm" className="h-7 text-xs px-3" data-testid={`button-book-${turf.id}`}>
              Book
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
