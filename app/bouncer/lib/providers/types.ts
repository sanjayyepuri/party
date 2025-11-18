// Core data types for the party invitation system

export interface Party {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date string
  location: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlusOne {
  name: string;
  dietaryRestrictions?: string;
}

export interface Guest {
  id: string;
  partyId: string;
  phone: string;
  name: string;
  rsvpStatus: 'pending' | 'accepted' | 'declined';
  plusOnes: PlusOne[];
  dietaryRestrictions?: string;
  specialRequests?: string;
  rsvpAt?: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

export interface RSVPFormData {
  phone: string;
  name: string;
  rsvpStatus: 'accepted' | 'declined';
  plusOnes: PlusOne[];
  dietaryRestrictions: string;
  specialRequests: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationState {
  isValid: boolean;
  errors: ValidationError[];
}

// Provider context types

export interface PartyContextValue {
  party: Party | null;
  loading: boolean;
  error: string | null;
  validateCode: (code: string) => Promise<boolean>;
  fetchParty: (code?: string) => Promise<void>;
}

export interface GuestContextValue {
  guest: Guest | null;
  isReturningGuest: boolean;
  loading: boolean;
  error: string | null;
  setGuestInfo: (info: Partial<RSVPFormData>) => void;
  addPlusOne: (plusOne: PlusOne) => void;
  removePlusOne: (index: number) => void;
  checkReturningGuest: (phone: string) => Promise<boolean>;
}

export interface RSVPContextValue {
  formData: RSVPFormData;
  validation: ValidationState;
  isSubmitting: boolean;
  submitError: string | null;
  updateField: (field: keyof RSVPFormData, value: any) => void;
  validateForm: () => boolean;
  submitRSVP: () => Promise<boolean>;
  resetForm: () => void;
}

// API response types

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PartyByCodeResponse {
  party: Party;
}

export interface GuestByPhoneResponse {
  guest: Guest;
}

export interface CreateGuestRequest {
  partyId: string;
  phone: string;
  name: string;
  rsvpStatus: 'accepted' | 'declined';
  plusOnes: PlusOne[];
  dietaryRestrictions?: string;
  specialRequests?: string;
}

export interface CreateGuestResponse {
  guest: Guest;
}

// Flow state types

export type InvitationStep = 
  | 'landing'
  | 'code-entry'
  | 'party-preview'
  | 'rsvp-form'
  | 'confirmation'
  | 'full-invitation'
  | 'returning-guest'
  | 'error';

export interface FlowState {
  currentStep: InvitationStep;
  hasValidCode: boolean;
  isReturningGuest: boolean;
  canProceed: boolean;
}