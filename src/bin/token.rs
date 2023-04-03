use hmac::{Hmac, Mac};
use jwt::SignWithKey;
use sha2::Sha256;
use std::collections::BTreeMap;

#[tokio::main]
async fn main() {
    let key: Hmac<Sha256> = Hmac::new_from_slice(b"dumb key").unwrap();
    let mut claims = BTreeMap::new();
    claims.insert("passcode", "dumb1");
    let token_str = claims.sign_with_key(&key).unwrap();

    println!("{}", token_str);
}
