import type { RsvpWithUser } from "@/lib/types";

interface GuestListProps {
  rsvps: RsvpWithUser[];
  currentUserId: string;
}

export function GuestList({ rsvps, currentUserId }: GuestListProps) {
  // Filter to only accepted RSVPs with names, excluding the current user
  const acceptedGuests = rsvps.filter(
    (rsvp) =>
      rsvp.status === "accepted" &&
      rsvp.user_name !== null &&
      rsvp.user_name !== undefined &&
      rsvp.user_id !== currentUserId
  );

  if (acceptedGuests.length === 0) {
    return (
      <div className="p-4 bg-white/5 rounded border border-white/10">
        <h3 className="text-xl mb-4">Guests</h3>
        <p className="text-sm opacity-80">No guests have accepted yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white/5 rounded border border-white/10">
      <h3 className="text-xl mb-4">Guests</h3>
      <ul className="space-y-2">
        {acceptedGuests.map((rsvp) => (
          <li key={rsvp.rsvp_id} className="text-base">
            {rsvp.user_name}
          </li>
        ))}
      </ul>
    </div>
  );
}
