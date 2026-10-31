"use client";

import { useState } from "react";
import { Download, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select, Label } from "@/components/ui/Input";
import type { PdfDocumentType, PdfFormat, PdfTemplate } from "@/lib/types";

const DOCUMENTS: { value: PdfDocumentType; label: string }[] = [
  { value: "digital-invitation", label: "Digital Invitation PDF" },
  { value: "print-ready", label: "Print-Ready PDF" },
  { value: "save-the-date", label: "Save the Date PDF" },
  { value: "ceremony-details", label: "Ceremony Details PDF" },
];

const FORMATS: { value: PdfFormat; label: string }[] = [
  { value: "5x7", label: "5 × 7 inches (default)" },
  { value: "a4", label: "A4 portrait" },
  { value: "a5", label: "A5 portrait" },
];

export function DownloadInvitation({
  defaultTemplate = "classic-floral",
  invitationToken,
}: {
  defaultTemplate?: PdfTemplate;
  invitationToken?: string;
}) {
  const [documentType, setDocumentType] =
    useState<PdfDocumentType>("digital-invitation");
  const [format, setFormat] = useState<PdfFormat>("5x7");
  const [template, setTemplate] = useState<PdfTemplate>(defaultTemplate);
  const [loading, setLoading] = useState<"preview" | "download" | null>(null);
  const [error, setError] = useState("");

  function buildQuery() {
    const params = new URLSearchParams({
      type: documentType,
      format,
      template,
    });
    if (invitationToken) params.set("token", invitationToken);
    return params.toString();
  }

  async function handle(action: "preview" | "download") {
    setLoading(action);
    setError("");
    try {
      const res = await fetch(`/api/pdf?${buildQuery()}&mode=${action}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "PDF generation failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (action === "preview") {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `${documentType}-${format}.pdf`;
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate PDF");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section id="download" className="section-pad mx-auto max-w-3xl py-16">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Keepsake</p>
        <h2 className="mt-3 font-serif text-4xl text-primary md:text-5xl">
          Download Invitation
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Preview and download professionally designed PDFs for sharing or print.
        </p>
      </div>

      <div className="mt-10 space-y-5 rounded-[1.5rem] border border-champagne bg-cream/80 p-6 md:p-8">
        <div>
          <Label>Document</Label>
          <Select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as PdfDocumentType)}
          >
            {DOCUMENTS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Format</Label>
            <Select
              value={format}
              onChange={(e) => setFormat(e.target.value as PdfFormat)}
            >
              {FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Style</Label>
            <Select
              value={template}
              onChange={(e) => setTemplate(e.target.value as PdfTemplate)}
            >
              <option value="classic-floral">Classic Floral</option>
              <option value="modern-indo-western">Modern Indo-Western</option>
              <option value="minimal-editorial">Minimal Editorial</option>
            </Select>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handle("preview")}
            disabled={Boolean(loading)}
          >
            {loading === "preview" ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Eye size={16} />
            )}
            Preview
          </Button>
          <Button
            type="button"
            onClick={() => handle("download")}
            disabled={Boolean(loading)}
          >
            {loading === "download" ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Download size={16} />
            )}
            Download PDF
          </Button>
        </div>
      </div>
    </section>
  );
}
