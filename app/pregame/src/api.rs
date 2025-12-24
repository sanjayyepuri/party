use axum::{
    Json,
    extract::{Path, Request, State},
    http::{HeaderMap, StatusCode, Uri},
    middleware::Next,
    response::IntoResponse,
};
use std::sync::Arc;

use crate::auth::{AuthError, AuthSession, OryState, extract_cookie_access_token, validate_token};
use crate::db::DbState;
use crate::model::{Book, Party};

pub struct ApiState {
    pub ory_state: OryState,
    pub db_state: DbState,
}

/// Middleware to authenticate requests using Ory's session management.
///
/// This function extracts the access token from the request headers and authenticates it.
/// If successful, the session is stored in the request extension, otherwise and error
/// response is returned.
///
/// https://docs.rs/axum/latest/axum/middleware/index.html
/// This is the simplest way to implement middleware in axum. It would be a good exercise, to
/// implement using the `tower::Layer` trait.
pub async fn auth_middleware(
    State(api_state): State<Arc<ApiState>>,
    headers: HeaderMap,
    mut request: Request,
    next: Next,
) -> impl IntoResponse {
    match auth_middleware_impl(api_state.clone(), &headers).await {
        Ok(session) => {
            request.extensions_mut().insert(session);
            next.run(request).await
        }
        Err(response) => response,
    }
}

async fn auth_middleware_impl(
    api_state: Arc<ApiState>,
    headers: &HeaderMap,
) -> Result<AuthSession, axum::response::Response> {
    let (cookie, access_token) = extract_cookie_access_token(&headers)
        .ok_or_else(|| (StatusCode::UNAUTHORIZED, Json("Unauthorized")).into_response())?;

    match validate_token(&api_state.ory_state, &cookie, &access_token).await {
        Ok(session) => Ok(session),
        Err(AuthError::InternalServerError(message)) => {
            tracing::error!("Internal server error: {}", message);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response())
        }
        Err(AuthError::Unauthorized) => {
            Err((StatusCode::UNAUTHORIZED, Json("Unauthorized")).into_response())
        }
    }
}

pub async fn hello_world(State(api_state): State<Arc<ApiState>>) -> impl IntoResponse {
    match hello_world_impl(api_state).await {
        Ok(books) => (StatusCode::OK, Json(books)).into_response(),
        Err(response) => response,
    }
}

async fn hello_world_impl(api_state: Arc<ApiState>) -> Result<Vec<Book>, axum::response::Response> {
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
        .query("SELECT party_id, name, time, location, description, slug, created_at, updated_at, deleted_at FROM party WHERE deleted_at IS NULL ORDER BY time ASC;", &[])
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
    Path(slug): Path<String>,
) -> impl IntoResponse {
    match get_party_impl(api_state, slug).await {
        Ok(Some(party)) => (StatusCode::OK, Json(party)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, Json("Party not found")).into_response(),
        Err(response) => response,
    }
}

async fn get_party_impl(
    api_state: Arc<ApiState>,
    slug: String,
) -> Result<Option<Party>, axum::response::Response> {
    let rows = api_state
        .db_state
        .client
        .query(
            "SELECT party_id, name, time, location, description, slug, created_at, updated_at, deleted_at FROM party WHERE slug = $1 AND deleted_at IS NULL;",
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
