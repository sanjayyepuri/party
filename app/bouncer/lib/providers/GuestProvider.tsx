'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Guest, GuestContextValue, RSVPFormData, PlusOne } from './types';
import { guestApi, ApiError } from './api-client';

const GuestContext = createContext<GuestContextValue | undefined>(undefined);

interface GuestProviderProps {
  children: ReactNode;
}

export function GuestProvider({ children }: GuestProviderProps) {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [isReturningGuest, setIsReturningGuest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setGuestInfo = useCallback((info: Partial<RSVPFormData>) => {
    if (!guest) return;

    setGuest(prevGuest => {
      if (!prevGuest) return null;
      
      return {
        ...prevGuest,
        name: info.name ?? prevGuest.name,
        phone: info.phone ?? prevGuest.phone,
        rsvpStatus: info.rsvpStatus ?? prevGuest.rsvpStatus,
        dietaryRestrictions: info.dietaryRestrictions ?? prevGuest.dietaryRestrictions,
        specialRequests: info.specialRequests ?? prevGuest.specialRequests,
        plusOnes: info.plusOnes ?? prevGuest.plusOnes,
        updatedAt: new Date().toISOString(),
      };
    });
  }, [guest]);

  const addPlusOne = useCallback((plusOne: PlusOne) => {
    if (!guest) return;

    setGuest(prevGuest => {
      if (!prevGuest) return null;
      
      return {
        ...prevGuest,
        plusOnes: [...prevGuest.plusOnes, plusOne],
        updatedAt: new Date().toISOString(),
      };
    });
  }, [guest]);

  const removePlusOne = useCallback((index: number) => {
    if (!guest) return;

    setGuest(prevGuest => {
      if (!prevGuest) return null;
      
      const newPlusOnes = [...prevGuest.plusOnes];
      newPlusOnes.splice(index, 1);
      
      return {
        ...prevGuest,
        plusOnes: newPlusOnes,
        updatedAt: new Date().toISOString(),
      };
    });
  }, [guest]);

  const checkReturningGuest = useCallback(async (phone: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const existingGuest = await guestApi.getGuestByPhone(phone);
      
      if (existingGuest) {
        setGuest(existingGuest);
        setIsReturningGuest(true);
        return true;
      } else {
        setIsReturningGuest(false);
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to check guest status';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const value: GuestContextValue = {
    guest,
    isReturningGuest,
    loading,
    error,
    setGuestInfo,
    addPlusOne,
    removePlusOne,
    checkReturningGuest,
  };

  return (
    <GuestContext.Provider value={value}>
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest(): GuestContextValue {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error('useGuest must be used within a GuestProvider');
  }
  return context;
}