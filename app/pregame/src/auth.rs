// The pregame is a resource server for hosting party and rsvp state. We are
// are using Ory for authentication and authorization. The ory module will
// implement the oauth2 flow to determine if an access token is valid.
//
// https://www.ory.com/docs/reference/api#tag/oAuth2/operation/introspectOAuth2Token
// This is the documentation for the endpoint that introspects an access token.

use axum::http::HeaderMap;
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

static ORY_SESSION_ENDPOINT: &str = "/sessions/whoami";

/// Represents the subset of an Ory `/sessions/whoami` response that this
/// service cares about when validating a user's session.
///
/// An `AuthSession` is returned by [`validate_token`] after forwarding the
/// user's Ory session cookie to Hydra. The `active` flag is then used to
/// decide whether the request should be treated as authenticated.
#[derive(Deserialize)]
pub struct AuthSession {
    /// Indicates whether Ory considers this session currently active/valid.
    ///
    /// When `false`, the session is treated as unauthorized by
    /// [`validate_token`], and an [`AuthError::Unauthorized`] is returned.
    pub active: bool,
    /// The unique identifier of the Ory session associated with the
    /// authenticated user.
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

// Tower middleware layer for authentication

use axum::{
    body::Body,
    extract::Request,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use std::sync::Arc;
use tower::{Layer, Service};

/// Tower layer that enforces authentication on all requests.
///
/// This layer wraps a service and checks for a valid Ory session cookie
/// before allowing the request to proceed. If authentication fails, it
/// returns a 401 Unauthorized response.
#[derive(Clone)]
pub struct AuthLayer {
    pub ory_state: Arc<OryState>,
}

impl AuthLayer {
    pub fn new(ory_state: Arc<OryState>) -> Self {
        Self { ory_state }
    }
}

impl<S> Layer<S> for AuthLayer {
    type Service = AuthMiddleware<S>;

    fn layer(&self, inner: S) -> Self::Service {
        AuthMiddleware {
            inner,
            ory_state: self.ory_state.clone(),
        }
    }
}

/// The middleware service that performs the actual authentication check.
#[derive(Clone)]
pub struct AuthMiddleware<S> {
    inner: S,
    ory_state: Arc<OryState>,
}

impl<S> Service<Request> for AuthMiddleware<S>
where
    S: Service<Request, Response = Response> + Clone + Send + 'static,
    S::Future: Send + 'static,
{
    type Response = Response;
    type Error = S::Error;
    type Future = std::pin::Pin<
        Box<dyn std::future::Future<Output = Result<Self::Response, Self::Error>> + Send>,
    >;

    fn poll_ready(
        &mut self,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, req: Request) -> Self::Future {
        let ory_state = self.ory_state.clone();
        let mut inner = self.inner.clone();

        Box::pin(async move {
            // Extract the Ory session cookie from headers
            let (cookie_name, session_token) = match extract_cookie_access_token(req.headers()) {
                Some(cookie) => cookie,
                None => {
                    return Ok((StatusCode::UNAUTHORIZED, "Unauthorized").into_response());
                }
            };

            // Validate the token with Ory
            match validate_token(&ory_state, &cookie_name, &session_token).await {
                Ok(_session) => {
                    // Authentication successful, proceed with the request
                    inner.call(req).await
                }
                Err(AuthError::Unauthorized) => {
                    Ok((StatusCode::UNAUTHORIZED, "Unauthorized").into_response())
                }
                Err(AuthError::InternalServerError(msg)) => {
                    tracing::error!("Authentication error: {}", msg);
                    Ok(
                        (StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error")
                            .into_response(),
                    )
                }
            }
        })
    }
}
