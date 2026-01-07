use axum::{
    Json,
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::IntoResponse,
};
use std::sync::Arc;

use crate::api::ApiState;
use crate::auth::{AuthError, BetterAuthSession, extract_session_token, validate_session_token};

/// Middleware to authenticate requests using Better Auth's session management.
///
/// This function extracts the session token from the request headers and validates it
/// against the database. If successful, the session is stored in the request extension,
/// otherwise an error response is returned.
///
/// The session contains all user information from the Better Auth user table,
/// so we no longer need a separate guest table.
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
) -> Result<BetterAuthSession, axum::response::Response> {
    let session_token = extract_session_token(&headers)
        .ok_or_else(|| (StatusCode::UNAUTHORIZED, Json("Unauthorized")).into_response())?;

    let session = match validate_session_token(&api_state.db_state.pool, &session_token).await {
        Ok(session) => session,
        Err(AuthError::InternalServerError(message)) => {
            tracing::error!("Internal server error: {}", message);
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

    Ok(session)
}
