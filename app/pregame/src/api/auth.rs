use axum::{
    Json,
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::IntoResponse,
};
use std::sync::Arc;

use crate::api::ApiState;
use crate::auth::{AuthError, AuthSession, extract_cookie_access_token, validate_token};
use crate::identity::get_or_create_guest;
use crate::model::Guest;

/// Middleware to authenticate requests using Ory's session management.
///
/// This function extracts the access token from the request headers and authenticates it.
/// If successful, the session and associated guest are stored in the request extensions,
/// otherwise an error response is returned.
///
/// The middleware performs two key operations:
/// 1. Validates the Ory session token
/// 2. Gets or creates a guest record linked to the Ory identity
///
/// Both the `AuthSession` and `Guest` are inserted into request extensions for use
/// by downstream handlers.
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
        Ok((session, guest)) => {
            request.extensions_mut().insert(session);
            request.extensions_mut().insert(guest);
            next.run(request).await
        }
        Err(response) => response,
    }
}

async fn auth_middleware_impl(
    api_state: Arc<ApiState>,
    headers: &HeaderMap,
) -> Result<(AuthSession, Guest), axum::response::Response> {
    // Extract and validate the Ory session token
    let (cookie, access_token) = extract_cookie_access_token(&headers)
        .ok_or_else(|| (StatusCode::UNAUTHORIZED, Json("Unauthorized")).into_response())?;

    let session = match validate_token(&api_state.ory_state, &cookie, &access_token).await {
        Ok(session) => session,
        Err(AuthError::InternalServerError(message)) => {
            tracing::error!("Auth validation error: {}", message);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response());
        }
        Err(AuthError::Unauthorized) => {
            return Err((StatusCode::UNAUTHORIZED, Json("Unauthorized")).into_response());
        }
    };

    // Extract identity from session and get or create guest
    let identity = session.identity.as_ref().ok_or_else(|| {
        tracing::error!("Session missing identity information");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json("Session missing identity"),
        )
            .into_response()
    })?;

    let guest = match get_or_create_guest(&api_state.db_state, identity).await {
        Ok(guest) => guest,
        Err(err) => {
            tracing::error!("Failed to get or create guest: {:?}", err);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Failed to create user session"),
            )
                .into_response());
        }
    };

    Ok((session, guest))
}
