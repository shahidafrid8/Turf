import { Settings, HelpCircle, LogOut, ChevronRight, Bell, Shield, CreditCard, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TurfTimeLogo } from "@/components/TurfTimeLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

const menuItems = [
  { icon: Bell, label: "Notifications", description: "Manage your notification preferences", route: "/profile/notifications" },
  { icon: CreditCard, label: "Payment Methods", description: "Add or remove payment options", route: "/profile/payment-methods" },
  { icon: Shield, label: "Privacy & Security", description: "Control your data and security", route: "/profile/privacy-security" },
  { icon: Star, label: "Rate Us", description: "Share your feedback", route: "/profile/rate-us" },
  { icon: HelpCircle, label: "Help & Support", description: "Get help with your bookings", route: "/profile/help-support" },
];

export default function Profile() {
  const { user, fullName, userRole, signOut } = useAuth();
  const [, navigate] = useLocation();

  const { data: bookings = [] } = useQuery<any[]>({
    queryKey: ["/api/bookings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/bookings?userId=${user.id}`);
      return res.json();
    },
    enabled: !!user,
  });
  const favCount = (() => { try { return JSON.parse(localStorage.getItem("favIds") || "[]").length; } catch { return 0; } })();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = fullName || user?.email?.split("@")[0] || "User";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
          <Button size="icon" variant="ghost">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xl bg-primary text-black font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-foreground">{displayName}</h2>
                <Badge variant="secondary" className="capitalize text-xs">{userRole}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">
                Member since {new Date(user?.created_at || "").toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{bookings.length}</p>
              <p className="text-xs text-muted-foreground">Bookings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{favCount}</p>
              <p className="text-xs text-muted-foreground">Favorites</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="divide-y divide-border">
            {menuItems.map((item, index) => (
              <button key={index} onClick={() => navigate(item.route)} className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <button onClick={handleSignOut} className="w-full flex items-center justify-between p-4 hover:bg-destructive/10 transition-colors text-destructive">
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">Sign Out</p>
                <p className="text-sm text-muted-foreground">Sign out of your account</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>
        </Card>

        <div className="text-center py-8">
          <TurfTimeLogo size="sm" className="mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Version 1.0.1</p>
          <p className="text-xs text-muted-foreground mt-1">© 2026 PlayTurf. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
