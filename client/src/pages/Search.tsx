import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, SlidersHorizontal, MapPin, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TurfCard } from "@/components/TurfCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Turf } from "@shared/schema";

const SPORT_OPTIONS = ["Cricket", "Football", "Basketball", "Tennis", "Badminton", "Volleyball"];
const POPULAR_CITIES = ["Bangalore", "Hyderabad", "Kurnool", "Nandyal", "Vijayawada", "Visakhapatnam", "Warangal", "Chennai"];

export default function Search() {
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const { data: turfs = [], isLoading } = useQuery<Turf[]>({
    queryKey: ["/api/turfs"],
    enabled: hasSearched && query.length > 0,
  });

  const filteredTurfs = turfs.filter(t => {
    const matchesQuery =
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.location.toLowerCase().includes(query.toLowerCase()) ||
      t.city.toLowerCase().includes(query.toLowerCase()) ||
      t.sportTypes.some(s => s.toLowerCase().includes(query.toLowerCase()));
    const matchesSport =
      selectedSports.length === 0 ||
      selectedSports.some(s => t.sportTypes.includes(s));
    return matchesQuery && matchesSport;
  });

  const toggleSport = (sport: string) =>
    setSelectedSports(prev =>
      prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
    );

  const handleSearch = (val?: string) => {
    const q = val ?? query;
    if (q.length > 0) {
      if (val !== undefined) setQuery(val);
      setHasSearched(true);
    }
  };

  const clearSearch = () => { setQuery(""); setHasSearched(false); };
  const activeFilters = selectedSports.length;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Search Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Input with search icon inside */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
            <Input
              type="search"
              placeholder="Search turfs, cities, sports..."
              className="pl-10 pr-9 h-11 bg-card border-transparent focus-visible:ring-0 focus-visible:border-border"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              autoFocus
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Filter button — separate, beside input */}
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`h-11 w-11 flex-shrink-0 bg-card relative ${activeFilters > 0 ? "border-primary" : "border-border"}`}
              >
                <SlidersHorizontal className={`w-4 h-4 ${activeFilters > 0 ? "text-primary" : "text-muted-foreground"}`} />
                {activeFilters > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl bg-background pb-8">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-foreground">Filter by Sport</SheetTitle>
              </SheetHeader>
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  {SPORT_OPTIONS.map(sport => (
                    <button
                      key={sport}
                      onClick={() => toggleSport(sport)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                        selectedSports.includes(sport)
                          ? "bg-primary text-black border-primary"
                          : "bg-card text-muted-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      {selectedSports.includes(sport) && <Check className="w-3.5 h-3.5" />}
                      {sport}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setSelectedSports([]); setFilterOpen(false); }}>Clear All</Button>
                  <Button className="flex-1" onClick={() => { setFilterOpen(false); if (query) setHasSearched(true); }}>Apply</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="px-4 py-5 space-y-6">
        {!hasSearched ? (
          <>
            {/* Popular Cities */}
            <section className="space-y-3">
              <h2 className="font-semibold text-foreground">Popular Cities</h2>
              <div className="grid grid-cols-2 gap-3">
                {POPULAR_CITIES.map(city => (
                  <button
                    key={city}
                    onClick={() => handleSearch(city)}
                    className="flex items-center gap-3 p-4 bg-card rounded-xl hover:bg-card/80 active:scale-[0.98] transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground text-sm">{city}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Browse by Sport */}
            <section className="space-y-3">
              <h2 className="font-semibold text-foreground">Browse by Sport</h2>
              <div className="flex flex-wrap gap-2">
                {SPORT_OPTIONS.map(sport => (
                  <Badge
                    key={sport}
                    variant="secondary"
                    className="px-4 py-2 cursor-pointer text-sm"
                    onClick={() => { setSelectedSports([sport]); handleSearch(sport); }}
                  >
                    <SearchIcon className="w-3 h-3 mr-1.5" />
                    {sport}
                  </Badge>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Results for &ldquo;{query}&rdquo;</h2>
              <span className="text-sm text-muted-foreground">{filteredTurfs.length} found</span>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
            ) : filteredTurfs.length === 0 ? (
              <div className="text-center py-14">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card flex items-center justify-center">
                  <SearchIcon className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">No results found</h3>
                <p className="text-muted-foreground text-sm">Try a different city or sport</p>
                <Button variant="ghost" className="mt-4 text-primary" onClick={clearSearch}>Clear search</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTurfs.map(turf => (
                  <TurfCard key={turf.id} turf={turf} variant="list" />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
