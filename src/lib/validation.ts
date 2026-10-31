import { z } from "zod";

export const rsvpSchema = z.object({
  invitationToken: z.string().optional(),
  guestName: z.string().min(2, "Please enter your name").max(120),
  email: z
    .string()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  attendanceStatus: z.enum(["accepted", "declined"]),
  attendeeCount: z.coerce.number().int().min(0).max(20),
  attendeeNames: z.string().max(500).optional().or(z.literal("")),
  dietaryPreferences: z.string().max(500).optional().or(z.literal("")),
  message: z.string().max(1000).optional().or(z.literal("")),
});

export const settingsSchema = z.object({
  partnerOne: z.string().min(1).max(80).optional(),
  partnerTwo: z.string().min(1).max(80).optional(),
  weddingDate: z.string().optional(),
  weddingTime: z.string().optional(),
  location: z.string().optional(),
  announcement: z.string().optional(),
  heroEyebrow: z.string().optional(),
  heroHeading: z.string().optional(),
  heroImage: z.string().optional(),
  featuredGalleryImageId: z.string().nullable().optional(),
  rsvpDeadline: z.string().optional(),
  rsvpEnabled: z.boolean().optional(),
  maxAttendeesDefault: z.number().int().min(1).max(50).optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  mapsUrl: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  ogImage: z.string().optional(),
  published: z.boolean().optional(),
  theme: z
    .object({
      primaryColor: z.string().optional(),
      accentColor: z.string().optional(),
      backgroundColor: z.string().optional(),
      surfaceColor: z.string().optional(),
      textColor: z.string().optional(),
      mutedTextColor: z.string().optional(),
      goldColor: z.string().optional(),
      roseColor: z.string().optional(),
      serifFont: z.string().optional(),
      sansFont: z.string().optional(),
      showFloralBorders: z.boolean().optional(),
      backgroundStyle: z
        .enum(["ivory", "champagne", "soft-gradient"])
        .optional(),
      pdfTemplate: z
        .enum(["classic-floral", "modern-indo-western", "minimal-editorial"])
        .optional(),
    })
    .optional(),
});

export const guestSchema = z.object({
  guestName: z.string().min(1).max(120),
  email: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  maximumAttendees: z.coerce.number().int().min(1).max(50),
  householdLabel: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const eventSchema = z.object({
  id: z.string().optional(),
  eventName: z.string().min(1),
  eventDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  description: z.string().optional(),
  dressCode: z.string().optional(),
  mapsUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  displayOrder: z.number().optional(),
});
