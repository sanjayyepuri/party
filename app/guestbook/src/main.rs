use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use clap::{Parser, Subcommand};
use openssl::ssl::{SslConnector, SslMethod};
use postgres_openssl::MakeTlsConnector;
use tokio_postgres::Client;
use uuid::Uuid;

#[derive(Parser)]
#[command(name = "guestbook")]
#[command(about = "CLI tool for managing parties and guests", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Create a new party
    Create {
        /// Name of the party
        #[arg(short, long)]
        name: String,

        /// URL slug for the party
        #[arg(short, long)]
        slug: String,

        /// Party date and time (RFC3339 format, e.g., "2025-07-15T18:00:00Z")
        #[arg(short, long)]
        time: String,

        /// Location of the party
        #[arg(short, long)]
        location: String,

        /// Description of the party
        #[arg(short, long)]
        description: String,
    },

    /// List all parties
    List {
        /// Include soft-deleted parties
        #[arg(long)]
        include_deleted: bool,
    },

    /// Get a single party by slug
    Get {
        /// Slug of the party
        slug: String,
    },

    /// Update a party
    Update {
        /// Slug of the party to update
        slug: String,

        /// New name
        #[arg(long)]
        name: Option<String>,

        /// New time (RFC3339 format)
        #[arg(long)]
        time: Option<String>,

        /// New location
        #[arg(long)]
        location: Option<String>,

        /// New description
        #[arg(long)]
        description: Option<String>,
    },

    /// Delete a party (soft delete)
    Delete {
        /// Slug of the party to delete
        slug: String,
    },

    /// Permanently delete a party
    Purge {
        /// Slug of the party to permanently delete
        slug: String,
    },

    /// Create the party table with the schema from RFD-006
    CreateTable,

    /// Clear all data from the party table
    ClearTable {
        /// Confirm deletion by typing 'yes'
        #[arg(long)]
        confirm: String,
    },
}

async fn connect_db() -> Result<Client> {
    dotenvy::dotenv().ok();

    let connection_string = std::env::var("NEON_POSTGRES_URL")
        .context("NEON_POSTGRES_URL environment variable not set")?;

    let mut builder = SslConnector::builder(SslMethod::tls())?;
    builder.set_verify(openssl::ssl::SslVerifyMode::NONE);
    let connector = MakeTlsConnector::new(builder.build());

    let (client, connection) = tokio_postgres::connect(&connection_string, connector).await?;

    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("Database connection error: {}", e);
        }
    });

    Ok(client)
}

async fn create_party(
    client: &Client,
    name: String,
    slug: String,
    time: String,
    location: String,
    description: String,
) -> Result<()> {
    let party_id = Uuid::new_v4().to_string();
    let time: DateTime<Utc> = time
        .parse()
        .context("Invalid time format. Use RFC3339 format like '2025-07-15T18:00:00Z'")?;
    let now = Utc::now();

    client
        .execute(
            "INSERT INTO party (party_id, name, slug, time, location, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            &[&party_id, &name, &slug, &time, &location, &description, &now, &now],
        )
        .await
        .context("Failed to create party")?;

    println!("✓ Created party: {} (slug: {})", name, slug);
    println!("  ID: {}", party_id);
    println!("  Time: {}", time);
    println!("  Location: {}", location);

    Ok(())
}

async fn list_parties(client: &Client, include_deleted: bool) -> Result<()> {
    let query = if include_deleted {
        "SELECT party_id, name, slug, time, location, description, created_at, updated_at, deleted_at FROM party ORDER BY time ASC"
    } else {
        "SELECT party_id, name, slug, time, location, description, created_at, updated_at, deleted_at FROM party WHERE deleted_at IS NULL ORDER BY time ASC"
    };

    let rows = client.query(query, &[]).await?;

    if rows.is_empty() {
        println!("No parties found.");
        return Ok(());
    }

    println!("\nParties:");
    println!("{}", "=".repeat(80));

    for row in &rows {
        let name: String = row.get("name");
        let slug: String = row.get("slug");
        let time: DateTime<Utc> = row.get("time");
        let location: String = row.get("location");
        let deleted_at: Option<DateTime<Utc>> = row.get("deleted_at");

        let status = if deleted_at.is_some() {
            " [DELETED]"
        } else {
            ""
        };

        println!("\n{}{}", name, status);
        println!("  Slug: {}", slug);
        println!("  Time: {}", time.format("%Y-%m-%d %H:%M:%S %Z"));
        println!("  Location: {}", location);
    }

    println!("\n{}", "=".repeat(80));
    println!("Total: {} parties\n", rows.len());

    Ok(())
}

