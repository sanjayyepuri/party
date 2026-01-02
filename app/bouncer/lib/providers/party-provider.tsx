"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { partyApi, Party, ApiError } from "../api-client";

interface PartyContextValue {
  parties: Party[];
  loading: boolean;
  error: string | null;
  fetchParties: () => Promise<void>;
  getParty: (partyId: string) => Party | undefined;
  refreshParties: () => Promise<void>;
}

const PartyContext = createContext<PartyContextValue | undefined>(undefined);

export function PartyProvider({ children }: { children: React.ReactNode }) {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await partyApi.listParties();
      setParties(data);
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : "Failed to fetch parties. Please try again.";
      setError(errorMessage);
      console.error("Error fetching parties:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshParties = useCallback(async () => {
    await fetchParties();
  }, [fetchParties]);

  const getParty = useCallback(
    (partyId: string) => {
      return parties.find((p) => p.party_id === partyId);
    },
    [parties]
  );

  // Fetch parties on mount
  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  const value: PartyContextValue = {
    parties,
    loading,
    error,
    fetchParties,
    getParty,
    refreshParties,
  };

  return (
    <PartyContext.Provider value={value}>{children}</PartyContext.Provider>
  );
}

export function useParty() {
  const context = useContext(PartyContext);
  if (context === undefined) {
    throw new Error("useParty must be used within a PartyProvider");
  }
  return context;
}
