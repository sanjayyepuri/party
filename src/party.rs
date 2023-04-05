use crate::models::{Guest, GuestDb, RsvpStatus};

use std::collections::HashMap;
use std::sync::Arc;

use hmac::{Hmac, Mac};
use sha2::Sha256;

pub type PartyKey = Hmac<Sha256>;


pub struct Party {
    pub db: GuestDb,
    pub party_key: PartyKey,
}

impl Party {
    pub fn new(party_key: &String) -> Party {
        Party {
            db: HashMap::from([
                (
                   "dumb1".to_string(),
                    Guest {
                        name: "Sanjay".to_string(),
                        passcode: "dumb1".to_string(),
                        status: RsvpStatus::Pending,
                    },
                ),
                (
                    "dumb2".to_string(),
                    Guest {
                        name: "Sanjana".to_string(),
                        passcode: "dumb2".to_string(),
                        status: RsvpStatus::Pending,
                    },
                ),
            ]),
            party_key: PartyKey::new_from_slice(party_key.as_bytes()).unwrap()
        }
    }


    pub fn guest(&self, passcode: &String) -> Option<&Guest> {
        self.db.get(passcode)
    }

}


pub type PartyRc = Arc<Party>;