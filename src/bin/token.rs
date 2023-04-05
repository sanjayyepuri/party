use hmac::{Hmac, Mac};
use jwt::SignWithKey;
use sha2::Sha256;
use std::collections::BTreeMap;

use std::{env, io};

#[tokio::main]
async fn main() {
    let token = match env::var("PARTY_TOKEN") {
        Ok(t) => t.trim().to_string(),
        Err(_) => panic!("supply PARTY_TOKEN")
    };

    let mut passcode = String::new();
    io::stdin().read_line(&mut passcode).unwrap();


    let key: Hmac<Sha256> = Hmac::new_from_slice(token.as_bytes()).unwrap();
    let mut claims = BTreeMap::new();
    claims.insert("name", passcode.trim().to_string());
    let token_str = claims.sign_with_key(&key).unwrap();

    println!("{}", token_str);
}
