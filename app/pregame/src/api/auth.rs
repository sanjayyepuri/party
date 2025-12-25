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

/// Middleware to authenticate requests using Ory's session management.
///
/// This function extracts the access token from the request headers and authenticates it.
/// If successful, the session is stored in the request extension, otherwise and error
/// response is returned.
///
/// https://docs.rs/axum/latest/axum/middleware/index.html
/// This is the simplest way to implemenet middleware in axum. It would be a good exercise, to
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
