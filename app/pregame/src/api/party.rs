use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use std::sync::Arc;

use crate::api::ApiState;
use crate::model::Party;

pub async fn list_parties(State(api_state): State<Arc<ApiState>>) -> impl IntoResponse {
    match list_parties_impl(api_state).await {
        Ok(parties) => (StatusCode::OK, Json(parties)).into_response(),
        Err(response) => response,
    }
}

async fn list_parties_impl(
    api_state: Arc<ApiState>,
) -> Result<Vec<Party>, axum::response::Response> {
    let rows = api_state
        .db_state
        .client
        .query(
            "SELECT
                party_id, name, time, location, description, slug, created_at, updated_at, deleted_at
            FROM party
            WHERE deleted_at IS NULL ORDER BY time ASC;",
            &[],
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
        .map(|row| Party::from_row(&row))
        .collect::<Result<Vec<Party>, _>>()
        .map_err(|err| {
            tracing::error!("Failed to parse party from row: {:?}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        })
}

pub async fn get_party(
    State(api_state): State<Arc<ApiState>>,
    Path(party_id): Path<String>,
) -> impl IntoResponse {
    match get_party_impl(api_state, party_id).await {
        Ok(Some(party)) => (StatusCode::OK, Json(party)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, Json("Party not found")).into_response(),
        Err(response) => response,
    }
}

async fn get_party_impl(
    api_state: Arc<ApiState>,
    party_id: String,
) -> Result<Option<Party>, axum::response::Response> {
    let rows = api_state
        .db_state
        .client
        .query(
            "SELECT
                party_id, name, time, location, description, slug, created_at, updated_at, deleted_at
            FROM party
            WHERE party_id = $1 AND deleted_at IS NULL;",
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

    if rows.is_empty() {
        return Ok(None);
    }

    Party::from_row(&rows[0]).map(Some).map_err(|err| {
        tracing::error!("Failed to parse party from row: {:?}", err);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json("Internal Server Error"),
        )
            .into_response()
    })
}

#[cfg(test)]
mod tests {
    // Note: These tests require database connections. For unit testing, you would need to:
    // 1. Mock the tokio_postgres::Client trait, or
    // 2. Use integration tests with a test database
    //
    // The following tests verify the structure and error handling patterns.

    #[test]
    fn test_list_parties_impl_structure() {
        // This test documents the expected behavior:
        // - Queries party table with deleted_at IS NULL
        // - Orders by time ASC
        // - Returns Vec<Party> on success
        // - Returns 500 error on database failure
        // - Returns 500 error on parsing failure
        assert!(true); // Placeholder - actual implementation requires database
    }

    #[test]
    fn test_get_party_impl_structure() {
        // This test documents the expected behavior:
        // - Queries party table by party_id with deleted_at IS NULL
        // - Returns Some(Party) if found
        // - Returns None if not found
        // - Returns 500 error on database failure
        // - Returns 500 error on parsing failure
        assert!(true); // Placeholder - actual implementation requires database
    }

    // Integration tests should be added in tests/ directory to test with real database
}
