import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Bell, Filter } from "lucide-react";
import { TurfTimeLogo } from "@/components/TurfTimeLogo";
import { TurfCard } from "@/components/TurfCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Turf } from "@shared/schema";

const sportFilters = ["Cricket", "All", "Football", "Basketball", "Tennis", "Badminton"];

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("Cricket");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: turfs, isLoading } = useQuery<Turf[]>({
    queryKey: ["/api/turfs"],
  });

  const featuredTurfs = turfs?.filter((t) => t.featured) || [];
  const availableTurfs = turfs?.filter((t) => t.isAvailable) || [];
  
  const filteredTurfs = activeFilter === "All" || activeFilter === "Cricket"
    ? availableTurfs 
    : availableTurfs.filter((t) => t.sportTypes.includes(activeFilter));

  const searchedTurfs = searchQuery 
    ? filteredTurfs.filter((t) => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredTurfs;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <TurfTimeLogo size="sm" />
          
          <div className="flex items-center gap-3">
            <Button 
              size="icon" 
              variant="ghost" 
              className="relative"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </Button>
            
            <Avatar className="w-8 h-8" data-testid="avatar-profile">
              <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="px-4 pt-6 space-y-6">
        {/* Hero Section */}
        <section className="space-y-1" data-testid="section-hero">
          <h1 className="text-2xl font-bold text-foreground">
            Find Your Perfect
            <span className="text-primary"> Turf</span>
          </h1>
          <p className="text-muted-foreground">
            Book your next game in seconds
          </p>
        </section>

        {/* Search Bar */}
        <section className="relative" data-testid="section-search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search turfs, locations..."
            className="pl-10 pr-12 h-12 bg-card border-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
          />
          <Button 
            size="icon" 
            variant="ghost" 
            className="absolute right-1 top-1/2 -translate-y-1/2"
            data-testid="button-filter"
          >
            <Filter className="w-5 h-5" />
          </Button>
        </section>

        {/* Sport Filters */}
        <section className="space-y-3" data-testid="section-filters">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
            {sportFilters.map((filter) => (
              <Badge
                key={filter}
                variant={activeFilter === filter ? "default" : "secondary"}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap cursor-pointer ${
                  activeFilter === filter ? "" : "hover-elevate"
                }`}
                onClick={() => setActiveFilter(filter)}
                data-testid={`filter-${filter.toLowerCase()}`}
              >
                {filter}
              </Badge>
            ))}
          </div>
        </section>

        {/* Featured Turfs */}
        {featuredTurfs.length > 0 && (
          <section className="space-y-4" data-testid="section-featured">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Featured Turfs</h2>
              <Button variant="link" className="text-primary p-0 h-auto">
                See all
              </Button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="min-w-[280px] h-[200px] rounded-xl" />
                ))
              ) : (
                featuredTurfs.map((turf, index) => (
                  <div 
                    key={turf.id} 
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <TurfCard turf={turf} variant="featured" />
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Available Now */}
        <section className="space-y-4" data-testid="section-available">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Available Now</h2>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
            <span className="text-sm text-muted-foreground">
              {searchedTurfs.length} turfs
            </span>
          </div>
          
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))
            ) : searchedTurfs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No turfs found</h3>
                <p className="text-muted-foreground text-sm">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              searchedTurfs.map((turf, index) => (
                <div 
                  key={turf.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
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
