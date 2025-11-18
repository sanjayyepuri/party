'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { RSVPFormData, RSVPContextValue, ValidationState, ValidationError, CreateGuestRequest } from './types';
import { guestApi, ApiError } from './api-client';
import { useParty } from './PartyProvider';

const RSVPContext = createContext<RSVPContextValue | undefined>(undefined);

interface RSVPProviderProps {
  children: ReactNode;
}

const initialFormData: RSVPFormData = {
  phone: '',
  name: '',
  rsvpStatus: 'accepted',
  plusOnes: [],
  dietaryRestrictions: '',
  specialRequests: '',
};

const initialValidation: ValidationState = {
  isValid: false,
  errors: [],
};

export function RSVPProvider({ children }: RSVPProviderProps) {
  const { party } = useParty();
  const [formData, setFormData] = useState<RSVPFormData>(initialFormData);
  const [validation, setValidation] = useState<ValidationState>(initialValidation);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateField = useCallback((field: keyof RSVPFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors for this field
    setValidation(prev => ({
      ...prev,
      errors: prev.errors.filter(error => error.field !== field),
    }));
    
    // Clear submit error when user makes changes
    setSubmitError(null);
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: ValidationError[] = [];

    // Phone number validation
    if (!formData.phone.trim()) {
      errors.push({ field: 'phone', message: 'Phone number is required' });
    } else {
      // Basic phone number format validation
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        errors.push({ field: 'phone', message: 'Please enter a valid phone number' });
      }
    }

    // Name validation
    if (!formData.name.trim()) {
      errors.push({ field: 'name', message: 'Name is required' });
    } else if (formData.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
    }

    // Plus-ones validation
    formData.plusOnes.forEach((plusOne, index) => {
      if (!plusOne.name.trim()) {
        errors.push({ field: `plusOne-${index}-name`, message: `Plus-one ${index + 1} name is required` });
      }
    });

    const isValid = errors.length === 0;
    setValidation({ isValid, errors });
    
    return isValid;
  }, [formData]);

  const submitRSVP = useCallback(async (): Promise<boolean> => {
    if (!party) {
      setSubmitError('Party information not available');
      return false;
    }

    // Validate form before submission
    if (!validateForm()) {
      return false;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const request: CreateGuestRequest = {
        partyId: party.id,
        phone: formData.phone.trim(),
        name: formData.name.trim(),
        rsvpStatus: formData.rsvpStatus,
        plusOnes: formData.plusOnes.map(plusOne => ({
          name: plusOne.name.trim(),
          dietaryRestrictions: plusOne.dietaryRestrictions?.trim() || undefined,
        })),
        dietaryRestrictions: formData.dietaryRestrictions.trim() || undefined,
        specialRequests: formData.specialRequests.trim() || undefined,
      };

      await guestApi.createGuest(request);
      return true;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to submit RSVP. Please try again.';
      setSubmitError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [party, formData, validateForm]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setValidation(initialValidation);
    setSubmitError(null);
  }, []);

  const value: RSVPContextValue = {
    formData,
    validation,
    isSubmitting,
    submitError,
    updateField,
    validateForm,
    submitRSVP,
    resetForm,
  };

  return (
    <RSVPContext.Provider value={value}>
      {children}
    </RSVPContext.Provider>
  );
}

export function useRSVP(): RSVPContextValue {
  const context = useContext(RSVPContext);
  if (context === undefined) {
    throw new Error('useRSVP must be used within an RSVPProvider');
  }
  return context;
}