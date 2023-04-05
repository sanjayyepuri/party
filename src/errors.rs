use warp::reject;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct GuestNotFoundError{
    pub userid: String
}
impl reject::Reject for GuestNotFoundError{}

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenVerificationError;
impl reject::Reject for TokenVerificationError {}