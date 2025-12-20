use serde::{Deserialize, Serialize};
use tokio_postgres::{Client, Row};

#[derive(Debug, Serialize, Deserialize)]
pub struct Guest {
    pub id: i32,
    pub name: String,
    pub email: String,
    pub phone: String,
}

impl Guest {
    pub fn from_row(row: &Row) -> Result<Self, tokio_postgres::Error> {
        Ok(Guest {
            id: row.try_get("id")?,
            name: row.try_get("name")?,
            email: row.try_get("email")?,
            phone: row.try_get("phone")?,
        })
    }

    pub async fn get_guest(client: &Client, id: i32) -> Result<Self, tokio_postgres::Error> {
        let row = client
            .query_one(
                "SELECT id, name, email, phone FROM guests WHERE id = $1",
                &[&id],
            )
            .await?;
        Self::from_row(&row)
    }

    pub async fn update_guest(client: &Client, guest: Self) -> Result<(), tokio_postgres::Error> {
        client
            .execute(
                "UPDATE guests SET name = $1, email = $2, phone = $3 WHERE id = $4",
                &[&guest.name, &guest.email, &guest.phone, &guest.id],
            )
            .await?;
        Ok(())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Party {
    pub id: i32,
    pub name: String,
    pub description: String,
    pub address: String,
}

impl Party {
    pub fn from_row(row: &Row) -> Result<Self, tokio_postgres::Error> {
        Ok(Self {
            id: row.try_get("id")?,
            name: row.try_get("name")?,
            description: row.try_get("description")?,
            address: row.try_get("address")?,
        })
    }

    pub async fn get_party(client: &Client, id: i32) -> Result<Self, tokio_postgres::Error> {
        let row = client
            .query_one(
                "SELECT id, name, description, address FROM parties WHERE id = $1",
                &[&id],
            )
            .await?;
        Self::from_row(&row)
    }

    pub async fn get_rsvps_by_party_with_guest(
        client: &Client,
        party_id: i32,
    ) -> Result<Vec<RsvpWithGuestName>, tokio_postgres::Error> {
        let rows = client
            .query(
                "SELECT r.id, r.party_id, r.guest_id, r.status, g.name
                 FROM rsvps r
                 JOIN guests g ON r.guest_id = g.id
                 WHERE r.party_id = $1",
                &[&party_id],
            )
            .await?;

        rows.iter()
            .map(|row| {
                Ok(RsvpWithGuestName {
                    id: row.try_get("id")?,
                    party_id: row.try_get("party_id")?,
                    guest_id: row.try_get("guest_id")?,
                    status: match row.try_get("status")? {
                        0 => RsvpStatus::Pending,
                        1 => RsvpStatus::Accepted,
                        2 => RsvpStatus::Maybe,
                        3 => RsvpStatus::Declined,
                        _ => panic!("Invalid status"),
                    },
                    guest_name: row.try_get("name")?,
                })
            })
            .collect::<Result<Vec<RsvpWithGuestName>, _>>()
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub enum RsvpStatus {
    Pending,
    Accepted,
    Maybe,
    Declined,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Rsvp {
    pub id: i32,
    pub party_id: i32,
    pub guest_id: i32,
    pub status: RsvpStatus,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RsvpWithGuest {
    #[serde(flatten)]
    pub rsvp: Rsvp,
    pub guest: Guest,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RsvpWithGuestName {
    pub id: i32,
    pub party_id: i32,
    pub guest_id: i32,
    pub status: RsvpStatus,
    pub guest_name: String,
}

impl Rsvp {
    pub fn from_row(row: &Row) -> Result<Self, tokio_postgres::Error> {
        Ok(Self {
            id: row.try_get("id")?,
            party_id: row.try_get("party_id")?,
            guest_id: row.try_get("guest_id")?,
            status: match row.try_get("status")? {
                0 => RsvpStatus::Pending,
                1 => RsvpStatus::Accepted,
                2 => RsvpStatus::Maybe,
                3 => RsvpStatus::Declined,
                _ => panic!("Invalid status"), // TODO (sanjay) properkly handle this error
            },
        })
    }

    pub async fn get_rsvp(client: &Client, id: i32) -> Result<Self, tokio_postgres::Error> {
        let row = client
            .query_one(
                "SELECT id, party_id, guest_id, status FROM rsvps WHERE id = $1",
                &[&id],
            )
            .await?;
        Self::from_row(&row)
    }

    pub async fn get_rsvps_by_guest_party(
        client: &Client,
        guest_id: i32,
        party_id: i32,
    ) -> Result<Self, tokio_postgres::Error> {
        let row = client
            .query_one(
                "SELECT id, party_id, guest_id, status FROM rsvps WHERE guest_id = $1 AND party_id = $2",
                &[&guest_id, &party_id],
            )
            .await?;

        Self::from_row(&row)
    }

    pub async fn update_rsvp(
        client: &Client,
        id: i32,
        status: RsvpStatus,
    ) -> Result<Self, tokio_postgres::Error> {
        let status_value: i32 = match status {
            RsvpStatus::Pending => 0,
            RsvpStatus::Accepted => 1,
            RsvpStatus::Maybe => 2,
            RsvpStatus::Declined => 3,
        };

        let row = client
            .query_one(
                "UPDATE rsvps SET status = $1 WHERE id = $2 RETURNING id, party_id, guest_id, status",
                &[&status_value, &id],
            )
            .await?;

        Self::from_row(&row)
    }
}
