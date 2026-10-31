"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "#celebration", label: "Our Celebration" },
  { href: "#events", label: "Events" },
  { href: "#gallery", label: "Gallery" },
  { href: "#rsvp", label: "RSVP" },
  { href: "#download", label: "Download" },
];

export function SiteNav({
  coupleLabel,
  rsvpHref = "#rsvp",
}: {
  coupleLabel: string;
  rsvpHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition",
        scrolled
          ? "bg-ivory/90 shadow-[0_8px_30px_rgba(44,36,27,0.08)] backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <div className="section-pad mx-auto flex max-w-6xl items-center justify-between py-4">
        <Link
          href="/"
          className={cn(
            "font-serif text-xl tracking-wide md:text-2xl",
            scrolled ? "text-primary" : "text-cream"
          )}
        >
          {coupleLabel}
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "text-xs uppercase tracking-[0.18em] transition hover:opacity-80",
                scrolled ? "text-muted" : "text-cream/90"
              )}
            >
              {link.label}
            </a>
          ))}
          <a
            href={rsvpHref}
            className="rounded-full bg-primary px-4 py-2 text-xs uppercase tracking-[0.16em] text-cream"
          >
            RSVP
          </a>
        </nav>

        <button
          type="button"
          className={cn(
            "rounded-full p-2 md:hidden",
            scrolled ? "text-primary" : "text-cream"
          )}
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-champagne/60 bg-ivory/95 px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="py-2 text-sm uppercase tracking-[0.16em] text-muted"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href={rsvpHref}
              className="mt-2 rounded-full bg-primary px-4 py-3 text-center text-sm uppercase tracking-[0.16em] text-cream"
              onClick={() => setOpen(false)}
            >
              RSVP
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
