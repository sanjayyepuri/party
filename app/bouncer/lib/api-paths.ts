export const API_PATH = "/api/bouncer";

export function partyCalendarDownloadPath(partyId: string): string {
  return `${API_PATH}/parties/${encodeURIComponent(partyId)}/calendar.ics`;
}
