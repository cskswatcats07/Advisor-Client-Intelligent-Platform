import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteEvent, replaceEvents, upsertEvent } from "@/lib/store";
import { eventSchema } from "@/lib/validation";
import type { WeddingEvent } from "@/lib/types";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }
    const event = await upsertEvent(parsed.data);
    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    if (Array.isArray(body.events)) {
      const events = await replaceEvents(body.events as WeddingEvent[]);
      return NextResponse.json(events);
    }
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }
    const event = await upsertEvent(parsed.data);
    return NextResponse.json(event);
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
    await deleteEvent(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
