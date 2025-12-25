use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Deserialize;
use std::sync::Arc;

use crate::model::Rsvp;

use crate::api::ApiState;

/// Get RSVPs for a specific party
pub async fn get_party_rsvps(
    State(api_state): State<Arc<ApiState>>,
    Path(slug): Path<String>,
) -> impl IntoResponse {
    match get_party_rsvps_impl(api_state, slug).await {
        Ok(rsvps) => (StatusCode::OK, Json(rsvps)).into_response(),
        Err(response) => response,
    }
}

async fn get_party_rsvps_impl(
    api_state: Arc<ApiState>,
    slug: String,
) -> Result<Vec<Rsvp>, axum::response::Response> {
    let rows = api_state
        .db_state
        .client
        .query(
            "SELECT r.rsvp_id, r.party_id, r.guest_id, r.status, r.created_at, r.updated_at, r.deleted_at
             FROM rsvp r
             JOIN party p ON r.party_id = p.party_id
             WHERE p.slug = $1 AND r.deleted_at IS NULL
             ORDER BY r.created_at ASC;",
            &[&slug],
        )
        .await
        .map_err(|err| {
            tracing::error!("Database query failed: {:?}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        })?;

    rows.into_iter()
        .map(|row| Rsvp::from_row(&row))
        .collect::<Result<Vec<Rsvp>, _>>()
        .map_err(|err| {
            tracing::error!("Failed to parse RSVP from row: {:?}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        })
}

/// Create or update an RSVP for a party
#[derive(Debug, Deserialize)]
pub struct RsvpRequest {
    pub party_slug: String,
    pub guest_id: String,
    pub status: String,
}

pub async fn upsert_rsvp(
    State(api_state): State<Arc<ApiState>>,
    Json(payload): Json<RsvpRequest>,
) -> impl IntoResponse {
    match upsert_rsvp_impl(api_state, payload).await {
        Ok(rsvp) => (StatusCode::OK, Json(rsvp)).into_response(),
        Err(response) => response,
    }
}

async fn upsert_rsvp_impl(
    api_state: Arc<ApiState>,
    payload: RsvpRequest,
) -> Result<Rsvp, axum::response::Response> {
    // Get party_id from slug
    let party_rows = api_state
        .db_state
        .client
        .query(
            "SELECT party_id FROM party WHERE slug = $1 AND deleted_at IS NULL;",
            &[&payload.party_slug],
        )
        .await
        .map_err(|err| {
            tracing::error!("Database query failed: {:?}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        })?;

    if party_rows.is_empty() {
        return Err((StatusCode::NOT_FOUND, Json("Party not found")).into_response());
    }

    let party_id: String = party_rows[0].get("party_id");
    let rsvp_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now();

    // Single query using ON CONFLICT for upsert
    let row = api_state
        .db_state
        .client
        .query_one(
            "INSERT INTO rsvp (rsvp_id, party_id, guest_id, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (party_id, guest_id)
             DO UPDATE SET
                 status = EXCLUDED.status,
                 updated_at = EXCLUDED.updated_at,
                 deleted_at = NULL
             RETURNING rsvp_id, party_id, guest_id, status, created_at, updated_at, deleted_at;",
            &[
                &rsvp_id,
                &party_id,
                &payload.guest_id,
                &payload.status,
                &now,
                &now,
            ],
        )
        .await
        .map_err(|err| {
            tracing::error!("Database upsert failed: {:?}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        })?;

    Rsvp::from_row(&row).map_err(|err| {
        tracing::error!("Failed to parse RSVP from row: {:?}", err);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json("Internal Server Error"),
        )
            .into_response()
    })
}

/// Delete an RSVP (soft delete)
pub async fn delete_rsvp(
    State(api_state): State<Arc<ApiState>>,
    Path((party_slug, guest_id)): Path<(String, String)>,
) -> impl IntoResponse {
    match delete_rsvp_impl(api_state, party_slug, guest_id).await {
        Ok(_) => (StatusCode::NO_CONTENT).into_response(),
        Err(response) => response,
    }
}

async fn delete_rsvp_impl(
    api_state: Arc<ApiState>,
    party_slug: String,
    guest_id: String,
) -> Result<(), axum::response::Response> {
    let now = chrono::Utc::now();

    let rows_affected = api_state
        .db_state
        .client
        .execute(
            "UPDATE rsvp SET deleted_at = $1, updated_at = $1
             WHERE party_id = (SELECT party_id FROM party WHERE slug = $2)
             AND guest_id = $3 AND deleted_at IS NULL;",
            &[&now, &party_slug, &guest_id],
        )
        .await
        .map_err(|err| {
            tracing::error!("Database update failed: {:?}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        })?;

    if rows_affected == 0 {
        return Err((StatusCode::NOT_FOUND, Json("RSVP not found")).into_response());
    }

    Ok(())
}
