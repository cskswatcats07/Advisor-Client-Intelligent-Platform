import type { PublicWeddingPayload } from "@/lib/types";
import { absoluteUrl, buildInviteUrl, formatWeddingDate } from "@/lib/utils";
import { SiteNav } from "./SiteNav";
import { Hero } from "./Hero";
import { Announcement } from "./Announcement";
import { Countdown } from "./Countdown";
import { Events } from "./Events";
import { Venue } from "./Venue";
import { Gallery } from "./Gallery";
import { RsvpForm } from "./RsvpForm";
import { DownloadInvitation } from "./DownloadInvitation";
import { ShareBar } from "./ShareBar";
import { Footer } from "./Footer";

export function InvitationPage({
  data,
  sharePath = "/",
}: {
  data: PublicWeddingPayload;
  sharePath?: string;
}) {
  const { settings, events, gallery, sections, guest } = data;
  const couple = `${settings.partnerOne} & ${settings.partnerTwo}`;
  const rsvpHref = guest
    ? `/rsvp/${guest.invitationToken}`
    : "#rsvp";
  const shareUrl = guest
    ? buildInviteUrl(guest.invitationToken)
    : absoluteUrl(sharePath);

  return (
    <main>
      <SiteNav coupleLabel={couple} rsvpHref={rsvpHref} />

      {guest && (
        <div className="relative z-20 bg-primary px-4 py-3 text-center text-sm text-cream">
          A personal invitation for <strong>{guest.guestName}</strong>
        </div>
      )}

      {sections.hero && (
        <Hero
          eyebrow={settings.heroEyebrow}
          partnerOne={settings.partnerOne}
          partnerTwo={settings.partnerTwo}
          heading={settings.heroHeading}
          weddingDate={settings.weddingDate}
          location={settings.location}
          heroImage={settings.heroImage}
          rsvpHref={rsvpHref}
        />
      )}

      <div className="mx-auto max-w-4xl px-6 py-10">
        <ShareBar
          url={shareUrl}
          title={settings.seoTitle}
          partnerOne={settings.partnerOne}
          partnerTwo={settings.partnerTwo}
          weddingDate={formatWeddingDate(settings.weddingDate)}
        />
      </div>

      {sections.announcement && (
        <Announcement
          message={settings.announcement}
          partnerOne={settings.partnerOne}
          partnerTwo={settings.partnerTwo}
        />
      )}

      {sections.countdown && (
        <Countdown
          weddingDate={settings.weddingDate}
          weddingTime={settings.weddingTime}
        />
      )}

      {sections.events && <Events events={events} />}

      {sections.venue && (
        <Venue
          venueName={settings.venueName}
          venueAddress={settings.venueAddress}
          mapsUrl={settings.mapsUrl}
          location={settings.location}
        />
      )}

      {sections.gallery && <Gallery images={gallery} />}

      {sections.rsvp && (
        <RsvpForm
          invitationToken={guest?.invitationToken}
          guestName={guest?.guestName}
          maximumAttendees={guest?.maximumAttendees || settings.maxAttendeesDefault}
          rsvpDeadline={settings.rsvpDeadline}
          rsvpEnabled={settings.rsvpEnabled}
          whatsappNumber={settings.whatsappNumber}
          partnerOne={settings.partnerOne}
          partnerTwo={settings.partnerTwo}
          hasResponded={guest?.hasResponded}
        />
      )}

      {sections.download && (
        <DownloadInvitation
          defaultTemplate={settings.theme.pdfTemplate}
          invitationToken={guest?.invitationToken}
        />
      )}

      <Footer partnerOne={settings.partnerOne} partnerTwo={settings.partnerTwo} />
    </main>
  );
}
