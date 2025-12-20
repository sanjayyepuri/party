use openssl::ssl::{SslConnector, SslMethod};
use postgres_openssl::MakeTlsConnector;
use std::sync::Arc;
use tokio;
use tokio::sync::Mutex;
use tokio_postgres::Client;

/// Database state for the pregame application.
/// Contains a tokio_postgres client for interacting with the database.
pub struct DbState {
    pub client: Client,
    connection_task: Arc<Mutex<Option<tokio::task::JoinHandle<Result<(), tokio_postgres::Error>>>>>,
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
            connection_task: Arc::new(Mutex::new(Some(connection_task))),
            connection_string,
        })
    }

    /// Gracefully shutdown the database connection.
    /// This method should be called before the application exits to ensure
    /// the connection is properly closed.
    pub async fn shutdown(&self) -> Result<(), Box<dyn std::error::Error>> {
        tracing::info!("Shutting down database connection");
        
        let mut task_guard = self.connection_task.lock().await;
        
        if let Some(task) = task_guard.take() {
            // Abort the connection task to signal shutdown
            task.abort();
            
            // Wait for the connection task to complete
            // This will return an Err if the task was aborted, which is expected
            match task.await {
                Ok(Ok(())) => {
                    tracing::info!("Database connection closed successfully");
                    Ok(())
                }
                Ok(Err(e)) => {
                    tracing::warn!("Database connection error during shutdown: {}", e);
                    Err(e.into())
                }
                Err(e) if e.is_cancelled() => {
                    tracing::info!("Database connection task cancelled");
                    Ok(())
                }
                Err(e) => {
                    tracing::error!("Error waiting for connection task: {}", e);
                    Err(e.into())
                }
            }
        } else {
            tracing::debug!("Database connection already shut down");
            Ok(())
        }
    }
}

impl Drop for DbState {
    fn drop(&mut self) {
        // Try to abort the connection task when DbState is dropped
        // This ensures cleanup happens even if shutdown() is not explicitly called
        if let Some(task) = self.connection_task.blocking_lock().as_ref() {
            if !task.is_finished() {
                tracing::debug!("Aborting database connection task in Drop");
                task.abort();
            }
        }
    }
}
