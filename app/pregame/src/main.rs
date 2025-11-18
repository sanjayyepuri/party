use pregame::start_grpc_server;
use sqlx::PgPool;
use tokio::runtime::Runtime;
use std::env;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let rt = Runtime::new()?;
    rt.block_on(async {
        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgres://postgres:password@localhost/party".to_string());
        let pool = PgPool::connect(&database_url).await?;
        start_grpc_server(pool).await?;
        Ok(())
    })
}
