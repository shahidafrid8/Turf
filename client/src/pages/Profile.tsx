import { User, Settings, HelpCircle, LogOut, ChevronRight, Bell, Shield, CreditCard, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TurfTimeLogo } from "@/components/TurfTimeLogo";

const menuItems = [
  { icon: User, label: "Edit Profile", description: "Update your personal information" },
  { icon: Bell, label: "Notifications", description: "Manage your notification preferences" },
  { icon: CreditCard, label: "Payment Methods", description: "Add or remove payment options" },
  { icon: Shield, label: "Privacy & Security", description: "Control your data and security" },
  { icon: Star, label: "Rate Us", description: "Share your feedback" },
  { icon: HelpCircle, label: "Help & Support", description: "Get help with your bookings" },
];

export default function Profile() {
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
              <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&h=160&fit=crop" />
              <AvatarFallback className="text-xl">JD</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">John Doe</h2>
              <p className="text-sm text-muted-foreground">john.doe@email.com</p>
              <p className="text-sm text-muted-foreground">+91 98765 43210</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">12</p>
              <p className="text-xs text-muted-foreground">Bookings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">4.8</p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">3</p>
              <p className="text-xs text-muted-foreground">Favorites</p>
            </div>
          </div>
        </Card>

        {/* Menu Items */}
        <Card className="divide-y divide-border" data-testid="card-menu">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-4 p-4 hover-elevate"
              data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <item.icon className="w-5 h-5 text-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </Card>

        {/* Logout */}
        <Button 
          variant="outline" 
          className="w-full text-destructive hover:text-destructive"
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Log Out
        </Button>

        {/* App Info */}
        <div className="flex flex-col items-center pt-4">
          <TurfTimeLogo size="sm" />
          <p className="text-xs text-muted-foreground mt-2">Version 1.0.0</p>
        </div>
      </main>
    </div>
  );
}
