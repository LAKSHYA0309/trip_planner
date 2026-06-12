"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Landmark, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navLinks } from "@/lib/data";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const displayName = session?.user?.isGuest
    ? "Guest Traveler"
    : session?.user?.name || session?.user?.email;

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-18 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/30">
            <Landmark className="h-5 w-5 text-gold" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-[0.2em] text-white">
              BHARAT
            </span>
            <span className="text-[10px] font-medium tracking-[0.35em] text-gold">
              YATRA
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-white/10 text-white font-medium ring-1 ring-white/10"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5">
                <User className="h-4 w-4 text-gold" />
                <span className="max-w-[120px] truncate text-sm text-white/80">
                  {displayName}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="border-white/10 text-white/80 hover:bg-white/5 hover:text-white"
              >
                <LogOut className="mr-1.5 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Link href="/sign-in" className="hidden sm:block">
              <Button
                variant="outline"
                size="sm"
                className="border-gold/40 text-gold hover:bg-gold/10"
              >
                Sign In
              </Button>
            </Link>
          )}

          <Link href="#planner" className="hidden sm:block">
            <Button className="bg-gold font-semibold text-black hover:bg-gold-light">
              Plan My Trip
            </Button>
          </Link>

          <button
            type="button"
            aria-label="Toggle menu"
            className="flex h-10 w-10 items-center justify-center rounded-md text-white lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-white/5 bg-black/95 px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`rounded-md px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-white/10 text-gold font-medium"
                      : "text-white/80 hover:bg-white/5"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}

            {isAuthenticated ? (
              <>
                <p className="px-3 py-2 text-sm text-gold">
                  {displayName}
                </p>
                <Button
                  variant="outline"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="mt-2 w-full border-white/10 text-white"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
                <Button
                  variant="outline"
                  className="mt-2 w-full border-gold/40 text-gold"
                >
                  Sign In
                </Button>
              </Link>
            )}

            <Link href="#planner" onClick={() => setMobileOpen(false)}>
              <Button className="mt-2 w-full bg-gold font-semibold text-black hover:bg-gold-light">
                Plan My Trip
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
