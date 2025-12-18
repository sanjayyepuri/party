use axum::{routing::get, Router};
use std::sync::Arc;
use tower::ServiceBuilder;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use url::Url;
use vercel_runtime::axum::VercelLayer;
use vercel_runtime::Error;

use pregame::api::{fallback, hello_world, ApiState};
use pregame::auth::ory::OryConfig;

#[tokio::main]
async fn main() -> Result<(), Error> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        // .with(
        //     tracing_subscriber::EnvFilter::try_from_default_env()
        //         .unwrap_or_else(|_| "ory_api_test=debug,tower_http=debug,hyper_util=trace".into()),
        // )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let ory_sdk_url =
        std::env::var("NEXT_PUBLIC_ORY_SDK_URL").expect("NEXT_PUBLIC_ORY_SDK_URL must be set");
    let ory_sdk_url = Url::parse(&ory_sdk_url).expect("Invalid Ory SDK URL");
    let ory_config = OryConfig { ory_sdk_url };

    let api_state = Arc::new(ApiState { ory_config });

    tracing::info!("Starting server");
    tracing::info!(
        "Ory SDK configured at: {:?}",
        api_state.as_ref().ory_config.ory_sdk_url
    );

    let app = Router::new()
        .route("/", get(hello_world))
        .route("/hello", get(hello_world))
        .route("/api/bouncer/hello", get(hello_world))
        .fallback(fallback)
        .layer(TraceLayer::new_for_http())
        .with_state(api_state);

    let app = ServiceBuilder::new().layer(VercelLayer::new()).service(app);

    vercel_runtime::run(app).await
}
