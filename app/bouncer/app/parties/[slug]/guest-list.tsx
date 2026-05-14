import type { RsvpWithUser } from "@/lib/types";

interface GuestListProps {
  rsvps: RsvpWithUser[];
  currentUserId: string;
}

export function GuestList({ rsvps, currentUserId }: GuestListProps) {
  const visibleGuests = rsvps.filter(
    (rsvp) =>
      (rsvp.status === "accepted" || rsvp.status === "pending") &&
      rsvp.user_name !== null &&
      rsvp.user_name !== undefined &&
      rsvp.user_id !== currentUserId
  );

  if (visibleGuests.length === 0) {
    return (
      <div className="p-4 bg-white/5 rounded border border-white/10">
        <h3 className="text-xl mb-4">Guests</h3>
        <p className="text-sm opacity-80">No guests have responded yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white/5 rounded border border-white/10">
      <h3 className="text-xl mb-4">Guests</h3>
      <ul className="space-y-2">
        {visibleGuests.map((rsvp) => (
          <li key={rsvp.rsvp_id} className="flex items-center gap-2 text-base">
            <span>{rsvp.user_name}</span>
            {rsvp.status === "pending" ? (
              <span className="rounded border border-yellow-600/30 px-2 py-0.5 text-xs font-medium text-yellow-700">
                Maybe
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
