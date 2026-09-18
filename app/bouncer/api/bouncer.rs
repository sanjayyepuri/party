use axum::middleware;
use axum::{
    Router,
    routing::{get, post, put},
};
use std::sync::Arc;
use tower::ServiceBuilder;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{EnvFilter, layer::SubscriberExt, util::SubscriberInitExt};
use vercel_runtime::Error;
use vercel_runtime::axum::VercelLayer;

use pregame::api::{ApiState, auth, calendar, error, party, rsvp};
use pregame::db::DbState;

#[tokio::main]
async fn main() -> Result<(), Error> {
    dotenvy::dotenv().ok();

    let log_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,tower_http=debug"))
        // Database TRACE logs include bound parameters such as session tokens.
        .add_directive("tokio_postgres=warn".parse()?);

    tracing_subscriber::registry()
        .with(log_filter)
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

    let protected_api_routes = Router::new()
        .route("/parties", get(party::list_parties))
        .route("/parties/{party_id}", get(party::get_party))
        .route(
            "/parties/{party_id}/calendar.ics",
            get(calendar::download_party_calendar),
        )
        .route("/parties/{party_id}/rsvps", get(rsvp::get_party_rsvps))
        .route(
            "/parties/{party_id}/rsvp",
            post(rsvp::get_rsvp).delete(rsvp::delete_rsvp),
        )
        .route("/rsvps", put(rsvp::update_rsvp))
        .route("/calendar/feed-token", get(calendar::get_feed_token))
        .route(
            "/calendar/feed-token/rotate",
            post(calendar::rotate_feed_token),
        )
        .route_layer(middleware::from_fn_with_state(
            api_state.clone(),
            auth::auth_middleware,
        ));

    let public_api_routes =
        Router::new().route("/calendar/feed.ics", get(calendar::get_calendar_feed));

    let api_routes = Router::new()
        .merge(public_api_routes)
        .merge(protected_api_routes);

    let app = Router::new()
        .nest("/api/bouncer", api_routes)
        .fallback(error::fallback)
        .layer(
            TraceLayer::new_for_http().make_span_with(|request: &axum::http::Request<_>| {
                tracing::debug_span!(
                    "request",
                    method = %request.method(),
                    path = %request.uri().path(),
                    version = ?request.version(),
                )
            }),
        )
        .with_state(api_state);

    let app = ServiceBuilder::new().layer(VercelLayer::new()).service(app);
    vercel_runtime::run(app).await
}
