import { MapPinned } from "lucide-react";

export function Venue({
  venueName,
  venueAddress,
  mapsUrl,
  location,
}: {
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  location: string;
}) {
  if (!venueName && !venueAddress) return null;

  return (
    <section className="section-pad mx-auto max-w-4xl py-10">
      <div className="rounded-[1.75rem] border border-champagne bg-[linear-gradient(160deg,rgba(251,247,240,0.95),rgba(237,228,214,0.75))] px-8 py-12 text-center shadow-[0_16px_40px_rgba(44,36,27,0.05)] md:px-12">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Venue & Directions</p>
        <h2 className="mt-3 font-serif text-4xl text-primary">{venueName || location}</h2>
        {venueAddress && (
          <p className="mx-auto mt-4 max-w-xl text-muted">{venueAddress}</p>
        )}
        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.18em] text-cream"
          >
            <MapPinned size={16} />
            Open in Google Maps
          </a>
        ) : (
          <p className="mt-6 text-sm text-muted">
            Directions will be shared with confirmed guests.
          </p>
        )}
      </div>
    </section>
  );
}
