import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationPage } from "@/components/public/InvitationPage";
import { getPublicWedding } from "@/lib/public-data";
import { getGuestByToken } from "@/lib/store";
import { absoluteUrl, formatWeddingDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const data = await getPublicWedding(token);
  const guest = data.guest;
  const title = guest
    ? `${guest.guestName} — Invitation to ${data.settings.partnerOne} & ${data.settings.partnerTwo}`
    : data.settings.seoTitle;
  return {
    title,
    description: `Join ${data.settings.partnerOne} & ${data.settings.partnerTwo} on ${formatWeddingDate(data.settings.weddingDate)}`,
    openGraph: {
      title,
      description: data.settings.seoDescription,
      images: [{ url: absoluteUrl(data.settings.ogImage || data.settings.heroImage) }],
    },
  };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const guest = await getGuestByToken(token);
  if (!guest) notFound();
  const data = await getPublicWedding(token);
  return <InvitationPage data={data} sharePath={`/invite/${token}`} />;
}
