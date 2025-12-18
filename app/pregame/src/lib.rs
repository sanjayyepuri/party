use serde::{Deserialize, Serialize};

pub mod api;
pub mod auth;

#[derive(Serialize, Deserialize)]
pub struct Party {
    pub name: String,
    pub description: String,
}

pub fn hello_party() -> Party {
    Party {
        name: "Hello".to_string(),
        description: "World".to_string(),
    }
}
