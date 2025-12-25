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
    Path(party_id): Path<String>,
) -> impl IntoResponse {
    match get_party_rsvps_impl(api_state, party_id).await {
        Ok(rsvps) => (StatusCode::OK, Json(rsvps)).into_response(),
        Err(response) => response,
    }
}

async fn get_party_rsvps_impl(
    api_state: Arc<ApiState>,
    party_id: String,
) -> Result<Vec<Rsvp>, axum::response::Response> {
    let rows = api_state
        .db_state
        .client
        .query(
            "SELECT r.rsvp_id, r.party_id, r.guest_id, r.status, r.created_at, r.updated_at, r.deleted_at
             FROM rsvp r
             WHERE r.party_id = $1 AND r.deleted_at IS NULL
             ORDER BY r.created_at ASC;",
            &[&party_id],
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

/// Get a specific RSVP by party ID and guest ID
pub async fn get_rsvp(
    State(api_state): State<Arc<ApiState>>,
    Path((party_id, guest_id)): Path<(String, String)>,
) -> impl IntoResponse {
    match get_rsvp_impl(api_state, party_id, guest_id).await {
        Ok(rsvp) => (StatusCode::OK, Json(rsvp)).into_response(),
        Err(response) => response,
    }
}

async fn get_rsvp_impl(
    api_state: Arc<ApiState>,
    party_id: String,
    guest_id: String,
) -> Result<Rsvp, axum::response::Response> {
    let rsvp_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now();
    let default_status = "pending";

    // Single query: insert if not exists, then select the RSVP
    let row = api_state
        .db_state
        .client
        .query_opt(
            "WITH inserted AS (
                 INSERT INTO rsvp (rsvp_id, party_id, guest_id, status, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (party_id, guest_id) DO NOTHING
                 RETURNING rsvp_id, party_id, guest_id, status, created_at, updated_at, deleted_at
             )
             SELECT * FROM inserted
             UNION ALL
             SELECT r.rsvp_id, r.party_id, r.guest_id, r.status, r.created_at, r.updated_at, r.deleted_at
             FROM rsvp r
             WHERE r.party_id = $2 AND r.guest_id = $3 AND r.deleted_at IS NULL
             AND NOT EXISTS (SELECT 1 FROM inserted)
             LIMIT 1;",
            &[
                &rsvp_id,
                &party_id,
                &guest_id,
                &default_status,
                &now,
                &now,
            ],
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

    match row {
        Some(row) => Rsvp::from_row(&row).map_err(|err| {
            tracing::error!("Failed to parse RSVP from row: {:?}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        }),
        None => Err((StatusCode::NOT_FOUND, Json("Party not found")).into_response()),
    }
}

/// Update an existing RSVP
#[derive(Debug, Deserialize)]
pub struct UpdateRsvpRequest {
    pub rsvp_id: String,
    pub status: String,
}

pub async fn update_rsvp(
    State(api_state): State<Arc<ApiState>>,
    Json(payload): Json<UpdateRsvpRequest>,
) -> impl IntoResponse {
    match update_rsvp_impl(api_state, payload).await {
        Ok(rsvp) => (StatusCode::OK, Json(rsvp)).into_response(),
        Err(response) => response,
    }
}

async fn update_rsvp_impl(
    api_state: Arc<ApiState>,
    payload: UpdateRsvpRequest,
) -> Result<Rsvp, axum::response::Response> {
    let now = chrono::Utc::now();

    let row = api_state
        .db_state
        .client
        .query_opt(
            "UPDATE rsvp
             SET status = $1, updated_at = $2
             WHERE rsvp_id = $3 AND deleted_at IS NULL
             RETURNING rsvp_id, party_id, guest_id, status, created_at, updated_at, deleted_at;",
            &[&payload.status, &now, &payload.rsvp_id],
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

    match row {
        Some(row) => Rsvp::from_row(&row).map_err(|err| {
            tracing::error!("Failed to parse RSVP from row: {:?}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        }),
        None => Err((StatusCode::NOT_FOUND, Json("RSVP not found")).into_response()),
    }
}

/// Delete an RSVP (soft delete)
pub async fn delete_rsvp(
    State(api_state): State<Arc<ApiState>>,
    Path((party_id, guest_id)): Path<(String, String)>,
) -> impl IntoResponse {
    match delete_rsvp_impl(api_state, party_id, guest_id).await {
        Ok(_) => (StatusCode::NO_CONTENT).into_response(),
        Err(response) => response,
    }
}

async fn delete_rsvp_impl(
    api_state: Arc<ApiState>,
    party_id: String,
    guest_id: String,
) -> Result<(), axum::response::Response> {
    let now = chrono::Utc::now();

    let rows_affected = api_state
        .db_state
        .client
        .execute(
            "UPDATE rsvp SET deleted_at = $1, updated_at = $1
             WHERE party_id = $2 AND guest_id = $3 AND deleted_at IS NULL;",
            &[&now, &party_id, &guest_id],
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
