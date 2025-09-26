import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CATEGORY_ICONS, USER_TYPES } from "@/lib/constants";
import { Plus, Home } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = [
  { key: "donors", href: "/donors", label: "Donors", icon: "heart" },
  { key: "volunteers", href: "/volunteers", label: "Volunteers", icon: "users" },
  { key: "ngos", href: "/ngos", label: "NGOs/Orphanages", icon: "building" },
  { key: "businesses", href: "/businesses", label: "Supermarkets/Hotels", icon: "store" },
  { key: "medical", href: "/medical", label: "Hospitals/Medical", icon: "hospital" },
  { key: "farmers", href: "/farmers", label: "Farmers", icon: "leaf" },
  { key: "clothing", href: "/clothing", label: "Clothing Stores", icon: "shirt" },
  { key: "events", href: "/events", label: "Event Hosts", icon: "calendar" },
  { key: "homes", href: "/homes", label: "Vacant Homes", icon: "home" },
  { key: "disaster", href: "/disaster", label: "Disaster Relief", icon: "alert-triangle" },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

  const handleLinkClick = () => {
    // Close sidebar on mobile when link is clicked
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-16 h-full w-64 bg-card border-r border-border z-40 transform transition-transform duration-300 ease-in-out custom-scrollbar overflow-y-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        data-testid="sidebar"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-6">Categories</h3>

          <nav className="space-y-2">
            <Link href="/dashboard" onClick={handleLinkClick}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                  location === "/dashboard"
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                )}
                data-testid="link-dashboard"
              >
                <Home size={20} />
                <span>Dashboard</span>
              </div>
            </Link>

            {categories.map((category) => (
              <Link key={category.key} href={category.href} onClick={handleLinkClick}>
                <div
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                    location === category.href
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                  data-testid={`link-${category.key}`}
                >
                  <i className={`${CATEGORY_ICONS[category.key as keyof typeof CATEGORY_ICONS]} w-5`} />
                  <span>{category.label}</span>
                </div>
              </Link>
            ))}
          </nav>

          <div className="mt-8">
            <Button className="w-full" data-testid="button-create-request">
              <Plus className="mr-2" size={16} />
              Create Request
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
