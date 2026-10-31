import { PdfDocument } from "@/components/pdf/PdfDocument";
import { getPublicWedding } from "@/lib/public-data";
import type { PdfDocumentType, PdfFormat, PdfTemplate } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PdfRenderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const type = String(params.type || "digital-invitation") as PdfDocumentType;
  const format = String(params.format || "5x7") as PdfFormat;
  const template = String(params.template || "classic-floral") as PdfTemplate;
  const token = params.token ? String(params.token) : undefined;
  const data = await getPublicWedding(token);

  return (
    <PdfDocument data={data} type={type} format={format} template={template} />
  );
}
