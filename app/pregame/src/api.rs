use crate::auth::ory::{OryConfig, extract_cookie_access_token, validate_token};
use axum::{Json, extract::State, http::HeaderMap, http::Uri, response::IntoResponse};
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
        None => return Json("Unauthorized"),
    };

    match validate_token(ory_config, &cookie, &access_token).await {
        Ok(_) => Json("Hello, world!"),
        Err(_) => return Json("Unauthorized"),
    }
}

pub async fn fallback(uri: Uri) -> impl IntoResponse {
    format!("Axum fallback for path {}", uri.path())
}
