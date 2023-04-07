mod errors;
mod handlers;
mod models;
mod party;

use std::env;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    let party_key = match env::var("PARTY_KEY") {
        Ok(t) => t.trim_end().to_string(),
        Err(_) => panic!("supply PARTY_KEY"),
    };

    let party = Arc::new(tokio::sync::RwLock::new(party::Party::new(&party_key)));

    warp::serve(filters::party(party.clone()))
        .run(([127, 0, 0, 1], 8000))
        .await;
}

mod filters {
    use crate::errors;
    use crate::handlers::{self, PartyRc};
    use crate::models;

    use jwt::{Error, VerifyWithKey};
    use serde::de::DeserializeOwned;
    use warp::{self, reject, Filter};

    use std::collections::BTreeMap;

    pub fn party(
        party: PartyRc,
    ) -> impl Filter<Extract = (impl warp::Reply,), Error = warp::Rejection> + Clone {
        hello(party.clone())
            .or(rsvp(party.clone()))
            .or(auth(party.clone()))
    }

    pub fn hello(
        party: PartyRc,
    ) -> impl Filter<Extract = (impl warp::Reply,), Error = warp::Rejection> + Clone {
        warp::path!("hello")
            .and(warp::get())
            .and(with_party(party.clone()))
            .and(with_token(party.clone()))
            .and_then(handlers::hello)
    }

    pub fn rsvp(
        party: PartyRc,
    ) -> impl Filter<Extract = (impl warp::Reply,), Error = warp::Rejection> + Clone {
        let get = warp::path!("rsvp")
            .and(warp::get())
            .and(with_party(party.clone()))
            .and(with_token(party.clone())) // TODO (sanjay) use dynamic signing key
            .and_then(handlers::get_guest);

        let post = warp::path!("rsvp")
            .and(warp::post())
            .and(with_party(party.clone()))
            .and(with_token(party.clone()))
            .and(with_json::<models::RsvpUpdate>())
            .and_then(handlers::update_rsvp);

        get.or(post)
    }

    pub fn auth(
        party: PartyRc,
    ) -> impl Filter<Extract = (impl warp::Reply,), Error = warp::Rejection> + Clone {
        warp::path!("auth")
            .and(warp::post())
            .and(with_party(party.clone()))
            .and(with_json::<models::AuthRequest>())
            .and_then(handlers::authenticate)
    }

    fn with_json<T: Send + DeserializeOwned>(
    ) -> impl Filter<Extract = (T,), Error = warp::Rejection> + Clone {
        warp::body::content_length_limit(1024).and(warp::body::json())
    }

    fn with_party(
        party: PartyRc,
    ) -> impl Filter<Extract = (PartyRc,), Error = std::convert::Infallible> + Clone {
        warp::any().map(move || party.clone())
    }

    fn with_token(
        party_lock: PartyRc,
    ) -> impl Filter<Extract = (String,), Error = warp::Rejection> + Clone {
        warp::header::header::<String>("Authorization")
            .and(with_party(party_lock.clone()))
            .and_then(|token: String, party_lock: PartyRc| async move {
                let res: Result<BTreeMap<String, String>, Error> =
                    token.verify_with_key(party_lock.read().await.key());

                if let Ok(claims) = res {
                    if let Some(guest) = claims.get("guest") {
                        Ok(guest.to_string())
                    } else {
                        Err(reject::custom(errors::TokenVerificationError))
                    }
                } else {
                    Err(reject::custom(errors::TokenVerificationError))
                }
            })
    }
}
