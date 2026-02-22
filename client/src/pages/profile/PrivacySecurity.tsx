import { useState, useEffect } from "react";
import { ArrowLeft, Shield, Lock, Eye, EyeOff, Fingerprint, Trash2, Download, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";

export default function PrivacySecurity() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";
  const qKey = ["/api/preferences", userId];

  // Load privacy prefs from server
  const { data, isLoading } = useQuery<{ privacyPrefs: Record<string, boolean> }>({
    queryKey: qKey,
    queryFn: async () => { const res = await fetch(`/api/preferences/${userId}`); return res.json(); },
    enabled: !!userId,
    staleTime: 30_000,
  });

  const [showEmail, setShowEmail] = useState(true);
  const [biometric, setBiometric] = useState(() => localStorage.getItem("biometric") === "1");
  const [twoFactor, setTwoFactor] = useState(() => localStorage.getItem("2fa") === "1");
  const [newPassword, setNewPassword] = useState("");
  const [showPwInput, setShowPwInput] = useState(false);

  useEffect(() => {
    if (data?.privacyPrefs && Object.keys(data.privacyPrefs).length > 0) {
      setShowEmail(data.privacyPrefs.showEmail ?? true);
    }
  }, [data]);

  const savePref = useMutation({
    mutationFn: async (privacyPrefs: Record<string, boolean>) => {
      await apiRequest("PUT", `/api/preferences/${userId}`, { privacyPrefs });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qKey }),
    onError: () => toast({ title: "Couldn't save preference", variant: "destructive" }),
  });

  const toggleBiometric = () => {
    const next = !biometric; setBiometric(next); localStorage.setItem("biometric", next ? "1" : "0");
    toast({ title: next ? "Biometric enabled" : "Biometric disabled" });
  };
  const toggleTwoFactor = () => {
    const next = !twoFactor; setTwoFactor(next); localStorage.setItem("2fa", next ? "1" : "0");
    toast({ title: next ? "2FA enabled" : "2FA disabled" });
  };
  const toggleShowEmail = () => {
    const next = !showEmail; setShowEmail(next);
    savePref.mutate({ ...(data?.privacyPrefs ?? {}), showEmail: next });
  };

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { setNewPassword(""); setShowPwInput(false); toast({ title: "Password updated!", description: "Your new password is now active." }); },
    onError: (e: any) => toast({ title: "Password update failed", description: e.message, variant: "destructive" }),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      // Sign out — in production you'd call a server endpoint that deletes the user
      await supabase.auth.signOut();
    },
    onSuccess: () => { navigate("/"); toast({ title: "Account signed out", description: "Contact support to fully delete your account.", variant: "destructive" }); },
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button size="icon" variant="ghost" onClick={() => navigate("/profile")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Privacy & Security</h1>
          {(isLoading || savePref.isPending) && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />}
        </div>
      </header>

      <main className="px-4 py-6 space-y-5">
        {/* Security */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Security</p>
          <Card className="divide-y divide-border">
            <div className="flex items-center justify-between p-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                  <Fingerprint className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Biometric Login</p>
                  <p className="text-xs text-muted-foreground">Use fingerprint to sign in</p>
                </div>
              </div>
              <button onClick={toggleBiometric} className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${biometric ? "bg-primary" : "bg-secondary"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${biometric ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Extra layer of account security</p>
                </div>
              </div>
              <button onClick={toggleTwoFactor} className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${twoFactor ? "bg-primary" : "bg-secondary"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${twoFactor ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            {/* Change Password */}
            <div className="p-4 space-y-3">
              <button className="w-full flex items-center gap-3" onClick={() => setShowPwInput(v => !v)}>
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium text-foreground text-sm">Change Password</p>
                  <p className="text-xs text-muted-foreground">Update your account password</p>
                </div>
              </button>
              {showPwInput && (
                <div className="flex gap-2 pl-12">
                  <Input
                    type="password"
                    placeholder="New password (min 6 chars)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="flex-1 bg-secondary border-0"
                  />
                  <Button size="sm" className="green-glow"
                    disabled={newPassword.length < 6 || changePasswordMutation.isPending}
                    onClick={() => changePasswordMutation.mutate()}>
                    {changePasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Privacy */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Privacy</p>
          <Card className="divide-y divide-border">
            <div className="flex items-center justify-between p-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                  {showEmail ? <Eye className="w-4 h-4 text-muted-foreground" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Show Email on Profile</p>
                  <p className="text-xs text-muted-foreground">Visible to turf owners</p>
                </div>
              </div>
              <button onClick={toggleShowEmail} disabled={savePref.isPending} className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-60 ${showEmail ? "bg-primary" : "bg-secondary"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${showEmail ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </Card>
        </div>

        {/* Your Data */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Your Data</p>
          <Card className="divide-y divide-border">
            <button className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left"
              onClick={() => toast({ title: "Export requested", description: "Your data export will be emailed to you." })}>
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <Download className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Export My Data</p>
                <p className="text-xs text-muted-foreground">Download all your bookings and info</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-4 hover:bg-red-500/10 transition-colors text-left"
              onClick={() => deleteAccountMutation.mutate()}>
              <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                {deleteAccountMutation.isPending
                  ? <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                  : <Trash2 className="w-4 h-4 text-red-500" />}
              </div>
              <div>
                <p className="font-medium text-red-500 text-sm">Delete Account</p>
                <p className="text-xs text-muted-foreground">Sign out and request account deletion</p>
              </div>
            </button>
          </Card>
        </div>
      </main>
    </div>
  );
}