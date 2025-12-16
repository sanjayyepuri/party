use axum::http::Uri;
use axum::{extract::Json, response::IntoResponse, routing::get, Router};
use serde::{Deserialize, Serialize};
use tower::ServiceBuilder;
use vercel_runtime::axum::VercelLayer;
use vercel_runtime::Error;

#[derive(Serialize, Deserialize)]
struct Party {
    name: String,
    description: String,
}

async fn hello_world() -> impl IntoResponse {
    Json(Party {
        name: "Hello World".to_string(),
        description: "A simple greeting".to_string(),
    })
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
