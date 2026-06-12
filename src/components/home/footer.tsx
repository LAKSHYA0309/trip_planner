import Link from "next/link";
import { Landmark, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { footerLinks } from "@/lib/data";

const socialLinks = [
  { label: "Facebook", href: "#", path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
  { label: "Instagram", href: "#", path: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01 M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z" },
  { label: "X", href: "#", path: "M4 4l11.5 16h4.5L8.5 4z M20 4L8.5 20" },
  { label: "YouTube", href: "#", path: "M22.54 6.42a2.78 2.78 0 0 0-1.95-2C18.88 4 12 4 12 4s-6.88 0-8.59.42a2.78 2.78 0 0 0-1.95 2 29 29 0 0 0 0 11.16 2.78 2.78 0 0 0 1.95 2C5.12 20 12 20 12 20s6.88 0 8.59-.42a2.78 2.78 0 0 0 1.95-2 29 29 0 0 0 0-11.16z M9.75 15.02l6.5-3.52-6.5-3.52v7.04z" },
];

export function Footer() {
  return (
    <footer id="about" className="border-t border-white/5 bg-black">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Brand */}
          <div className="lg:col-span-3">
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
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI-powered India travel planning. Personalized itineraries,
              budget optimization, and authentic local experiences.
            </p>
            <div className="mt-5 flex gap-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-gold/10 hover:text-gold"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden
                  >
                    <path d={social.path} />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-6 lg:grid-cols-3">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="text-sm font-semibold tracking-wider text-white uppercase">
                  {title}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <Link
                        href="#"
                        className="text-sm text-muted-foreground transition-colors hover:text-gold"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-semibold tracking-wider text-white uppercase">
              Subscribe
            </h4>
            <p className="mt-3 text-sm text-muted-foreground">
              Get travel inspiration, deals, and AI trip planning tips.
            </p>
            <div className="mt-4 flex gap-2">
              <Input
                type="email"
                placeholder="Your email"
                className="h-11 border-white/10 bg-secondary text-white placeholder:text-white/30"
              />
              <Button
                size="icon"
                className="h-11 w-11 shrink-0 bg-gold text-black hover:bg-gold-light"
                aria-label="Subscribe"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="section-divider mt-12" />

        <div className="mt-8 flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row sm:text-sm">
          <p>© {new Date().getFullYear()} BharatYatra. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-gold">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-gold">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-gold">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
