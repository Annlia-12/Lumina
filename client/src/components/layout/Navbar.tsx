import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Heart, Menu, X, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NavbarProps {
  onSidebarToggle?: () => void;
  sidebarOpen?: boolean;
}

export function Navbar({ onSidebarToggle, sidebarOpen }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [notificationCount] = useState(3); // Mock notification count
  const [scrolled, setScrolled] = useState(false);

  const isDashboardPage = location === "/dashboard";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Emergency Strip */}
      <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4 animate-pulse" />
        <span>
          URGENT: Earthquake relief needed in Turkey —{" "}
          <Link
            href="/disaster-relief"
            className="underline font-semibold hover:text-yellow-200"
          >
            Help Now
          </Link>
        </span>
      </div>

      {/* Main Navbar */}
      <nav
        className={`sticky top-0 left-0 right-0 z-50 transition-all ${
          scrolled ? "bg-white shadow-md" : "bg-white shadow-sm"
        } border-b border-gray-200`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Sidebar toggle + Logo */}
            <div className="flex items-center w-full">
              {/* Hamburger on left for all pages except home */}
              {location !== "/" && onSidebarToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSidebarToggle}
                  className="mr-2"
                  data-testid="sidebar-toggle"
                >
                  {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </Button>
              )}
              {/* Logo next to hamburger, not too far right */}
              <Link
                href="/"
                className="flex items-center space-x-2"
                data-testid="link-home"
              >
                <Heart className="h-8 w-8 text-red-600" />
                <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Lumina
                </span>
              </Link>
            </div>

            {/* Middle: Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              {[
                { href: "/#about", label: "About" },
                { href: "/#impact", label: "Impact" },
                { href: "/#stories", label: "Stories" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative text-gray-700 hover:text-gray-900 font-medium transition group"
                >
                  {link.label}
                  <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-current transition-all group-hover:w-full" />
                </Link>
              ))}
            </div>

            {/* Right: User Actions */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid="button-notifications"
                      className="relative"
                    >
                      <Bell size={18} />
                      {notificationCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center"
                        >
                          {notificationCount}
                        </Badge>
                      )}
                    </Button>
                  </div>

                  <span className="hidden sm:inline text-sm text-gray-500">
                    Welcome, {user?.name}
                  </span>

                  <Link href="/dashboard">
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid="button-dashboard"
                    >
                      Dashboard
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    data-testid="button-logout"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid="button-login"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" data-testid="button-register">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
