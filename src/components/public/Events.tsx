import { MapPin, Clock, Shirt } from "lucide-react";
import type { WeddingEvent } from "@/lib/types";
import { formatTime, formatWeddingDate } from "@/lib/utils";

export function Events({ events }: { events: WeddingEvent[] }) {
  if (!events.length) return null;

  return (
    <section id="events" className="section-pad mx-auto max-w-5xl py-16">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Ceremony Details</p>
        <h2 className="mt-3 font-serif text-4xl text-primary md:text-5xl">
          The celebrations
        </h2>
      </div>

      <div className="mt-12 space-y-6">
        {events.map((event, index) => (
          <article
            key={event.id}
            className="overflow-hidden rounded-[1.5rem] border border-champagne bg-cream/75 shadow-[0_16px_40px_rgba(44,36,27,0.05)]"
          >
            <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
              <div className="relative min-h-[220px] bg-[linear-gradient(135deg,#ede4d6,#f7f1e8)] p-8 md:p-10">
                <p className="text-[11px] uppercase tracking-[0.28em] text-gold">
                  Event {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 font-serif text-3xl text-primary md:text-4xl">
                  {event.eventName}
                </h3>
                <p className="mt-4 text-sm text-muted">
                  {formatWeddingDate(event.eventDate)}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-foreground/80">
                  <Clock size={16} className="text-gold" />
                  {formatTime(event.startTime)}
                  {event.endTime ? ` – ${formatTime(event.endTime)}` : ""}
                </div>
                {event.description && (
                  <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
                    {event.description}
                  </p>
                )}
              </div>

              <div className="flex flex-col justify-center gap-4 border-t border-champagne p-8 md:border-l md:border-t-0 md:p-10">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
                    Venue
                  </p>
                  <p className="mt-1 font-serif text-2xl text-primary">
                    {event.venueName}
                  </p>
                  {event.venueAddress && (
                    <p className="mt-2 flex items-start gap-2 text-sm text-muted">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-gold" />
                      {event.venueAddress}
                    </p>
                  )}
                </div>

                {event.dressCode && (
                  <p className="flex items-start gap-2 text-sm text-foreground/80">
                    <Shirt size={16} className="mt-0.5 shrink-0 text-gold" />
                    Dress code: {event.dressCode}
                  </p>
                )}

                {event.mapsUrl && (
                  <a
                    href={event.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex w-fit items-center rounded-full border border-primary/25 px-5 py-2.5 text-xs uppercase tracking-[0.16em] text-primary transition hover:bg-primary/5"
                  >
                    Get directions
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
