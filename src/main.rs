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

    let party = Arc::new(party::Party::new(&party_key));

    warp::serve(filters::party(party.clone()))
        .run(([127, 0, 0, 1], 8000))
        .await;
}

mod filters {
    use super::handlers;
    use super::party;

    use std::collections::BTreeMap;
    use std::sync::Arc;

    use jwt::{Error, VerifyWithKey};
    use warp::{self, reject, Filter};

    use crate::errors;
    use crate::models;

    pub fn party(
        party: Arc<party::Party>,
    ) -> impl Filter<Extract = (impl warp::Reply,), Error = warp::Rejection> + Clone {
        hello(party.clone())
            .or(rsvp(party.clone()))
            .or(auth(party.clone()))
    }

    pub fn hello(
        party: party::PartyRc,
    ) -> impl Filter<Extract = (impl warp::Reply,), Error = warp::Rejection> + Clone {
        warp::path!("hello")
            .and(warp::get())
            .and(with_party(party.clone()))
            .and(with_token(party.party_key.clone()))
            .and_then(handlers::hello)
    }

    pub fn rsvp(
        party: party::PartyRc,
    ) -> impl Filter<Extract = (impl warp::Reply,), Error = warp::Rejection> + Clone {
        warp::path!("rsvp")
            .and(warp::get())
            .and(with_party(party.clone()))
            .and(with_token(party.party_key.clone())) // TODO (sanjay) use dynamic signing key
            .and_then(handlers::get_rsvp)
    }

    pub fn auth(
        party: party::PartyRc,
    ) -> impl Filter<Extract = (impl warp::Reply,), Error = warp::Rejection> + Clone {
        warp::path!("auth")
            .and(warp::post())
            .and(with_party(party.clone()))
            .and(json_auth())
            .and_then(handlers::auth)
    }

    fn json_auth() -> impl Filter<Extract = (models::AuthRequest,), Error = warp::Rejection> + Clone
    {
        warp::body::content_length_limit(1024).and(warp::body::json())
    }

    fn with_party(
        party: Arc<party::Party>,
    ) -> impl Filter<Extract = (Arc<party::Party>,), Error = std::convert::Infallible> + Clone {
        warp::any().map(move || party.clone())
    }

    fn with_token(
        party_key: party::PartyKey,
    ) -> impl Filter<Extract = (String,), Error = warp::Rejection> + Clone {
        warp::header::header::<String>("Authorization")
            .and(warp::any().map(move || party_key.clone()))
            .and_then(|token: String, party_key| async move {
                let res: Result<BTreeMap<String, String>, Error> =
                    token.verify_with_key(&party_key);

                if let Ok(claims) = res {
                    if let Some(userid) = claims.get("name") {
                        Ok(userid.to_string())
                    } else {
                        Err(reject::custom(errors::TokenVerificationError))
                    }
                } else {
                    Err(reject::custom(errors::TokenVerificationError))
                }
            })
    }
}
