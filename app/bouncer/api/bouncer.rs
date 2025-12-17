use axum::http::Uri;
use axum::{response::IntoResponse, routing::get, Json, Router};
use tower::ServiceBuilder;
use vercel_runtime::axum::VercelLayer;
use vercel_runtime::Error;

use pregame::hello_party;

async fn hello_world() -> impl IntoResponse {
    Json(hello_party())
}

async fn fallback(uri: Uri) -> impl IntoResponse {
    format!("Axum fallback for path {}", uri.path())
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    let app = Router::new()
        .route("/", get(hello_world))
        .route("/hello", get(hello_world))
        .route("/api/bouncer/hello", get(hello_world))
        .fallback(fallback);

    let app = ServiceBuilder::new().layer(VercelLayer::new()).service(app);

    vercel_runtime::run(app).await
}
