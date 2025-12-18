use crate::auth::ory::{OryConfig, extract_cookie_access_token, validate_token};
use axum::{Json, extract::State, http::{HeaderMap, StatusCode}, http::Uri, response::IntoResponse};
use std::sync::Arc;

pub struct ApiState {
    pub ory_config: OryConfig,
}

/// Temporary testing endpoint to ensure cookie and access token are extracted correctly
pub async fn hello_world(
    State(api_state): State<Arc<ApiState>>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let ory_config = &api_state.ory_config;

    let (cookie, access_token) = match extract_cookie_access_token(&headers) {
        Some(token) => token,
        None => return (StatusCode::UNAUTHORIZED, Json("Unauthorized")).into_response(),
    };

    match validate_token(ory_config, &cookie, &access_token).await {
        Ok(_) => (StatusCode::OK, Json("Hello, world!")).into_response(),
        Err(err) => {
            eprintln!("Token validation failed: {:?}", err);
            (StatusCode::UNAUTHORIZED, Json("Unauthorized")).into_response()
        }
    }
}

pub async fn fallback(uri: Uri) -> impl IntoResponse {
    format!("Axum fallback for path {}", uri.path())
}
