use axum::middleware;
use axum::{
    routing::{delete, get, post},
    Router,
};
use reqwest::Client;
use std::sync::Arc;
use tower::ServiceBuilder;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use url::Url;
use vercel_runtime::axum::VercelLayer;
use vercel_runtime::Error;

use pregame::api::{auth, error, party, rsvp, ApiState};
use pregame::auth::OryState;
use pregame::db::DbState;

#[tokio::main]
async fn main() -> Result<(), Error> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .init();

    let ory_sdk_url = match std::env::var("NEXT_PUBLIC_ORY_SDK_URL") {
        Ok(value) => value,
        Err(e) => {
            tracing::error!(
                "Environment variable NEXT_PUBLIC_ORY_SDK_URL must be set: {}",
                e
            );
            return Err(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("NEXT_PUBLIC_ORY_SDK_URL must be set: {}", e),
            )
            .into());
        }
    };
    let ory_sdk_url = match Url::parse(&ory_sdk_url) {
        Ok(url) => url,
        Err(e) => {
            tracing::error!("Invalid Ory SDK URL in NEXT_PUBLIC_ORY_SDK_URL: {}", e);
            return Err(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("Invalid Ory SDK URL: {}", e),
            )
            .into());
        }
    };

    let postgres_connection_string = match std::env::var("NEON_POSTGRES_URL") {
        Ok(value) => value,
        Err(e) => {
            tracing::error!("Environment variable NEON_POSTGRES_URL must be set: {}", e);
            return Err(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("NEON_POSTGRES_URL must be set: {}", e),
            )
            .into());
        }
    };

    let ory_state = OryState {
        ory_sdk_url,
        client: Client::new(),
    };

    let db_state = match DbState::new(postgres_connection_string).await {
        Ok(state) => state,
        Err(e) => {
            tracing::error!("Failed to initialize database state: {}", e);
            return Err(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("Failed to initialize database state: {}", e),
            )
            .into());
        }
    };

    let api_state = Arc::new(ApiState {
        ory_state,
        db_state,
    });

    tracing::info!("Starting server");
    tracing::info!(
        "Ory SDK configured at: {:?}",
        api_state.as_ref().ory_state.ory_sdk_url
    );

    let app = Router::new()
        .route("/api/bouncer/parties", get(party::list_parties))
        .route("/api/bouncer/parties/{slug}", get(party::get_party))
        .route(
            "/api/bouncer/parties/{party_id}/rsvps",
            get(rsvp::get_party_rsvps),
        )
        .route(
            "/api/bouncer/parties/{party_id}/rsvps/{guest_id}",
            get(rsvp::get_rsvp),
        )
        .route("/api/bouncer/rsvps", post(rsvp::update_rsvp))
        .route(
            "/api/bouncer/parties/{party_id}/rsvps/{guest_id}",
            delete(rsvp::delete_rsvp),
        )
        .route_layer(middleware::from_fn_with_state(
            api_state.clone(),
            auth::auth_middleware,
        ))
        .fallback(error::fallback)
        .layer(TraceLayer::new_for_http())
        .with_state(api_state);

    let app = ServiceBuilder::new().layer(VercelLayer::new()).service(app);
    vercel_runtime::run(app).await
}
