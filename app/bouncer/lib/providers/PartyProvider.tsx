'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Party, PartyContextValue } from './types';
import { partyApi, ApiError } from './api-client';

const PartyContext = createContext<PartyContextValue | undefined>(undefined);

interface PartyProviderProps {
  children: ReactNode;
}

export function PartyProvider({ children }: PartyProviderProps) {
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateCode = useCallback(async (code: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const isValid = await partyApi.validateCode(code);
      return isValid;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to validate code';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchParty = useCallback(async (code?: string): Promise<void> => {
    if (!code && !party?.code) {
      setError('No party code provided');
      return;
    }

    const partyCode = code || party?.code;
    if (!partyCode) {
      setError('No party code available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const partyData = await partyApi.getPartyByCode(partyCode);
      setParty(partyData);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to fetch party details';
      setError(errorMessage);
      setParty(null);
    } finally {
      setLoading(false);
    }
  }, [party?.code]);

  const value: PartyContextValue = {
    party,
    loading,
    error,
    validateCode,
    fetchParty,
  };

  return (
    <PartyContext.Provider value={value}>
      {children}
    </PartyContext.Provider>
  );
}

export function useParty(): PartyContextValue {
  const context = useContext(PartyContext);
  if (context === undefined) {
    throw new Error('useParty must be used within a PartyProvider');
  }
  return context;
}