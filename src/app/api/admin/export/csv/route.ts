import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAppData } from "@/lib/store";

function csvEscape(value: string | number) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  try {
    await requireAdmin();
    const data = await getAppData();

    const header = [
      "guest_name",
      "email",
      "phone",
      "household",
      "maximum_attendees",
      "invitation_status",
      "rsvp_status",
      "attendee_count",
      "attendee_names",
      "dietary_preferences",
      "message",
      "submitted_at",
      "invitation_token",
    ];

    const rows = data.guests.map((guest) => {
      const rsvp = data.rsvps.find((r) => r.guestId === guest.id);
      return [
        guest.guestName,
        guest.email,
        guest.phone,
        guest.householdLabel,
        guest.maximumAttendees,
        guest.invitationStatus,
        rsvp?.attendanceStatus || "pending",
        rsvp?.attendeeCount ?? "",
        rsvp?.attendeeNames || "",
        rsvp?.dietaryPreferences || "",
        rsvp?.message || "",
        rsvp?.submittedAt || "",
        guest.invitationToken,
      ]
        .map(csvEscape)
        .join(",");
    });

    const csv = [header.join(","), ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="rsvp-export.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
