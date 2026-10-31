import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  createGuest,
  deleteGuest,
  getAppData,
  regenerateGuestToken,
  revokeGuest,
  updateGuest,
} from "@/lib/store";
import { guestSchema } from "@/lib/validation";
import { buildInviteUrl, buildRsvpUrl } from "@/lib/utils";

export async function GET() {
  try {
    await requireAdmin();
    const data = await getAppData();
    const guests = data.guests.map((guest) => {
      const rsvp = data.rsvps.find((r) => r.guestId === guest.id);
      return {
        ...guest,
        inviteUrl: buildInviteUrl(guest.invitationToken),
        rsvpUrl: buildRsvpUrl(guest.invitationToken),
        rsvpStatus: rsvp?.attendanceStatus || "pending",
        attendeeCount: rsvp?.attendeeCount || 0,
        submittedAt: rsvp?.submittedAt || null,
      };
    });
    return NextResponse.json({ guests, rsvps: data.rsvps });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = guestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid guest" },
        { status: 400 }
      );
    }
    const guest = await createGuest({
      guestName: parsed.data.guestName,
      email: parsed.data.email || "",
      phone: parsed.data.phone || "",
      maximumAttendees: parsed.data.maximumAttendees,
      householdLabel: parsed.data.householdLabel || "",
      notes: parsed.data.notes || "",
    });
    return NextResponse.json({
      ...guest,
      inviteUrl: buildInviteUrl(guest.invitationToken),
      rsvpUrl: buildRsvpUrl(guest.invitationToken),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, action, ...rest } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    if (action === "regenerate") {
      const guest = await regenerateGuestToken(id);
      return NextResponse.json(guest);
    }
    if (action === "revoke") {
      const guest = await revokeGuest(id);
      return NextResponse.json(guest);
    }

    const guest = await updateGuest(id, rest);
    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }
    return NextResponse.json(guest);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await deleteGuest(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
