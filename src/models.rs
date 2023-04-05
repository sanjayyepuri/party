use std::collections::HashMap;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub enum RsvpStatus {
    Pending,
    Going,
    Maybe,
    Declined,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Guest {
    pub name: String,
    pub passcode: String,
    pub status: RsvpStatus
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthRequest {
    pub password_hash: String
}

pub type GuestDb = HashMap<String, Guest>;