async fn get_party(client: &Client, slug: String) -> Result<()> {
    let rows = client
        .query(
            "SELECT party_id, name, slug, time, location, description, created_at, updated_at, deleted_at FROM party WHERE slug = $1",
            &[&slug],
        )
        .await?;

    if rows.is_empty() {
        anyhow::bail!("Party with slug '{}' not found", slug);
    }

    let row = &rows[0];
    let party_id: String = row.get("party_id");
    let name: String = row.get("name");
    let slug: String = row.get("slug");
    let time: DateTime<Utc> = row.get("time");
    let location: String = row.get("location");
    let description: String = row.get("description");
    let created_at: DateTime<Utc> = row.get("created_at");
    let updated_at: DateTime<Utc> = row.get("updated_at");
    let deleted_at: Option<DateTime<Utc>> = row.get("deleted_at");

    println!("\n{}", "=".repeat(80));
    println!("Party: {}", name);
    println!("{}", "=".repeat(80));
    println!("ID:          {}", party_id);
    println!("Slug:        {}", slug);
    println!("Time:        {}", time.format("%Y-%m-%d %H:%M:%S %Z"));
    println!("Location:    {}", location);
    println!("Description: {}", description);
    println!("Created:     {}", created_at.format("%Y-%m-%d %H:%M:%S %Z"));
    println!("Updated:     {}", updated_at.format("%Y-%m-%d %H:%M:%S %Z"));
    if let Some(deleted) = deleted_at {
        println!("Deleted:     {}", deleted.format("%Y-%m-%d %H:%M:%S %Z"));
    }
    println!("{}\n", "=".repeat(80));

    Ok(())
}

async fn update_party(
    client: &Client,
    slug: String,
    name: Option<String>,
    time: Option<String>,
    location: Option<String>,
    description: Option<String>,
) -> Result<()> {
    let mut updates = Vec::new();
    let mut params: Vec<&(dyn tokio_postgres::types::ToSql + Sync)> = vec![&slug];
    let mut param_idx = 2;

    // Parse time early so it lives long enough
    let parsed_time: Option<DateTime<Utc>> = if let Some(ref t) = time {
        Some(t.parse().context("Invalid time format")?)
    } else {
        None
    };

    if let Some(ref n) = name {
        updates.push(format!("name = ${}", param_idx));
        params.push(n);
        param_idx += 1;
    }

    if let Some(ref t) = parsed_time {
        updates.push(format!("time = ${}", param_idx));
        params.push(t);
        param_idx += 1;
    }

    if let Some(ref l) = location {
        updates.push(format!("location = ${}", param_idx));
        params.push(l);
        param_idx += 1;
    }

    if let Some(ref d) = description {
        updates.push(format!("description = ${}", param_idx));
        params.push(d);
        param_idx += 1;
    }

    if updates.is_empty() {
        anyhow::bail!("No fields to update. Provide at least one field to update.");
    }

    let now = Utc::now();
    updates.push(format!("updated_at = ${}", param_idx));
    params.push(&now);

    let query = format!(
        "UPDATE party SET {} WHERE slug = $1 AND deleted_at IS NULL",
        updates.join(", ")
    );

    let rows_affected = client.execute(&query, &params).await?;

    if rows_affected == 0 {
        anyhow::bail!("Party with slug '{}' not found or already deleted", slug);
    }

    println!("✓ Updated party: {}", slug);

    Ok(())
}

async fn delete_party(client: &Client, slug: String) -> Result<()> {
    let now = Utc::now();

    let rows_affected = client
        .execute(
            "UPDATE party SET deleted_at = $1, updated_at = $1 WHERE slug = $2 AND deleted_at IS NULL",
            &[&now, &slug],
        )
        .await?;

    if rows_affected == 0 {
        anyhow::bail!("Party with slug '{}' not found or already deleted", slug);
    }

    println!("✓ Deleted party: {}", slug);

    Ok(())
}

