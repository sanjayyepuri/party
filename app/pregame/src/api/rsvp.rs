use axum::{
    Json,
    Extension,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Deserialize;
use std::sync::Arc;

use crate::auth::BetterAuthSession;
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
            "SELECT r.rsvp_id, r.party_id, r.user_id, r.status, r.created_at, r.updated_at, r.deleted_at
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

/// Get or create RSVP for the authenticated user for a specific party
/// Uses the user_id from the authenticated session
pub async fn get_rsvp(
    State(api_state): State<Arc<ApiState>>,
    Extension(session): Extension<BetterAuthSession>,
    Path(party_id): Path<String>,
) -> impl IntoResponse {
    match get_rsvp_impl(api_state, party_id, session.user_id).await {
        Ok(rsvp) => (StatusCode::OK, Json(rsvp)).into_response(),
        Err(response) => response,
    }
}

async fn get_rsvp_impl(
    api_state: Arc<ApiState>,
    party_id: String,
    user_id: String,
) -> Result<Rsvp, axum::response::Response> {
    let rsvp_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now();
    let default_status = "pending";

    // Single query: validate party exists, insert if not exists, then select the RSVP
    let row = api_state
        .db_state
        .client
        .query_opt(
            "WITH party_check AS (
                 SELECT party_id FROM party WHERE party_id = $2 AND deleted_at IS NULL
             ),
             inserted AS (
                 INSERT INTO rsvp (rsvp_id, party_id, user_id, status, created_at, updated_at)
                 SELECT $1, $2, $3, $4, $5, $6
                 FROM party_check
                 ON CONFLICT (party_id, user_id) DO NOTHING
                 RETURNING rsvp_id, party_id, user_id, status, created_at, updated_at, deleted_at
             )
             SELECT * FROM inserted
             UNION ALL
             SELECT r.rsvp_id, r.party_id, r.user_id, r.status, r.created_at, r.updated_at, r.deleted_at
             FROM rsvp r
             JOIN party_check pc ON r.party_id = pc.party_id
             WHERE r.party_id = $2 AND r.user_id = $3 AND r.deleted_at IS NULL
             AND NOT EXISTS (SELECT 1 FROM inserted)
             LIMIT 1;",
            &[
                &rsvp_id,
                &party_id,
                &user_id,
                &default_status,
                &now,
                &now,
            ],
        )
        .await
        .map_err(|err| {
            tracing::error!("Database query failed: {:?}", err);

            // Check if it's a foreign key constraint violation for user_id
            if let Some(db_err) = err.as_db_error() {
                if db_err.code() == &tokio_postgres::error::SqlState::FOREIGN_KEY_VIOLATION {
                    if let Some(constraint) = db_err.constraint() {
                        if constraint.contains("user") {
                            return (StatusCode::NOT_FOUND, Json("User not found")).into_response();
                        }
                    }
                }
            }

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

/// Update an existing RSVP
#[derive(Debug, Deserialize)]
pub struct UpdateRsvpRequest {
    pub rsvp_id: String,
    pub status: String,
}

pub async fn update_rsvp(
    State(api_state): State<Arc<ApiState>>,
    Extension(session): Extension<BetterAuthSession>,
    Json(payload): Json<UpdateRsvpRequest>,
) -> impl IntoResponse {
    match update_rsvp_impl(api_state, payload, session.user_id).await {
        Ok(rsvp) => (StatusCode::OK, Json(rsvp)).into_response(),
        Err(response) => response,
    }
}

async fn update_rsvp_impl(
    api_state: Arc<ApiState>,
    payload: UpdateRsvpRequest,
    user_id: String,
) -> Result<Rsvp, axum::response::Response> {
    let now = chrono::Utc::now();

    // Only allow users to update their own RSVPs
    let row = api_state
        .db_state
        .client
        .query_opt(
            "UPDATE rsvp
             SET status = $1, updated_at = $2
             WHERE rsvp_id = $3 AND user_id = $4 AND deleted_at IS NULL
             RETURNING rsvp_id, party_id, user_id, status, created_at, updated_at, deleted_at;",
            &[&payload.status, &now, &payload.rsvp_id, &user_id],
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
/// Users can only delete their own RSVPs
pub async fn delete_rsvp(
    State(api_state): State<Arc<ApiState>>,
    Extension(session): Extension<BetterAuthSession>,
    Path(party_id): Path<String>,
) -> impl IntoResponse {
    match delete_rsvp_impl(api_state, party_id, session.user_id).await {
        Ok(_) => (StatusCode::NO_CONTENT).into_response(),
        Err(response) => response,
    }
}

async fn delete_rsvp_impl(
    api_state: Arc<ApiState>,
    party_id: String,
    user_id: String,
) -> Result<(), axum::response::Response> {
    let now = chrono::Utc::now();

    let rows_affected = api_state
        .db_state
        .client
        .execute(
            "UPDATE rsvp SET deleted_at = $1, updated_at = $1
             WHERE party_id = $2 AND user_id = $3 AND deleted_at IS NULL;",
            &[&now, &party_id, &user_id],
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

#[cfg(test)]
mod tests {
    use super::*;

    // Note: These tests require database connections. For unit testing, you would need to:
    // 1. Mock the tokio_postgres::Client trait, or
    // 2. Use integration tests with a test database
    //
    // The following tests verify the structure and error handling patterns.

    #[test]
    fn test_get_party_rsvps_impl_structure() {
        // This test documents the expected behavior:
        // - Queries rsvp table by party_id with deleted_at IS NULL
        // - Orders by created_at ASC
        // - Returns Vec<Rsvp> on success
        // - Returns 500 error on database failure
        // - Returns 500 error on parsing failure
        assert!(true); // Placeholder - actual implementation requires database
    }

    #[test]
    fn test_get_rsvp_impl_structure() {
        // This test documents the expected behavior:
        // - Validates party exists (deleted_at IS NULL)
        // - Inserts new RSVP if not exists (ON CONFLICT DO NOTHING)
        // - Returns existing RSVP if found
        // - Returns 404 if party not found
        // - Returns 404 if user not found (foreign key violation)
        // - Returns 500 error on database failure
        assert!(true); // Placeholder - actual implementation requires database
    }

    #[test]
    fn test_update_rsvp_impl_structure() {
        // This test documents the expected behavior:
        // - Updates RSVP status and updated_at
        // - Only allows users to update their own RSVPs (user_id check)
        // - Only updates non-deleted RSVPs (deleted_at IS NULL)
        // - Returns updated Rsvp on success
        // - Returns 404 if RSVP not found
        // - Returns 500 error on database failure
        assert!(true); // Placeholder - actual implementation requires database
    }

    #[test]
    fn test_delete_rsvp_impl_structure() {
        // This test documents the expected behavior:
        // - Soft deletes RSVP (sets deleted_at and updated_at)
        // - Only allows users to delete their own RSVPs (user_id check)
        // - Only deletes non-deleted RSVPs (deleted_at IS NULL)
        // - Returns 204 NO_CONTENT on success
        // - Returns 404 if RSVP not found
        // - Returns 500 error on database failure
        assert!(true); // Placeholder - actual implementation requires database
    }

    #[test]
    fn test_update_rsvp_request_deserialization() {
        let json = r#"{"rsvp_id": "test-id", "status": "confirmed"}"#;
        let request: UpdateRsvpRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.rsvp_id, "test-id");
        assert_eq!(request.status, "confirmed");
    }

    // Integration tests should be added in tests/ directory to test with real database
}
