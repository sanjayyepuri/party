use axum::{
    routing::{get, put},
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

use pregame::api::{
    fallback, get_guest, get_party, get_party_rsvps, get_rsvp, get_rsvp_by_guest_party,
    hello_world, update_guest, update_rsvp, ApiState,
};
use pregame::auth::{AuthLayer, OryState};
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
        .route("/", get(hello_world))
        .route("/hello", get(hello_world))
        .route("/api/bouncer/hello", get(hello_world))
        // Guest endpoints
        .route("/api/bouncer/guests/:id", get(get_guest).put(update_guest))
        // Party endpoints
        .route("/api/bouncer/parties/:id", get(get_party))
        .route("/api/bouncer/parties/:party_id/rsvps", get(get_party_rsvps))
        // RSVP endpoints
        .route("/api/bouncer/rsvps/:id", get(get_rsvp).put(update_rsvp))
        .route(
            "/api/bouncer/rsvps/guest/:guest_id/party/:party_id",
            get(get_rsvp_by_guest_party),
        )
        .fallback(fallback)
        .layer(AuthLayer::new(Arc::new(
            api_state.as_ref().ory_state.clone(),
        )))
        .layer(TraceLayer::new_for_http())
        .with_state(api_state);

    let app = ServiceBuilder::new().layer(VercelLayer::new()).service(app);
    vercel_runtime::run(app).await
}
