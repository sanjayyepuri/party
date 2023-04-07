use std::collections::BTreeMap;

use crate::errors::AuthError;
use crate::models::AuthReply;
use crate::party;
use crate::{errors::GuestNotFoundError, models};
use jwt::SignWithKey;
use warp::{reject, Rejection, Reply};

pub async fn hello(party: party::PartyRc, guest: String) -> Result<impl Reply, Rejection> {
    if let Some(guest) = party.guest(&guest) {
        // TODO (sanjay) upon first request to hello delete the passcode
        Ok(warp::reply::json(&guest))
    } else {
        Err(reject::custom(GuestNotFoundError { guest }))
    }
}

pub async fn get_guest(party: party::PartyRc, guest: String) -> Result<impl Reply, Rejection> {
    if let Some(guest) = party.guest(&guest) {
        Ok(warp::reply::json(guest))
    } else {
        Err(reject::custom(GuestNotFoundError { guest }))
    }
}

pub async fn auth(
    party: party::PartyRc,
    auth: models::AuthRequest,
) -> Result<impl Reply, Rejection> {
    if let Some(guest) = party.auth(&auth.passcode) {
        let mut claims = BTreeMap::new();
        claims.insert("guest", guest);

        if let Ok(token) =  claims.sign_with_key(party.key()) {
            Ok(warp::reply::json(&AuthReply{token}))
        } else {
            Err(reject::custom(AuthError{}))
        }
    } else {
        Err(reject::custom(AuthError{}))
    }
}
