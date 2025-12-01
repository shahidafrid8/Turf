import { Home, Search, Calendar, Heart, User } from "lucide-react";
import { Link, useLocation } from "wouter";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: Calendar, label: "Bookings", path: "/bookings" },
  { icon: Heart, label: "Favorites", path: "/favorites" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function BottomNavigation() {
  const [location] = useLocation();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border"
      data-testid="nav-bottom"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location === item.path || 
            (item.path === "/" && location === "/") ||
            (item.path !== "/" && location.startsWith(item.path));
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[56px] ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon 
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "scale-110" : ""
                  }`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-[10px] font-medium ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}>
                  {item.label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
