use crate::auth::OryState;
use crate::db::DbState;

/// ApiState contains shared server state for the API.
///
/// This is to store connections and other shared resources.
/// No request specific state should be stored here.
pub struct ApiState {
    pub ory_state: OryState,
    pub db_state: DbState,
}

pub mod auth;
pub mod error;
pub mod party;
pub mod rsvp;
