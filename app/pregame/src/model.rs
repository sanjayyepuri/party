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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_party_serialization() {
        let party = Party {
            party_id: "test-party-id".to_string(),
            name: "Test Party".to_string(),
            time: chrono::Utc::now(),
            location: "Test Location".to_string(),
            description: "Test Description".to_string(),
            slug: "test-party".to_string(),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            deleted_at: None,
        };

        let json = serde_json::to_string(&party).unwrap();
        let deserialized: Party = serde_json::from_str(&json).unwrap();

        assert_eq!(party.party_id, deserialized.party_id);
        assert_eq!(party.name, deserialized.name);
        assert_eq!(party.location, deserialized.location);
        assert_eq!(party.description, deserialized.description);
        assert_eq!(party.slug, deserialized.slug);
        assert_eq!(party.deleted_at, deserialized.deleted_at);
    }

    #[test]
    fn test_party_with_deleted_at() {
        let party = Party {
            party_id: "test-party-id".to_string(),
            name: "Test Party".to_string(),
            time: chrono::Utc::now(),
            location: "Test Location".to_string(),
            description: "Test Description".to_string(),
            slug: "test-party".to_string(),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            deleted_at: Some(chrono::Utc::now()),
        };

        let json = serde_json::to_string(&party).unwrap();
        let deserialized: Party = serde_json::from_str(&json).unwrap();

        assert!(deserialized.deleted_at.is_some());
    }

    #[test]
    fn test_rsvp_serialization() {
        let rsvp = Rsvp {
            rsvp_id: "test-rsvp-id".to_string(),
            party_id: "test-party-id".to_string(),
            user_id: "test-user-id".to_string(),
            status: "confirmed".to_string(),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            deleted_at: None,
        };

        let json = serde_json::to_string(&rsvp).unwrap();
        let deserialized: Rsvp = serde_json::from_str(&json).unwrap();

        assert_eq!(rsvp.rsvp_id, deserialized.rsvp_id);
        assert_eq!(rsvp.party_id, deserialized.party_id);
        assert_eq!(rsvp.user_id, deserialized.user_id);
        assert_eq!(rsvp.status, deserialized.status);
        assert_eq!(rsvp.deleted_at, deserialized.deleted_at);
    }

    #[test]
    fn test_rsvp_with_deleted_at() {
        let rsvp = Rsvp {
            rsvp_id: "test-rsvp-id".to_string(),
            party_id: "test-party-id".to_string(),
            user_id: "test-user-id".to_string(),
            status: "pending".to_string(),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            deleted_at: Some(chrono::Utc::now()),
        };

        let json = serde_json::to_string(&rsvp).unwrap();
        let deserialized: Rsvp = serde_json::from_str(&json).unwrap();

        assert!(deserialized.deleted_at.is_some());
    }

    // Note: from_row() methods require database Row objects and should be tested
    // via integration tests with a real database connection or mocked Row objects.
}
