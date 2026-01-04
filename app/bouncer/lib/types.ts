/**
 * Type definitions for Party and RSVP entities
 * These match the backend models defined in app/pregame/src/model.rs
 */

export interface Party {
  party_id: string;
  name: string;
  time: string; // ISO 8601 datetime string
  location: string;
  description: string;
  slug: string;
  created_at: string; // ISO 8601 datetime string
  updated_at: string; // ISO 8601 datetime string
  deleted_at: string | null; // ISO 8601 datetime string or null
}

export interface Rsvp {
  rsvp_id: string;
  party_id: string;
  user_id: string;
  status: string;
  created_at: string; // ISO 8601 datetime string
  updated_at: string; // ISO 8601 datetime string
  deleted_at: string | null; // ISO 8601 datetime string or null
}

export interface UpdateRsvpRequest {
  rsvp_id: string;
  status: string;
}
