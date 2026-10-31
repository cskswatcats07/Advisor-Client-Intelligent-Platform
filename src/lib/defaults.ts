import { nanoid } from "nanoid";
import type { AppData, ThemeConfig } from "./types";

export const defaultTheme: ThemeConfig = {
  primaryColor: "#7A1F2B",
  accentColor: "#E8A317",
  backgroundColor: "#F7F1E8",
  surfaceColor: "#FBF7F0",
  textColor: "#2C241B",
  mutedTextColor: "#6B5E52",
  goldColor: "#B08D57",
  roseColor: "#C4877A",
  serifFont: "Cormorant Garamond",
  sansFont: "Outfit",
  showFloralBorders: true,
  backgroundStyle: "soft-gradient",
  pdfTemplate: "classic-floral",
};

const weddingDate = "2026-12-12";

export function createDefaultData(): AppData {
  const galleryId = nanoid();
  const ceremonyId = nanoid();
  const receptionId = nanoid();
  const celebrationId = nanoid();

  return {
    settings: {
      id: "default",
      partnerOne: "Aanya",
      partnerTwo: "Rohan",
      weddingDate,
      weddingTime: "16:00",
      location: "Mumbai",
      announcement:
        "Two journeys, two families and one beautiful beginning. We would be delighted to have you celebrate this special milestone with us.",
      heroEyebrow: "Together with our families",
      heroHeading: "Save the Date",
      heroImage: "/images/hero-decor.jpg",
      featuredGalleryImageId: galleryId,
      theme: defaultTheme,
      rsvpDeadline: "2026-11-20",
      rsvpEnabled: true,
      maxAttendeesDefault: 2,
      contactEmail: "celebrate@example.com",
      contactPhone: "",
      whatsappNumber: "",
      venueName: "The Ivory Courtyard",
      venueAddress: "To be shared with confirmed guests",
      mapsUrl: "",
      seoTitle: "Aanya & Rohan — Wedding Invitation",
      seoDescription:
        "Join us as we celebrate our wedding. Save the date and RSVP for an unforgettable Indo-western celebration.",
      ogImage: "/images/hero-decor.jpg",
      published: true,
      updatedAt: new Date().toISOString(),
    },
    events: [
      {
        id: ceremonyId,
        eventName: "Wedding Ceremony",
        eventDate: weddingDate,
        startTime: "16:00",
        endTime: "17:30",
        venueName: "The Ivory Courtyard",
        venueAddress: "To be shared with confirmed guests",
        description:
          "An intimate Indo-western civil ceremony framed by florals, candlelight and family.",
        dressCode: "Formal / Festive Indo-western",
        mapsUrl: "",
        imageUrl: "/images/hero-decor.jpg",
        displayOrder: 0,
      },
      {
        id: receptionId,
        eventName: "Reception",
        eventDate: weddingDate,
        startTime: "19:00",
        endTime: "23:00",
        venueName: "The Ivory Courtyard",
        venueAddress: "To be shared with confirmed guests",
        description:
          "Dinner, music and celebration with our closest people under warm golden light.",
        dressCode: "Cocktail / Elegant festive",
        mapsUrl: "",
        imageUrl: "",
        displayOrder: 1,
      },
      {
        id: celebrationId,
        eventName: "Additional Celebrations",
        eventDate: weddingDate,
        startTime: "12:00",
        endTime: "14:00",
        venueName: "Family Residence",
        venueAddress: "Details shared privately",
        description:
          "A joyful gathering with loved ones before the ceremony — laughter, blessings and photographs.",
        dressCode: "Bright festive colours welcome",
        mapsUrl: "",
        imageUrl: "",
        displayOrder: 2,
      },
    ],
    gallery: [
      {
        id: galleryId,
        imageUrl: "/images/gallery-1.jpg",
        caption: "Ceremony floral arch and seating",
        displayOrder: 0,
        createdAt: new Date().toISOString(),
      },
    ],
    guests: [],
    rsvps: [],
    sections: {
      hero: true,
      announcement: true,
      countdown: true,
      events: true,
      venue: true,
      gallery: true,
      rsvp: true,
      download: true,
    },
  };
}
