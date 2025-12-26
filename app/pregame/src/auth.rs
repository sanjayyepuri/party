// The pregame is a resource server for hosting party and rsvp state. We are
// are using Ory for authentication and authorization. The ory module will
// implement the oauth2 flow to determine if an access token is valid.
//
// https://www.ory.com/docs/reference/api#tag/oAuth2/operation/introspectOAuth2Token
// This is the documentation for the endpoint that introspects an access token.

use axum::http::HeaderMap;
use percent_encoding::percent_decode_str;
use reqwest::Client;
use serde::Deserialize;
use url::Url;

/// Runtime state required for talking to the Ory (Hydra) API from this module.
///
/// This struct is intended to be created once at application startup (for example,
/// from environment variables or a configuration file) and then shared or injected
/// wherever Ory-backed authentication is needed. It contains both configuration
/// (the base URL of the Ory SDK / API) and runtime state (the HTTP client).
///
/// # URL format
///
/// `ory_sdk_url` must be a fully-qualified base URL (including scheme and host),
/// such as `https://ory-hydra.example.com/`. It should *not* include endpoint-
/// specific paths; this module appends paths like [`ORY_SESSION_ENDPOINT`] using
/// [`Url::join`]. A trailing slash on the base URL is allowed but not required.
pub struct OryState {
    /// Base URL of the Ory Hydra API used by this service (scheme + host, optional port).
    /// The URL must be suitable for `ory_sdk_url.join(ORY_SESSION_ENDPOINT)`.
    pub ory_sdk_url: Url,
    /// Reusable HTTP client that maintains a connection pool for efficiency.
    pub client: Client,
}

/// This is the ory endpoint which is used to determine whether the session provided in
/// the request is valid.
///
/// https://www.ory.com/docs/reference/api#tag/frontend/operation/toSession
static ORY_SESSION_ENDPOINT: &str = "/sessions/whoami";

/// Represents the subset of an Ory `/sessions/whoami` response that this
/// service cares about when validating a user's session.
///
/// An `AuthSession` is returned by [`validate_token`] after forwarding the
/// user's Ory session cookie to Hydra. The `active` flag is then used to
/// decide whether the request should be treated as authenticated.
#[derive(Debug, Deserialize, Clone)]
pub struct AuthSession {
    /// Indicates whether Ory considers this session currently active/valid.
    ///
    /// When `false`, the session is treated as unauthorized by
    /// [`validate_token`], and an [`AuthError::Unauthorized`] is returned.
    pub active: bool,
    /// The unique identifier of the Ory session associated with the
    /// authenticated user.
    pub id: String,
    /// The identity associated with this session.
    /// Contains the unique identity ID and user traits from Ory.
    pub identity: Option<OryIdentity>,
}

/// Represents the Ory identity associated with an authenticated session.
///
/// This struct contains the identity ID (which we'll store in our guest table)
/// and the user's traits (email, phone, name) that can be synced to our database.
#[derive(Debug, Deserialize, Clone)]
pub struct OryIdentity {
    /// Unique identifier for this identity in Ory's system.
    /// This is what we store in the guest.ory_identity_id column.
    pub id: String,
    /// User traits/attributes configured in Ory's identity schema.
    /// Contains JSON data representing user traits from Ory's identity schema.
    pub traits: IdentityTraits,
}

/// User traits/attributes from Ory's identity schema.
///
/// These fields represent the user's profile information that can be
/// synced to our guest table. All fields are optional as the Ory
/// identity schema may not require them.
#[derive(Debug, Deserialize, Clone)]
pub struct IdentityTraits {
    /// User's email address
    pub email: Option<String>,
    /// User's phone number
    pub phone: Option<String>,
    /// User's display name
    pub name: Option<IdentityName>,
}

/// Currently the Ory Name Trait is configured with first and last name.
/// TODO (sanjay) Consider collapsing this into a single field.
#[derive(Debug, Deserialize, Clone)]
pub struct IdentityName {
    /// User's first name
    pub first: Option<String>,
    /// User's last name
    pub last: Option<String>,
}

impl IdentityName {
    /// Converts the identity name into a single string representation.
    pub fn full_name(&self) -> String {
        match (&self.first, &self.last) {
            (Some(first), Some(last)) => format!("{} {}", first, last),
            (Some(first), None) => first.clone(),
            (None, Some(last)) => last.clone(),
            (None, None) => String::new(),
        }
    }
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
                        // URL-decode the cookie value
                        // TODO (sanjay) I am not convinced that we should be url decoding the token on the server side
                        // Need to determine why nextjs server url encodes the token.
                        let decoded_value =
                            percent_decode_str(value).decode_utf8().ok()?.into_owned();
                        return Some((name.to_string(), decoded_value));
                    }
                }
            }
        }
    }

    None
}

/// Forwards the cookie to ory's session endpoint
pub async fn validate_token(
    config: &OryState,
    cookie_name: &str,
    session_token: &str,
) -> Result<AuthSession, AuthError> {
    let url = config.ory_sdk_url.join(ORY_SESSION_ENDPOINT)?;

    let response = config
        .client
        .get(url)
        .header("Cookie", format!("{}={}", cookie_name, session_token))
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(AuthError::InternalServerError(format!(
            "Ory service returned error status: {}",
            response.status()
        )));
    }

    let result = response.json::<AuthSession>().await?;
    if result.active {
        Ok(result)
    } else {
        Err(AuthError::Unauthorized)
    }
}
