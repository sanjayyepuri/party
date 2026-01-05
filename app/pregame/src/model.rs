use serde::{Deserialize, Serialize};
use tokio_postgres::Row;

#[derive(Debug, Serialize, Deserialize)]
pub struct Party {
    pub party_id: String,
    pub name: String,
    pub time: chrono::DateTime<chrono::Utc>,
    pub location: String,
    pub description: String,
    pub slug: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub deleted_at: Option<chrono::DateTime<chrono::Utc>>,
}

impl Party {
    pub fn from_row(row: &Row) -> Result<Self, tokio_postgres::Error> {
        Ok(Party {
            party_id: row.try_get("party_id")?,
            name: row.try_get("name")?,
            time: row.try_get("time")?,
            location: row.try_get("location")?,
            description: row.try_get("description")?,
            slug: row.try_get("slug")?,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
            deleted_at: row.try_get("deleted_at")?,
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Rsvp {
    pub rsvp_id: String,
    pub party_id: String,
    /// Better Auth user ID - links directly to the "user" table
    pub user_id: String,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub deleted_at: Option<chrono::DateTime<chrono::Utc>>,
}

impl Rsvp {
    pub fn from_row(row: &Row) -> Result<Self, tokio_postgres::Error> {
        Ok(Rsvp {
            rsvp_id: row.try_get("rsvp_id")?,
            party_id: row.try_get("party_id")?,
            user_id: row.try_get("user_id")?,
            status: row.try_get("status")?,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
            deleted_at: row.try_get("deleted_at")?,
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RsvpWithUser {
    pub rsvp_id: String,
    pub party_id: String,
    pub user_id: String,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub deleted_at: Option<chrono::DateTime<chrono::Utc>>,
    pub user_name: Option<String>,
}

impl RsvpWithUser {
    pub fn from_row(row: &Row) -> Result<Self, tokio_postgres::Error> {
        Ok(RsvpWithUser {
            rsvp_id: row.try_get("rsvp_id")?,
            party_id: row.try_get("party_id")?,
            user_id: row.try_get("user_id")?,
            status: row.try_get("status")?,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
            deleted_at: row.try_get("deleted_at")?,
            user_name: row.try_get("user_name")?,
        })
    }
}
