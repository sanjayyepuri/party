use openssl::ssl::{SslConnector, SslMethod};
use postgres_openssl::MakeTlsConnector;
use tokio;
use tokio_postgres::Client;

/// Database state for the pregame application.
/// Contains a tokio_postgres client for interacting with the database.
pub struct DbState {
  pub client: Client,
  pub connection_task: tokio::task::JoinHandle<Result<(), tokio_postgres::Error>>,
  pub connection_string: String,
}

impl DbState {
  pub async fn new(connection_string: String) -> Result<Self, Box<dyn std::error::Error>> {
    let builder = SslConnector::builder(SslMethod::tls())?;
    let connector = MakeTlsConnector::new(builder.build());

    let (client, connection) = tokio_postgres::connect(&connection_string, connector).await?;

    // Spawn the connection task and store the handle for lifecycle management
    let connection_task = tokio::spawn(async move { connection.await });

    Ok(DbState {
      client,
      connection_task,
      connection_string,
    })
  }
}
