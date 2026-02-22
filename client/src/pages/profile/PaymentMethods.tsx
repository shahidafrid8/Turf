import { useState } from "react";
import { ArrowLeft, CreditCard, Smartphone, Wallet, Plus, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import type { UserPaymentMethod } from "@shared/schema";

const typeIcon = { upi: Smartphone, card: CreditCard, wallet: Wallet };
const methodTypes: { id: "upi" | "card" | "wallet"; label: string; detail: string }[] = [
  { id: "upi", label: "UPI", detail: "user@upi" },
  { id: "card", label: "Debit / Credit Card", detail: "**** **** **** 4242" },
  { id: "wallet", label: "Wallet (Paytm)", detail: "Linked wallet" },
];

export default function PaymentMethods() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";
  const qKey = ["/api/payment-methods", userId];

  const { data: methods = [], isLoading } = useQuery<UserPaymentMethod[]>({
    queryKey: qKey,
    queryFn: async () => {
      const res = await fetch(`/api/payment-methods/${userId}`);
      return res.json();
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qKey });

  const addMutation = useMutation({
    mutationFn: async (type: "upi" | "card" | "wallet") => {
      const def = methodTypes.find(m => m.id === type)!;
      await apiRequest("POST", `/api/payment-methods/${userId}`, {
        userId, type: def.id, label: def.label, detail: def.detail, isDefault: methods.length === 0,
      });
    },
    onSuccess: () => { invalidate(); toast({ title: "Added", description: "Payment method saved." }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/payment-methods/${userId}/${id}`); },
    onSuccess: () => { invalidate(); toast({ title: "Removed" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const defaultMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("PATCH", `/api/payment-methods/${userId}/${id}/default`, {}); },
    onSuccess: () => invalidate(),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const isBusy = addMutation.isPending || removeMutation.isPending || defaultMutation.isPending;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button size="icon" variant="ghost" onClick={() => navigate("/profile")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Payment Methods</h1>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />}
        </div>
      </header>

      <main className="px-4 py-6 space-y-4">
        {!isLoading && methods.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No payment methods saved yet.</p>
          </div>
        )}
        {methods.length > 0 && (
          <Card className="divide-y divide-border">
            {methods.map(m => {
              const Icon = typeIcon[m.type as keyof typeof typeIcon] ?? CreditCard;
              return (
                <div key={m.id} className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground text-sm">{m.label}</p>
                      {m.isDefault && <Badge className="bg-primary text-black text-xs px-1.5">Default</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{m.detail}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!m.isDefault && (
                      <button onClick={() => defaultMutation.mutate(m.id)} disabled={isBusy} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                        <CheckCircle className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                    <button onClick={() => removeMutation.mutate(m.id)} disabled={isBusy} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        <div className="space-y-2">
          {methodTypes.filter(t => !methods.some(m => m.type === t.id)).map(t => {
            const Icon = typeIcon[t.id as keyof typeof typeIcon] ?? CreditCard;
            return (
              <Button key={t.id} variant="outline" className="w-full justify-start gap-3" disabled={isBusy}
                onClick={() => addMutation.mutate(t.id)}>
                <Icon className="w-4 h-4" />
                Add {t.label}
                {addMutation.isPending && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
              </Button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center px-4">
          Your payment preferences are securely stored in your account.
        </p>
      </main>
    </div>
  );
}
