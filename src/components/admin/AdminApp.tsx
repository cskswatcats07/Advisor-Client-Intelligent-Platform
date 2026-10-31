"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Copy,
  Download,
  Eye,
  ImageIcon,
  LayoutDashboard,
  Link2,
  LogOut,
  Palette,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import type {
  AppData,
  GalleryImage,
  Guest,
  WeddingEvent,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab =
  | "overview"
  | "details"
  | "design"
  | "events"
  | "gallery"
  | "guests"
  | "rsvps"
  | "pdf"
  | "settings";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
  { id: "details", label: "Wedding Details", icon: <Settings size={16} /> },
  { id: "design", label: "Design & Themes", icon: <Palette size={16} /> },
  { id: "events", label: "Events", icon: <CalendarDays size={16} /> },
  { id: "gallery", label: "Gallery", icon: <ImageIcon size={16} /> },
  { id: "guests", label: "Guest Management", icon: <Users size={16} /> },
  { id: "rsvps", label: "RSVP Responses", icon: <Link2 size={16} /> },
  { id: "pdf", label: "PDF Export", icon: <Download size={16} /> },
  { id: "settings", label: "Settings", icon: <Settings size={16} /> },
];

export function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [data, setData] = useState<AppData | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [mobilePreview, setMobilePreview] = useState(false);
  const [guestForm, setGuestForm] = useState({
    guestName: "",
    email: "",
    phone: "",
    maximumAttendees: 2,
    householdLabel: "",
    notes: "",
  });
  const [eventForm, setEventForm] = useState<Partial<WeddingEvent>>({
    eventName: "",
    eventDate: "",
    startTime: "16:00",
    endTime: "18:00",
    venueName: "",
    venueAddress: "",
    description: "",
    dressCode: "",
    mapsUrl: "",
  });

  async function checkSession() {
    const res = await fetch("/api/admin/session");
    const json = await res.json();
    setAuthed(Boolean(json.authenticated));
    if (json.authenticated) await loadData();
  }

  async function loadData() {
    const res = await fetch("/api/admin/data");
    if (!res.ok) {
      setAuthed(false);
      return;
    }
    setData(await res.json());
  }

  useEffect(() => {
    void checkSession();
    // Mount-only session bootstrap
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setLoginError("Invalid password");
      return;
    }
    setAuthed(true);
    await loadData();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setData(null);
  }

  async function saveSettings(partial?: Partial<AppData["settings"]>) {
    if (!data) return;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: partial || data.settings,
        sections: data.sections,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Save failed");
      return;
    }
    setData(await res.json());
    setMessage("Saved");
  }

  async function uploadFile(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Upload failed");
    return json.url as string;
  }

  const stats = useMemo(() => {
    if (!data) return null;
    const accepted = data.rsvps.filter((r) => r.attendanceStatus === "accepted");
    const declined = data.rsvps.filter((r) => r.attendanceStatus === "declined");
    const attending = accepted.reduce((sum, r) => sum + r.attendeeCount, 0);
    return {
      guests: data.guests.length,
      responded: data.rsvps.length,
      accepted: accepted.length,
      declined: declined.length,
      attending,
      pending: data.guests.filter(
        (g) => !data.rsvps.some((r) => r.guestId === g.id)
      ).length,
    };
  }, [data]);

  if (authed === null) {
    return <div className="p-10 text-center text-muted">Loading…</div>;
  }

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <div className="admin-card p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Admin</p>
          <h1 className="mt-2 font-serif text-3xl text-primary">Wedding Studio</h1>
          <p className="mt-2 text-sm text-muted">
            Sign in to edit invitation content, guests and PDFs.
          </p>
          <form onSubmit={login} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {loginError && (
              <p className="text-sm text-primary">{loginError}</p>
            )}
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
          <p className="mt-4 text-xs text-muted">
            Default local password: <code>wedding-admin</code>
          </p>
        </div>
      </div>
    );
  }

  if (!data || !stats) {
    return <div className="p-10 text-center">Loading dashboard…</div>;
  }

  const guestRows = data.guests.map((guest) => {
    const rsvp = data.rsvps.find((r) => r.guestId === guest.id);
    return { guest, rsvp };
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
      <aside className="border-b border-champagne bg-[#f8f3ea] lg:w-64 lg:border-b-0 lg:border-r">
        <div className="px-5 py-6">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold">
            Admin
          </p>
          <h1 className="font-serif text-2xl text-primary">Wedding Studio</h1>
          <p className="mt-1 text-sm text-muted">
            {data.settings.partnerOne} & {data.settings.partnerTwo}
          </p>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-3 pb-4 lg:flex-col lg:overflow-visible">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition",
                tab === item.id
                  ? "bg-primary text-cream"
                  : "text-muted hover:bg-white/70"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="hidden space-y-2 px-4 pb-6 lg:block">
          <Link href="/" target="_blank" className="block">
            <Button variant="secondary" className="w-full">
              <Eye size={14} /> Preview site
            </Button>
          </Link>
          <Button variant="ghost" className="w-full" onClick={logout}>
            <LogOut size={14} /> Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-3xl text-primary">
              {TABS.find((t) => t.id === tab)?.label}
            </h2>
            {message && <p className="mt-1 text-sm text-forest">{message}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setMobilePreview((v) => !v)}
            >
              {mobilePreview ? "Desktop preview" : "Mobile preview"}
            </Button>
            <Button onClick={() => saveSettings()} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>

        {mobilePreview && (
          <div className="mb-6 overflow-hidden rounded-[1.5rem] border border-champagne bg-white shadow-lg">
            <iframe
              title="Mobile preview"
              src="/"
              className="mx-auto h-[640px] w-full max-w-[390px] bg-white"
            />
          </div>
        )}

        {tab === "overview" && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Guests invited", stats.guests],
              ["Responses", stats.responded],
              ["Attending", stats.attending],
              ["Pending", stats.pending],
            ].map(([label, value]) => (
              <div key={String(label)} className="admin-card p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  {label}
                </p>
                <p className="mt-2 font-serif text-4xl text-primary">{value}</p>
              </div>
            ))}
            <div className="admin-card p-5 sm:col-span-2 xl:col-span-4">
              <p className="text-sm text-muted">
                Wedding date: <strong>{data.settings.weddingDate}</strong> ·{" "}
                {data.settings.location}
              </p>
              <p className="mt-2 text-sm text-muted">
                RSVP deadline: {data.settings.rsvpDeadline || "Not set"} ·{" "}
                {data.settings.rsvpEnabled ? "Open" : "Closed"}
              </p>
            </div>
          </div>
        )}

        {tab === "details" && (
          <div className="admin-card grid gap-4 p-6 md:grid-cols-2">
            {(
              [
                ["partnerOne", "Partner 1"],
                ["partnerTwo", "Partner 2"],
                ["weddingDate", "Wedding date"],
                ["weddingTime", "Wedding time"],
                ["location", "Location / city"],
                ["venueName", "Venue name"],
                ["venueAddress", "Venue address"],
                ["mapsUrl", "Google Maps URL"],
                ["rsvpDeadline", "RSVP deadline"],
                ["contactEmail", "Contact email"],
                ["contactPhone", "Contact phone"],
                ["whatsappNumber", "WhatsApp number"],
                ["heroEyebrow", "Hero eyebrow"],
                ["heroHeading", "Hero heading"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input
                  type={
                    key.includes("Date") || key.includes("deadline")
                      ? "date"
                      : key.includes("Time")
                        ? "time"
                        : "text"
                  }
                  value={String(data.settings[key] || "")}
                  onChange={(e) =>
                    setData({
                      ...data,
                      settings: { ...data.settings, [key]: e.target.value },
                    })
                  }
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <Label>Announcement</Label>
              <Textarea
                rows={4}
                value={data.settings.announcement}
                onChange={(e) =>
                  setData({
                    ...data,
                    settings: { ...data.settings, announcement: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>Default max attendees</Label>
              <Input
                type="number"
                min={1}
                value={data.settings.maxAttendeesDefault}
                onChange={(e) =>
                  setData({
                    ...data,
                    settings: {
                      ...data.settings,
                      maxAttendeesDefault: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={data.settings.rsvpEnabled}
                  onChange={(e) =>
                    setData({
                      ...data,
                      settings: {
                        ...data.settings,
                        rsvpEnabled: e.target.checked,
                      },
                    })
                  }
                />
                RSVP enabled
              </label>
            </div>
          </div>
        )}

        {tab === "design" && (
          <div className="admin-card grid gap-4 p-6 md:grid-cols-2">
            {(
              [
                ["primaryColor", "Primary"],
                ["accentColor", "Accent"],
                ["backgroundColor", "Background"],
                ["surfaceColor", "Surface"],
                ["goldColor", "Gold"],
                ["roseColor", "Rose"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <Label>{label}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="h-12 w-16 p-1"
                    value={data.settings.theme[key]}
                    onChange={(e) =>
                      setData({
                        ...data,
                        settings: {
                          ...data.settings,
                          theme: {
                            ...data.settings.theme,
                            [key]: e.target.value,
                          },
                        },
                      })
                    }
                  />
                  <Input
                    value={data.settings.theme[key]}
                    onChange={(e) =>
                      setData({
                        ...data,
                        settings: {
                          ...data.settings,
                          theme: {
                            ...data.settings.theme,
                            [key]: e.target.value,
                          },
                        },
                      })
                    }
                  />
                </div>
              </div>
            ))}
            <div>
              <Label>Background style</Label>
              <Select
                value={data.settings.theme.backgroundStyle}
                onChange={(e) =>
                  setData({
                    ...data,
                    settings: {
                      ...data.settings,
                      theme: {
                        ...data.settings.theme,
                        backgroundStyle: e.target.value as
                          | "ivory"
                          | "champagne"
                          | "soft-gradient",
                      },
                    },
                  })
                }
              >
                <option value="ivory">Ivory</option>
                <option value="champagne">Champagne</option>
                <option value="soft-gradient">Soft gradient</option>
              </Select>
            </div>
            <div>
              <Label>PDF template</Label>
              <Select
                value={data.settings.theme.pdfTemplate}
                onChange={(e) =>
                  setData({
                    ...data,
                    settings: {
                      ...data.settings,
                      theme: {
                        ...data.settings.theme,
                        pdfTemplate: e.target.value as AppData["settings"]["theme"]["pdfTemplate"],
                      },
                    },
                  })
                }
              >
                <option value="classic-floral">Classic Floral</option>
                <option value="modern-indo-western">Modern Indo-Western</option>
                <option value="minimal-editorial">Minimal Editorial</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Hero image URL</Label>
              <Input
                value={data.settings.heroImage}
                onChange={(e) =>
                  setData({
                    ...data,
                    settings: { ...data.settings, heroImage: e.target.value },
                  })
                }
              />
              <input
                type="file"
                accept="image/*"
                className="mt-3 block w-full text-sm"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await uploadFile(file);
                  setData({
                    ...data,
                    settings: {
                      ...data.settings,
                      heroImage: url,
                      ogImage: url,
                    },
                  });
                }}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Section visibility</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                {Object.entries(data.sections).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        setData({
                          ...data,
                          sections: {
                            ...data.sections,
                            [key]: e.target.checked,
                          },
                        })
                      }
                    />
                    {key}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "events" && (
          <div className="space-y-6">
            <div className="admin-card space-y-4 p-6">
              <h3 className="font-serif text-2xl text-primary">Add / update event</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {(
                  [
                    ["eventName", "Event name"],
                    ["eventDate", "Date"],
                    ["startTime", "Start time"],
                    ["endTime", "End time"],
                    ["venueName", "Venue"],
                    ["venueAddress", "Address"],
                    ["dressCode", "Dress code"],
                    ["mapsUrl", "Maps URL"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input
                      type={
                        key === "eventDate"
                          ? "date"
                          : key.includes("Time")
                            ? "time"
                            : "text"
                      }
                      value={String(eventForm[key] || "")}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, [key]: e.target.value })
                      }
                    />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={eventForm.description || ""}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  const res = await fetch("/api/admin/events", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(eventForm),
                  });
                  if (res.ok) {
                    setEventForm({
                      eventName: "",
                      eventDate: data.settings.weddingDate,
                      startTime: "16:00",
                      endTime: "18:00",
                      venueName: "",
                      venueAddress: "",
                      description: "",
                      dressCode: "",
                      mapsUrl: "",
                    });
                    await loadData();
                  }
                }}
              >
                <Plus size={14} /> Save event
              </Button>
            </div>

            <div className="space-y-3">
              {data.events
                .slice()
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((event, index) => (
                  <div key={event.id} className="admin-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="font-serif text-xl text-primary">
                          {event.eventName}
                        </h4>
                        <p className="text-sm text-muted">
                          {event.eventDate} · {event.startTime}–{event.endTime}
                        </p>
                        <p className="mt-1 text-sm">{event.venueName}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={async () => {
                            const events = [...data.events];
                            if (index === 0) return;
                            const tmp = events[index - 1];
                            events[index - 1] = {
                              ...events[index],
                              displayOrder: index - 1,
                            };
                            events[index] = { ...tmp, displayOrder: index };
                            await fetch("/api/admin/events", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ events }),
                            });
                            await loadData();
                          }}
                        >
                          Up
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={async () => {
                            await fetch(`/api/admin/events?id=${event.id}`, {
                              method: "DELETE",
                            });
                            await loadData();
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === "gallery" && (
          <div className="space-y-6">
            <div className="admin-card p-6">
              <Label>Upload gallery image</Label>
              <input
                type="file"
                accept="image/*"
                className="mt-2 block w-full text-sm"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await uploadFile(file);
                  await fetch("/api/admin/gallery", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      imageUrl: url,
                      caption: file.name,
                    }),
                  });
                  await loadData();
                }}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.gallery.map((image: GalleryImage) => (
                <div key={image.id} className="admin-card overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.imageUrl}
                    alt={image.caption}
                    className="h-44 w-full object-cover"
                  />
                  <div className="space-y-2 p-4">
                    <Input
                      value={image.caption}
                      onChange={(e) =>
                        setData({
                          ...data,
                          gallery: data.gallery.map((g) =>
                            g.id === image.id
                              ? { ...g, caption: e.target.value }
                              : g
                          ),
                        })
                      }
                      onBlur={async () => {
                        await fetch("/api/admin/gallery", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ images: data.gallery }),
                        });
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={async () => {
                          await fetch("/api/admin/gallery", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              featuredImageId: image.id,
                              imageUrl: image.imageUrl,
                            }),
                          });
                          await loadData();
                        }}
                      >
                        Set featured
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          await fetch(`/api/admin/gallery?id=${image.id}`, {
                            method: "DELETE",
                          });
                          await loadData();
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "guests" && (
          <div className="space-y-6">
            <div className="admin-card grid gap-3 p-6 md:grid-cols-2">
              {(
                [
                  ["guestName", "Guest / household name"],
                  ["email", "Email"],
                  ["phone", "Phone"],
                  ["householdLabel", "Household label"],
                  ["notes", "Notes"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input
                    value={guestForm[key]}
                    onChange={(e) =>
                      setGuestForm({ ...guestForm, [key]: e.target.value })
                    }
                  />
                </div>
              ))}
              <div>
                <Label>Max attendees</Label>
                <Input
                  type="number"
                  min={1}
                  value={guestForm.maximumAttendees}
                  onChange={(e) =>
                    setGuestForm({
                      ...guestForm,
                      maximumAttendees: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={async () => {
                    const res = await fetch("/api/admin/guests", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(guestForm),
                    });
                    if (res.ok) {
                      setGuestForm({
                        guestName: "",
                        email: "",
                        phone: "",
                        maximumAttendees: data.settings.maxAttendeesDefault,
                        householdLabel: "",
                        notes: "",
                      });
                      await loadData();
                    }
                  }}
                >
                  <Plus size={14} /> Add guest
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {guestRows.map(({ guest, rsvp }) => (
                <GuestRow
                  key={guest.id}
                  guest={guest}
                  rsvpStatus={rsvp?.attendanceStatus || "pending"}
                  onRefresh={loadData}
                />
              ))}
            </div>
          </div>
        )}

        {tab === "rsvps" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <a href="/api/admin/export/csv">
                <Button variant="secondary">
                  <Download size={14} /> Export CSV
                </Button>
              </a>
            </div>
            {data.rsvps.length === 0 && (
              <div className="admin-card p-6 text-sm text-muted">
                No RSVP responses yet.
              </div>
            )}
            {data.rsvps.map((rsvp) => (
              <div key={rsvp.id} className="admin-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-serif text-xl text-primary">
                    {rsvp.guestName}
                  </h4>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs uppercase tracking-wider text-primary">
                    {rsvp.attendanceStatus}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">
                  Attendees: {rsvp.attendeeCount}
                  {rsvp.attendeeNames ? ` · ${rsvp.attendeeNames}` : ""}
                </p>
                {rsvp.dietaryPreferences && (
                  <p className="text-sm">Diet: {rsvp.dietaryPreferences}</p>
                )}
                {rsvp.message && (
                  <p className="mt-2 text-sm italic text-muted">“{rsvp.message}”</p>
                )}
                <p className="mt-2 text-xs text-muted">
                  {new Date(rsvp.submittedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === "pdf" && (
          <div className="admin-card space-y-4 p-6">
            <p className="text-sm text-muted">
              Generate stationery PDFs using the current wedding configuration.
              Default print size is 5×7 inches.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/api/pdf?type=digital-invitation&format=5x7&template=classic-floral&mode=preview"
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="secondary">Preview digital PDF</Button>
              </a>
              <a href="/api/pdf?type=print-ready&format=5x7&template=classic-floral&mode=download">
                <Button>Download 5×7 print PDF</Button>
              </a>
              <a href="/api/pdf?type=save-the-date&format=a5&template=minimal-editorial&mode=download">
                <Button variant="gold">Save the Date A5</Button>
              </a>
              <a href="/api/pdf?type=ceremony-details&format=a4&template=modern-indo-western&mode=download">
                <Button variant="secondary">Ceremony details A4</Button>
              </a>
            </div>
            <p className="text-xs text-muted">
              Preferred template: {data.settings.theme.pdfTemplate}
            </p>
          </div>
        )}

        {tab === "settings" && (
          <div className="admin-card grid gap-4 p-6 md:grid-cols-2">
            <div>
              <Label>SEO title</Label>
              <Input
                value={data.settings.seoTitle}
                onChange={(e) =>
                  setData({
                    ...data,
                    settings: { ...data.settings, seoTitle: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>OG image URL</Label>
              <Input
                value={data.settings.ogImage}
                onChange={(e) =>
                  setData({
                    ...data,
                    settings: { ...data.settings, ogImage: e.target.value },
                  })
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label>SEO description</Label>
              <Textarea
                rows={3}
                value={data.settings.seoDescription}
                onChange={(e) =>
                  setData({
                    ...data,
                    settings: {
                      ...data.settings,
                      seoDescription: e.target.value,
                    },
                  })
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.settings.published}
                onChange={(e) =>
                  setData({
                    ...data,
                    settings: {
                      ...data.settings,
                      published: e.target.checked,
                    },
                  })
                }
              />
              Published
            </label>
            <p className="md:col-span-2 text-xs text-muted">
              Local data file: <code>data/wedding.json</code>. Optional Supabase
              sync uses env vars from <code>.env.example</code>.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function GuestRow({
  guest,
  rsvpStatus,
  onRefresh,
}: {
  guest: Guest;
  rsvpStatus: string;
  onRefresh: () => Promise<void>;
}) {
  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite/${guest.invitationToken}`
      : `/invite/${guest.invitationToken}`;

  return (
    <div className="admin-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-serif text-xl text-primary">{guest.guestName}</h4>
          <p className="text-sm text-muted">
            Max {guest.maximumAttendees} · {guest.invitationStatus} · RSVP:{" "}
            {rsvpStatus}
          </p>
          <p className="mt-1 break-all text-xs text-muted">{inviteUrl}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => navigator.clipboard.writeText(inviteUrl)}
          >
            <Copy size={14} /> Copy link
          </Button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `You're invited! ${inviteUrl}`
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="gold">WhatsApp</Button>
          </a>
          <Button
            variant="ghost"
            onClick={async () => {
              await fetch("/api/admin/guests", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: guest.id, action: "regenerate" }),
              });
              await onRefresh();
            }}
          >
            <RefreshCw size={14} />
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              await fetch("/api/admin/guests", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: guest.id, action: "revoke" }),
              });
              await onRefresh();
            }}
          >
            Revoke
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              await fetch(`/api/admin/guests?id=${guest.id}`, {
                method: "DELETE",
              });
              await onRefresh();
            }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
