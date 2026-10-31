import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWeddingDate(date: string, options?: Intl.DateTimeFormatOptions) {
  if (!date) return "";
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  });
}

export function formatTime(time: string) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return time;
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function weddingDateTimeIso(date: string, time: string) {
  return new Date(`${date}T${time || "00:00"}:00`);
}

export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function buildInviteUrl(token: string) {
  return `${getBaseUrl()}/invite/${token}`;
}

export function buildRsvpUrl(token: string) {
  return `${getBaseUrl()}/rsvp/${token}`;
}

export function whatsappShareUrl(phone: string, text: string) {
  const cleaned = phone.replace(/[^\d+]/g, "");
  const encoded = encodeURIComponent(text);
  if (cleaned) {
    return `https://wa.me/${cleaned.replace("+", "")}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
