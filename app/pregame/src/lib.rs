pub mod models;
pub mod server;

use sqlx::{PgPool, Result, Row};
use models::{Guest, Invitation, Party, RsvpStatus};
pub use server::start_grpc_server;
use chrono::{DateTime, Utc};

// Guest CRUD operations
pub async fn create_guest(pool: &PgPool, first_name: &str, last_name: &str, phone_number: &str) -> Result<Guest> {
    let row = sqlx::query(
        r#"
        INSERT INTO guests (first_name, last_name, phone_number)
        VALUES ($1, $2, $3)
        RETURNING id, first_name, last_name, phone_number
        "#,
    )
    .bind(first_name)
    .bind(last_name)
    .bind(phone_number)
    .fetch_one(pool)
    .await?;

    Ok(Guest {
        id: row.get("id"),
        first_name: row.get("first_name"),
        last_name: row.get("last_name"),
        phone_number: row.get("phone_number"),
    })
}

pub async fn get_guest(pool: &PgPool, guest_id: i32) -> Result<Guest> {
    let row = sqlx::query(
        r#"
        SELECT id, first_name, last_name, phone_number
        FROM guests
        WHERE id = $1
        "#,
    )
    .bind(guest_id)
    .fetch_one(pool)
    .await?;

    Ok(Guest {
        id: row.get("id"),
        first_name: row.get("first_name"),
        last_name: row.get("last_name"),
        phone_number: row.get("phone_number"),
    })
}

pub async fn update_guest(pool: &PgPool, guest_id: i32, first_name: &str, last_name: &str, phone_number: &str) -> Result<Guest> {
    let row = sqlx::query(
        r#"
        UPDATE guests
        SET first_name = $1, last_name = $2, phone_number = $3
        WHERE id = $4
        RETURNING id, first_name, last_name, phone_number
        "#,
    )
    .bind(first_name)
    .bind(last_name)
    .bind(phone_number)
    .bind(guest_id)
    .fetch_one(pool)
    .await?;

    Ok(Guest {
        id: row.get("id"),
        first_name: row.get("first_name"),
        last_name: row.get("last_name"),
        phone_number: row.get("phone_number"),
    })
}

