// The pregame is a resource server for hosting party and rsvp state. We are
// using Better Auth for authentication. The auth module validates session
// tokens by querying the database directly.

use axum::http::HeaderMap;
use percent_encoding::percent_decode_str;
use serde::Deserialize;
use tokio_postgres::Client;

/// Represents a validated Better Auth session with user information.
///
/// This is returned after successfully validating a session token
/// against the database. Contains the user's ID, email, and name.
#[derive(Debug, Clone)]
pub struct BetterAuthSession {
    /// Unique session identifier from Better Auth
    pub session_id: String,
    /// User ID from Better Auth (stored in guest.better_auth_user_id)
    pub user_id: String,
    /// User's email address
    pub email: String,
    /// User's display name
    pub name: Option<String>,
    /// User's phone number (optional)
    pub phone: Option<String>,
}

#[derive(Debug)]
pub enum AuthError {
    InternalServerError(String),
    Unauthorized,
}

impl From<tokio_postgres::Error> for AuthError {
    fn from(err: tokio_postgres::Error) -> Self {
        AuthError::InternalServerError(format!("Database error: {}", err))
    }
}

/// Extracts the Better Auth session token from request headers.
///
/// Better Auth uses a cookie named "better-auth.session_token" by default.
/// The cookie value is signed using HMAC in the format: "value.signature"
/// This function extracts the unsigned token value (before the dot) since
/// the database stores only the unsigned token.
pub fn extract_session_token(headers: &HeaderMap) -> Option<String> {
    // Try Cookie header (looking for better-auth.session_token)
    if let Some(cookie_header) = headers.get("cookie") {
        if let Ok(cookie_str) = cookie_header.to_str() {
            for cookie in cookie_str.split(';') {
                let cookie = cookie.trim();
                if cookie.starts_with("better-auth.session_token=") {
                    if let Some((_, value)) = cookie.split_once('=') {
                        // URL-decode the cookie value
                        let decoded_value =
                            percent_decode_str(value).decode_utf8().ok()?.into_owned();

                        // Better Auth uses signed cookies in format: "value.signature"
                        // The database stores only the unsigned value (before the dot)
                        // Extract just the token value, ignoring the signature
                        let token_value = if let Some((token, _signature)) = decoded_value.split_once('.') {
                            token.to_string()
                        } else {
                            // Fallback: if no signature found, use full value
                            decoded_value
                        };

                        return Some(token_value);
                    }
                }
            }
        }
    }

    None
}

/// Validates a Better Auth session token by querying the database.
///
/// This function:
/// 1. Queries the session table for the given token
/// 2. Checks if the session has expired
/// 3. Joins with the user table to get user information
/// 4. Returns a BetterAuthSession if valid
///
/// # Arguments
/// * `db_client` - Database connection from DbState
/// * `session_token` - The session token from the cookie
///
/// # Returns
/// * `Ok(BetterAuthSession)` if the session is valid and not expired
/// * `Err(AuthError::Unauthorized)` if the session is invalid or expired
/// * `Err(AuthError::InternalServerError)` for database errors
pub async fn validate_session_token(
    db_client: &Client,
    session_token: &str,
) -> Result<BetterAuthSession, AuthError> {
    // Query session and join with user table
    let query = r#"
        SELECT
            s.id as session_id,
            s."userId" as user_id,
            s."expiresAt" as expires_at,
            u.email,
            u.name,
            u.phone
        FROM session s
        JOIN "user" u ON s."userId" = u.id
        WHERE s.token = $1
    "#;

    let row = db_client
        .query_opt(query, &[&session_token])
        .await?
        .ok_or(AuthError::Unauthorized)?;

    tracing::debug!("row: {:?}", row);

    // Check if session has expired
    let expires_at: chrono::DateTime<chrono::Utc> = row.get("expires_at");
    if expires_at < chrono::Utc::now() {
        return Err(AuthError::Unauthorized);
    }

    Ok(BetterAuthSession {
        session_id: row.get("session_id"),
        user_id: row.get("user_id"),
        email: row.get("email"),
        name: row.get("name"),
        phone: row.get("phone"),
    })
}
