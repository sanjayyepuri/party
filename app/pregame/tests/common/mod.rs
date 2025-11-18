use sqlx::{PgPool, Postgres};
use testcontainers::{clients::Cli, Container};
use testcontainers_modules::postgres::Postgres as PostgresImage;
use uuid::Uuid;

pub struct TestDb {
    pub pool: PgPool,
    #[allow(dead_code)]
    container: Container<'static, PostgresImage>,
}

impl TestDb {
    pub async fn new() -> TestDb {
        let docker = Box::leak(Box::new(Cli::default()));
        let container = docker.run(PostgresImage::default());
        
        let connection_string = format!(
            "postgres://postgres:postgres@127.0.0.1:{}/postgres",
            container.get_host_port_ipv4(5432)
        );

        // Create connection pool
        let pool = PgPool::connect(&connection_string)
            .await
            .expect("Failed to connect to test database");

        // Run migrations
        Self::setup_schema(&pool).await;

        TestDb { pool, container }
    }

    async fn setup_schema(pool: &PgPool) {
        // Create custom enum type for RSVP status
        sqlx::query("CREATE TYPE RsvpStatus AS ENUM ('no', 'yes', 'maybe');")
            .execute(pool)
            .await
            .expect("Failed to create RsvpStatus enum");

        // Create guests table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS guests (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(255) NOT NULL,
                last_name VARCHAR(255) NOT NULL,
                phone_number VARCHAR(20) NOT NULL
            );
            "#,
        )
        .execute(pool)
        .await
        .expect("Failed to create guests table");

        // Create party table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS party (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                location VARCHAR(255) NOT NULL,
                description TEXT,
                date TIMESTAMPTZ
            );
            "#,
        )
        .execute(pool)
        .await
        .expect("Failed to create party table");

        // Create invitation table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS invitation (
                id SERIAL PRIMARY KEY,
                guest_id BIGINT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
                party_id BIGINT NOT NULL REFERENCES party(id) ON DELETE CASCADE,
                status RsvpStatus NOT NULL DEFAULT 'maybe',
                UNIQUE(guest_id, party_id)
            );
            "#,
        )
        .execute(pool)
        .await
        .expect("Failed to create invitation table");

        // Create indexes
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_invitation_guest_id ON invitation(guest_id);")
            .execute(pool)
            .await
            .expect("Failed to create guest_id index");

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_invitation_party_id ON invitation(party_id);")
            .execute(pool)
            .await
            .expect("Failed to create party_id index");

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_party_date ON party(date);")
            .execute(pool)
            .await
            .expect("Failed to create date index");
    }

    pub async fn cleanup(&self) {
        // Clean up test data
        sqlx::query("DELETE FROM invitation").execute(&self.pool).await.ok();
        sqlx::query("DELETE FROM party").execute(&self.pool).await.ok();
        sqlx::query("DELETE FROM guests").execute(&self.pool).await.ok();
    }
}

// Test data helpers
pub fn random_guest_data() -> (String, String, String) {
    let id = Uuid::new_v4().to_string()[..8].to_string();
    (
        format!("FirstName{}", id),
        format!("LastName{}", id),
        format!("+1555{}", &id[..7]),
    )
}

pub fn random_party_data() -> (String, String, String) {
    let id = Uuid::new_v4().to_string()[..8].to_string();
    (
        format!("Party{}", id),
        format!("Location{}", id),
        format!("Description for party {}", id),
    )
}