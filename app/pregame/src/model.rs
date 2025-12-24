use serde::{Deserialize, Serialize};
use tokio_postgres::Row;

#[derive(Debug, Serialize, Deserialize)]
pub struct Book {
    pub id: i32,
    pub title: String,
    pub author: String,
    pub year: i32,
}

impl Book {
    pub fn from_row(row: &Row) -> Result<Self, tokio_postgres::Error> {
        Ok(Book {
            id: row.try_get("id")?,
            title: row.try_get("title")?,
            author: row.try_get("author")?,
            year: row.try_get("publication_year")?,
        })
    }
}

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
