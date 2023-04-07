use crate::models::{Guest, RsvpStatus};

use hmac::{Hmac, Mac};
use sha2::{Sha256, Digest};

use std::collections::HashMap;

pub type PartyKey = Hmac<Sha256>;

pub struct Party {
    auth_map: HashMap<Vec<u8>, String>,
    guest_map: HashMap<String, Guest>,
    party_key: PartyKey,
}

// passcode hash -> userid
// userid -> Guest

impl Party {
    pub fn new(party_key: &str) -> Party {
        Party {
            auth_map: HashMap::from([
                (Sha256::digest("passcode1").to_vec(), "guest1".to_string()),
                (Sha256::digest("passcode2").to_vec(), "guest2".to_string()),
            ]),
            guest_map: HashMap::from([
                (
                    "guest1".to_string(),
                    Guest {
                        name: "name1".to_string(),
                        status: RsvpStatus::Pending,
                        passcode: "passcode1".to_string(),
                    },
                ),
                (
                    "guest2".to_string(),
                    Guest {
                        name: "name2".to_string(),
                        status: RsvpStatus::Pending,
                        passcode: "passcode2".to_string(),
                    },
                ),
            ]),
            party_key: PartyKey::new_from_slice(party_key.as_bytes()).unwrap(),
        }
    }

    pub fn auth(&self, passcode: &str) -> Option<&String> {
        let sha = Sha256::digest(passcode).to_vec();
        self.auth_map.get(&sha)
    }

    pub fn guest(&self, guest: &str) -> Option<&Guest> {
        self.guest_map.get(guest)
    }

    pub fn key(&self) -> &PartyKey {
        &self.party_key
    }

    pub fn rsvp(&mut self, guest: &str, rsvp: RsvpStatus) -> Option<&Guest> {
        if let Some(guest) = self.guest_map.get_mut(guest) {
            guest.status = rsvp;
            Some(guest)
        } else {
            None
        }
    }

}

