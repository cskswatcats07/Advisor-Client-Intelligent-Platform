import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAppData, saveAppData, updateSections, updateSettings } from "@/lib/store";
import { settingsSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireAdmin();
    const data = await getAppData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    if (body.settings) {
      const parsed = settingsSchema.safeParse(body.settings);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Invalid settings" },
          { status: 400 }
        );
      }
      await updateSettings(parsed.data as Parameters<typeof updateSettings>[0]);
    }

    if (body.sections) {
      await updateSections(body.sections);
    }

    if (body.replaceAll && body.data) {
      await saveAppData(body.data);
    }

    const data = await getAppData();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Unable to save" }, { status: 500 });
  }
}
