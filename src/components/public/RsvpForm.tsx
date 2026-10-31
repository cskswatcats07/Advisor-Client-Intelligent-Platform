"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { formatWeddingDate, whatsappShareUrl } from "@/lib/utils";

export function RsvpForm({
  invitationToken,
  guestName,
  maximumAttendees = 2,
  rsvpDeadline,
  rsvpEnabled,
  whatsappNumber,
  partnerOne,
  partnerTwo,
  hasResponded,
}: {
  invitationToken?: string;
  guestName?: string;
  maximumAttendees?: number;
  rsvpDeadline: string;
  rsvpEnabled: boolean;
  whatsappNumber?: string;
  partnerOne: string;
  partnerTwo: string;
  hasResponded?: boolean;
}) {
  const [form, setForm] = useState({
    guestName: guestName || "",
    email: "",
    phone: "",
    attendanceStatus: "accepted" as "accepted" | "declined",
    attendeeCount: Math.min(1, maximumAttendees) || 1,
    attendeeNames: "",
    dietaryPreferences: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    hasResponded ? "success" : "idle"
  );
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          invitationToken,
          attendeeCount:
            form.attendanceStatus === "declined" ? 0 : form.attendeeCount,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to submit RSVP");
      setConfirmation(
        form.attendanceStatus === "accepted"
          ? `Thank you, ${form.guestName}. We cannot wait to celebrate with you.`
          : `Thank you, ${form.guestName}. We’re sorry you’ll miss the day, and grateful you let us know.`
      );
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (!rsvpEnabled) {
    return (
      <section id="rsvp" className="section-pad mx-auto max-w-2xl py-16 text-center">
        <h2 className="font-serif text-4xl text-primary">RSVP</h2>
        <p className="mt-4 text-muted">RSVP is currently closed.</p>
      </section>
    );
  }

  const whatsappText = `Hello! I’d like to RSVP for ${partnerOne} & ${partnerTwo}'s wedding.`;

  return (
    <section id="rsvp" className="section-pad mx-auto max-w-2xl py-16">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Kindly Reply</p>
        <h2 className="mt-3 font-serif text-4xl text-primary md:text-5xl">RSVP</h2>
        {guestName && (
          <p className="mt-4 font-serif text-xl text-foreground/80">
            Dear {guestName}, we would be honoured by your presence.
          </p>
        )}
        {rsvpDeadline && (
          <p className="mt-3 text-sm text-muted">
            Please respond by {formatWeddingDate(rsvpDeadline, { weekday: undefined })}
          </p>
        )}
      </div>

      {status === "success" ? (
        <div className="mt-10 rounded-[1.5rem] border border-champagne bg-cream/80 px-6 py-10 text-center">
          <p className="font-serif text-2xl text-primary">
            {confirmation || "Your response has been recorded."}
          </p>
          <p className="mt-3 text-sm text-muted">
            You may update your RSVP by submitting this form again with the same invitation.
          </p>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="mt-10 space-y-5 rounded-[1.5rem] border border-champagne bg-cream/80 p-6 shadow-[0_16px_40px_rgba(44,36,27,0.05)] md:p-8"
        >
          <div>
            <Label htmlFor="guestName">Guest name *</Label>
            <Input
              id="guestName"
              required
              value={form.guestName}
              onChange={(e) => setForm({ ...form, guestName: e.target.value })}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="attendance">Will you attend? *</Label>
            <Select
              id="attendance"
              value={form.attendanceStatus}
              onChange={(e) =>
                setForm({
                  ...form,
                  attendanceStatus: e.target.value as "accepted" | "declined",
                })
              }
            >
              <option value="accepted">Accept with pleasure</option>
              <option value="declined">Regretfully decline</option>
            </Select>
          </div>

          {form.attendanceStatus === "accepted" && (
            <>
              <div>
                <Label htmlFor="attendeeCount">
                  Number of attendees (max {maximumAttendees})
                </Label>
                <Input
                  id="attendeeCount"
                  type="number"
                  min={1}
                  max={maximumAttendees}
                  required
                  value={form.attendeeCount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      attendeeCount: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="attendeeNames">Guest names</Label>
                <Input
                  id="attendeeNames"
                  placeholder="Names of everyone attending"
                  value={form.attendeeNames}
                  onChange={(e) =>
                    setForm({ ...form, attendeeNames: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="dietary">Dietary preferences</Label>
                <Input
                  id="dietary"
                  value={form.dietaryPreferences}
                  onChange={(e) =>
                    setForm({ ...form, dietaryPreferences: e.target.value })
                  }
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="message">Additional message</Label>
            <Textarea
              id="message"
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={status === "loading"}>
            {status === "loading" ? "Sending…" : "Submit RSVP"}
          </Button>

          {whatsappNumber && (
            <a
              href={whatsappShareUrl(whatsappNumber, whatsappText)}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-sm text-muted underline-offset-4 hover:underline"
            >
              Or RSVP via WhatsApp
            </a>
          )}
        </form>
      )}
    </section>
  );
}
