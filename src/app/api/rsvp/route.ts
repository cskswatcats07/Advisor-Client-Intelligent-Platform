import { NextResponse } from "next/server";
import { rsvpSchema } from "@/lib/validation";
import { submitRsvp } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = rsvpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid RSVP data" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (data.attendanceStatus === "accepted" && data.attendeeCount < 1) {
      return NextResponse.json(
        { error: "Please include at least one attendee." },
        { status: 400 }
      );
    }

    const response = await submitRsvp({
      invitationToken: data.invitationToken,
      guestName: data.guestName,
      email: data.email,
      phone: data.phone,
      attendanceStatus: data.attendanceStatus,
      attendeeCount: data.attendeeCount,
      attendeeNames: data.attendeeNames,
      dietaryPreferences: data.dietaryPreferences,
      message: data.message,
    });

    return NextResponse.json({
      ok: true,
      response: {
        id: response.id,
        attendanceStatus: response.attendanceStatus,
        attendeeCount: response.attendeeCount,
        submittedAt: response.submittedAt,
        guestName: response.guestName,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save RSVP";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
