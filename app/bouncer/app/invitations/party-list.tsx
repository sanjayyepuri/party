"use client";

import { useParty } from "@/lib/providers/party-provider";
import { useRSVP } from "@/lib/providers/rsvp-provider";
import { useEffect, useState } from "react";
import { RsvpStatus } from "@/lib/providers/rsvp-provider";

export function PartyList() {
  const { parties, loading: partiesLoading, error: partiesError } = useParty();
  const {
    getRsvpForParty,
    getRsvp,
    updateRsvp,
    isSubmitting,
    error: rsvpError,
  } = useRSVP();
  const [loadingRsvps, setLoadingRsvps] = useState<Set<string>>(new Set());

  // Load RSVPs for all parties on mount
  useEffect(() => {
    const loadRsvps = async () => {
      for (const party of parties) {
        // Only fetch if we don't already have the RSVP
        if (!getRsvpForParty(party.party_id)) {
          setLoadingRsvps((prev) => new Set(prev).add(party.party_id));
          try {
            await getRsvp(party.party_id);
          } catch (err) {
            // Ignore errors - RSVP might not exist yet
            console.error(`Failed to load RSVP for party ${party.party_id}:`, err);
          } finally {
            setLoadingRsvps((prev) => {
              const next = new Set(prev);
              next.delete(party.party_id);
              return next;
            });
          }
        }
      }
    };

    if (parties.length > 0) {
      loadRsvps();
    }
  }, [parties, getRsvp, getRsvpForParty]);

  const handleRsvpUpdate = async (partyId: string, status: RsvpStatus) => {
    try {
      await updateRsvp(partyId, status);
    } catch (err) {
      console.error("Failed to update RSVP:", err);
      // Error is already set in the context
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (partiesLoading) {
    return (
      <div className="text-lg opacity-60">loading your invitations...</div>
    );
  }

  if (partiesError) {
    return (
      <div className="text-red-500">
        <p>Error loading parties: {partiesError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 underline"
        >
          try again
        </button>
      </div>
    );
  }

  if (parties.length === 0) {
    return (
      <div className="text-lg opacity-60">
        no invitations yet. check back soon!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rsvpError && (
        <div className="text-red-500 text-sm mb-4">
          {rsvpError}
        </div>
      )}
      {parties.map((party) => {
        const rsvp = getRsvpForParty(party.party_id);
        const isLoadingRsvp = loadingRsvps.has(party.party_id);
        const currentStatus = rsvp?.status as RsvpStatus | undefined;

        return (
          <div
            key={party.party_id}
            className="border-t border-white/20 pt-6 first:border-t-0 first:pt-0"
          >
            <div className="mb-4">
              <h3 className="text-2xl mb-2">{party.name}</h3>
              <p className="text-sm opacity-80 mb-2">
                {formatDate(party.time)}
              </p>
              <p className="text-sm opacity-80 mb-4">{party.location}</p>
              {party.description && (
                <p className="text-base opacity-90 mb-4">
                  {party.description}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {isLoadingRsvp ? (
                <div className="text-sm opacity-60">loading rsvp...</div>
              ) : (
                <>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleRsvpUpdate(party.party_id, "accepted")}
                      disabled={isSubmitting}
                      className={`px-4 py-2 text-sm border transition-all ${
                        currentStatus === "accepted"
                          ? "bg-white text-black border-white"
                          : "border-white/40 hover:border-white/60"
                      } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {currentStatus === "accepted" ? "✓ going" : "going"}
                    </button>
                    <button
                      onClick={() => handleRsvpUpdate(party.party_id, "maybe")}
                      disabled={isSubmitting}
                      className={`px-4 py-2 text-sm border transition-all ${
                        currentStatus === "maybe"
                          ? "bg-white text-black border-white"
                          : "border-white/40 hover:border-white/60"
                      } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {currentStatus === "maybe" ? "✓ maybe" : "maybe"}
                    </button>
                    <button
                      onClick={() => handleRsvpUpdate(party.party_id, "declined")}
                      disabled={isSubmitting}
                      className={`px-4 py-2 text-sm border transition-all ${
                        currentStatus === "declined"
                          ? "bg-white text-black border-white"
                          : "border-white/40 hover:border-white/60"
                      } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {currentStatus === "declined" ? "✓ can't go" : "can't go"}
                    </button>
                  </div>
                  {currentStatus && (
                    <p className="text-xs opacity-60 mt-1">
                      current status: {currentStatus}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
