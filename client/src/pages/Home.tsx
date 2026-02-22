import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Bell, MapPin, ChevronDown, Check } from "lucide-react";
import { TurfTimeLogo } from "@/components/TurfTimeLogo";
import { TurfCard } from "@/components/TurfCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useAuth } from "@/contexts/AuthContext";
import type { Turf } from "@shared/schema";

const SPORT_FILTERS = ["All", "Cricket", "Football", "Basketball", "Tennis", "Badminton"];

function isAvailableNow(turf: Turf): boolean {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = turf.openingTime.split(":").map(Number);
  const [ch, cm] = turf.closingTime.split(":").map(Number);
  return cur >= oh * 60 + om && cur < ch * 60 + cm - 60;
}

const CITY_KEY = "playturf_city";

export default function Home() {
  const { user, fullName } = useAuth();
  const [selectedCity, setSelectedCity] = useState<string>(() =>
    localStorage.getItem(CITY_KEY) || "Bangalore"
  );
  const [cityOpen, setCityOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { localStorage.setItem(CITY_KEY, selectedCity); }, [selectedCity]);

  const { data: cities = [] } = useQuery<string[]>({
    queryKey: ["/api/cities"],
  });

  const { data: turfs = [], isLoading } = useQuery<Turf[]>({
    queryKey: ["/api/turfs", selectedCity],
    queryFn: async () => {
      const r = await fetch(`/api/turfs?city=${encodeURIComponent(selectedCity)}`);
      if (!r.ok) return [];
      const data = await r.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const displayName = fullName || user?.email?.split("@")[0] || "User";
  const initials = displayName.substring(0, 2).toUpperCase();

  const sportFiltered =
    activeFilter === "All"
      ? turfs
      : turfs.filter(t => t.sportTypes.includes(activeFilter));

  const searched = searchQuery
    ? sportFiltered.filter(
      t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : sportFiltered;

  const featuredTurfs = searched.filter(t => t.featured);
  const availableNowTurfs = searched.filter(t => t.isAvailable && isAvailableNow(t));
  const allListTurfs = searched.filter(t => t.isAvailable);
  const displayList = availableNowTurfs.length > 0 ? availableNowTurfs : allListTurfs;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <TurfTimeLogo size="sm" />
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </Button>
            <Avatar className="w-8 h-8 cursor-pointer">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary text-black text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="px-4 pt-5 space-y-5">
        {/* Hero + City Selector — title left, city pill right */}
        <section className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground leading-tight">
              Find Your Perfect<span className="text-primary"> Turf</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Book your next game in seconds</p>
          </div>

          {/* Searchable city picker */}
          <Popover open={cityOpen} onOpenChange={setCityOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={cityOpen}
                className="flex-shrink-0 h-auto py-2 px-3 gap-1.5 bg-card border-border hover:border-primary/60 text-foreground rounded-xl mt-0.5"
              >
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-medium max-w-[88px] truncate">{selectedCity}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-0 w-52">
              <Command>
                <CommandInput placeholder="Search city..." className="h-9" />
                <CommandList className="max-h-56">
                  <CommandEmpty>No city found.</CommandEmpty>
                  <CommandGroup>
                    {cities.map(city => (
                      <CommandItem
                        key={city}
                        value={city}
                        onSelect={() => {
                          setSelectedCity(city);
                          setActiveFilter("All");
                          setCityOpen(false);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${city === selectedCity ? "opacity-100 text-primary" : "opacity-0"
                            }`}
                        />
                        {city}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </section>

        {/* Search */}
        <section className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder={`Search turfs in ${selectedCity}...`}
            className="pl-10 h-11 bg-card border-transparent focus-visible:ring-0 focus-visible:border-border"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </section>

        {/* Sport Filters */}
        <section>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
            {SPORT_FILTERS.map(f => (
              <Badge
                key={f}
                variant={activeFilter === f ? "default" : "secondary"}
                className="px-4 py-2 text-sm font-medium whitespace-nowrap cursor-pointer flex-shrink-0"
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </Badge>
            ))}
          </div>
        </section>

        {/* Featured Turfs */}
        {(isLoading || featuredTurfs.length > 0) && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Featured Turfs</h2>
              <span className="text-xs text-muted-foreground">{selectedCity}</span>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="min-w-[260px] h-[180px] rounded-xl flex-shrink-0"
                  />
                ))
                : featuredTurfs.map((turf, i) => (
                  <div
                    key={turf.id}
                    className="animate-slide-up flex-shrink-0"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <TurfCard turf={turf} variant="featured" />
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Available Now */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">Available Now</h2>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
            <span className="text-xs text-muted-foreground">
              {isLoading ? "..." : `${displayList.length} turfs`}
            </span>
          </div>

          <div className="space-y-3 pb-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))
            ) : displayList.length === 0 ? (
              <div className="text-center py-14">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card flex items-center justify-center">
                  <MapPin className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  No turfs in {selectedCity}
                </h3>
                <p className="text-muted-foreground text-sm">
                  Be the first to add a turf here, or try another city.
                </p>
              </div>
            ) : (
              displayList.map((turf, i) => (
                <div
                  key={turf.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <TurfCard turf={turf} variant="list" />
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