async fn purge_party(client: &Client, slug: String) -> Result<()> {
    let rows_affected = client
        .execute("DELETE FROM party WHERE slug = $1", &[&slug])
        .await?;

    if rows_affected == 0 {
        anyhow::bail!("Party with slug '{}' not found", slug);
    }

    println!("✓ Permanently deleted party: {}", slug);

    Ok(())
}

async fn create_table(client: &Client) -> Result<()> {
    client
        .execute(
            "CREATE TABLE IF NOT EXISTS party (
                party_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                time TIMESTAMPTZ NOT NULL,
                location TEXT NOT NULL,
                description TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL,
                deleted_at TIMESTAMPTZ
            )",
            &[],
        )
        .await?;

    println!("✓ Created party table (or already exists)");

    // Create index on slug for faster lookups
    client
        .execute(
            "CREATE INDEX IF NOT EXISTS idx_party_slug ON party(slug)",
            &[],
        )
        .await?;

    // Create index on time for chronological queries
    client
        .execute(
            "CREATE INDEX IF NOT EXISTS idx_party_time ON party(time)",
            &[],
        )
        .await?;

    // Create index on deleted_at for filtering soft-deleted parties
    client
        .execute(
            "CREATE INDEX IF NOT EXISTS idx_party_deleted_at ON party(deleted_at)",
            &[],
        )
        .await?;

    println!("✓ Created indexes on slug, time, and deleted_at");

    // Create guest table
    client
        .execute(
            "CREATE TABLE IF NOT EXISTS guest (
                guest_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL,
                deleted_at TIMESTAMPTZ
            )",
            &[],
        )
        .await?;

    println!("✓ Created guest table (or already exists)");

    // Create RSVP table with unique constraint
    client
        .execute(
            "CREATE TABLE IF NOT EXISTS rsvp (
                rsvp_id TEXT PRIMARY KEY,
                party_id TEXT NOT NULL REFERENCES party(party_id) ON DELETE CASCADE,
                guest_id TEXT NOT NULL REFERENCES guest(guest_id) ON DELETE CASCADE,
                status TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL,
                deleted_at TIMESTAMPTZ,
                UNIQUE(party_id, guest_id)
            )",
            &[],
        )
        .await?;

    println!("✓ Created rsvp table with unique constraint (or already exists)");

    // Create indexes for RSVP table
    client
        .execute(
            "CREATE INDEX IF NOT EXISTS idx_rsvp_party_id ON rsvp(party_id)",
            &[],
        )
        .await?;

    client
        .execute(
            "CREATE INDEX IF NOT EXISTS idx_rsvp_guest_id ON rsvp(guest_id)",
            &[],
        )
        .await?;

    println!("✓ Created indexes on rsvp table");

    Ok(())
}

async fn clear_table(client: &Client, confirm: String) -> Result<()> {
    if confirm != "yes" {
        anyhow::bail!("Confirmation failed. Use --confirm yes to clear the table.");
    }

    let rows_affected = client.execute("DELETE FROM party", &[]).await?;

    println!("✓ Cleared party table. Deleted {} rows.", rows_affected);

    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    // Load environment variables from .env file
    dotenvy::dotenv().ok();

    let cli = Cli::parse();
    let client = connect_db().await?;

    match cli.command {
        Commands::Create {
            name,
            slug,
            time,
            location,
            description,
        } => create_party(&client, name, slug, time, location, description).await?,

        Commands::List { include_deleted } => list_parties(&client, include_deleted).await?,

        Commands::Get { slug } => get_party(&client, slug).await?,

        Commands::Update {
            slug,
            name,
            time,
            location,
            description,
        } => update_party(&client, slug, name, time, location, description).await?,

        Commands::Delete { slug } => delete_party(&client, slug).await?,

        Commands::Purge { slug } => purge_party(&client, slug).await?,

        Commands::CreateTable => create_table(&client).await?,

        Commands::ClearTable { confirm } => clear_table(&client, confirm).await?,
    }

    Ok(())
}
