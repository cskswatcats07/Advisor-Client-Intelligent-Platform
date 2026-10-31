import { chromium, type Browser } from "playwright";
import type { PdfDocumentType, PdfFormat, PdfTemplate } from "./types";
import { getBaseUrl } from "./utils";

const FORMAT_SIZE: Record<
  PdfFormat,
  { width: string; height: string; label: string }
> = {
  "5x7": { width: "5in", height: "7in", label: "5x7" },
  a4: { width: "210mm", height: "297mm", label: "A4" },
  a5: { width: "148mm", height: "210mm", label: "A5" },
};

let browserPromise: Promise<Browser> | null = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserPromise;
}

export async function generateWeddingPdf(options: {
  type: PdfDocumentType;
  format: PdfFormat;
  template: PdfTemplate;
  token?: string;
}) {
  const base = getBaseUrl();
  const params = new URLSearchParams({
    type: options.type,
    format: options.format,
    template: options.template,
  });
  if (options.token) params.set("token", options.token);

  const url = `${base}/pdf/render?${params.toString()}`;
  const size = FORMAT_SIZE[options.format];
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      const images = Array.from(document.images);
      await Promise.all(
        images.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              })
        )
      );
    });

    const pdf = await page.pdf({
      width: size.width,
      height: size.height,
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0.35in",
        right: "0.35in",
        bottom: "0.35in",
        left: "0.35in",
      },
    });

    return pdf;
  } finally {
    await page.close();
  }
}

export function pdfFilename(
  type: PdfDocumentType,
  format: PdfFormat,
  template: PdfTemplate
) {
  return `${type}-${template}-${format}.pdf`;
}
