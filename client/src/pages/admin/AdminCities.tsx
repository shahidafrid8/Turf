import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { ArrowLeft, Plus, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function AdminCities() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newCity, setNewCity] = useState('');

  const { data: cities = [], isLoading } = useQuery<string[]>({
    queryKey: ['/api/cities'],
  });

  const addMutation = useMutation({
    mutationFn: async (city: string) => {
      const res = await fetch('/api/admin/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cities'] });
      setNewCity('');
      toast({ title: 'City Added', description: `${newCity} is now available for owners.` });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to add city.', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (city: string) => {
      const res = await fetch(`/api/admin/cities/${encodeURIComponent(city)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: (_, city) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cities'] });
      toast({ title: 'City Removed', description: `${city} removed from the list.` });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to remove city.', variant: 'destructive' }),
  });

  const handleAdd = () => {
    const trimmed = newCity.trim();
    if (!trimmed) return;
    if (cities.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: 'Already exists', description: 'This city is already in the list.', variant: 'destructive' });
      return;
    }
    addMutation.mutate(trimmed);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={() => navigate('/admin')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Manage Cities</h1>
          <p className="text-xs text-muted-foreground">{cities.length} cities available</p>
        </div>
      </header>

      <main className="px-4 pt-6 space-y-5">
        {/* Add city input */}
        <Card className="p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Add a New City</p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Nandyal, Kurnool..."
              value={newCity}
              onChange={e => setNewCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="bg-background flex-1"
            />
            <Button
              onClick={handleAdd}
              disabled={addMutation.isPending || !newCity.trim()}
              className="gap-2 px-5"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Cities added here will instantly appear in the owner's turf creation form and all city pickers.
          </p>
        </Card>

        {/* City list */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Current Cities</p>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))
          ) : cities.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No cities yet. Add one above.
            </div>
          ) : (
            <div className="space-y-2">
              {cities.map(city => (
                <div
                  key={city}
                  className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <span className="flex-1 font-medium text-foreground text-sm">{city}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                    onClick={() => deleteMutation.mutate(city)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
