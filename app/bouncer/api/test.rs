use axum::{response::Json, routing::get, Router};
use serde_json::json;
use vercel_runtime::axum::VercelLayer;
use vercel_runtime::{run, Error};

use pregame::api::error;

use tower::ServiceBuilder;

#[tokio::main]
async fn main() -> Result<(), Error> {
    // Create a simple router with a hello endpoint
    let routes = Router::new()
        .route("/", get(hello_handler))
        .route("/world", get(world_handler));

    let app = Router::new()
        .nest("/api/test", routes)
        .fallback(error::fallback);

    // Run the Axum app with Vercel runtime
    let app = ServiceBuilder::new().layer(VercelLayer::new()).service(app);
    run(app).await
}

async fn hello_handler() -> Json<serde_json::Value> {
    Json(json!({
        "message": "Hello from Rust!",
        "runtime": "Vercel Axum"
    }))
}

async fn world_handler() -> Json<serde_json::Value> {
    Json(json!({
        "message": "Hello World from Rust!",
        "path": "/api/hello/world"
    }))
}
