use axum::{
    Extension, Json,
    extract::{Query, State},
    http::{HeaderMap, StatusCode, header},
    response::IntoResponse,
};
use chrono::{Duration, Utc};
use icalendar::{Calendar, Component, Event, EventLike};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio_postgres::Row;
use uuid::Uuid;

use crate::api::ApiState;
use crate::auth::BetterAuthSession;

#[derive(Debug, Serialize)]
pub struct CalendarFeedTokenResponse {
    pub feed_path: String,
}

#[derive(Debug, Deserialize)]
pub struct CalendarFeedQuery {
    pub token: String,
}

#[derive(Debug)]
struct CalendarFeedEvent {
    party_id: String,
    name: String,
    time: chrono::DateTime<chrono::Utc>,
    location: String,
    description: String,
    slug: String,
    updated_at: chrono::DateTime<chrono::Utc>,
    rsvp_status: String,
}

impl CalendarFeedEvent {
    fn from_row(row: &Row) -> Result<Self, tokio_postgres::Error> {
        Ok(Self {
            party_id: row.try_get("party_id")?,
            name: row.try_get("name")?,
            time: row.try_get("time")?,
            location: row.try_get("location")?,
            description: row.try_get("description")?,
            slug: row.try_get("slug")?,
            updated_at: row.try_get("updated_at")?,
            rsvp_status: row.try_get("rsvp_status")?,
        })
    }
}

/// Returns the current user's calendar feed token path, creating one if needed.
pub async fn get_feed_token(
    State(api_state): State<Arc<ApiState>>,
    Extension(session): Extension<BetterAuthSession>,
) -> impl IntoResponse {
    match get_feed_token_impl(api_state, session.user_id).await {
        Ok(response) => (StatusCode::OK, Json(response)).into_response(),
        Err(response) => response,
    }
}

async fn get_feed_token_impl(
    api_state: Arc<ApiState>,
    user_id: String,
) -> Result<CalendarFeedTokenResponse, axum::response::Response> {
    let client = api_state.db_state.get_connection().await?;
    let now = Utc::now();
    let token_candidate = generate_feed_token();

    let row = client
        .query_one(
            "WITH inserted AS (
                INSERT INTO calendar_feed_token (user_id, token, created_at, updated_at)
                VALUES ($1, $2, $3, $3)
                ON CONFLICT (user_id) DO NOTHING
                RETURNING token
            )
            SELECT token FROM inserted
            UNION ALL
            SELECT token FROM calendar_feed_token WHERE user_id = $1
            LIMIT 1;",
            &[&user_id, &token_candidate, &now],
        )
        .await
        .map_err(internal_error)?;

    let token: String = row.try_get("token").map_err(internal_error)?;

    Ok(CalendarFeedTokenResponse {
        feed_path: build_feed_path(&token),
    })
}

/// Rotates the current user's calendar feed token.
pub async fn rotate_feed_token(
    State(api_state): State<Arc<ApiState>>,
    Extension(session): Extension<BetterAuthSession>,
) -> impl IntoResponse {
    match rotate_feed_token_impl(api_state, session.user_id).await {
        Ok(response) => (StatusCode::OK, Json(response)).into_response(),
        Err(response) => response,
    }
}

async fn rotate_feed_token_impl(
    api_state: Arc<ApiState>,
    user_id: String,
) -> Result<CalendarFeedTokenResponse, axum::response::Response> {
    let client = api_state.db_state.get_connection().await?;
    let now = Utc::now();
    let new_token = generate_feed_token();

    let row = client
        .query_one(
            "INSERT INTO calendar_feed_token (user_id, token, created_at, updated_at)
             VALUES ($1, $2, $3, $3)
             ON CONFLICT (user_id)
             DO UPDATE SET token = EXCLUDED.token, updated_at = EXCLUDED.updated_at
             RETURNING token;",
            &[&user_id, &new_token, &now],
        )
        .await
        .map_err(internal_error)?;

    let token: String = row.try_get("token").map_err(internal_error)?;

    Ok(CalendarFeedTokenResponse {
        feed_path: build_feed_path(&token),
    })
}

/// Returns a token-authenticated iCalendar feed.
pub async fn get_calendar_feed(
    State(api_state): State<Arc<ApiState>>,
    headers: HeaderMap,
    Query(query): Query<CalendarFeedQuery>,
) -> impl IntoResponse {
    match get_calendar_feed_impl(api_state, headers, query).await {
        Ok(calendar_payload) => (
            StatusCode::OK,
            [(header::CONTENT_TYPE, "text/calendar; charset=utf-8")],
            calendar_payload,
        )
            .into_response(),
        Err(response) => response,
    }
}

