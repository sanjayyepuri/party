// The pregame is a resource server for hosting party and rsvp state. We are
// are using Ory for authentication and authorization. The ory module will
// implement the oauth2 flow to determine if an access token is valid.
//
// https://www.ory.com/docs/reference/api#tag/oAuth2/operation/introspectOAuth2Token
// Is document for the endpoint that introspect an access token.

use axum::http::HeaderMap;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use url::Url;

/// Contains the configuration for Ory.
pub struct OryConfig {
    /// The API Endpoint to access the Ory Hydra API
    pub ory_sdk_url: Url,
}

static ORY_SESSION_ENDPOINT: &str = "/sessions/whoami";

#[derive(Deserialize)]
pub struct AuthSession {
    pub active: bool,
    pub id: String,
}

#[derive(Debug)]
pub enum AuthError {
    InternalServerError(String),
    Unauthorized,
}

impl From<url::ParseError> for AuthError {
    fn from(_: url::ParseError) -> Self {
        AuthError::InternalServerError("URL parsing error".to_string())
    }
}

impl From<reqwest::Error> for AuthError {
    fn from(_: reqwest::Error) -> Self {
        AuthError::InternalServerError("Failed to make HTTP request.".to_string())
    }
}

impl From<serde_json::Error> for AuthError {
    fn from(_: serde_json::Error) -> Self {
        AuthError::InternalServerError("Failed to parse JSON response".to_string())
    }
}

/// Extracts the access token from the headers.
/// In theory, we may receive the access token in headers, but we currently only support cookies.
pub fn extract_cookie_access_token(headers: &HeaderMap) -> Option<(String, String)> {
    // Try Cookie header (looking for ory_session_*)
    if let Some(cookie_header) = headers.get("cookie") {
        if let Ok(cookie_str) = cookie_header.to_str() {
            for cookie in cookie_str.split(';') {
                let cookie = cookie.trim();
                if cookie.starts_with("ory_session_") {
                    if let Some((name, value)) = cookie.split_once('=') {
                        return Some((name.to_string(), value.to_string()));
                    }
                }
            }
        }
    }

    None
}

/// Forwards the cookie to ory's session endpoint
pub async fn validate_token(
    config: &OryConfig,
    cookie_name: &str,
    session_token: &str,
) -> Result<AuthSession, AuthError> {
    let url = config.ory_sdk_url.join(ORY_SESSION_ENDPOINT)?;

    let client = Client::new();
    let response = client
        .get(url)
        .header("Cookie", format!("{}={}", cookie_name, session_token))
        .send()
        .await?;

    let result = response.json::<AuthSession>().await?;
    if result.active {
        Ok(result)
    } else {
        Err(AuthError::Unauthorized)
    }
}
