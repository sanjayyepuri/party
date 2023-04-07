use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub enum RsvpStatus {
    Pending,
    Going,
    Maybe,
    Declined,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Guest {
    pub name: String,
    pub status: RsvpStatus,
    pub passcode: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthRequest {
    pub passcode: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthReply {
    pub token: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RsvpUpdate {
    pub rsvp_status: RsvpStatus
}
