use std::collections::HashMap;

#[derive(Debug)]
pub enum RsvpStatus {
    Pending,
    Going,
    Maybe,
    Declined,
}

#[derive(Debug)]
pub struct Guest {
    pub name: String,
    pub passcode: String,
    pub status: RsvpStatus
}

pub type GuestDb = HashMap<String, Guest>;
