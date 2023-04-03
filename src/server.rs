use crate::party::Party;

use std::collections::BTreeMap;

use hmac::{Hmac, Mac};
use jwt::VerifyWithKey;
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

pub struct Server {
    pub party: Party,
    party_key: HmacSha256,
}

impl Server {
    pub fn new(party: Party, party_key: &str) -> Server {
        Server {
            party,
            party_key: HmacSha256::new_from_slice(party_key.as_bytes()).unwrap(),
        }
    }

    pub fn hello(&self, token: String) -> String {
        println!("{:?}", token);
        let claims: BTreeMap<String, String> = token.verify_with_key(&self.party_key).unwrap();
        let guest = self.party.guest(&claims["passcode"]).unwrap();
        format!("{:?}", guest)
    }
}
