import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  addGalleryImage,
  deleteGalleryImage,
  replaceGallery,
  updateSettings,
} from "@/lib/store";
import type { GalleryImage } from "@/lib/types";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    if (!body.imageUrl) {
      return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
    }
    const image = await addGalleryImage({
      imageUrl: body.imageUrl,
      caption: body.caption || "",
    });
    if (body.featured) {
      await updateSettings({
        featuredGalleryImageId: image.id,
        heroImage: image.imageUrl,
        ogImage: image.imageUrl,
      });
    }
    return NextResponse.json(image);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    if (Array.isArray(body.images)) {
      const images = await replaceGallery(body.images as GalleryImage[]);
      return NextResponse.json(images);
    }
    if (body.featuredImageId && body.imageUrl) {
      await updateSettings({
        featuredGalleryImageId: body.featuredImageId,
        heroImage: body.imageUrl,
        ogImage: body.imageUrl,
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
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
    await deleteGalleryImage(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
