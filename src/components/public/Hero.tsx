"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { formatWeddingDate } from "@/lib/utils";

export function Hero({
  eyebrow,
  partnerOne,
  partnerTwo,
  heading,
  weddingDate,
  location,
  heroImage,
  rsvpHref = "#rsvp",
}: {
  eyebrow: string;
  partnerOne: string;
  partnerTwo: string;
  heading: string;
  weddingDate: string;
  location: string;
  heroImage: string;
  rsvpHref?: string;
}) {
  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <Image
        src={heroImage}
        alt="Wedding floral ceremony backdrop"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="hero-scrim absolute inset-0" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-4xl flex-col items-center justify-center px-6 pb-16 pt-28 text-center text-cream">
        <p className="animate-fade-up text-[11px] uppercase tracking-[0.35em] text-cream/85 md:text-xs">
          {eyebrow}
        </p>

        <h1 className="animate-glow-in mt-6 font-serif text-5xl leading-[1.05] md:text-7xl lg:text-8xl">
          <span className="block">{partnerOne}</span>
          <span className="mt-2 block font-serif text-3xl italic text-accent md:text-4xl">
            &
          </span>
          <span className="mt-2 block">{partnerTwo}</span>
        </h1>

        <div className="ornament-line animate-fade-up-delay my-8 w-40 opacity-80" />

        <p className="animate-fade-up-delay text-xs uppercase tracking-[0.4em] text-cream/90 md:text-sm">
          {heading}
        </p>
        <p className="animate-fade-up-delay mt-4 font-serif text-2xl md:text-3xl">
          {formatWeddingDate(weddingDate)}
        </p>
        <p className="animate-fade-up-delay-2 mt-2 text-sm uppercase tracking-[0.28em] text-cream/80">
          {location}
        </p>

        <div className="animate-fade-up-delay-2 mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href={rsvpHref}
            className="rounded-full bg-primary px-7 py-3 text-xs uppercase tracking-[0.2em] text-cream shadow-[0_12px_30px_rgba(122,31,43,0.35)] transition hover:bg-[#641823]"
          >
            RSVP
          </a>
          <a
            href="#celebration"
            className="rounded-full border border-cream/40 px-7 py-3 text-xs uppercase tracking-[0.2em] text-cream/95 backdrop-blur-sm transition hover:bg-cream/10"
          >
            Our Story
          </a>
        </div>
      </div>

      <a
        href="#celebration"
        className="animate-scroll-hint absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-cream/80"
        aria-label="Scroll to celebration"
      >
        <ChevronDown size={28} />
      </a>
    </section>
  );
}
