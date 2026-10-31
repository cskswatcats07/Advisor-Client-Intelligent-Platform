import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { createDefaultData } from "./defaults";
import type {
  AppData,
  GalleryImage,
  Guest,
  RsvpResponse,
  WeddingEvent,
  WeddingSettings,
  SectionVisibility,
} from "./types";
import { isSupabaseConfigured, supabaseAdmin } from "./supabase";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "wedding.json");

async function ensureDataFile(): Promise<AppData> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as AppData;
  } catch {
    const data = createDefaultData();
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return data;
  }
}

async function writeData(data: AppData): Promise<AppData> {
  data.settings.updatedAt = new Date().toISOString();
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  return data;
}

export async function getAppData(): Promise<AppData> {
  if (isSupabaseConfigured()) {
    try {
      return await loadFromSupabase();
    } catch (error) {
      console.error("Supabase load failed, falling back to local store:", error);
    }
  }
  return ensureDataFile();
}

export async function saveAppData(data: AppData): Promise<AppData> {
  const saved = await writeData(data);
  if (isSupabaseConfigured()) {
    try {
      await syncToSupabase(saved);
    } catch (error) {
      console.error("Supabase sync failed:", error);
    }
  }
  return saved;
}

export async function updateSettings(
  partial: Partial<WeddingSettings>
): Promise<WeddingSettings> {
  const data = await getAppData();
  data.settings = {
    ...data.settings,
    ...partial,
    theme: { ...data.settings.theme, ...(partial.theme || {}) },
  };
  await saveAppData(data);
  return data.settings;
}

export async function updateSections(
  sections: Partial<SectionVisibility>
): Promise<SectionVisibility> {
  const data = await getAppData();
  data.sections = { ...data.sections, ...sections };
  await saveAppData(data);
  return data.sections;
}

export async function replaceEvents(events: WeddingEvent[]): Promise<WeddingEvent[]> {
  const data = await getAppData();
  data.events = events
    .map((e, index) => ({ ...e, displayOrder: e.displayOrder ?? index }))
    .sort((a, b) => a.displayOrder - b.displayOrder);
  await saveAppData(data);
  return data.events;
}

export async function upsertEvent(
  event: Partial<WeddingEvent> & { eventName: string }
): Promise<WeddingEvent> {
  const data = await getAppData();
  if (event.id) {
    data.events = data.events.map((e) =>
      e.id === event.id ? ({ ...e, ...event } as WeddingEvent) : e
    );
  } else {
    const created: WeddingEvent = {
      id: nanoid(),
      eventName: event.eventName,
      eventDate: event.eventDate || data.settings.weddingDate,
      startTime: event.startTime || "16:00",
      endTime: event.endTime || "18:00",
      venueName: event.venueName || data.settings.venueName,
      venueAddress: event.venueAddress || data.settings.venueAddress,
      description: event.description || "",
      dressCode: event.dressCode || "",
      mapsUrl: event.mapsUrl || "",
      imageUrl: event.imageUrl || "",
      displayOrder: data.events.length,
    };
    data.events.push(created);
    await saveAppData(data);
    return created;
  }
  await saveAppData(data);
  return data.events.find((e) => e.id === event.id)!;
}

export async function deleteEvent(id: string): Promise<void> {
  const data = await getAppData();
  data.events = data.events
    .filter((e) => e.id !== id)
    .map((e, index) => ({ ...e, displayOrder: index }));
  await saveAppData(data);
}

export async function replaceGallery(images: GalleryImage[]): Promise<GalleryImage[]> {
  const data = await getAppData();
  data.gallery = images
    .map((img, index) => ({ ...img, displayOrder: img.displayOrder ?? index }))
    .sort((a, b) => a.displayOrder - b.displayOrder);
  await saveAppData(data);
  return data.gallery;
}

export async function addGalleryImage(
  image: Omit<GalleryImage, "id" | "createdAt" | "displayOrder"> & {
    displayOrder?: number;
  }
): Promise<GalleryImage> {
  const data = await getAppData();
  const created: GalleryImage = {
    id: nanoid(),
    imageUrl: image.imageUrl,
    caption: image.caption || "",
    displayOrder: image.displayOrder ?? data.gallery.length,
    createdAt: new Date().toISOString(),
  };
  data.gallery.push(created);
  if (!data.settings.featuredGalleryImageId) {
    data.settings.featuredGalleryImageId = created.id;
  }
  await saveAppData(data);
  return created;
}

