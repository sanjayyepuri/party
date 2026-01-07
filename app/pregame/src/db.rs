use deadpool_postgres::{Config, ManagerConfig, Pool, RecyclingMethod, Runtime};
use openssl::ssl::{SslConnector, SslMethod};
use postgres_openssl::MakeTlsConnector;

/// Database state for the pregame application.
/// Contains a connection pool for interacting with the database.
/// 
/// Using a connection pool instead of a single connection provides:
/// - Automatic reconnection when connections are closed
/// - Better handling of serverless environments where connections can be terminated
/// - Connection reuse for better performance
pub struct DbState {
    pub pool: Pool,
}

impl DbState {
    pub async fn new(connection_string: String) -> Result<Self, Box<dyn std::error::Error>> {
        // Create deadpool Config from connection string
        // The Config struct can be created with a URL string
        let mut config = Config::new();
        config.url = Some(connection_string);
        
        // Configure the pool for serverless environments
        // Set reasonable pool sizes for serverless (smaller pools)
        config.pool = Some(deadpool_postgres::PoolConfig {
            max_size: 10,
            ..Default::default()
        });
        
        // Configure manager to handle connection recycling
        // Use Verified recycling to test connections before returning them
        // This helps detect closed connections in serverless environments
        config.manager = Some(ManagerConfig {
            recycling_method: RecyclingMethod::Verified,
        });

        // Create SSL connector for Neon (requires TLS)
        let builder = SslConnector::builder(SslMethod::tls())?;
        let connector = MakeTlsConnector::new(builder.build());

        // Create the pool with the SSL connector
        let pool = config.create_pool(Some(Runtime::Tokio1), connector)?;

        Ok(DbState { pool })
    }
}
