export type AttendanceStatus = "accepted" | "declined" | "pending";
export type InvitationStatus = "active" | "revoked";
export type PdfTemplate = "classic-floral" | "modern-indo-western" | "minimal-editorial";
export type PdfFormat = "5x7" | "a4" | "a5";
export type PdfDocumentType =
  | "digital-invitation"
  | "print-ready"
  | "save-the-date"
  | "ceremony-details";

export interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  goldColor: string;
  roseColor: string;
  serifFont: string;
  sansFont: string;
  showFloralBorders: boolean;
  backgroundStyle: "ivory" | "champagne" | "soft-gradient";
  pdfTemplate: PdfTemplate;
}

export interface WeddingSettings {
  id: string;
  partnerOne: string;
  partnerTwo: string;
  weddingDate: string; // ISO date YYYY-MM-DD
  weddingTime: string; // HH:mm
  location: string;
  announcement: string;
  heroEyebrow: string;
  heroHeading: string;
  heroImage: string;
  featuredGalleryImageId: string | null;
  theme: ThemeConfig;
  rsvpDeadline: string; // ISO date
  rsvpEnabled: boolean;
  maxAttendeesDefault: number;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  published: boolean;
  updatedAt: string;
}

export interface WeddingEvent {
  id: string;
  eventName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  venueAddress: string;
  description: string;
  dressCode: string;
  mapsUrl: string;
  imageUrl: string;
  displayOrder: number;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  caption: string;
  displayOrder: number;
  createdAt: string;
}

export interface Guest {
  id: string;
  invitationToken: string;
  guestName: string;
  email: string;
  phone: string;
  maximumAttendees: number;
  invitationStatus: InvitationStatus;
  householdLabel: string;
  createdAt: string;
  notes: string;
}

export interface RsvpResponse {
  id: string;
  guestId: string;
  invitationToken: string;
  guestName: string;
  email: string;
  phone: string;
  attendanceStatus: Exclude<AttendanceStatus, "pending">;
  attendeeCount: number;
  attendeeNames: string;
  dietaryPreferences: string;
  message: string;
  submittedAt: string;
}

export interface SectionVisibility {
  hero: boolean;
  announcement: boolean;
  countdown: boolean;
  events: boolean;
  venue: boolean;
  gallery: boolean;
  rsvp: boolean;
  download: boolean;
}

export interface AppData {
  settings: WeddingSettings;
  events: WeddingEvent[];
  gallery: GalleryImage[];
  guests: Guest[];
  rsvps: RsvpResponse[];
  sections: SectionVisibility;
}

export interface PublicWeddingPayload {
  settings: Omit<
    WeddingSettings,
    "contactEmail" | "contactPhone" | "whatsappNumber"
  > & {
    contactEmail?: string;
    contactPhone?: string;
    whatsappNumber?: string;
  };
  events: WeddingEvent[];
  gallery: GalleryImage[];
  sections: SectionVisibility;
  guest?: {
    id: string;
    guestName: string;
    maximumAttendees: number;
    invitationToken: string;
    hasResponded: boolean;
    response?: RsvpResponse;
  };
}

export interface AdminAuthConfig {
  passwordHash: string;
  sessionSecret: string;
}
