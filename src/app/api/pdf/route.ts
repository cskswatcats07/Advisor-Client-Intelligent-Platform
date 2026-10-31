import { NextResponse } from "next/server";
import { generateWeddingPdf, pdfFilename } from "@/lib/pdf";
import type { PdfDocumentType, PdfFormat, PdfTemplate } from "@/lib/types";

const TYPES: PdfDocumentType[] = [
  "digital-invitation",
  "print-ready",
  "save-the-date",
  "ceremony-details",
];
const FORMATS: PdfFormat[] = ["5x7", "a4", "a5"];
const TEMPLATES: PdfTemplate[] = [
  "classic-floral",
  "modern-indo-western",
  "minimal-editorial",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") || "digital-invitation") as PdfDocumentType;
  const format = (searchParams.get("format") || "5x7") as PdfFormat;
  const template = (searchParams.get("template") ||
    "classic-floral") as PdfTemplate;
  const token = searchParams.get("token") || undefined;
  const mode = searchParams.get("mode") || "download";

  if (!TYPES.includes(type) || !FORMATS.includes(format) || !TEMPLATES.includes(template)) {
    return NextResponse.json({ error: "Invalid PDF options" }, { status: 400 });
  }

  try {
    const pdf = await generateWeddingPdf({ type, format, template, token });
    const filename = pdfFilename(type, format, template);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          mode === "preview"
            ? `inline; filename="${filename}"`
            : `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "PDF generation failed. Ensure the app URL is reachable.",
      },
      { status: 500 }
    );
  }
}
