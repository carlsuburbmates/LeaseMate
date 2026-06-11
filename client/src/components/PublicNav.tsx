import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/services", label: "Services" },
  { href: "/for-providers", label: "For Providers" },
  { href: "/faq", label: "FAQ" },
];

export default function PublicNav() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardHref =
    user?.role === "operator" || user?.role === "admin"
      ? "/ops"
      : user?.role === "provider"
      ? "/provider/dashboard"
      : "/dashboard";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-0 select-none">
          <span className="text-xl font-semibold tracking-tight text-[#2C2C2C]">Lease</span>
          <span className="text-xl font-semibold tracking-tight text-[#4A7C7E]">Mate</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                location === link.href
                  ? "text-[#4A7C7E]"
                  : "text-[#6B6B6B] hover:text-[#2C2C2C]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link href={dashboardHref}>
              <Button variant="outline" size="sm" className="rounded-md border-[#4A7C7E] text-[#4A7C7E] hover:bg-[#4A7C7E] hover:text-white">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <a href={getLoginUrl()}>
                <Button variant="ghost" size="sm" className="text-[#6B6B6B] hover:text-[#2C2C2C]">
                  Sign In
                </Button>
              </a>
              <Link href="/move-out-cart">
                <Button size="sm" className="rounded-md bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-[#2C2C2C]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-stone-100 px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm font-medium text-[#6B6B6B] hover:text-[#2C2C2C] py-1"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-stone-100 space-y-2">
            {isAuthenticated ? (
              <Link href={dashboardHref} onClick={() => setMobileOpen(false)}>
                <Button variant="outline" size="sm" className="w-full rounded-md">Dashboard</Button>
              </Link>
            ) : (
              <>
                <a href={getLoginUrl()} className="block">
                  <Button variant="ghost" size="sm" className="w-full">Sign In</Button>
                </a>
                <Link href="/move-out-cart" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full rounded-md bg-[#2C2C2C] text-white">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
