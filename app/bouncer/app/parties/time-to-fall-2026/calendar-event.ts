import type { Party } from "@/lib/types";

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/[,;]/g, "\\$&");
}

// iCalendar content lines must fold at 75 UTF-8 octets, without splitting a character.
function foldLine(line: string): string {
  let folded = "";
  let width = 0;
  for (const character of line) {
    const size = Buffer.byteLength(character, "utf8");
    if (width + size > 75) {
      folded += "\r\n ";
      width = 1;
    }
    folded += character;
    width += size;
  }
  return folded;
}

export function createCalendarEvent(party: Party): string {
  const utc = (value: string) =>
    new Date(value)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//sanjay.party//Invitations//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${escapeText(party.party_id)}@sanjay.party`,
      `DTSTAMP:${utc(party.updated_at)}`,
      `DTSTART:${utc(party.time)}`,
      `SUMMARY:${escapeText(party.name)}`,
      `LOCATION:${escapeText(party.location)}`,
      `DESCRIPTION:${escapeText(party.description)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .map(foldLine)
      .join("\r\n") + "\r\n"
  );
}
