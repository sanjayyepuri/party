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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Guest {
    pub guest_id: String,
    /// This is the Ory Identity ID associated with the guest.
    pub ory_identity_id: String,
    pub name: String,
    pub email: String,
    pub phone: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub deleted_at: Option<chrono::DateTime<chrono::Utc>>,
}

impl Guest {
    pub fn from_row(row: &Row) -> Result<Self, tokio_postgres::Error> {
        Ok(Guest {
            guest_id: row.try_get("guest_id")?,
            ory_identity_id: row.try_get("ory_identity_id")?,
            name: row.try_get("name")?,
            email: row.try_get("email")?,
            phone: row.try_get("phone")?,
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
    pub guest_id: String,
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
            guest_id: row.try_get("guest_id")?,
            status: row.try_get("status")?,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
            deleted_at: row.try_get("deleted_at")?,
        })
    }
}
