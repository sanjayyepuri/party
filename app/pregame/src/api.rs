use axum::{
    Json,
    extract::{Path, State},
    http::Uri,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
};
use std::sync::Arc;

use crate::auth::{OryState, extract_cookie_access_token, validate_token};
use crate::db::DbState;
use crate::model::{Guest, Party, Rsvp, RsvpStatus, RsvpWithGuest};

pub struct ApiState {
    pub ory_state: OryState,
    pub db_state: DbState,
}

// Guest endpoints
pub async fn get_guest(
    State(api_state): State<Arc<ApiState>>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    match Guest::get_guest(&api_state.db_state.client, id).await {
        Ok(guest) => (StatusCode::OK, Json(guest)).into_response(),
        Err(err) => {
            tracing::error!("Failed to get guest: {:?}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        }
    }
}

pub async fn update_guest(
    State(api_state): State<Arc<ApiState>>,
    Json(guest): Json<Guest>,
) -> impl IntoResponse {
    match Guest::update_guest(&api_state.db_state.client, guest).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(err) => {
            tracing::error!("Failed to update guest: {:?}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        }
    }
}

// Party endpoints
pub async fn get_party(
    State(api_state): State<Arc<ApiState>>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    match Party::get_party(&api_state.db_state.client, id).await {
        Ok(party) => (StatusCode::OK, Json(party)).into_response(),
        Err(err) => {
            tracing::error!("Failed to get party: {:?}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        }
    }
}

// RSVP endpoints
pub async fn get_rsvp(
    State(api_state): State<Arc<ApiState>>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    match Rsvp::get_rsvp(&api_state.db_state.client, id).await {
        Ok(rsvp) => (StatusCode::OK, Json(rsvp)).into_response(),
        Err(err) => {
            tracing::error!("Failed to get RSVP: {:?}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        }
    }
}

pub async fn get_rsvp_by_guest_party(
    State(api_state): State<Arc<ApiState>>,
    Path((guest_id, party_id)): Path<(i32, i32)>,
) -> impl IntoResponse {
    match Rsvp::get_rsvps_by_guest_party(&api_state.db_state.client, guest_id, party_id).await {
        Ok(rsvp) => (StatusCode::OK, Json(rsvp)).into_response(),
        Err(err) => {
            tracing::error!("Failed to get RSVP by guest and party: {:?}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        }
    }
}

#[derive(serde::Deserialize)]
pub struct UpdateRsvpRequest {
    pub status: RsvpStatus,
}

pub async fn update_rsvp(
    State(api_state): State<Arc<ApiState>>,
    Path(id): Path<i32>,
    Json(request): Json<UpdateRsvpRequest>,
) -> impl IntoResponse {
    match Rsvp::update_rsvp(&api_state.db_state.client, id, request.status).await {
        Ok(rsvp) => (StatusCode::OK, Json(rsvp)).into_response(),
        Err(err) => {
            tracing::error!("Failed to update RSVP: {:?}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        }
    }
}

pub async fn get_party_rsvps(
    State(api_state): State<Arc<ApiState>>,
    Path(party_id): Path<i32>,
) -> impl IntoResponse {
    match Rsvp::get_rsvps_by_party_with_guest(&api_state.db_state.client, party_id).await {
        Ok(rsvps) => (StatusCode::OK, Json(rsvps)).into_response(),
        Err(err) => {
            tracing::error!("Failed to get party RSVPs: {:?}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json("Internal Server Error"),
            )
                .into_response()
        }
    }
}

pub async fn fallback(uri: Uri) -> impl IntoResponse {
    format!("Axum fallback for path {}", uri.path())
}
