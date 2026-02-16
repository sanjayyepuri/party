use axum::middleware;
use axum::{
    routing::{get, post, put},
    Router,
};
use std::sync::Arc;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use pregame::api::{auth, error, party, rsvp, ApiState};
use pregame::db::DbState;

fn build_app(api_state: Arc<ApiState>) -> Router {
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

    Router::new()
        .nest("/api/bouncer", api_routes)
        .fallback(error::fallback)
        .layer(TraceLayer::new_for_http())
        .with_state(api_state)
}

async fn init_state() -> Result<Arc<ApiState>, Box<dyn std::error::Error>> {
    dotenvy::from_filename(".env.local").ok();
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .init();

    let postgres_connection_string = std::env::var("NEON_POSTGRES_URL")
        .map_err(|e| format!("NEON_POSTGRES_URL must be set: {}", e))?;

    let db_state = DbState::new(postgres_connection_string).await?;

    Ok(Arc::new(ApiState { db_state }))
}

#[cfg(not(feature = "vercel"))]
#[tokio::main]
async fn main() {
    let api_state = init_state().await.expect("Failed to initialize API state");
    let app = build_app(api_state);

    let port = std::env::var("BOUNCER_PORT").unwrap_or_else(|_| "30021".to_string());
    let addr = format!("0.0.0.0:{}", port);
    tracing::info!("Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

#[cfg(feature = "vercel")]
#[tokio::main]
async fn main() -> Result<(), vercel_runtime::Error> {
    use tower::ServiceBuilder;
    use vercel_runtime::axum::VercelLayer;

    let api_state = init_state()
        .await
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
    let app = build_app(api_state);

    let app = ServiceBuilder::new().layer(VercelLayer::new()).service(app);
    vercel_runtime::run(app).await
}