pub async fn delete_guest(pool: &PgPool, guest_id: i32) -> Result<()> {
    sqlx::query(
        r#"
        DELETE FROM guests
        WHERE id = $1
        "#,
    )
    .bind(guest_id)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn list_guests(pool: &PgPool) -> Result<Vec<Guest>> {
    let rows = sqlx::query(
        r#"
        SELECT id, first_name, last_name, phone_number
        FROM guests
        ORDER BY id
        "#
    )
    .fetch_all(pool)
    .await?;

    let guests = rows.into_iter().map(|row| Guest {
        id: row.get("id"),
        first_name: row.get("first_name"),
        last_name: row.get("last_name"),
        phone_number: row.get("phone_number"),
    }).collect();

    Ok(guests)
}

// Party CRUD operations
pub async fn create_party(pool: &PgPool, name: &str, location: &str, description: &str, date: Option<DateTime<Utc>>) -> Result<Party> {
    let row = sqlx::query(
        r#"
        INSERT INTO party (name, location, description, date)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, location, description, date
        "#,
    )
    .bind(name)
    .bind(location)
    .bind(description)
    .bind(date)
    .fetch_one(pool)
    .await?;

    Ok(Party {
        id: row.get("id"),
        name: row.get("name"),
        location: row.get("location"),
        description: row.get("description"),
        date: row.get("date"),
    })
}

pub async fn get_party(pool: &PgPool, party_id: i32) -> Result<Party> {
    let row = sqlx::query(
        r#"
        SELECT id, name, location, description, date
        FROM party
        WHERE id = $1
        "#,
    )
    .bind(party_id)
    .fetch_one(pool)
    .await?;

    Ok(Party {
        id: row.get("id"),
        name: row.get("name"),
        location: row.get("location"),
        description: row.get("description"),
        date: row.get("date"),
    })
}

pub async fn update_party(pool: &PgPool, party_id: i32, name: &str, location: &str, description: &str, date: Option<DateTime<Utc>>) -> Result<Party> {
    let row = sqlx::query(
        r#"
        UPDATE party
        SET name = $1, location = $2, description = $3, date = $4
        WHERE id = $5
        RETURNING id, name, location, description, date
        "#,
    )
    .bind(name)
    .bind(location)
    .bind(description)
    .bind(date)
    .bind(party_id)
    .fetch_one(pool)
    .await?;

    Ok(Party {
        id: row.get("id"),
        name: row.get("name"),
        location: row.get("location"),
        description: row.get("description"),
        date: row.get("date"),
    })
}

pub async fn delete_party(pool: &PgPool, party_id: i32) -> Result<()> {
    sqlx::query(
        r#"
        DELETE FROM party
        WHERE id = $1
        "#,
    )
    .bind(party_id)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn list_parties(pool: &PgPool) -> Result<Vec<Party>> {
    let rows = sqlx::query(
        r#"
        SELECT id, name, location, description, date
        FROM party
        ORDER BY id
        "#
    )
    .fetch_all(pool)
    .await?;

    let parties = rows.into_iter().map(|row| Party {
        id: row.get("id"),
        name: row.get("name"),
        location: row.get("location"),
        description: row.get("description"),
        date: row.get("date"),
    }).collect();

    Ok(parties)
}

// Invitation CRUD operations
pub async fn create_invitation(pool: &PgPool, guest_id: i64, party_id: i64, status: &RsvpStatus) -> Result<Invitation> {
    let status_str = match status {
        RsvpStatus::No => "no",
        RsvpStatus::Yes => "yes",
        RsvpStatus::Maybe => "maybe",
    };

    let row = sqlx::query(
        r#"
        INSERT INTO invitation (guest_id, party_id, status)
        VALUES ($1, $2, $3)
        RETURNING id, guest_id, party_id, status
        "#,
    )
    .bind(guest_id)
    .bind(party_id)
    .bind(status_str)
    .fetch_one(pool)
    .await?;

    let status_from_db: String = row.get("status");
    let parsed_status = match status_from_db.as_str() {
        "no" => RsvpStatus::No,
        "yes" => RsvpStatus::Yes,
        "maybe" => RsvpStatus::Maybe,
        _ => RsvpStatus::Maybe,
    };

    Ok(Invitation {
        id: row.get("id"),
        guest_id: row.get("guest_id"),
        party_id: row.get("party_id"),
        status: parsed_status,
    })
}

pub async fn get_invitation(pool: &PgPool, invitation_id: i32) -> Result<Invitation> {
    let row = sqlx::query(
        r#"
        SELECT id, guest_id, party_id, status
        FROM invitation
        WHERE id = $1
        "#,
    )
    .bind(invitation_id)
    .fetch_one(pool)
    .await?;

    let status_from_db: String = row.get("status");
    let parsed_status = match status_from_db.as_str() {
        "no" => RsvpStatus::No,
        "yes" => RsvpStatus::Yes,
        "maybe" => RsvpStatus::Maybe,
        _ => RsvpStatus::Maybe,
    };

    Ok(Invitation {
        id: row.get("id"),
        guest_id: row.get("guest_id"),
        party_id: row.get("party_id"),
        status: parsed_status,
    })
}

pub async fn update_invitation(pool: &PgPool, invitation_id: i32, guest_id: i64, party_id: i64, status: &RsvpStatus) -> Result<Invitation> {
    let status_str = match status {
        RsvpStatus::No => "no",
        RsvpStatus::Yes => "yes",
        RsvpStatus::Maybe => "maybe",
    };

    let row = sqlx::query(
        r#"
        UPDATE invitation
        SET guest_id = $1, party_id = $2, status = $3
        WHERE id = $4
        RETURNING id, guest_id, party_id, status
        "#,
    )
    .bind(guest_id)
    .bind(party_id)
    .bind(status_str)
    .bind(invitation_id)
    .fetch_one(pool)
    .await?;

    let status_from_db: String = row.get("status");
    let parsed_status = match status_from_db.as_str() {
        "no" => RsvpStatus::No,
        "yes" => RsvpStatus::Yes,
        "maybe" => RsvpStatus::Maybe,
        _ => RsvpStatus::Maybe,
    };

    Ok(Invitation {
        id: row.get("id"),
        guest_id: row.get("guest_id"),
        party_id: row.get("party_id"),
        status: parsed_status,
    })
}

pub async fn delete_invitation(pool: &PgPool, invitation_id: i32) -> Result<()> {
    sqlx::query(
        r#"
        DELETE FROM invitation
        WHERE id = $1
        "#,
    )
    .bind(invitation_id)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn list_invitations(pool: &PgPool) -> Result<Vec<Invitation>> {
    let rows = sqlx::query(
        r#"
        SELECT id, guest_id, party_id, status
        FROM invitation
        ORDER BY id
        "#
    )
    .fetch_all(pool)
    .await?;

    let invitations = rows.into_iter().map(|row| {
        let status_from_db: String = row.get("status");
        let parsed_status = match status_from_db.as_str() {
            "no" => RsvpStatus::No,
            "yes" => RsvpStatus::Yes,
            "maybe" => RsvpStatus::Maybe,
            _ => RsvpStatus::Maybe,
        };

        Invitation {
            id: row.get("id"),
            guest_id: row.get("guest_id"),
            party_id: row.get("party_id"),
            status: parsed_status,
        }
    }).collect();

    Ok(invitations)
}