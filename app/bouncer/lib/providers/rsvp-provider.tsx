"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { rsvpApi, Rsvp, ApiError } from "../api-client";

export type RsvpStatus = "pending" | "accepted" | "declined" | "maybe";

interface RsvpContextValue {
  rsvps: Map<string, Rsvp>; // Map of party_id -> Rsvp
  loading: boolean;
  error: string | null;
  getRsvp: (partyId: string) => Promise<Rsvp | null>;
  updateRsvp: (partyId: string, status: RsvpStatus) => Promise<void>;
  deleteRsvp: (partyId: string) => Promise<void>;
  getRsvpForParty: (partyId: string) => Rsvp | undefined;
  isSubmitting: boolean;
}

const RsvpContext = createContext<RsvpContextValue | undefined>(undefined);

export function RsvpProvider({ children }: { children: React.ReactNode }) {
  const [rsvps, setRsvps] = useState<Map<string, Rsvp>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRsvp = useCallback(async (partyId: string): Promise<Rsvp | null> => {
    setLoading(true);
    setError(null);
    try {
      const rsvp = await rsvpApi.getRsvp(partyId);
      setRsvps((prev) => {
        const next = new Map(prev);
        next.set(partyId, rsvp);
        return next;
      });
      return rsvp;
    } catch (err) {
      // If it's a 404, the RSVP doesn't exist yet - that's okay, don't set error
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      
      // For other errors, set error state
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : "Failed to fetch RSVP. Please try again.";
      setError(errorMessage);
      console.error("Error fetching RSVP:", err);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRsvp = useCallback(
    async (partyId: string, status: RsvpStatus) => {
      setIsSubmitting(true);
      setError(null);
      
      try {
        // First, get the current RSVP to get the rsvp_id
        let rsvp = rsvps.get(partyId);
        if (!rsvp) {
          // If no RSVP exists, create one first
          rsvp = await getRsvp(partyId);
          if (!rsvp) {
            throw new Error("Failed to create RSVP");
          }
        }

        // Update the RSVP
        const updated = await rsvpApi.updateRsvp({
          rsvp_id: rsvp.rsvp_id,
          status,
        });

        setRsvps((prev) => {
          const next = new Map(prev);
          next.set(partyId, updated);
          return next;
        });
      } catch (err) {
        const errorMessage =
          err instanceof ApiError
            ? err.message
            : "Failed to update RSVP. Please try again.";
        setError(errorMessage);
        console.error("Error updating RSVP:", err);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [rsvps, getRsvp]
  );

  const deleteRsvp = useCallback(async (partyId: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await rsvpApi.deleteRsvp(partyId);
      setRsvps((prev) => {
        const next = new Map(prev);
        next.delete(partyId);
        return next;
      });
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : "Failed to delete RSVP. Please try again.";
      setError(errorMessage);
      console.error("Error deleting RSVP:", err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const getRsvpForParty = useCallback(
    (partyId: string) => {
      return rsvps.get(partyId);
    },
    [rsvps]
  );

  const value: RsvpContextValue = {
    rsvps,
    loading,
    error,
    getRsvp,
    updateRsvp,
    deleteRsvp,
    getRsvpForParty,
    isSubmitting,
  };

  return (
    <RsvpContext.Provider value={value}>{children}</RsvpContext.Provider>
  );
}

export function useRSVP() {
  const context = useContext(RsvpContext);
  if (context === undefined) {
    throw new Error("useRSVP must be used within a RsvpProvider");
  }
  return context;
}
