---
author: Sanjay Yepuri
state: Draft
discussion: TBD
---

# Calendar Feed

## Problem

Users need a reliable way to track party events in their personal calendar app (Apple Calendar, Google Calendar, Outlook) without manual per-event entry. The platform currently exposes party and RSVP state in the web app, but does not provide a subscribable calendar feed format.

## Requirements

### Functional Requirements

- Provide a subscribable iCalendar (`.ics`) feed URL.
- Feed access must be user-scoped and secured with a secret token.
- Users must be able to rotate the secret token and invalidate the old link immediately.
- Feed should include all upcoming visible parties in current schema.
- Provide an authenticated, per-party `.ics` download for one-click imports.
- Events should include title, time, location, description, RSVP state, and deep link back to invitation page.
- Event duration defaults to 3 hours because schema currently stores start time only.

### Non-Functional Requirements

- Avoid reimplementing RFC5545 serialization details.
- Keep feed endpoint lightweight and cache-friendly for periodic calendar client polling.
- Ensure token lookup and event fetch queries are indexed and bounded to upcoming events.

## Architecture

The calendar feature extends the existing Axum API under `/api/bouncer` with:

- Authenticated token management endpoints:
  - `GET /calendar/feed-token`
  - `POST /calendar/feed-token/rotate`
- Authenticated invitation download endpoint:
  - `GET /parties/{party_id}/calendar.ics`
- Public feed endpoint:
  - `GET /calendar/feed.ics?token=<secret>`

High-level flow:

1. Authenticated user requests/rotates feed token.
2. Frontend stores only returned path and composes absolute URL from browser origin.
3. Calendar app polls `.ics` endpoint with token.
4. Backend validates token, fetches upcoming parties plus user RSVP status, emits ICS document.
5. On an invitation, the browser can download a single-event `.ics` document
   using the user's existing session.

## API Contracts

### Authenticated: Get Feed Token

- Method: `GET`
- Path: `/api/bouncer/calendar/feed-token`
- Auth: Better Auth session required
- Response:

```json
{
  "feed_path": "/api/bouncer/calendar/feed.ics?token=<secret>"
}
```

Behavior:

- Creates a token if missing for current user.
- Returns existing token path if already present.

### Authenticated: Rotate Feed Token

- Method: `POST`
- Path: `/api/bouncer/calendar/feed-token/rotate`
- Auth: Better Auth session required
- Response:

```json
{
  "feed_path": "/api/bouncer/calendar/feed.ics?token=<new-secret>"
}
```

Behavior:

- Replaces existing token for current user atomically.
- Old token becomes invalid immediately.

### Authenticated: Download Invitation

- Method: `GET`
- Path: `/api/bouncer/parties/{party_id}/calendar.ics`
- Auth: Better Auth session required
- Success:
  - `200 OK`
  - `Content-Type: text/calendar; charset=utf-8`
  - `Content-Disposition: attachment`
  - `Cache-Control: private, no-store`
  - Body: RFC5545 calendar document containing one event
- Failure:
  - `401 Unauthorized` when the session is missing or expired
  - `404 Not Found` when the party does not exist
  - `500 Internal Server Error` for internal failures

Behavior:

- Uses `METHOD:PUBLISH` so calendar clients import one event rather than offer
  to create a subscribed calendar.
- Uses the same event UID as the subscription feed to support deduplication.

### Public: Calendar Feed

- Method: `GET`
- Path: `/api/bouncer/calendar/feed.ics`
- Query: `token` (required)
- Auth: none (token-based)
- Success:
  - `200 OK`
  - `Content-Type: text/calendar; charset=utf-8`
  - Body: RFC5545 calendar document
- Failure:
  - `404 Not Found` for missing/invalid token
  - `500 Internal Server Error` for internal failures

## Data Model

Add new table:

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| user_id     | text      | Better Auth user id (PK, FK to `user.id`) |
| token       | text      | Unique secret token used for feed access |
| created_at  | timestamptz | Token creation timestamp |
| updated_at  | timestamptz | Token last rotation timestamp |

Constraints:

- Primary key on `user_id` (one active token per user).
- Unique index/constraint on `token`.

Event query model:

- Source: `party` rows where `deleted_at IS NULL` and `time >= now()`.
- RSVP state via left join with `rsvp` on (`party_id`, `user_id`, `deleted_at IS NULL`).
- RSVP fallback when absent: `"invited"`.

## Security

- Secret URL token acts as bearer credential for feed consumption.
- Token is high-entropy and unguessable.
- Token lifecycle is user-managed via rotate endpoint.
- Invalid token responses are normalized to `404` to reduce probing signal.
- No session auth on the subscription feed endpoint to preserve compatibility
  with polling calendar clients.
- Per-invitation downloads require a valid user session and are marked
  `private, no-store` because RSVP state varies by user.
- Any authenticated user may download any non-deleted party, matching the
  existing party-detail and invitation-feed visibility model.
- Download filenames are derived from the party slug and restricted to safe
  ASCII filename characters before being placed in `Content-Disposition`.

## Client Compatibility

- `webcal://` opens the subscription directly in compatible desktop and Apple
  calendar applications.
- Google Calendar web and clients without a registered `webcal` handler can
  use the advanced feed URL flow.
- The per-invitation endpoint uses a normal HTTPS download because `.ics`
  imports are broadly supported across desktop, iOS, and Android.

## Library Choices

Calendar serialization must be library-backed:

- Use Rust `icalendar` crate to construct VCALENDAR/VEVENT structures and serialize output.
- Use existing `uuid` crate for token entropy and stable event UID derivation.
- Do not implement custom ICS escaping, line folding, or serializer logic by hand.

Custom code remains limited to:

- token lifecycle and persistence
- authorization and endpoint routing
- SQL queries for feed content
- response wiring

## Rollout

1. Ship migration for `calendar_feed_token`.
2. Deploy token management endpoints and public `.ics` endpoint.
3. Add one-click subscription and feed download controls to Settings, plus a
   per-invitation download on Party Detail pages. Keep URL copying as an
   advanced fallback rather than the primary workflow.
4. Verify subscription and rotation behavior in Apple Calendar / Google
   Calendar, and invitation imports on iOS and Android.
5. Monitor logs for token lookup misses and feed generation errors.

## Success Metrics

- Users can subscribe successfully from major calendar clients.
- Token rotation invalidates previous feed URL on next poll.
- Feed includes all upcoming parties with expected metadata.
- No regressions in existing party/RSVP flows.
