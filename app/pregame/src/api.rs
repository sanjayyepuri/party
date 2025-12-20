use axum::{
    Json,
    extract::State,
    http::Uri,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
};
use std::sync::Arc;

use crate::auth::{OryState, extract_cookie_access_token, validate_token};
use crate::db::DbState;
use crate::model::Book;

pub struct ApiState {
    pub ory_state: OryState,
    pub db_state: DbState,
}

/// Temporary testing endpoint to ensure cookie and access token are extracted correctly
pub async fn hello_world(
    State(api_state): State<Arc<ApiState>>,
    headers: HeaderMap,
) -> impl IntoResponse {
    match hello_world_impl(api_state, headers).await {
        Ok(books) => (StatusCode::OK, Json(books)).into_response(),
        Err(response) => response,
    }
}

async fn hello_world_impl(
    api_state: Arc<ApiState>,
    headers: HeaderMap,
) -> Result<Vec<Book>, axum::response::Response> {
    let (cookie, access_token) = extract_cookie_access_token(&headers)
        .ok_or_else(|| (StatusCode::UNAUTHORIZED, Json("Unauthorized")).into_response())?;

    validate_token(&api_state.ory_state, &cookie, &access_token)
        .await
        .map_err(|err| {
            tracing::error!("Token validation failed: {:?}", err);
            (StatusCode::UNAUTHORIZED, Json("Unauthorized")).into_response()
        })?;

    let rows = api_state
        .db_state
        .client
        .query("SELECT * FROM books;", &[])
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
        .map(|row| Book::from_row(&row))
        .collect::<Result<Vec<Book>, _>>()
        .map_err(|err| {
            tracing::error!("Failed to parse book from row: {:?}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        })
}

pub async fn fallback(uri: Uri) -> impl IntoResponse {
    format!("Axum fallback for path {}", uri.path())
}
