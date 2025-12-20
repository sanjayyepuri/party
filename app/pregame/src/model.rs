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
