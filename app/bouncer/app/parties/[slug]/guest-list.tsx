"use client";
import { useState } from "react";
import type { RsvpWithUser } from "@/lib/types";

interface GuestListProps {
  rsvps: RsvpWithUser[];
  currentUserId: string;
}

export function GuestList({ rsvps, currentUserId }: GuestListProps) {
  const [activeTab, setActiveTab] = useState<"accepted" | "pending">(
    "accepted"
  );

  const goingGuests = rsvps.filter(
    (rsvp) =>
      rsvp.status === "accepted" &&
      rsvp.user_name !== null &&
      rsvp.user_name !== undefined &&
      rsvp.user_id !== currentUserId
  );

  const maybeGuests = rsvps.filter(
    (rsvp) =>
      rsvp.status === "pending" &&
      rsvp.user_name !== null &&
      rsvp.user_name !== undefined &&
      rsvp.user_id !== currentUserId
  );

  const activeGuests = activeTab === "accepted" ? goingGuests : maybeGuests;

  const tabClass = (tab: "accepted" | "pending") =>
    activeTab === tab
      ? "px-4 py-2 text-sm font-medium border-b-2 border-black/70 text-black/90"
      : "px-4 py-2 text-sm font-medium border-b-2 border-transparent text-black/40 hover:text-black/60 transition-colors";

  return (
    <div className="p-4 bg-white/5 rounded border border-white/10">
      <h3 className="text-xl mb-4">Guests</h3>
      <div className="flex gap-1 mb-4 border-b border-black/10">
        <button
          onClick={() => setActiveTab("accepted")}
          className={tabClass("accepted")}
        >
          Going ({goingGuests.length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={tabClass("pending")}
        >
          Maybe ({maybeGuests.length})
        </button>
      </div>
      {activeGuests.length === 0 ? (
        <p className="text-sm opacity-60">
          {activeTab === "accepted"
            ? "No guests have accepted yet."
            : "No guests have responded with maybe yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {activeGuests.map((rsvp) => (
            <li key={rsvp.rsvp_id} className="text-base">
              {rsvp.user_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
