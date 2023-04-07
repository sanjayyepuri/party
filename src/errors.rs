use warp::reject;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct GuestNotFoundError{
    pub guest: String
}
impl reject::Reject for GuestNotFoundError{}

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenVerificationError;
impl reject::Reject for TokenVerificationError {}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthError;
impl reject::Reject for AuthError {}