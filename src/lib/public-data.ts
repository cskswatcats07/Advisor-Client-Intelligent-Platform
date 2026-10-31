import { getAppData, getGuestByToken } from "./store";
import type { PublicWeddingPayload } from "./types";

export async function getPublicWedding(
  token?: string
): Promise<PublicWeddingPayload> {
  const data = await getAppData();
  const {
    contactEmail,
    contactPhone,
    whatsappNumber,
    ...publicSettings
  } = data.settings;

  const payload: PublicWeddingPayload = {
    settings: {
      ...publicSettings,
      // Only expose contact channels needed for guest actions
      whatsappNumber: whatsappNumber || undefined,
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
    },
    events: [...data.events].sort((a, b) => a.displayOrder - b.displayOrder),
    gallery: [...data.gallery].sort((a, b) => a.displayOrder - b.displayOrder),
    sections: data.sections,
  };

  if (token) {
    const guest = await getGuestByToken(token);
    if (guest) {
      const response = data.rsvps.find((r) => r.guestId === guest.id);
      payload.guest = {
        id: guest.id,
        guestName: guest.guestName,
        maximumAttendees: guest.maximumAttendees,
        invitationToken: guest.invitationToken,
        hasResponded: Boolean(response),
        response,
      };
    }
  }

  return payload;
}
