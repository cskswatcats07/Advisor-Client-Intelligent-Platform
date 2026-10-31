import type {
  PdfDocumentType,
  PdfFormat,
  PdfTemplate,
  PublicWeddingPayload,
} from "@/lib/types";
import { absoluteUrl, buildRsvpUrl, formatTime, formatWeddingDate } from "@/lib/utils";

const SIZE_CLASS: Record<PdfFormat, string> = {
  "5x7": "w-[5in] min-h-[7in]",
  a4: "w-[210mm] min-h-[297mm]",
  a5: "w-[148mm] min-h-[210mm]",
};

const TEMPLATE_STYLES: Record<
  PdfTemplate,
  { shell: string; accent: string; border: string }
> = {
  "classic-floral": {
    shell: "bg-[#fbf7f0] text-[#2c241b]",
    accent: "text-[#7a1f2b]",
    border: "border-[#b08d57]/55",
  },
  "modern-indo-western": {
    shell: "bg-[#1f1512] text-[#f7f1e8]",
    accent: "text-[#e8a317]",
    border: "border-[#e8a317]/40",
  },
  "minimal-editorial": {
    shell: "bg-white text-[#221c16]",
    accent: "text-[#221c16]",
    border: "border-[#221c16]/20",
  },
};

export function PdfDocument({
  data,
  type,
  format,
  template,
}: {
  data: PublicWeddingPayload;
  type: PdfDocumentType;
  format: PdfFormat;
  template: PdfTemplate;
}) {
  const { settings, events, gallery, guest } = data;
  const styles = TEMPLATE_STYLES[template];
  const hero = absoluteUrl(settings.heroImage);
  const rsvpLink = guest
    ? buildRsvpUrl(guest.invitationToken)
    : absoluteUrl("/#rsvp");
  const mapsLink = settings.mapsUrl;

  const showEvents =
    type === "digital-invitation" ||
    type === "print-ready" ||
    type === "ceremony-details";
  const showAnnouncement =
    type === "digital-invitation" || type === "print-ready";
  const showGallery =
    (type === "digital-invitation" || type === "print-ready") &&
    gallery.length > 0;
  const isSaveTheDate = type === "save-the-date";

  return (
    <div
      className={`pdf-page mx-auto ${SIZE_CLASS[format]} ${styles.shell} overflow-hidden`}
      style={{ pageBreakAfter: "always" }}
    >
      <div className={`m-3 border ${styles.border} p-5 md:p-7`}>
        <p className="text-center text-[9px] uppercase tracking-[0.35em] opacity-80">
          {settings.heroEyebrow}
        </p>
        <h1
          className={`mt-3 text-center font-serif text-4xl leading-tight ${styles.accent}`}
        >
          {settings.partnerOne}
          <span className="mx-2 text-2xl italic opacity-80">&</span>
          {settings.partnerTwo}
        </h1>

        <p className="mt-4 text-center text-[10px] uppercase tracking-[0.4em]">
          {isSaveTheDate ? "Save the Date" : settings.heroHeading}
        </p>
        <p className="mt-3 text-center font-serif text-xl">
          {formatWeddingDate(settings.weddingDate)}
        </p>
        <p className="mt-1 text-center text-xs uppercase tracking-[0.25em] opacity-80">
          {settings.location}
        </p>

        {guest && (
          <p className="mt-5 text-center text-sm italic opacity-90">
            Dear {guest.guestName},
          </p>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero}
          alt="Wedding decor"
          className="mt-6 h-48 w-full rounded-sm object-cover"
        />

        {showAnnouncement && (
          <p className="mt-6 text-center font-serif text-base leading-relaxed opacity-90">
            “{settings.announcement}”
          </p>
        )}

        {isSaveTheDate && (
          <div className="mt-8 text-center text-sm">
            <p>Formal invitation to follow.</p>
            <p className="mt-3">
              We hope you will save this date to celebrate with us.
            </p>
          </div>
        )}

        {showEvents && (
          <div className="mt-8 space-y-4">
            <h2
              className={`text-center font-serif text-2xl ${styles.accent}`}
            >
              Ceremony Details
            </h2>
            {events.map((event) => (
              <div
                key={event.id}
                className={`border-t ${styles.border} pt-4 text-sm`}
                style={{ breakInside: "avoid" }}
              >
                <h3 className="font-serif text-lg">{event.eventName}</h3>
                <p className="mt-1 opacity-80">
                  {formatWeddingDate(event.eventDate)} ·{" "}
                  {formatTime(event.startTime)}
                  {event.endTime ? ` – ${formatTime(event.endTime)}` : ""}
                </p>
                <p className="mt-1">
                  {event.venueName}
                  {event.venueAddress ? ` — ${event.venueAddress}` : ""}
                </p>
                {event.dressCode && (
                  <p className="mt-1 opacity-80">Dress code: {event.dressCode}</p>
                )}
                {event.description && (
                  <p className="mt-2 opacity-80">{event.description}</p>
                )}
                {event.mapsUrl && (
                  <a
                    href={event.mapsUrl}
                    className={`mt-2 inline-block underline ${styles.accent}`}
                  >
                    Directions
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {(type === "digital-invitation" || type === "print-ready") && (
          <div className={`mt-8 border-t ${styles.border} pt-5 text-center text-sm`}>
            <h2 className={`font-serif text-2xl ${styles.accent}`}>Venue</h2>
            <p className="mt-2">{settings.venueName}</p>
            <p className="opacity-80">{settings.venueAddress}</p>
            {mapsLink && (
              <a href={mapsLink} className={`mt-2 inline-block underline ${styles.accent}`}>
                Open Google Maps
              </a>
            )}
          </div>
        )}

        {showGallery && (
          <div className="mt-8" style={{ breakInside: "avoid" }}>
            <h2 className={`text-center font-serif text-2xl ${styles.accent}`}>
              Moments
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {gallery.slice(0, 4).map((image) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={image.id}
                  src={absoluteUrl(image.imageUrl)}
                  alt={image.caption || "Gallery"}
                  className="h-28 w-full object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {!isSaveTheDate && (
          <div
            className={`mt-8 border-t ${styles.border} pt-5 text-center text-sm`}
            style={{ breakInside: "avoid" }}
          >
            <h2 className={`font-serif text-2xl ${styles.accent}`}>RSVP</h2>
            <p className="mt-2 opacity-80">
              Kindly respond
              {settings.rsvpDeadline
                ? ` by ${formatWeddingDate(settings.rsvpDeadline, {
                    weekday: undefined,
                  })}`
                : ""}
              .
            </p>
            <a
              href={rsvpLink}
              className={`mt-3 inline-block font-medium underline ${styles.accent}`}
            >
              {rsvpLink}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
