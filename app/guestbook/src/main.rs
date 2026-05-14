use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use clap::{Parser, Subcommand};
use openssl::ssl::{SslConnector, SslMethod};
use postgres_openssl::MakeTlsConnector;
use serde::Serialize;
use std::path::{Path, PathBuf};
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

    /// Show RSVP summary for a party
    Summary {
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

    /// Send a new-party notification email to all verified users
    Notify {
        /// Slug of the party to notify guests about
        slug: String,

        /// Explicit recipient email. May be repeated or comma-separated.
        #[arg(long = "email", value_delimiter = ',')]
        emails: Vec<String>,

        /// Preview recipients and email content without sending via Resend
        #[arg(long)]
        dry_run: bool,
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
    load_environment();

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

fn find_env_file_from(start: &Path, filename: &str) -> Option<PathBuf> {
    let mut directory = start.to_path_buf();

    loop {
        let candidate = directory.join(filename);
        if candidate.is_file() {
            return Some(candidate);
        }

        if !directory.pop() {
            return None;
        }
    }
}

fn find_env_file(filename: &str) -> Option<PathBuf> {
    std::env::current_dir()
        .ok()
        .and_then(|current_dir| find_env_file_from(&current_dir, filename))
}

fn load_environment() {
    if let Some(env_path) = find_env_file(".env") {
        dotenvy::from_path(env_path).ok();
    }

    if let Some(env_local_path) = find_env_file(".env.local") {
        dotenvy::from_path_override(env_local_path).ok();
    }
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

#[derive(Debug, Clone)]
struct PartySummary {
    party_id: String,
    name: String,
    slug: String,
    time: DateTime<Utc>,
}

#[derive(Debug, Clone)]
struct RsvpSummaryRow {
    name: Option<String>,
    email: String,
    status: String,
    updated_at: Option<DateTime<Utc>>,
}

fn rsvp_status_label(status: &str) -> &'static str {
    match status {
        "accepted" => "Going",
        "pending" => "Maybe",
        "declined" => "Declined",
        "not_started" => "Not started",
        _ => "Other",
    }
}

fn rsvp_status_order(status: &str) -> usize {
    match status {
        "accepted" => 0,
        "pending" => 1,
        "declined" => 2,
        "not_started" => 3,
        _ => 4,
    }
}

fn count_rsvp_status(rows: &[RsvpSummaryRow], status: &str) -> usize {
    rows.iter().filter(|row| row.status == status).count()
}

fn format_rsvp_summary_person(row: &RsvpSummaryRow) -> String {
    let display_name = row.name.as_deref().unwrap_or("").trim();
    let person = if display_name.is_empty() {
        row.email.clone()
    } else {
        format!("{} <{}>", display_name, row.email)
    };

    match row.updated_at {
        Some(updated_at) => format!(
            "{} (updated {})",
            person,
            updated_at.format("%Y-%m-%d %H:%M")
        ),
        None => person,
    }
}

async fn fetch_party_summary(client: &Client, slug: &str) -> Result<Option<PartySummary>> {
    let row = client
        .query_opt(
            "SELECT party_id, name, slug, time
             FROM party
             WHERE slug = $1 AND deleted_at IS NULL",
            &[&slug],
        )
        .await?;

    row.map(|row| -> Result<PartySummary, tokio_postgres::Error> {
        Ok(PartySummary {
            party_id: row.try_get("party_id")?,
            name: row.try_get("name")?,
            slug: row.try_get("slug")?,
            time: row.try_get("time")?,
        })
    })
    .transpose()
    .context("Failed to parse party summary row")
}

async fn fetch_rsvp_summary_rows(client: &Client, party_id: &str) -> Result<Vec<RsvpSummaryRow>> {
    let rows = client
        .query(
            r#"
            SELECT
                u.name,
                u.email,
                COALESCE(r.status, 'not_started') AS status,
                r.updated_at
            FROM "user" u
            LEFT JOIN rsvp r
                ON r.user_id = u.id
                AND r.party_id = $1
                AND r.deleted_at IS NULL
            WHERE btrim(u.email) <> ''
            ORDER BY
                CASE COALESCE(r.status, 'not_started')
                    WHEN 'accepted' THEN 0
                    WHEN 'pending' THEN 1
                    WHEN 'declined' THEN 2
                    WHEN 'not_started' THEN 3
                    ELSE 4
                END,
                lower(COALESCE(NULLIF(btrim(u.name), ''), u.email)),
                lower(u.email)
            "#,
            &[&party_id],
        )
        .await?;

    rows.into_iter()
        .map(|row| {
            Ok(RsvpSummaryRow {
                name: row.try_get("name")?,
                email: row.try_get("email")?,
                status: row.try_get("status")?,
                updated_at: row.try_get("updated_at")?,
            })
        })
        .collect::<Result<Vec<_>, tokio_postgres::Error>>()
        .context("Failed to parse RSVP summary rows")
}

fn print_rsvp_summary(party: &PartySummary, rows: &[RsvpSummaryRow]) {
    println!("\nRSVP summary: {}", party.name);
    println!("{}", "=".repeat(80));
    println!("Slug: {}", party.slug);
    println!("Time: {}", party.time.format("%Y-%m-%d %H:%M:%S %Z"));
    println!("Total users: {}", rows.len());
    println!("Going: {}", count_rsvp_status(rows, "accepted"));
    println!("Maybe: {}", count_rsvp_status(rows, "pending"));
    println!("Declined: {}", count_rsvp_status(rows, "declined"));
    println!("Not started: {}", count_rsvp_status(rows, "not_started"));

    for status in ["accepted", "pending", "declined", "not_started"] {
        let people = rows
            .iter()
            .filter(|row| row.status == status)
            .collect::<Vec<_>>();

        if people.is_empty() {
            continue;
        }

        println!("\n{} ({})", rsvp_status_label(status), people.len());
        for person in people {
            println!("  - {}", format_rsvp_summary_person(person));
        }
    }

    let other_statuses = rows
        .iter()
        .filter(|row| rsvp_status_order(&row.status) == 4)
        .collect::<Vec<_>>();
    if !other_statuses.is_empty() {
        println!("\nOther ({})", other_statuses.len());
        for person in other_statuses {
            println!(
                "  - {} [{}]",
                format_rsvp_summary_person(person),
                person.status
            );
        }
    }

    println!("\n{}", "=".repeat(80));
}

async fn show_rsvp_summary(client: &Client, slug: String) -> Result<()> {
    let party = fetch_party_summary(client, &slug)
        .await?
        .with_context(|| format!("Party with slug '{}' not found or already deleted", slug))?;
    let rows = fetch_rsvp_summary_rows(client, &party.party_id).await?;

    print_rsvp_summary(&party, &rows);

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
                ory_identity_id TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                created_at TIMESTAMPTZ NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL,
                deleted_at TIMESTAMPTZ
            )",
            &[],
        )
        .await?;

    println!("✓ Created guest table (or already exists)");

    // Create index on ory_identity_id for faster lookups during authentication
    client
        .execute(
            "CREATE INDEX IF NOT EXISTS idx_guest_ory_identity_id ON guest(ory_identity_id)",
            &[],
        )
        .await?;

    println!("✓ Created index on ory_identity_id");

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

#[derive(Debug, Clone)]
struct PartyNotification {
    name: String,
    slug: String,
    time: DateTime<Utc>,
    location: String,
    description: String,
}

#[derive(Debug, Clone)]
struct PartyNotificationEmail {
    subject: String,
    html: String,
    text: String,
    rsvp_url: String,
}

#[derive(Debug, Serialize)]
struct ResendEmailPayload {
    from: String,
    to: String,
    subject: String,
    html: String,
    text: String,
}

#[derive(Debug)]
struct SendFailure {
    email: String,
    error: String,
}

#[derive(Debug, PartialEq, Eq)]
struct NotificationConfig {
    resend_api_key: Option<String>,
    from_email: Option<String>,
    site_base_url: String,
}

fn load_notification_config(dry_run: bool) -> Result<NotificationConfig> {
    let site_base_url = std::env::var("PARTY_SITE_BASE_URL")
        .context("PARTY_SITE_BASE_URL environment variable is required for notifications")?;

    if dry_run {
        return Ok(NotificationConfig {
            resend_api_key: None,
            from_email: None,
            site_base_url,
        });
    }

    Ok(NotificationConfig {
        resend_api_key: Some(
            std::env::var("RESEND_API_KEY")
                .context("RESEND_API_KEY environment variable is required for notifications")?,
        ),
        from_email: Some(
            std::env::var("RESEND_FROM_EMAIL")
                .context("RESEND_FROM_EMAIL environment variable is required for notifications")?,
        ),
        site_base_url,
    })
}

fn escape_html(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

fn build_party_notification_email(
    party: &PartyNotification,
    site_base_url: &str,
) -> PartyNotificationEmail {
    let base_url = site_base_url.trim_end_matches('/');
    let rsvp_url = format!("{}/parties/{}", base_url, party.slug);
    let formatted_time = party.time.format("%A, %B %-d, %Y at %-I:%M %p UTC");
    let subject = format!("Sanjay invited you to {}", party.name);

    let html = format!(
        r#"
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222; line-height: 1.5;">
  <p>Hey,</p>
  <p>I am hosting {name} and wanted to invite you.</p>
  <p>
    When: {time}<br>
    Where: {location}
  </p>
  <p>{description}</p>
  <p>RSVP here:<br><a href="{rsvp_url}">{rsvp_url}</a></p>
  <p style="color: #666; font-size: 14px;">
    You are getting this because you have an account on sanjay.party.
    Reply here with any questions. If you do not want party invites, reply "unsubscribe".
  </p>
</div>
"#,
        name = escape_html(&party.name),
        description = escape_html(&party.description),
        time = escape_html(&formatted_time.to_string()),
        location = escape_html(&party.location),
        rsvp_url = escape_html(&rsvp_url),
    );

    let text = format!(
        "Hey,\n\nI am hosting {} and wanted to invite you.\n\nWhen: {}\nWhere: {}\n\n{}\n\nRSVP here:\n{}\n\nYou are getting this because you have an account on sanjay.party.\nReply here with any questions. If you do not want party invites, reply \"unsubscribe\".",
        party.name, formatted_time, party.location, party.description, rsvp_url
    );

    PartyNotificationEmail {
        subject,
        html,
        text,
        rsvp_url,
    }
}

fn build_resend_payload(
    from_email: &str,
    recipient_email: &str,
    email: &PartyNotificationEmail,
) -> ResendEmailPayload {
    ResendEmailPayload {
        from: from_email.to_string(),
        to: recipient_email.to_string(),
        subject: email.subject.clone(),
        html: email.html.clone(),
        text: email.text.clone(),
    }
}

fn normalize_explicit_recipient_emails(emails: Vec<String>) -> Vec<String> {
    let mut recipients = Vec::new();

    for email in emails {
        let email = email.trim();
        if email.is_empty() || recipients.iter().any(|existing| existing == email) {
            continue;
        }

        recipients.push(email.to_string());
    }

    recipients
}

async fn fetch_party_notification(
    client: &Client,
    slug: &str,
) -> Result<Option<PartyNotification>> {
    let row = client
        .query_opt(
            "SELECT name, slug, time, location, description
             FROM party
             WHERE slug = $1 AND deleted_at IS NULL",
            &[&slug],
        )
        .await?;

    row.map(|row| -> Result<PartyNotification, tokio_postgres::Error> {
        Ok(PartyNotification {
            name: row.try_get("name")?,
            slug: row.try_get("slug")?,
            time: row.try_get("time")?,
            location: row.try_get("location")?,
            description: row.try_get("description")?,
        })
    })
    .transpose()
    .context("Failed to parse party notification row")
}

async fn fetch_verified_recipient_emails(client: &Client) -> Result<Vec<String>> {
    let rows = client
        .query(
            r#"
            SELECT email
            FROM "user"
            WHERE "emailVerified" = true
              AND btrim(email) <> ''
            ORDER BY email ASC
            "#,
            &[],
        )
        .await?;

    rows.into_iter()
        .map(|row| row.try_get("email").context("Failed to parse user email"))
        .collect()
}

async fn send_resend_email(
    http_client: &reqwest::Client,
    api_key: &str,
    payload: &ResendEmailPayload,
) -> Result<()> {
    send_resend_email_to_endpoint(
        http_client,
        api_key,
        "https://api.resend.com/emails",
        payload,
    )
    .await
}

async fn send_resend_email_to_endpoint(
    http_client: &reqwest::Client,
    api_key: &str,
    endpoint: &str,
    payload: &ResendEmailPayload,
) -> Result<()> {
    let response = http_client
        .post(endpoint)
        .bearer_auth(api_key)
        .json(payload)
        .send()
        .await
        .context("Failed to send request to Resend")?;

    let status = response.status();
    if !status.is_success() {
        let body = response
            .text()
            .await
            .unwrap_or_else(|_| "Unable to read response body".to_string());
        anyhow::bail!("Resend returned {}: {}", status, body);
    }

    Ok(())
}

async fn notify_party(
    client: &Client,
    slug: String,
    explicit_recipient_emails: Vec<String>,
    dry_run: bool,
) -> Result<()> {
    let config = load_notification_config(dry_run)?;

    let party = fetch_party_notification(client, &slug)
        .await?
        .with_context(|| format!("Party with slug '{}' not found or already deleted", slug))?;
    let explicit_recipients = normalize_explicit_recipient_emails(explicit_recipient_emails);
    let (recipients, recipient_label) = if explicit_recipients.is_empty() {
        (
            fetch_verified_recipient_emails(client).await?,
            "verified users",
        )
    } else {
        (explicit_recipients, "explicit recipients")
    };

    if recipients.is_empty() {
        anyhow::bail!("No recipient email addresses found");
    }

    let email = build_party_notification_email(&party, &config.site_base_url);

    if dry_run {
        println!(
            "Dry run: would send party notification for '{}' to {} {}",
            party.name,
            recipients.len(),
            recipient_label
        );
        println!("  Subject: {}", email.subject);
        println!("  RSVP link: {}", email.rsvp_url);
        println!("\nRecipients:");
        for recipient in &recipients {
            println!("  - {}", recipient);
        }
        println!("\nPlain-text preview:\n{}", email.text);
        return Ok(());
    }

    let resend_api_key = config
        .resend_api_key
        .as_deref()
        .expect("RESEND_API_KEY is loaded when dry_run is false");
    let from_email = config
        .from_email
        .as_deref()
        .expect("RESEND_FROM_EMAIL is loaded when dry_run is false");
    let http_client = reqwest::Client::new();
    let mut sent_count = 0usize;
    let mut failures = Vec::new();

    println!(
        "Sending party notification for '{}' to {} {}",
        party.name,
        recipients.len(),
        recipient_label
    );

    for recipient in &recipients {
        let payload = build_resend_payload(&from_email, recipient, &email);
        match send_resend_email(&http_client, &resend_api_key, &payload).await {
            Ok(()) => {
                sent_count += 1;
                println!("✓ Sent notification to {}", recipient);
            }
            Err(error) => {
                eprintln!("✗ Failed to send notification to {}: {}", recipient, error);
                failures.push(SendFailure {
                    email: recipient.clone(),
                    error: error.to_string(),
                });
            }
        }
    }

    println!("\nNotification summary");
    println!("  Total recipients: {}", recipients.len());
    println!("  Sent: {}", sent_count);
    println!("  Failed: {}", failures.len());
    println!("  RSVP link: {}", email.rsvp_url);

    if !failures.is_empty() {
        println!("\nFailed recipients:");
        for failure in &failures {
            println!("  - {} ({})", failure.email, failure.error);
        }
    }

    if sent_count == 0 {
        anyhow::bail!("Failed to send all {} notifications", recipients.len());
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::sync::Mutex;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    use tokio::net::TcpListener;

    static ENV_LOCK: Mutex<()> = Mutex::new(());

    fn test_party() -> PartyNotification {
        PartyNotification {
            name: "Sanjay's <Party>".to_string(),
            slug: "new-party".to_string(),
            time: "2026-05-31T00:00:00Z".parse().unwrap(),
            location: "Austin & <NYC>".to_string(),
            description: "Bring \"ideas\" & snacks.".to_string(),
        }
    }

    #[test]
    fn finds_env_file_in_parent_directory() {
        let temp_root = std::env::temp_dir().join(format!("guestbook-env-test-{}", Uuid::new_v4()));
        let nested_dir = temp_root.join("app").join("guestbook");
        fs::create_dir_all(&nested_dir).unwrap();
        fs::write(
            temp_root.join(".env.local"),
            "PARTY_SITE_BASE_URL=https://example.com",
        )
        .unwrap();

        let found = find_env_file_from(&nested_dir, ".env.local");

        assert_eq!(found, Some(temp_root.join(".env.local")));

        fs::remove_dir_all(temp_root).unwrap();
    }

    #[test]
    fn builds_party_notification_email_with_escaped_html_and_plain_text() {
        let party = test_party();
        let email = build_party_notification_email(&party, "https://sanjay.party");

        assert_eq!(email.subject, "Sanjay invited you to Sanjay's <Party>");
        assert_eq!(email.rsvp_url, "https://sanjay.party/parties/new-party");
        assert!(email.html.contains("Sanjay&#39;s &lt;Party&gt;"));
        assert!(email.html.contains("Austin &amp; &lt;NYC&gt;"));
        assert!(email.html.contains("Bring &quot;ideas&quot; &amp; snacks."));
        assert!(!email.html.contains("Sanjay's <Party>"));
        assert!(email.text.contains("Sanjay's <Party>"));
        assert!(email
            .text
            .contains("RSVP here:\nhttps://sanjay.party/parties/new-party"));
        assert!(email
            .text
            .contains("You are getting this because you have an account on sanjay.party."));
        assert!(email.text.contains("reply \"unsubscribe\""));
        assert!(!email.html.contains("View invitation and RSVP"));
    }

    #[test]
    fn trims_base_url_before_building_rsvp_link() {
        let party = test_party();
        let email = build_party_notification_email(&party, "https://sanjay.party/");

        assert_eq!(email.rsvp_url, "https://sanjay.party/parties/new-party");
    }

    #[test]
    fn builds_resend_payload() {
        let email = PartyNotificationEmail {
            subject: "You're invited: Test".to_string(),
            html: "<p>Hello</p>".to_string(),
            text: "Hello".to_string(),
            rsvp_url: "https://sanjay.party/parties/test".to_string(),
        };

        let payload =
            build_resend_payload("Party <party@sanjay.party>", "guest@example.com", &email);

        assert_eq!(payload.from, "Party <party@sanjay.party>");
        assert_eq!(payload.to, "guest@example.com");
        assert_eq!(payload.subject, "You're invited: Test");
        assert_eq!(payload.html, "<p>Hello</p>");
        assert_eq!(payload.text, "Hello");
    }

    #[test]
    fn formats_rsvp_summary_people_with_and_without_names() {
        let updated_at: DateTime<Utc> = "2026-05-31T00:00:00Z".parse().unwrap();
        let named = RsvpSummaryRow {
            name: Some("  Jane Guest  ".to_string()),
            email: "jane@example.com".to_string(),
            status: "accepted".to_string(),
            updated_at: Some(updated_at),
        };
        let unnamed = RsvpSummaryRow {
            name: Some(" ".to_string()),
            email: "anon@example.com".to_string(),
            status: "not_started".to_string(),
            updated_at: None,
        };

        assert_eq!(
            format_rsvp_summary_person(&named),
            "Jane Guest <jane@example.com> (updated 2026-05-31 00:00)"
        );
        assert_eq!(format_rsvp_summary_person(&unnamed), "anon@example.com");
    }

    #[test]
    fn counts_rsvp_summary_statuses() {
        let rows = vec![
            RsvpSummaryRow {
                name: None,
                email: "a@example.com".to_string(),
                status: "accepted".to_string(),
                updated_at: None,
            },
            RsvpSummaryRow {
                name: None,
                email: "b@example.com".to_string(),
                status: "accepted".to_string(),
                updated_at: None,
            },
            RsvpSummaryRow {
                name: None,
                email: "c@example.com".to_string(),
                status: "pending".to_string(),
                updated_at: None,
            },
        ];

        assert_eq!(count_rsvp_status(&rows, "accepted"), 2);
        assert_eq!(count_rsvp_status(&rows, "pending"), 1);
        assert_eq!(count_rsvp_status(&rows, "declined"), 0);
        assert_eq!(rsvp_status_label("not_started"), "Not started");
        assert_eq!(rsvp_status_order("accepted"), 0);
        assert_eq!(rsvp_status_order("unknown"), 4);
    }

    #[test]
    fn normalizes_explicit_recipient_emails() {
        let recipients = normalize_explicit_recipient_emails(vec![
            " guest@example.com ".to_string(),
            "".to_string(),
            "guest@example.com".to_string(),
            "friend@example.com".to_string(),
        ]);

        assert_eq!(
            recipients,
            vec![
                "guest@example.com".to_string(),
                "friend@example.com".to_string(),
            ]
        );
    }

    #[test]
    fn dry_run_config_does_not_require_resend_credentials() {
        let _env_lock = ENV_LOCK.lock().unwrap();
        std::env::set_var("PARTY_SITE_BASE_URL", "https://sanjay.party");
        std::env::remove_var("RESEND_API_KEY");
        std::env::remove_var("RESEND_FROM_EMAIL");

        let config = load_notification_config(true).unwrap();

        assert_eq!(
            config,
            NotificationConfig {
                resend_api_key: None,
                from_email: None,
                site_base_url: "https://sanjay.party".to_string(),
            }
        );

        std::env::remove_var("PARTY_SITE_BASE_URL");
    }

    #[test]
    fn send_config_requires_resend_credentials() {
        let _env_lock = ENV_LOCK.lock().unwrap();
        std::env::set_var("PARTY_SITE_BASE_URL", "https://sanjay.party");
        std::env::remove_var("RESEND_API_KEY");
        std::env::remove_var("RESEND_FROM_EMAIL");

        let error = load_notification_config(false).unwrap_err();

        assert!(error.to_string().contains("RESEND_API_KEY"));

        std::env::remove_var("PARTY_SITE_BASE_URL");
    }

    #[tokio::test]
    async fn sends_resend_payload_to_http_endpoint() {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();

        let server = tokio::spawn(async move {
            let (mut stream, _) = listener.accept().await.unwrap();
            let mut buffer = vec![0; 4096];
            let bytes_read = stream.read(&mut buffer).await.unwrap();
            let request = String::from_utf8_lossy(&buffer[..bytes_read]).to_string();
            stream
                .write_all(
                    b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 13\r\n\r\n{\"id\":\"ok\"}",
                )
                .await
                .unwrap();
            request
        });

        let email = PartyNotificationEmail {
            subject: "You're invited: Test".to_string(),
            html: "<p>Hello</p>".to_string(),
            text: "Hello".to_string(),
            rsvp_url: "https://sanjay.party/parties/test".to_string(),
        };
        let payload =
            build_resend_payload("Party <party@sanjay.party>", "guest@example.com", &email);
        let http_client = reqwest::Client::new();

        send_resend_email_to_endpoint(
            &http_client,
            "test-api-key",
            &format!("http://{}/emails", address),
            &payload,
        )
        .await
        .unwrap();

        let request = server.await.unwrap();
        assert!(request.starts_with("POST /emails HTTP/1.1"));
        assert!(request.contains("authorization: Bearer test-api-key"));
        assert!(request.contains("\"from\":\"Party <party@sanjay.party>\""));
        assert!(request.contains("\"to\":\"guest@example.com\""));
        assert!(request.contains("\"subject\":\"You're invited: Test\""));
        assert!(request.contains("\"html\":\"<p>Hello</p>\""));
        assert!(request.contains("\"text\":\"Hello\""));
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    load_environment();

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

        Commands::Summary { slug } => show_rsvp_summary(&client, slug).await?,

        Commands::Update {
            slug,
            name,
            time,
            location,
            description,
        } => update_party(&client, slug, name, time, location, description).await?,

        Commands::Delete { slug } => delete_party(&client, slug).await?,

        Commands::Purge { slug } => purge_party(&client, slug).await?,

        Commands::Notify {
            slug,
            emails,
            dry_run,
        } => notify_party(&client, slug, emails, dry_run).await?,

        Commands::CreateTable => create_table(&client).await?,

        Commands::ClearTable { confirm } => clear_table(&client, confirm).await?,
    }

    Ok(())
}
