//! Identity integration module for mapping Ory identities to application guests.
//!
//! This module provides the bridge between Ory's authentication system and our
//! application's guest records. It handles:
//! - Looking up guests by Ory identity ID
//! - Auto-creating guest records on first authentication
//! - Syncing user traits (email, phone, name) from Ory to our database

use crate::auth::OryIdentity;
use crate::db::DbState;
use crate::model::Guest;
use chrono::Utc;
use uuid::Uuid;

#[derive(Debug)]
pub enum IdentityError {
    DatabaseError(String),
    InvalidIdentity(String),
}

impl From<tokio_postgres::Error> for IdentityError {
    fn from(err: tokio_postgres::Error) -> Self {
        IdentityError::DatabaseError(err.to_string())
    }
}

/// Get an existing guest by Ory identity ID, or create a new one if it doesn't exist.
///
/// This function is called during authentication to ensure every authenticated user
/// has a corresponding guest record in our database. On first login, it creates a
/// new guest record with information from Ory's identity traits.
///
/// # Arguments
///
/// * `db` - Database connection state
/// * `identity` - Ory identity containing the ID and user traits
///
/// # Returns
///
/// Returns the guest record (either existing or newly created)
///
/// # Errors
///
/// Returns `IdentityError` if:
/// - Database query fails
/// - Guest creation fails
/// - Identity data is invalid
pub async fn get_or_create_guest(
    db: &DbState,
    identity: &OryIdentity,
) -> Result<Guest, IdentityError> {
    // First, try to find an existing guest with this identity_id
    let existing = db
        .client
        .query_opt(
            "SELECT guest_id, ory_identity_id, name, email, phone, created_at, updated_at, deleted_at
             FROM guest
             WHERE ory_identity_id = $1 AND deleted_at IS NULL",
            &[&identity.id],
        )
        .await?;

    if let Some(row) = existing {
        let guest =
            Guest::from_row(&row).map_err(|e| IdentityError::DatabaseError(e.to_string()))?;

        // TODO: Optionally sync traits here if they've changed
        // For now, we just return the existing guest

        return Ok(guest);
    }

    // Guest doesn't exist, create a new one from Ory identity traits
    let guest_id = Uuid::new_v4().to_string();
    let now = Utc::now();

    // Extract traits with defaults
    let name = identity.traits.name.clone().unwrap_or_default();
    let email = identity.traits.email.clone().unwrap_or_default();
    let phone = identity.traits.phone.clone().unwrap_or_default();

    db.client
        .execute(
            "INSERT INTO guest (guest_id, ory_identity_id, name, email, phone, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)",
            &[&guest_id, &identity.id, &name, &email, &phone, &now, &now],
        )
        .await?;

    // Fetch and return the newly created guest
    let row = db
        .client
        .query_one(
            "SELECT guest_id, ory_identity_id, name, email, phone, created_at, updated_at, deleted_at
             FROM guest
             WHERE guest_id = $1",
            &[&guest_id],
        )
        .await?;

    let guest = Guest::from_row(&row).map_err(|e| IdentityError::DatabaseError(e.to_string()))?;

    Ok(guest)
}

/// Sync guest traits from Ory identity.
///
/// This function updates the guest's name, email, and phone from Ory's identity
/// traits. This is useful when user information changes in Ory and we want to
/// keep our local data in sync.
///
/// # Arguments
///
/// * `db` - Database connection state
/// * `guest_id` - ID of the guest to update
/// * `identity` - Ory identity with updated traits
///
/// # Returns
///
/// Returns the updated guest record
///
/// # Errors
///
/// Returns `IdentityError` if the database update fails
#[allow(dead_code)]
pub async fn sync_guest_traits(
    db: &DbState,
    guest_id: &str,
    identity: &OryIdentity,
) -> Result<Guest, IdentityError> {
    let now = Utc::now();

    let name = identity.traits.name.clone().unwrap_or_default();
    let email = identity.traits.email.clone().unwrap_or_default();
    let phone = identity.traits.phone.clone().unwrap_or_default();

    db.client
        .execute(
            "UPDATE guest
             SET name = $1, email = $2, phone = $3, updated_at = $4
             WHERE guest_id = $5 AND deleted_at IS NULL",
            &[&name, &email, &phone, &now, &guest_id],
        )
        .await?;

    // Fetch and return the updated guest
    let row = db
        .client
        .query_one(
            "SELECT guest_id, ory_identity_id, name, email, phone, created_at, updated_at, deleted_at
             FROM guest
             WHERE guest_id = $1",
            &[&guest_id],
        )
        .await?;

    let guest = Guest::from_row(&row).map_err(|e| IdentityError::DatabaseError(e.to_string()))?;

    Ok(guest)
}
