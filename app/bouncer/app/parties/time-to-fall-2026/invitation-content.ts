import { invitationCopy } from "./invitation-copy";

// Identity is separate from editable copy so changes never orphan existing RSVPs.
export const FALL_PARTY_SLUG = "time-to-fall-2026";
export const invitationName = Object.values(invitationCopy.title)
  .filter(Boolean)
  .join(" ");
// Preview defaults only. Live event details always come from Neon.
export const invitationEvent = {
  name: invitationName,
  time: invitationCopy.event.time,
  location:
    invitationCopy.event.location || invitationCopy.messages.locationPending,
  description: invitationCopy.event.description,
};

export function invitationDateMarks(time: string) {
  const date = new Date(time);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: invitationCopy.event.timeZone,
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const roman = (value: number): string => {
    let result = "";
    for (const [amount, symbol] of [
      [10, "X"],
      [9, "IX"],
      [5, "V"],
      [4, "IV"],
      [1, "I"],
    ] as const) {
      while (value >= amount) {
        result += symbol;
        value -= amount;
      }
    }
    return result;
  };
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return {
    roman: `${roman(month)} / ${roman(day)}`,
    postal: new Intl.DateTimeFormat("en-GB", {
      timeZone: invitationCopy.event.timeZone,
      day: "2-digit",
      month: "short",
    })
      .format(date)
      .toUpperCase(),
    year: new Intl.DateTimeFormat("en-US", {
      timeZone: invitationCopy.event.timeZone,
      year: "numeric",
    }).format(date),
  };
}
