use axum::{
    Json,
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::IntoResponse,
};
use std::sync::Arc;
use uuid::Uuid;

use crate::auth::{AuthError, AuthSession, extract_cookie_access_token, validate_token};
use crate::model::Guest;
use crate::{api::ApiState, db::DbState};

/// Middleware to authenticate requests using Ory's session management.
///
/// This function extracts the access token from the request headers and authenticates it.
/// If successful, the session is stored in the request extension, otherwise and error
/// response is returned.
///
/// If there is a token, then we query the application database to retrieve the guest
/// information. If the guest does not exist, we create a new one.
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
    let (cookie, access_token) = extract_cookie_access_token(&headers)
        .ok_or_else(|| (StatusCode::UNAUTHORIZED, Json("Unauthorized")).into_response())?;

    let session = match validate_token(&api_state.ory_state, &cookie, &access_token).await {
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

    // Get or create the guest from the session
    let guest = get_or_create_guest(&api_state.db_state, &session).await?;

    Ok((session, guest))
}

async fn get_or_create_guest(
    db_state: &DbState,
    session: &AuthSession,
) -> Result<Guest, axum::response::Response> {
    // Extract the ory_identity_id from the session.
    let ory_identity_id = match &session.identity {
        Some(identity) => &identity.id,
        None => {
            return Err((StatusCode::UNAUTHORIZED, Json("No identity in session")).into_response());
        }
    };

    // Try to get existing guest
    if let Some(guest) = get_guest(db_state, ory_identity_id).await? {
        return Ok(guest);
    }
    tracing::info!("Guest not found, creating new guest");

    // Guest doesn't exist, create a new one
    // This branch should only occur when the user is first created, so should be rare.
    create_guest(db_state, session).await
}

async fn get_guest(
    db_state: &DbState,
    ory_identity_id: &str,
) -> Result<Option<Guest>, axum::response::Response> {
    let existing_guest = db_state
        .client
        .query_opt(
            "SELECT guest_id, ory_identity_id, name, email, phone, created_at, updated_at, deleted_at
             FROM guest
             WHERE ory_identity_id = $1 AND deleted_at IS NULL",
            &[&ory_identity_id],
        )
        .await
        .map_err(|e| {
            tracing::error!("Database error when querying guest: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        })?;

    if let Some(row) = existing_guest {
        let guest = Guest::from_row(&row).map_err(|e| {
            tracing::error!("Failed to parse guest from database row: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        })?;
        Ok(Some(guest))
    } else {
        Ok(None)
    }
}

async fn create_guest(
    db_state: &DbState,
    session: &AuthSession,
) -> Result<Guest, axum::response::Response> {
    let new_guest = session.to_guest().map_err(|e| {
        tracing::error!("Failed to create guest from session: {:?}", e);
        match e {
            AuthError::Unauthorized => {
                (StatusCode::UNAUTHORIZED, Json("Unauthorized")).into_response()
            }
            AuthError::InternalServerError(msg) => {
                tracing::error!("Internal server error: {}", msg);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json("Internal Server Error"),
                )
                    .into_response()
            }
        }
    })?;

    db_state
        .client
        .execute(
            "INSERT INTO guest (guest_id, ory_identity_id, name, email, phone, created_at, updated_at, deleted_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            &[
                &new_guest.guest_id,
                &new_guest.ory_identity_id,
                &new_guest.name,
                &new_guest.email,
                &new_guest.phone,
                &new_guest.created_at,
                &new_guest.updated_at,
                &new_guest.deleted_at,
            ],
        )
        .await
        .map_err(|e| {
            tracing::error!("Database error when inserting guest: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        })?;

    Ok(new_guest)
}

impl AuthSession {
    fn to_guest(&self) -> Result<Guest, AuthError> {
        let now = chrono::Utc::now();

        match &self.identity {
            Some(identity) => Ok(Guest {
                guest_id: Uuid::new_v4().to_string(),
                ory_identity_id: identity.id.clone(),
                name: identity
                    .traits
                    .name
                    .as_ref()
                    .ok_or(AuthError::InternalServerError(
                        "Unable to parse identity name".to_string(),
                    ))?
                    .to_string(),
                email: identity
                    .traits
                    .email
                    .as_ref()
                    .ok_or(AuthError::InternalServerError(
                        "Unable to parse identity email".to_string(),
                    ))?
                    .clone(),
                // TODO (sanjay) Should we enforce that phone number is provided?
                phone: identity
                    .traits
                    .phone
                    .as_ref()
                    .map_or("", |phone| phone)
                    .to_string(),
                created_at: now,
                updated_at: now,
                deleted_at: None,
            }),
            None => Err(AuthError::Unauthorized),
        }
    }
}
