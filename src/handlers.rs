use std::convert::Infallible;

use crate::party;
use crate::{errors::GuestNotFoundError, models};
use warp::{reject, Rejection, Reply};

pub async fn hello(party: party::PartyRc, userid: String) -> Result<impl Reply, Rejection> {
    if let Some(guest) = party.guest(&userid) {
        Ok(guest.passcode.to_string())
    } else {
        Err(reject::custom(GuestNotFoundError { userid }))
    }
}

pub async fn get_rsvp(party: party::PartyRc, userid: String) -> Result<impl Reply, Rejection> {
    if let Some(guest) = party.db.get(&userid) {
        Ok(warp::reply::json(guest))
    } else {
        Err(reject::custom(GuestNotFoundError { userid }))
    }
}

pub async fn auth(
    party: party::PartyRc,
    auth: models::AuthRequest,
) -> Result<impl Reply, Infallible> {
    Ok("token".to_string())
}
