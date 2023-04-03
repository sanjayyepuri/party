mod db;
mod party;
mod server;

use hmac::{Hmac, Mac};
use sha2::Sha256;
use jwt::SignWithKey;
use warp::Filter;

use std::collections::BTreeMap;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    let key: Hmac<Sha256> = Hmac::new_from_slice(b"dumb key").unwrap();
    let mut claims = BTreeMap::new();
    claims.insert("passcode", "dumb1");
    let token_str = claims.sign_with_key(&key).unwrap();

    println!("{}", token_str);

    let server = Arc::new(server::Server::new(party::Party::new(), "dumb key"));

    let hp = Arc::clone(&server);
    let hi = warp::path!("hello" / String).map(move |token: String| hp.hello(token));

    warp::serve(hi).run(([127, 0, 0, 1], 8000)).await;
}
