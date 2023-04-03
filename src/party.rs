use crate::db::{Guest, GuestDb, RsvpStatus};

use std::collections::HashMap;

pub struct Party {
    pub db: GuestDb,
}

impl Party {
    pub fn new() -> Party {
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
        }
    }


    pub fn guest(&self, passcode: &String) -> Option<&Guest> {
        self.db.get(passcode)
    }

}
