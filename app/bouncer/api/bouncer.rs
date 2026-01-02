use axum::middleware;
use axum::{
    routing::{get, post, put},
    Router,
};
use std::sync::Arc;
use tower::ServiceBuilder;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use vercel_runtime::axum::VercelLayer;
use vercel_runtime::Error;

use pregame::api::{auth, error, party, rsvp, ApiState};
use pregame::db::DbState;

#[tokio::main]
async fn main() -> Result<(), Error> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .init();

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

    let api_state = Arc::new(ApiState { db_state });

    let api_routes = Router::new()
        .route("/parties", get(party::list_parties))
        .route("/parties/{party_id}", get(party::get_party))
        .route("/parties/{party_id}/rsvps", get(rsvp::get_party_rsvps))
        .route(
            "/parties/{party_id}/rsvp",
            post(rsvp::get_rsvp).delete(rsvp::delete_rsvp),
        )
        .route("/rsvps", put(rsvp::update_rsvp))
        .route_layer(middleware::from_fn_with_state(
            api_state.clone(),
            auth::auth_middleware,
        ));

    let app = Router::new()
        .nest("/api/bouncer", api_routes)
        .fallback(error::fallback)
        .layer(TraceLayer::new_for_http())
        .with_state(api_state);

    let app = ServiceBuilder::new().layer(VercelLayer::new()).service(app);
    vercel_runtime::run(app).await
}
