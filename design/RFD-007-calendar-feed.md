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
- Public feed endpoint:
  - `GET /calendar/feed.ics?token=<secret>`

High-level flow:

1. Authenticated user requests/rotates feed token.
2. Frontend stores only returned path and composes absolute URL from browser origin.
3. Calendar app polls `.ics` endpoint with token.
4. Backend validates token, fetches upcoming parties plus user RSVP status, emits ICS document.

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
- No session auth on `.ics` endpoint to preserve compatibility with calendar clients.

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
3. Add calendar controls to Settings and Party Detail pages.
4. Verify subscription and rotation behavior in Apple Calendar / Google Calendar.
5. Monitor logs for token lookup misses and feed generation errors.

## Success Metrics

- Users can subscribe successfully from major calendar clients.
- Token rotation invalidates previous feed URL on next poll.
- Feed includes all upcoming parties with expected metadata.
- No regressions in existing party/RSVP flows.
