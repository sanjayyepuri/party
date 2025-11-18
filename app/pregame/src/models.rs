use sqlx::FromRow;
use chrono::{DateTime, Utc};

#[derive(FromRow)]
pub struct Guest {
    pub id: i32,
    pub first_name: String,
    pub last_name: String,
    pub phone_number: String,
}

#[derive(FromRow)]
pub struct Party {
    pub id: i32,
    pub name: String,
    pub location: String,
    pub description: String,
    pub date: Option<DateTime<Utc>>,
}

#[derive(sqlx::Type, Debug, Clone, PartialEq, PartialOrd)]
#[sqlx(type_name = "RsvpStatus", rename_all = "lowercase")]
pub enum RsvpStatus {
    No,
    Yes,
    Maybe,
}

#[derive(FromRow)]
pub struct Invitation {
    pub id: i32,
    pub guest_id: i64,
    pub party_id: i64,
    pub status: RsvpStatus,
}