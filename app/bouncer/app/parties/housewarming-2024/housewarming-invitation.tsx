"use client";

import Link from "next/link";
import type { Party, Rsvp, RsvpWithUser } from "@/lib/types";
import { RsvpForm } from "../[slug]/rsvp-form";
import { GuestList } from "../[slug]/guest-list";
import { ReceiptCanvas } from "@/lib/webgl/receipt-canvas";

interface HousewarmingInvitationProps {
  party: Party;
  rsvp: Rsvp | null;
  rsvpError: string | null;
  partyRsvps: RsvpWithUser[] | null;
  partyRsvpsError: string | null;
  currentUserId: string;
}

export function HousewarmingInvitation({
  party,
  rsvp,
  rsvpError,
  partyRsvps,
  partyRsvpsError,
  currentUserId,
}: HousewarmingInvitationProps) {
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
    <div className="relative min-h-screen overflow-hidden">
      {/* Receipt canvas background */}
      <div className="fixed inset-0 w-full h-full z-0">
        <ReceiptCanvas className="w-full h-full" pixelSize={8.0} />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back link */}
          <div className="mb-6">
            <Link
              href="/invitations"
              className="text-black/90 hover:text-black transition-opacity text-sm inline-flex items-center gap-2 backdrop-blur-sm bg-black/30 px-4 py-2 rounded-lg"
            >
              ← Back to invitations
            </Link>
          </div>

          {/* Party details card */}
          <div className="mb-8 backdrop-blur-md bg-black/60 rounded-2xl p-8 border border-white/30">
            <h1 className="text-5xl font-bold mb-6 text-black">{party.name}</h1>
            <div className="space-y-3 text-lg text-black/90">
              <p>
                <strong className="text-black">When:</strong> {formattedDate} at{" "}
                {formattedTime}
              </p>
              <p>
                <strong className="text-black">Where:</strong> {party.location}
              </p>
            </div>

            {party.description && (
              <div className="mt-6 p-4 bg-black/40 rounded-lg border border-white/20">
                <p className="whitespace-pre-wrap text-black">
                  {party.description}
                </p>
              </div>
            )}
          </div>

          {/* RSVP section */}
          <div className="mb-8 backdrop-blur-md bg-black/60 rounded-2xl p-8 border border-white/30">
            <h2 className="text-3xl font-bold mb-6 text-black">RSVP</h2>
            {rsvpError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
                <p className="font-medium">Error loading RSVP</p>
                <p className="text-sm">{rsvpError}</p>
              </div>
            )}
            {!rsvpError && rsvp && <RsvpForm initialRsvp={rsvp} />}
            {!rsvpError && !rsvp && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded text-gray-600">
                <p>Loading RSVP...</p>
              </div>
            )}
          </div>

          {/* Guest list section */}
          <div className="mb-8 backdrop-blur-md bg-black/60 rounded-2xl p-8 border border-white/30">
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
      </div>
    </div>
  );
}
