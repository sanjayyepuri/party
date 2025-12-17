use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Party {
    name: String,
    description: String,
}

pub fn hello_party() -> Party {
    Party {
        name: "Hello".to_string(),
        description: "World".to_string(),
    }
}
