/**
 * EDIT THIS FILE for poster captions, labels, and design-preview defaults.
 * LIVE EVENT DETAILS (title/date/location/description) come from Neon.
 * Database edits appear after refreshing the live invite, preview tile, and .ics.
 * The event/title values below are preview defaults; editing them alone does not
 * replace live data. To deliberately push these defaults to Neon, inspect first:
 *   vercel env run -e development -- node scripts/sync-fall-invitation.cjs --check
 * Then omit --check to apply. This overwrites the database event details.
 */
import type { RsvpFormCopy } from "../[slug]/rsvp-form";
import type { GuestListCopy } from "../[slug]/guest-list";

export const invitationCopy = {
  // Default title layout. A different title in Neon renders as plain display text.
  // connector is the smaller italic word.
  title: { firstLine: "Time", connector: "to", secondLine: "Fall" },

  // Preview/sync defaults only. The live invitation uses the database record.
  event: {
    // ISO timestamp with timezone. This is Nov 13 at 7:30 PM in New York.
    time: "2026-11-14T00:30:00Z",
    timeZone: "America/New_York",
    timeZoneLabel: "Eastern",
    // Leave empty until the address is ready. A real address enables map links.
    location: "",
    // Use \n to add intentional line breaks. An empty string hides the description.
    description:
      "A little warmth as the weather turns. Come spend an autumn evening in good company. No occasion needed, just you.",
  },

  poster: {
    edition: "Autumn, MMXXVI",
    caption: "Sweaters",
    italicCaption: "required!",
    // The small Roman date is generated from event.time.
  },
  preview: {
    eyebrow: "An autumn gathering",
    message: "Design preview — open the live invitation to RSVP.",
  },
  navigation: { back: "← Invitations", backLabel: "Back to invitations" },
  actions: { addToCalendar: "Add to calendar" },
  response: { heading: "RSVP & guests", prompt: "Come by!" },
  footer: "I was stupid and now here I am.",

  // These override only this invite; other invitations keep their existing labels.
  rsvp: {
    currentStatus: "Current Status",
    updateStatus: "Update Status",
    maybe: "Maybe",
    going: "Going",
    decline: "Decline",
    loading: "Loading RSVP...",
    updating: "Updating RSVP...",
    unknown: "Unknown",
    loadError: "Failed to load RSVP",
    updateError: "Failed to update RSVP",
  } satisfies RsvpFormCopy,
  guests: {
    heading: "Guests",
    maybe: "Maybe",
    empty: "No guests to show yet.",
  } satisfies GuestListCopy,
  messages: {
    guestListLoading: "Loading guest list…",
    guestListError: "Guest list unavailable:",
    invitationUnavailable: "Invitation unavailable",
    invitationError:
      "We couldn’t load the invitation. Please try again shortly.",
    retry: "Please try again shortly.",
    locationPending: "To be announced",
  },
};
