"use client";

import Link from "next/link";
import type { Party, RsvpWithUser } from "@/lib/types";
import { RsvpForm } from "../[slug]/rsvp-form";
import { GuestList } from "../[slug]/guest-list";
import { InvitationShaderCanvas } from "@/lib/webgl/invitation-shader-canvas";

interface HousewarmingInvitationProps {
  party: Party;
  partyRsvps: RsvpWithUser[] | null;
  partyRsvpsError: string | null;
  currentUserId: string;
}

export function HousewarmingInvitation({
  party,
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
      {/* Invitation shader background */}
      <div className="fixed inset-0 w-full h-full z-0">
        <InvitationShaderCanvas className="w-full h-full" speed={1.0} brightness={0.4} />
      </div>

      {/* Darkening overlay for better text readability */}
      <div className="fixed inset-0 w-full h-full z-[1] bg-neutral-950/40" />

      {/* Content overlay */}
      <div className="relative z-10 min-h-screen">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-8 max-w-4xl">
          {/* Back link */}
          <div className="mb-6">
            <Link
              href="/invitations"
              className="transition-opacity text-sm tracking-wide inline-flex items-center gap-2 backdrop-blur-sm px-4 py-2 rounded-lg"
              style={{ color: '#faf9f6', backgroundColor: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(250, 249, 246, 0.3)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#faf9f6'}
            >
              ← Back to invitations
            </Link>
          </div>

          {/* Party details card */}
          <div className="mb-4 md:mb-8 backdrop-blur-md rounded-2xl p-4 md:p-8" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', border: '1px solid rgba(250, 249, 246, 0.3)' }}>
            <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold mb-6 md:mb-8 tracking-tight leading-tight" style={{ color: '#faf9f6' }}>
              {party.name}
            </h1>
            <div className="space-y-3 md:space-y-4 text-base md:text-lg leading-relaxed tracking-normal" style={{ color: '#faf9f6' }}>
              <p>
                <strong className="font-semibold" style={{ color: '#ffffff' }}>When:</strong> {formattedDate} at{" "}
                {formattedTime}
              </p>
              <p>
                <strong className="font-semibold" style={{ color: '#ffffff' }}>Where:</strong> {party.location}
              </p>
            </div>

            {party.description && (
              <div className="mt-6 md:mt-8 p-4 md:p-5 rounded-lg" style={{ border: '1px solid rgba(250, 249, 246, 0.2)', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed tracking-normal" style={{ color: '#faf9f6' }}>
                  {party.description}
                </p>
              </div>
            )}
          </div>

          {/* RSVP section */}
          <div className="mb-4 md:mb-8 backdrop-blur-md rounded-2xl p-4 md:p-8" style={{ color: '#faf9f6', backgroundColor: 'rgba(0, 0, 0, 0.7)', border: '1px solid rgba(250, 249, 246, 0.3)' }}>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 tracking-tight">
              RSVP
            </h2>
            <RsvpForm partyId={party.party_id} />
          </div>

          {/* Guest list section */}
          <div className="mb-4 md:mb-8 backdrop-blur-md rounded-2xl p-4 md:p-8" style={{ color: '#faf9f6', backgroundColor: 'rgba(0, 0, 0, 0.7)', border: '1px solid rgba(250, 249, 246, 0.3)' }}>
            {partyRsvpsError && (
              <div className="p-4 bg-red-950/40 border border-red-800/40 rounded text-red-200/90">
                <p className="font-medium tracking-normal">Error loading guest list</p>
                <p className="text-sm text-red-200/80 tracking-normal">{partyRsvpsError}</p>
              </div>
            )}
            {!partyRsvpsError && partyRsvps && (
              <GuestList rsvps={partyRsvps} currentUserId={currentUserId} />
            )}
            {!partyRsvpsError && !partyRsvps && (
              <div className="p-4 rounded tracking-normal" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(250, 249, 246, 0.2)' }}>
                <p>Loading guest list...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
