import { notFound } from "next/navigation";
import Link from "next/link";
import { RsvpForm } from "@/components/public/RsvpForm";
import { getPublicWedding } from "@/lib/public-data";
import { getGuestByToken } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function RsvpTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const guest = await getGuestByToken(token);
  if (!guest) notFound();
  const data = await getPublicWedding(token);

  return (
    <main className="min-h-screen pb-16">
      <div className="border-b border-champagne bg-cream/70 px-6 py-8 text-center">
        <Link
          href={`/invite/${token}`}
          className="font-serif text-2xl text-primary"
        >
          {data.settings.partnerOne} & {data.settings.partnerTwo}
        </Link>
        <p className="mt-2 text-sm text-muted">Personalized RSVP</p>
      </div>
      <RsvpForm
        invitationToken={guest.invitationToken}
        guestName={guest.guestName}
        maximumAttendees={guest.maximumAttendees}
        rsvpDeadline={data.settings.rsvpDeadline}
        rsvpEnabled={data.settings.rsvpEnabled}
        whatsappNumber={data.settings.whatsappNumber}
        partnerOne={data.settings.partnerOne}
        partnerTwo={data.settings.partnerTwo}
        hasResponded={data.guest?.hasResponded}
      />
    </main>
  );
}
