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
    let client = api_state
        .db_state
        .pool
        .get()
        .await
        .map_err(|err| {
            tracing::error!("Failed to get database connection: {:?}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        })?;

    let rows = client
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
    let client = api_state
        .db_state
        .pool
        .get()
        .await
        .map_err(|err| {
            tracing::error!("Failed to get database connection: {:?}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        })?;

    let rows = client
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
