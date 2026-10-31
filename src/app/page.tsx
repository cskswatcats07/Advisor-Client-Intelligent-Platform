import { InvitationPage } from "@/components/public/InvitationPage";
import { getPublicWedding } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getPublicWedding();
  return <InvitationPage data={data} />;
}
