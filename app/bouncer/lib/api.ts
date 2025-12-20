// API client for the bouncer backend

export interface Guest {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface Party {
  id: number;
  name: string;
  description: string;
  address: string;
}

export enum RsvpStatus {
  Pending = "Pending",
  Accepted = "Accepted",
  Maybe = "Maybe",
  Declined = "Declined",
}

export interface Rsvp {
  id: number;
  party_id: number;
  guest_id: number;
  status: RsvpStatus;
}

export interface RsvpWithGuestName {
  id: number;
  party_id: number;
  guest_id: number;
  status: RsvpStatus;
  guest_name: string;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = "/api/bouncer";
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      credentials: "include", // Include cookies for authentication
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Guest endpoints
  async getGuest(id: number): Promise<Guest> {
    return this.request<Guest>(`/guests/${id}`);
  }

  async updateGuest(guest: Guest): Promise<void> {
    await this.request(`/guests/${guest.id}`, {
      method: "PUT",
      body: JSON.stringify(guest),
    });
  }

  // Party endpoints
  async getParty(id: number): Promise<Party> {
    return this.request<Party>(`/parties/${id}`);
  }

  async getPartyRsvps(partyId: number): Promise<RsvpWithGuestName[]> {
    return this.request<RsvpWithGuestName[]>(`/parties/${partyId}/rsvps`);
  }

  // RSVP endpoints
  async getRsvp(id: number): Promise<Rsvp> {
    return this.request<Rsvp>(`/rsvps/${id}`);
  }

  async getRsvpByGuestParty(
    guestId: number,
    partyId: number
  ): Promise<Rsvp> {
    return this.request<Rsvp>(`/rsvps/guest/${guestId}/party/${partyId}`);
  }

  async updateRsvp(id: number, status: RsvpStatus): Promise<Rsvp> {
    return this.request<Rsvp>(`/rsvps/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }
}

export const api = new ApiClient();
