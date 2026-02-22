import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, CheckCircle, XCircle, MapPin, Clock, User, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { Turf } from '@shared/schema';

interface OwnerAccount {
  id: string;
  username: string;
  fullName: string | null;
  role: string;
  ownerStatus: string;
}

export default function AdminPendingApprovals() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: pendingOwners = [], isLoading: ownersLoading } = useQuery<OwnerAccount[]>({
    queryKey: ['/api/admin/owners/pending'],
  });

  const { data: pendingTurfs = [], isLoading: turfsLoading } = useQuery<Turf[]>({
    queryKey: ['/api/admin/turfs/pending'],
  });

  const approveOwnerMutation = useMutation({
    mutationFn: async (supabaseId: string) => {
      const res = await apiRequest('PATCH', '/api/admin/owners/' + supabaseId + '/approve', {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/owners/pending'] });
      toast({ title: 'Owner Approved', description: 'The turf owner can now manage their listings.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to approve owner.', variant: 'destructive' }),
  });

  const rejectOwnerMutation = useMutation({
    mutationFn: async (supabaseId: string) => {
      const res = await apiRequest('PATCH', '/api/admin/owners/' + supabaseId + '/reject', {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/owners/pending'] });
      toast({ title: 'Owner Rejected', description: 'The application has been declined.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to reject owner.', variant: 'destructive' }),
  });

  const approveTurfMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('PATCH', '/api/admin/turfs/' + id + '/approve', {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/turfs/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/turfs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/turfs'] });
      toast({ title: 'Turf Approved', description: 'The turf is now live for bookings.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to approve turf.', variant: 'destructive' }),
  });

  const rejectTurfMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('PATCH', '/api/admin/turfs/' + id + '/reject', {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/turfs/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/turfs'] });
      toast({ title: 'Turf Rejected', description: 'The owner has been notified.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to reject turf.', variant: 'destructive' }),
  });

  const totalPending = pendingOwners.length + pendingTurfs.length;

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={() => navigate('/admin')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Pending Approvals</h1>
          <p className="text-xs text-muted-foreground">{totalPending} awaiting review</p>
        </div>
      </header>

      <main className="px-4 pt-4">
        <Tabs defaultValue="owners">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="owners" className="flex-1 gap-2">
              <User className="w-4 h-4" />
              Owner Accounts
              {pendingOwners.length > 0 && (
                <Badge className="ml-1 bg-primary text-black text-xs h-4 px-1.5">
                  {pendingOwners.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="turfs" className="flex-1 gap-2">
              <Store className="w-4 h-4" />
              Turf Listings
              {pendingTurfs.length > 0 && (
                <Badge className="ml-1 bg-primary text-black text-xs h-4 px-1.5">
                  {pendingTurfs.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="owners" className="space-y-3 mt-0">
            {ownersLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))
            ) : pendingOwners.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">All clear!</h3>
                <p className="text-sm text-muted-foreground">No owner accounts pending approval.</p>
              </div>
            ) : (
              pendingOwners.map(owner => (
                <Card key={owner.id} className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Store className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {owner.fullName || 'Unknown User'}
                      </p>
                      <p className="text-xs text-muted-foreground">Turf Owner Application</p>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                      Pending
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Wants to list and manage turfs on TurfTime</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => rejectOwnerMutation.mutate(owner.username)}
                      disabled={rejectOwnerMutation.isPending || approveOwnerMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button
                      onClick={() => approveOwnerMutation.mutate(owner.username)}
                      disabled={approveOwnerMutation.isPending || rejectOwnerMutation.isPending}
                      className="gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="turfs" className="space-y-4 mt-0">
            {turfsLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))
            ) : pendingTurfs.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">All clear!</h3>
                <p className="text-sm text-muted-foreground">No turf listings pending approval.</p>
              </div>
            ) : (
              pendingTurfs.map(turf => (
                <Card key={turf.id} className="overflow-hidden">
                  <div className="relative h-40">
                    <img src={turf.imageUrl} alt={turf.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-bold text-white text-base">{turf.name}</h3>
                      <div className="flex items-center gap-1 text-white/80 text-xs">
                        <MapPin className="w-3 h-3" />
                        <span>{turf.location}</span>
                      </div>
                    </div>
                    <Badge className="absolute top-3 right-3 bg-yellow-500/90 text-black">Pending</Badge>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-muted/50 rounded-lg py-2">
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="font-bold text-primary text-sm">Rs.{turf.pricePerHour}/hr</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg py-2">
                        <p className="text-xs text-muted-foreground">Hours</p>
                        <p className="font-bold text-foreground text-sm">{turf.openingTime}-{turf.closingTime ? turf.closingTime.substring(0,5) : ''}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg py-2">
                        <p className="text-xs text-muted-foreground">Sports</p>
                        <p className="font-bold text-foreground text-sm">{turf.sportTypes.length}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm text-foreground">{turf.address}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {turf.sportTypes.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{s}</span>
                      ))}
                      {turf.amenities.map(a => (
                        <span key={a} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">{a}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <Button
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => rejectTurfMutation.mutate(turf.id)}
                        disabled={rejectTurfMutation.isPending || approveTurfMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                      </Button>
                      <Button
                        onClick={() => approveTurfMutation.mutate(turf.id)}
                        disabled={approveTurfMutation.isPending || rejectTurfMutation.isPending}
                        className="gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
