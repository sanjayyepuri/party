import Link from "next/link";
import type { Party, RsvpWithUser } from "@/lib/types";
import { RsvpForm } from "./rsvp-form";
import { GuestList } from "./guest-list";

interface PartyDetailWrapperProps {
  party: Party;
  partyRsvps: RsvpWithUser[] | null;
  partyRsvpsError: string | null;
  currentUserId: string;
}

export function PartyDetailWrapper({
  party,
  partyRsvps,
  partyRsvpsError,
  currentUserId,
}: PartyDetailWrapperProps) {
  const partyDate = new Date(party.time);
  const formattedDate = partyDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = partyDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="relative bg-white/90 backdrop-blur-sm rounded-lg p-8 border-2 border-black/10 shadow-[0_4px_6px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] overflow-hidden">
      {/* Inner shadow for depth */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/40 to-transparent pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-10">
        <div className="mb-6">
          <Link
            href="/invitations"
            className="text-sm opacity-80 hover:opacity-100 transition-opacity inline-block mb-4"
          >
            ← Back to invitations
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl mb-4 text-black/90">{party.name}</h1>
          <div className="space-y-2 text-lg text-black/70">
            <p>
              <strong>When:</strong> {formattedDate} at {formattedTime}
            </p>
            <p>
              <strong>Where:</strong> {party.location}
            </p>
          </div>
        </div>

        {party.description && (
          <div className="mb-8 p-4 bg-white/50 rounded border border-black/5">
            <p className="whitespace-pre-wrap text-black/80">
              {party.description}
            </p>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl mb-4 text-black/90">RSVP</h2>
          <RsvpForm partyId={party.party_id} />
        </div>

        <div className="mb-8">
          {partyRsvpsError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">
              <p className="font-medium">Error loading guest list</p>
              <p className="text-sm">{partyRsvpsError}</p>
            </div>
          )}
          {!partyRsvpsError && partyRsvps && (
            <GuestList rsvps={partyRsvps} currentUserId={currentUserId} />
          )}
          {!partyRsvpsError && !partyRsvps && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded text-gray-600">
              <p>Loading guest list...</p>
            </div>
          )}
        </div>
      </div>

      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/60 to-transparent rounded-bl-full pointer-events-none" />
    </div>
  );
}
