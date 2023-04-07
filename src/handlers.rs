use crate::errors::AuthError;
use crate::models::AuthReply;
use crate::party;
use crate::{errors::GuestNotFoundError, models};

use jwt::SignWithKey;
use warp::{reject, Rejection, Reply};

use std::sync::Arc;
use std::collections::BTreeMap;

pub type PartyRc = Arc<tokio::sync::RwLock<party::Party>>;

pub async fn hello(party_lock: PartyRc, guest: String) -> Result<impl Reply, Rejection> {
    let party = party_lock.read().await;
    if let Some(guest) = party.guest(&guest) {
        // TODO (sanjay) upon first request to hello delete the passcode
        Ok(warp::reply::json(&guest))
    } else {
        Err(reject::custom(GuestNotFoundError { guest }))
    }
}

pub async fn get_guest(party: PartyRc, guest: String) -> Result<impl Reply, Rejection> {
    if let Some(guest) = party.read().await.guest(&guest) {
        Ok(warp::reply::json(guest))
    } else {
        Err(reject::custom(GuestNotFoundError { guest }))
    }
}

pub async fn authenticate(
    party_lock: PartyRc,
    auth: models::AuthRequest,
) -> Result<impl Reply, Rejection> {
    let party = party_lock.read().await;
    if let Some(guest) = party.auth(&auth.passcode) {
        let mut claims = BTreeMap::new();
        claims.insert("guest", guest);

        if let Ok(token) = claims.sign_with_key(party.key()) {
            Ok(warp::reply::json(&AuthReply { token }))
        } else {
            Err(reject::custom(AuthError {}))
        }
    } else {
        Err(reject::custom(AuthError {}))
    }
}

pub async fn update_rsvp(
    party_lock: PartyRc,
    guest: String,
    rsvp: models::RsvpUpdate,
) -> Result<impl Reply, Rejection> {
    let mut party = party_lock.write().await;
    if let Some(guest) = party.rsvp(&guest, rsvp.rsvp_status) {
        return Ok(warp::reply::json(&guest));
    } else {
        Err(reject::custom(GuestNotFoundError { guest }))
    }
}
