"use client";

import { useEffect, useState } from "react";
import { weddingDateTimeIso } from "@/lib/utils";

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function getParts(target: Date): Parts | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export function Countdown({
  weddingDate,
  weddingTime,
}: {
  weddingDate: string;
  weddingTime: string;
}) {
  const target = weddingDateTimeIso(weddingDate, weddingTime);
  const [parts, setParts] = useState<Parts | null>(() => getParts(target));

  useEffect(() => {
    const nextTarget = weddingDateTimeIso(weddingDate, weddingTime);
    const tick = () => setParts(getParts(nextTarget));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [weddingDate, weddingTime]);

  if (!parts) {
    return (
      <section className="section-pad mx-auto max-w-4xl py-16 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Countdown</p>
        <h2 className="mt-3 font-serif text-3xl text-primary md:text-4xl">
          The celebration has begun
        </h2>
        <p className="mt-3 text-muted">
          Thank you for being part of our day.
        </p>
      </section>
    );
  }

  const items = [
    { label: "Days", value: parts.days },
    { label: "Hours", value: parts.hours },
    { label: "Minutes", value: parts.minutes },
    { label: "Seconds", value: parts.seconds },
  ];

  return (
    <section className="section-pad mx-auto max-w-4xl py-16">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Countdown</p>
        <h2 className="mt-3 font-serif text-3xl text-primary md:text-4xl">
          Until we say I do
        </h2>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-champagne/80 bg-cream/70 px-4 py-6 text-center shadow-[0_10px_30px_rgba(44,36,27,0.04)]"
          >
            <div className="font-serif text-4xl text-primary md:text-5xl">
              {String(item.value).padStart(2, "0")}
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-muted">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