export async function deleteGalleryImage(id: string): Promise<void> {
  const data = await getAppData();
  data.gallery = data.gallery
    .filter((g) => g.id !== id)
    .map((g, index) => ({ ...g, displayOrder: index }));
  if (data.settings.featuredGalleryImageId === id) {
    data.settings.featuredGalleryImageId = data.gallery[0]?.id || null;
  }
  await saveAppData(data);
}

export async function createGuest(
  input: Omit<Guest, "id" | "invitationToken" | "createdAt" | "invitationStatus"> & {
    invitationToken?: string;
  }
): Promise<Guest> {
  const data = await getAppData();
  const guest: Guest = {
    id: nanoid(),
    invitationToken: input.invitationToken || nanoid(24),
    guestName: input.guestName,
    email: input.email || "",
    phone: input.phone || "",
    maximumAttendees: input.maximumAttendees || data.settings.maxAttendeesDefault,
    invitationStatus: "active",
    householdLabel: input.householdLabel || "",
    notes: input.notes || "",
    createdAt: new Date().toISOString(),
  };
  data.guests.push(guest);
  await saveAppData(data);
  return guest;
}

export async function updateGuest(
  id: string,
  partial: Partial<Guest>
): Promise<Guest | null> {
  const data = await getAppData();
  const index = data.guests.findIndex((g) => g.id === id);
  if (index === -1) return null;
  data.guests[index] = { ...data.guests[index], ...partial, id };
  await saveAppData(data);
  return data.guests[index];
}

export async function deleteGuest(id: string): Promise<void> {
  const data = await getAppData();
  data.guests = data.guests.filter((g) => g.id !== id);
  data.rsvps = data.rsvps.filter((r) => r.guestId !== id);
  await saveAppData(data);
}

export async function regenerateGuestToken(id: string): Promise<Guest | null> {
  return updateGuest(id, { invitationToken: nanoid(24), invitationStatus: "active" });
}

export async function revokeGuest(id: string): Promise<Guest | null> {
  return updateGuest(id, { invitationStatus: "revoked" });
}

export async function getGuestByToken(token: string): Promise<Guest | null> {
  const data = await getAppData();
  return (
    data.guests.find(
      (g) => g.invitationToken === token && g.invitationStatus === "active"
    ) || null
  );
}

export async function submitRsvp(input: {
  invitationToken?: string;
  guestName: string;
  email?: string;
  phone?: string;
  attendanceStatus: "accepted" | "declined";
  attendeeCount: number;
  attendeeNames?: string;
  dietaryPreferences?: string;
  message?: string;
}): Promise<RsvpResponse> {
  const data = await getAppData();

  if (!data.settings.rsvpEnabled) {
    throw new Error("RSVP is currently closed.");
  }

  if (data.settings.rsvpDeadline) {
    const deadline = new Date(`${data.settings.rsvpDeadline}T23:59:59`);
    if (Date.now() > deadline.getTime()) {
      throw new Error("The RSVP deadline has passed.");
    }
  }

  let guest = input.invitationToken
    ? data.guests.find((g) => g.invitationToken === input.invitationToken)
    : undefined;

  if (input.invitationToken) {
    if (!guest || guest.invitationStatus !== "active") {
      throw new Error("This invitation link is invalid or has been revoked.");
    }
    if (input.attendeeCount > guest.maximumAttendees) {
      throw new Error(
        `This invitation allows a maximum of ${guest.maximumAttendees} attendees.`
      );
    }
  } else if (input.attendeeCount > data.settings.maxAttendeesDefault) {
    throw new Error(
      `Maximum of ${data.settings.maxAttendeesDefault} attendees allowed.`
    );
  }

  if (!guest) {
    guest = {
      id: nanoid(),
      invitationToken: nanoid(24),
      guestName: input.guestName,
      email: input.email || "",
      phone: input.phone || "",
      maximumAttendees: data.settings.maxAttendeesDefault,
      invitationStatus: "active",
      householdLabel: "",
      notes: "Open RSVP",
      createdAt: new Date().toISOString(),
    };
    data.guests.push(guest);
  }

  const existingIndex = data.rsvps.findIndex((r) => r.guestId === guest!.id);
  const response: RsvpResponse = {
    id: existingIndex >= 0 ? data.rsvps[existingIndex].id : nanoid(),
    guestId: guest.id,
    invitationToken: guest.invitationToken,
    guestName: input.guestName || guest.guestName,
    email: input.email || guest.email || "",
    phone: input.phone || guest.phone || "",
    attendanceStatus: input.attendanceStatus,
    attendeeCount:
      input.attendanceStatus === "declined" ? 0 : Math.max(1, input.attendeeCount),
    attendeeNames: input.attendeeNames || "",
    dietaryPreferences: input.dietaryPreferences || "",
    message: input.message || "",
    submittedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    data.rsvps[existingIndex] = response;
  } else {
    data.rsvps.push(response);
  }

  // Keep guest contact in sync
  guest.guestName = response.guestName;
  guest.email = response.email;
  guest.phone = response.phone;

  await saveAppData(data);
  return response;
}

