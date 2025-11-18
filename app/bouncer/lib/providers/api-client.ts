// API client for guest-facing invitation system
// Communicates with the Rust gRPC backend

import {
  Party,
  Guest,
  CreateGuestRequest,
  CreateGuestResponse,
  PartyByCodeResponse,
  GuestByPhoneResponse,
  ApiResponse
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const USE_MOCK_API = process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_USE_REAL_API;

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (USE_MOCK_API) {
    return mockApiRequest<T>(endpoint, options);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(response.status, errorText || response.statusText);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    return await response.json() as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Mock API for development
async function mockApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));

  const mockParty: Party = {
    id: 'party-1',
    title: 'Sweater Weather',
    description: 'Join us for an evening of great food, drinks, and company on the rooftop terrace.',
    date: '2024-08-15T19:00:00Z',
    location: '123 Main Street, Rooftop Terrace, San Francisco, CA 94105',
    code: 'SUNSET24',
    createdAt: '2024-07-01T10:00:00Z',
    updatedAt: '2024-07-01T10:00:00Z',
  };

  const mockGuest: Guest = {
    id: 'guest-1',
    partyId: 'party-1',
    phone: '+15551234567',
    name: 'Sarah Johnson',
    rsvpStatus: 'accepted',
    plusOnes: [{ name: 'Jake Smith', dietaryRestrictions: 'Vegetarian' }],
    dietaryRestrictions: '',
    specialRequests: '',
    rsvpAt: '2024-07-05T14:30:00Z',
    createdAt: '2024-07-05T14:30:00Z',
    updatedAt: '2024-07-05T14:30:00Z',
  };

  if (endpoint.includes('/parties/') && endpoint.includes('/code/')) {
    const code = endpoint.split('/').pop();
    if (code === 'SUNSET24') {
      return { party: mockParty } as T;
    } else {
      throw new ApiError(404, 'Party not found');
    }
  }

  if (endpoint.includes('/guests/phone/')) {
    const phone = decodeURIComponent(endpoint.split('/').pop() || '');
    if (phone === '+15551234567') {
      return { guest: mockGuest } as T;
    } else {
      throw new ApiError(404, 'Guest not found');
    }
  }

  if (endpoint === '/api/guests' && options.method === 'POST') {
    return {
      guest: {
        ...mockGuest,
        id: 'guest-' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    } as T;
  }

  throw new ApiError(404, 'Mock endpoint not implemented');
}

// Party API
export const partyApi = {
  async getPartyByCode(code: string): Promise<Party> {
    const response = await apiRequest<PartyByCodeResponse>(`/api/parties/code/${encodeURIComponent(code)}`);
    return response.party;
  },

  async validateCode(code: string): Promise<boolean> {
    try {
      await this.getPartyByCode(code);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return false;
      }
      throw error;
    }
  },
};

// Guest API
export const guestApi = {
  async getGuestByPhone(phone: string): Promise<Guest | null> {
    try {
      const response = await apiRequest<GuestByPhoneResponse>(`/api/guests/phone/${encodeURIComponent(phone)}`);
      return response.guest;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async createGuest(request: CreateGuestRequest): Promise<Guest> {
    const response = await apiRequest<CreateGuestResponse>('/api/guests', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.guest;
  },

  async checkReturningGuest(phone: string): Promise<boolean> {
    const guest = await this.getGuestByPhone(phone);
    return guest !== null;
  },
};

export { ApiError };
