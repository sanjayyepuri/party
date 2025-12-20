use axum::{
    Json,
    extract::State,
    http::Uri,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
};
use std::sync::Arc;

use crate::auth::{OryState, extract_cookie_access_token, validate_token};
use crate::db::DbState;
use crate::model::Book;

pub struct ApiState {
    pub ory_state: OryState,
    pub db_state: DbState,
}

/// Temporary testing endpoint to ensure cookie and access token are extracted correctly
pub async fn hello_world(
    State(api_state): State<Arc<ApiState>>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let ory_config = &api_state.ory_state;

    let (cookie, access_token) = match extract_cookie_access_token(&headers) {
        Some(token) => token,
        None => return (StatusCode::UNAUTHORIZED, Json("Unauthorized")).into_response(),
    };

    match validate_token(ory_config, &cookie, &access_token).await {
        Ok(_) => {
            let db = &api_state.db_state;
            match db.client.query("SELECT * FROM books;", &[]).await {
                Ok(rows) => {
                    let books: Vec<Book> =
                        match rows.into_iter().map(|row| Book::from_row(&row)).collect() {
                            Ok(books) => books,
                            Err(err) => {
                                tracing::error!("Failed to parse book from row: {:?}", err);
                                return (
                                    StatusCode::INTERNAL_SERVER_ERROR,
                                    Json("Internal Server Error"),
                                )
                                    .into_response();
                            }
                        };
                    (StatusCode::OK, Json(books)).into_response()
                }
                Err(err) => {
                    tracing::error!("Database query failed: {:?}", err);
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json("Internal Server Error"),
                    )
                        .into_response()
                }
            }
        }

        Err(err) => {
            tracing::error!("Token validation failed: {:?}", err);
            (StatusCode::UNAUTHORIZED, Json("Unauthorized")).into_response()
        }
    }
}

pub async fn fallback(uri: Uri) -> impl IntoResponse {
    format!("Axum fallback for path {}", uri.path())
}
