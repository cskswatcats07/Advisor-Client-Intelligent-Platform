"use client";

import { useState } from "react";
import { Check, Copy, Mail, Share2 } from "lucide-react";
import { whatsappShareUrl } from "@/lib/utils";

export function ShareBar({
  url,
  title,
  partnerOne,
  partnerTwo,
  weddingDate,
}: {
  url: string;
  title: string;
  partnerOne: string;
  partnerTwo: string;
  weddingDate: string;
}) {
  const [copied, setCopied] = useState(false);
  const message = `You're invited to celebrate ${partnerOne} & ${partnerTwo} on ${weddingDate}. ${url}`;

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <a
        href={whatsappShareUrl("", message)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-champagne bg-cream/80 px-4 py-2 text-xs uppercase tracking-[0.14em] text-foreground"
      >
        <Share2 size={14} /> WhatsApp
      </a>
      <a
        href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`}
        className="inline-flex items-center gap-2 rounded-full border border-champagne bg-cream/80 px-4 py-2 text-xs uppercase tracking-[0.14em] text-foreground"
      >
        <Mail size={14} /> Email
      </a>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-full border border-champagne bg-cream/80 px-4 py-2 text-xs uppercase tracking-[0.14em] text-foreground"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