async fn get_calendar_feed_impl(
    api_state: Arc<ApiState>,
    headers: HeaderMap,
    query: CalendarFeedQuery,
) -> Result<String, axum::response::Response> {
    if query.token.trim().is_empty() {
        return Err((StatusCode::NOT_FOUND, Json("Calendar feed not found")).into_response());
    }

    let client = api_state.db_state.get_connection().await?;

    let user_row = client
        .query_opt(
            "SELECT user_id FROM calendar_feed_token WHERE token = $1;",
            &[&query.token],
        )
        .await
        .map_err(internal_error)?;

    let Some(user_row) = user_row else {
        return Err((StatusCode::NOT_FOUND, Json("Calendar feed not found")).into_response());
    };

    let user_id: String = user_row.try_get("user_id").map_err(internal_error)?;

    let rows = client
        .query(
            "SELECT
                p.party_id,
                p.name,
                p.time,
                p.location,
                p.description,
                p.slug,
                p.updated_at,
                COALESCE(r.status, 'invited') AS rsvp_status
            FROM party p
            LEFT JOIN rsvp r
                ON p.party_id = r.party_id
                AND r.user_id = $1
                AND r.deleted_at IS NULL
            WHERE p.deleted_at IS NULL
                AND p.time >= NOW()
            ORDER BY p.time ASC;",
            &[&user_id],
        )
        .await
        .map_err(internal_error)?;

    let events = rows
        .iter()
        .map(CalendarFeedEvent::from_row)
        .collect::<Result<Vec<_>, _>>()
        .map_err(internal_error)?;

    let origin = extract_request_origin(&headers);

    Ok(build_calendar_payload(&events, &origin))
}

fn internal_error(error: impl std::fmt::Debug) -> axum::response::Response {
    tracing::error!("Calendar API error: {:?}", error);
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json("Internal Server Error"),
    )
        .into_response()
}

fn generate_feed_token() -> String {
    format!("{}{}", Uuid::new_v4().simple(), Uuid::new_v4().simple())
}

fn build_feed_path(token: &str) -> String {
    format!("/api/bouncer/calendar/feed.ics?token={token}")
}

fn extract_request_origin(headers: &HeaderMap) -> String {
    let forwarded_proto = first_header_value(headers, "x-forwarded-proto");
    let forwarded_host = first_header_value(headers, "x-forwarded-host");
    let host = first_header_value(headers, "host");

    let protocol = forwarded_proto.unwrap_or_else(|| "http".to_string());
    let host_value = forwarded_host.or(host);

    match host_value {
        Some(hostname) if hostname.starts_with("http://") || hostname.starts_with("https://") => {
            hostname
        }
        Some(hostname) => format!("{protocol}://{hostname}"),
        None => "http://localhost:3000".to_string(),
    }
}

fn first_header_value(headers: &HeaderMap, name: &str) -> Option<String> {
    headers
        .get(name)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(',').next())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

fn build_calendar_payload(events: &[CalendarFeedEvent], origin: &str) -> String {
    let mut calendar = Calendar::new();
    calendar.name("Party Invitations");

    let safe_origin = origin.trim_end_matches('/');
    let uid_domain = url::Url::parse(origin)
        .ok()
        .and_then(|url| url.host_str().map(str::to_string))
        .unwrap_or_else(|| "party.local".to_string());

    for event in events {
        let event_url = format!("{safe_origin}/parties/{}", event.slug);
        let status = normalize_rsvp_status(&event.rsvp_status);
        let description = if event.description.trim().is_empty() {
            format!("RSVP status: {status}\nInvitation: {event_url}")
        } else {
            format!(
                "{}\n\nRSVP status: {}\nInvitation: {}",
                event.description, status, event_url
            )
        };

        let calendar_event = Event::new()
            .summary(&event.name)
            .description(&description)
            .starts(event.time)
            .ends(event.time + Duration::hours(3))
            .location(&event.location)
            .uid(&format!("party-{}@{uid_domain}", event.party_id))
            .timestamp(Utc::now())
            .last_modified(event.updated_at)
            .url(&event_url)
            .done();

        calendar.push(calendar_event);
    }

    calendar.to_string()
}

fn normalize_rsvp_status(status: &str) -> &'static str {
    match status {
        "accepted" => "accepted",
        "pending" => "pending",
        "declined" => "declined",
        _ => "invited",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn generate_feed_token_is_64_hex_characters() {
        let token = generate_feed_token();
        assert_eq!(token.len(), 64);
        assert!(token.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn extract_request_origin_prefers_forwarded_headers() {
        let mut headers = HeaderMap::new();
        headers.insert("x-forwarded-proto", "https".parse().unwrap());
        headers.insert("x-forwarded-host", "calendar.example.com".parse().unwrap());
        headers.insert("host", "localhost:3000".parse().unwrap());

        assert_eq!(
            extract_request_origin(&headers),
            "https://calendar.example.com"
        );
    }

    #[test]
    fn build_calendar_payload_includes_url_and_rsvp_status() {
        let events = vec![CalendarFeedEvent {
            party_id: "party-1".to_string(),
            name: "Launch Party".to_string(),
            time: chrono::DateTime::parse_from_rfc3339("2026-02-28T17:00:00Z")
                .unwrap()
                .with_timezone(&Utc),
            location: "321 Oak Street".to_string(),
            description: "Big reveal night".to_string(),
            slug: "launch-party-2026".to_string(),
            updated_at: chrono::DateTime::parse_from_rfc3339("2026-02-20T10:00:00Z")
                .unwrap()
                .with_timezone(&Utc),
            rsvp_status: "accepted".to_string(),
        }];

        let payload = build_calendar_payload(&events, "https://www.sanjay.party");

        assert!(payload.contains("BEGIN:VCALENDAR"));
        assert!(payload.contains("BEGIN:VEVENT"));
        assert!(payload.contains("URL:https://www.sanjay.party/parties/launch-party-2026"));
        assert!(payload.contains("RSVP status: accepted"));
    }
}