async function loadFromSupabase(): Promise<AppData> {
  const supabase = supabaseAdmin();
  const [
    { data: settingsRows },
    { data: events },
    { data: gallery },
    { data: guests },
    { data: rsvps },
  ] = await Promise.all([
    supabase.from("wedding_settings").select("*").limit(1),
    supabase.from("wedding_events").select("*").order("display_order"),
    supabase.from("gallery_images").select("*").order("display_order"),
    supabase.from("guests").select("*").order("created_at"),
    supabase.from("rsvp_responses").select("*").order("submitted_at"),
  ]);

  if (!settingsRows?.[0]) {
    return ensureDataFile();
  }

  const row = settingsRows[0];
  const local = await ensureDataFile();

  return {
    settings: {
      ...local.settings,
      id: row.id,
      partnerOne: row.partner_one,
      partnerTwo: row.partner_two,
      weddingDate: row.wedding_date,
      weddingTime: row.wedding_time || local.settings.weddingTime,
      location: row.wedding_location,
      announcement: row.announcement,
      heroImage: row.hero_image || local.settings.heroImage,
      theme: { ...local.settings.theme, ...(row.theme_configuration || {}) },
      rsvpDeadline: row.rsvp_deadline || local.settings.rsvpDeadline,
      contactEmail: row.contact_information?.email || local.settings.contactEmail,
      contactPhone: row.contact_information?.phone || local.settings.contactPhone,
      whatsappNumber:
        row.contact_information?.whatsapp || local.settings.whatsappNumber,
      venueName: row.venue_name || local.settings.venueName,
      venueAddress: row.venue_address || local.settings.venueAddress,
      mapsUrl: row.maps_url || local.settings.mapsUrl,
      updatedAt: row.updated_at || new Date().toISOString(),
    },
    events: (events || []).map((e) => ({
      id: e.id,
      eventName: e.event_name,
      eventDate: e.event_date,
      startTime: e.start_time,
      endTime: e.end_time,
      venueName: e.venue_name,
      venueAddress: e.venue_address,
      description: e.description || "",
      dressCode: e.dress_code || "",
      mapsUrl: e.maps_url || "",
      imageUrl: e.image_url || "",
      displayOrder: e.display_order ?? 0,
    })),
    gallery: (gallery || []).map((g) => ({
      id: g.id,
      imageUrl: g.image_url,
      caption: g.caption || "",
      displayOrder: g.display_order ?? 0,
      createdAt: g.created_at,
    })),
    guests: (guests || []).map((g) => ({
      id: g.id,
      invitationToken: g.invitation_token,
      guestName: g.guest_name,
      email: g.email || "",
      phone: g.phone || "",
      maximumAttendees: g.maximum_attendees,
      invitationStatus: g.invitation_status,
      householdLabel: g.household_label || "",
      notes: g.notes || "",
      createdAt: g.created_at,
    })),
    rsvps: (rsvps || []).map((r) => ({
      id: r.id,
      guestId: r.guest_id,
      invitationToken: r.invitation_token || "",
      guestName: r.guest_name || "",
      email: r.email || "",
      phone: r.phone || "",
      attendanceStatus: r.attendance_status,
      attendeeCount: r.attendee_count,
      attendeeNames: r.attendee_names || "",
      dietaryPreferences: r.dietary_preferences || "",
      message: r.message || "",
      submittedAt: r.submitted_at,
    })),
    sections: local.sections,
  };
}

async function syncToSupabase(data: AppData): Promise<void> {
  const supabase = supabaseAdmin();
  await supabase.from("wedding_settings").upsert({
    id: data.settings.id,
    partner_one: data.settings.partnerOne,
    partner_two: data.settings.partnerTwo,
    wedding_date: data.settings.weddingDate,
    wedding_time: data.settings.weddingTime,
    wedding_location: data.settings.location,
    announcement: data.settings.announcement,
    theme_configuration: data.settings.theme,
    hero_image: data.settings.heroImage,
    rsvp_deadline: data.settings.rsvpDeadline,
    contact_information: {
      email: data.settings.contactEmail,
      phone: data.settings.contactPhone,
      whatsapp: data.settings.whatsappNumber,
    },
    venue_name: data.settings.venueName,
    venue_address: data.settings.venueAddress,
    maps_url: data.settings.mapsUrl,
    updated_at: data.settings.updatedAt,
  });
}
