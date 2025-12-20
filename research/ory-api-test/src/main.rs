use axum::{
    extract::State,
    http::{header, HeaderMap, Method, StatusCode},
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Clone)]
struct AppState {
    ory_sdk_url: String,
    http_client: reqwest::Client,
}

#[derive(Debug, Serialize, Deserialize)]
struct ValidateResponse {
    valid: bool,
    session: Option<serde_json::Value>,
    error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Session {
    id: String,
    active: bool,
    identity: serde_json::Value,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "ory_api_test=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load environment variables
    dotenvy::dotenv().ok();

    let ory_sdk_url =
        std::env::var("NEXT_PUBLIC_ORY_SDK_URL").expect("NEXT_PUBLIC_ORY_SDK_URL must be set");

    let state = Arc::new(AppState {
        ory_sdk_url,
        http_client: reqwest::Client::new(),
    });

    let origins = [
        "http://localhost:3000".parse().unwrap(),
        "http://localhost:3001".parse().unwrap(),
    ];

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(origins)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([
            header::AUTHORIZATION,
            header::CONTENT_TYPE,
            header::COOKIE,
            header::HeaderName::from_static("x-session-token"),
        ])
        .allow_credentials(true);

    // Build our application with routes
    let app = Router::new()
        .route("/", get(root))
        .route("/validate", post(validate_token))
        .route("/health", get(health_check))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // Run the server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await.unwrap();

    tracing::info!("listening on {}", listener.local_addr().unwrap());

    axum::serve(listener, app).await.unwrap();
}

async fn root() -> &'static str {
    "Ory Kratos Token Validation API"
}

async fn health_check() -> StatusCode {
    StatusCode::OK
}

async fn validate_token(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> (StatusCode, Json<ValidateResponse>) {
    // Extract the session token from the Authorization header or Cookie
    let token_info = extract_token(&headers);

    if token_info.is_none() {
        tracing::warn!("No session token found in request headers");
        return (
            StatusCode::UNAUTHORIZED,
            Json(ValidateResponse {
                valid: false,
                session: None,
                error: Some("No session token provided".to_string()),
            }),
        );
    }

    let (cookie_name, token) = token_info.unwrap();
    tracing::info!(
        "Extracted token from '{}' (first 10 chars): {}...",
        cookie_name,
        &token.chars().take(10).collect::<String>()
    );

    // Validate the session with Ory Kratos
    match validate_session_with_kratos(&state, &cookie_name, &token).await {
        Ok(session) => {
            tracing::info!(
                "Session validation successful for identity: {}",
                session
                    .identity
                    .get("id")
                    .unwrap_or(&serde_json::Value::String("unknown".to_string()))
            );
            if session.active {
                (
                    StatusCode::OK,
                    Json(ValidateResponse {
                        valid: true,
                        session: Some(serde_json::to_value(session).unwrap()),
                        error: None,
                    }),
                )
            } else {
                (
                    StatusCode::UNAUTHORIZED,
                    Json(ValidateResponse {
                        valid: false,
                        session: None,
                        error: Some("Session is not active".to_string()),
                    }),
                )
            }
        }
        Err(e) => {
            tracing::error!("Error validating session: {}", e);
            (
                StatusCode::UNAUTHORIZED,
                Json(ValidateResponse {
                    valid: false,
                    session: None,
                    error: Some(format!("Invalid session: {}", e)),
                }),
            )
        }
    }
}

/// Extracts the token from the headers.
fn extract_token(headers: &HeaderMap) -> Option<(String, String)> {
    // Try Authorization header first (Bearer token)
    if let Some(auth_header) = headers.get("authorization") {
        if let Ok(auth_str) = auth_header.to_str() {
            if auth_str.starts_with("Bearer ") {
                return Some(("bearer".to_string(), auth_str[7..].to_string()));
            }
        }
    }

    // Try X-Session-Token header
    if let Some(session_header) = headers.get("x-session-token") {
        if let Ok(token) = session_header.to_str() {
            return Some(("x-session-token".to_string(), token.to_string()));
        }
    }

    // Try Cookie header (looking for ory_session_*)
    if let Some(cookie_header) = headers.get("cookie") {
        if let Ok(cookie_str) = cookie_header.to_str() {
            tracing::debug!("Received cookies: {}", cookie_str);
            for cookie in cookie_str.split(';') {
                let cookie = cookie.trim();
                if cookie.starts_with("ory_session_") {
                    if let Some((name, value)) = cookie.split_once('=') {
                        tracing::info!("Found Ory session cookie: {}", name);
                        return Some((name.to_string(), value.to_string()));
                    }
                }
            }
        }
    }

    None
}

async fn validate_session_with_kratos(
    state: &AppState,
    cookie_name: &str,
    session_token: &str,
) -> Result<Session, Box<dyn std::error::Error>> {
    let url = format!("{}/sessions/whoami", state.ory_sdk_url);

    tracing::info!("validating with kratos: {}", url);

    let response = state
        .http_client
        .get(&url)
        .header("Cookie", format!("{}={}", cookie_name, session_token))
        .send()
        .await?;

    let status = response.status();
    tracing::info!("Kratos response status: {}", status);

    if !status.is_success() {
        let error_body = response
            .text()
            .await
            .unwrap_or_else(|_| "Unable to read error body".to_string());
        tracing::error!("Kratos error response: {}", error_body);
        return Err(format!("Kratos returned status {}: {}", status, error_body).into());
    }

    let session: Session = response.json().await?;
    Ok(session)
}
