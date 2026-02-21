import { User, Settings, HelpCircle, LogOut, ChevronRight, Bell, Shield, CreditCard, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TurfTimeLogo } from "@/components/TurfTimeLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

const menuItems = [
  { icon: Bell, label: "Notifications", description: "Manage your notification preferences" },
  { icon: CreditCard, label: "Payment Methods", description: "Add or remove payment options" },
  { icon: Shield, label: "Privacy & Security", description: "Control your data and security" },
  { icon: Star, label: "Rate Us", description: "Share your feedback" },
  { icon: HelpCircle, label: "Help & Support", description: "Get help with your bookings" },
];

export default function Profile() {
  const { user, signOut } = useAuth();
  const [, navigate] = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
          <Button size="icon" variant="ghost" data-testid="button-settings">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Profile Card */}
        <Card className="p-5" data-testid="card-profile">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16" data-testid="avatar-profile">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xl">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                {user?.user_metadata?.full_name || "User"}
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">Member since {new Date(user?.created_at || '').toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-xs text-muted-foreground">Bookings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-xs text-muted-foreground">Favorites</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
          </div>
        </Card>

        {/* Menu Items */}
        <Card>
          <div className="divide-y divide-border">
            {menuItems.map((item, index) => (
              <button
                key={index}
                className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
              >
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

        {/* Sign Out */}
        <Card>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-between p-4 hover:bg-destructive/10 transition-colors text-destructive"
          >
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

        {/* App Info */}
        <div className="text-center py-8">
          <TurfTimeLogo size="sm" className="mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Version 1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">© 2024 TurfTime. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
