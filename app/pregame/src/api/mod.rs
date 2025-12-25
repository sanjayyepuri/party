use crate::auth::OryState;
use crate::db::DbState;

pub struct ApiState {
    pub ory_state: OryState,
    pub db_state: DbState,
}

pub mod auth;
pub mod error;
pub mod party;
pub mod rsvp;
