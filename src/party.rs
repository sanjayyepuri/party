use crate::models::{Guest, RsvpStatus};

use firestore::*;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use std::collections::HashMap;

use tracing::*;

pub type PartyKey = Hmac<Sha256>;

pub struct Party {
    db: FirestoreDb,
    party_key: PartyKey,
}

impl Party {
    pub async fn new(project_id: &str, party_key: &str) -> Party {
        Party {
            db: FirestoreDb::new(project_id).await.unwrap(),
            party_key: PartyKey::new_from_slice(party_key.as_bytes()).unwrap(),
        }
    }

    pub async fn auth(&self, passcode: &str) -> Option<String> {
        let query = self
            .db
            .fluent()
            .select()
            .fields(paths!(Guest::id))
            .from("guests")
            .filter(|q| q.for_any(q.field("passcode").eq(passcode)))
            .obj()
            .query()
            .await;

        let mut guests: Vec<HashMap<String, String>> = match query {
            Ok(guests) => guests,
            Err(_) => return None,
        };

        if guests.len() != 1 {
            return None;
        }
        
       guests[0].remove("_firestore_id")
    }

    pub async fn guest(&self, guest: &str) -> Option<Guest> {
        let res = self
            .db
            .fluent()
            .select()
            .by_id_in("guests")
            .obj()
            .one(guest)
            .await;

        match res {
            Ok(guest) => guest,
            Err(_) => None,
        }
    }

    pub fn key(&self) -> &PartyKey {
        &self.party_key
    }

    pub async fn rsvp(&mut self, guest: &str, rsvp: RsvpStatus) -> Option<Guest> {
        let update = HashMap::from([("status".to_owned(), rsvp)]);

        let res = self
            .db
            .fluent()
            .update()
            .fields(paths!(Guest::status))
            .in_col("guests")
            .document_id(guest)
            .object(&update)
            .execute()
            .await;

        match res {
            Ok(guest) => guest,
            Err(_) => None,
        }
    }
}
