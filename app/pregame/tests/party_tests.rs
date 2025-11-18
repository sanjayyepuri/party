mod common;

use pregame::{create_party, get_party, update_party, delete_party, list_parties};
use common::{TestDb, random_party_data};
use chrono::{DateTime, Utc, TimeZone};

#[tokio::test]
async fn test_create_party_without_date() {
    let test_db = TestDb::new().await;
    let (name, location, description) = random_party_data();

    let party = create_party(&test_db.pool, &name, &location, &description, None)
        .await
        .expect("Failed to create party");

    assert_eq!(party.name, name);
    assert_eq!(party.location, location);
    assert_eq!(party.description, description);
    assert!(party.date.is_none());
    assert!(party.id > 0);
}

#[tokio::test]
async fn test_create_party_with_date() {
    let test_db = TestDb::new().await;
    let (name, location, description) = random_party_data();
    let party_date = Utc.with_ymd_and_hms(2024, 12, 31, 20, 0, 0).unwrap();

    let party = create_party(&test_db.pool, &name, &location, &description, Some(party_date))
        .await
        .expect("Failed to create party");

    assert_eq!(party.name, name);
    assert_eq!(party.location, location);
    assert_eq!(party.description, description);
    assert_eq!(party.date, Some(party_date));
    assert!(party.id > 0);
}

#[tokio::test]
async fn test_get_party() {
    let test_db = TestDb::new().await;
    let (name, location, description) = random_party_data();
    let party_date = Utc.with_ymd_and_hms(2024, 6, 15, 18, 30, 0).unwrap();

    // Create a party first
    let created_party = create_party(&test_db.pool, &name, &location, &description, Some(party_date))
        .await
        .expect("Failed to create party");

    // Get the party
    let retrieved_party = get_party(&test_db.pool, created_party.id)
        .await
        .expect("Failed to get party");

    assert_eq!(retrieved_party.id, created_party.id);
    assert_eq!(retrieved_party.name, name);
    assert_eq!(retrieved_party.location, location);
    assert_eq!(retrieved_party.description, description);
    assert_eq!(retrieved_party.date, Some(party_date));
}

#[tokio::test]
async fn test_get_nonexistent_party() {
    let test_db = TestDb::new().await;

    let result = get_party(&test_db.pool, 99999).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_update_party_without_date() {
    let test_db = TestDb::new().await;
    let (name, location, description) = random_party_data();

    // Create a party first
    let created_party = create_party(&test_db.pool, &name, &location, &description, None)
        .await
        .expect("Failed to create party");

    // Update the party
    let (new_name, new_location, new_description) = random_party_data();
    let updated_party = update_party(&test_db.pool, created_party.id, &new_name, &new_location, &new_description, None)
        .await
        .expect("Failed to update party");

    assert_eq!(updated_party.id, created_party.id);
    assert_eq!(updated_party.name, new_name);
    assert_eq!(updated_party.location, new_location);
    assert_eq!(updated_party.description, new_description);
    assert!(updated_party.date.is_none());
}

#[tokio::test]
async fn test_update_party_with_date() {
    let test_db = TestDb::new().await;
    let (name, location, description) = random_party_data();

    // Create a party first
    let created_party = create_party(&test_db.pool, &name, &location, &description, None)
        .await
        .expect("Failed to create party");

    // Update the party with a date
    let (new_name, new_location, new_description) = random_party_data();
    let new_date = Utc.with_ymd_and_hms(2025, 1, 1, 0, 0, 0).unwrap();
    let updated_party = update_party(&test_db.pool, created_party.id, &new_name, &new_location, &new_description, Some(new_date))
        .await
        .expect("Failed to update party");

    assert_eq!(updated_party.id, created_party.id);
    assert_eq!(updated_party.name, new_name);
    assert_eq!(updated_party.location, new_location);
    assert_eq!(updated_party.description, new_description);
    assert_eq!(updated_party.date, Some(new_date));
}

#[tokio::test]
async fn test_update_party_remove_date() {
    let test_db = TestDb::new().await;
    let (name, location, description) = random_party_data();
    let party_date = Utc.with_ymd_and_hms(2024, 12, 31, 23, 59, 0).unwrap();

    // Create a party with a date
    let created_party = create_party(&test_db.pool, &name, &location, &description, Some(party_date))
        .await
        .expect("Failed to create party");

    // Update the party to remove the date
    let (new_name, new_location, new_description) = random_party_data();
    let updated_party = update_party(&test_db.pool, created_party.id, &new_name, &new_location, &new_description, None)
        .await
        .expect("Failed to update party");

    assert_eq!(updated_party.id, created_party.id);
    assert_eq!(updated_party.name, new_name);
    assert_eq!(updated_party.location, new_location);
    assert_eq!(updated_party.description, new_description);
    assert!(updated_party.date.is_none());
}

#[tokio::test]
async fn test_update_nonexistent_party() {
    let test_db = TestDb::new().await;
    let (name, location, description) = random_party_data();

    let result = update_party(&test_db.pool, 99999, &name, &location, &description, None).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_delete_party() {
    let test_db = TestDb::new().await;
    let (name, location, description) = random_party_data();

    // Create a party first
    let created_party = create_party(&test_db.pool, &name, &location, &description, None)
        .await
        .expect("Failed to create party");

    // Delete the party
    delete_party(&test_db.pool, created_party.id)
        .await
        .expect("Failed to delete party");

    // Try to get the deleted party
    let result = get_party(&test_db.pool, created_party.id).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_delete_nonexistent_party() {
    let test_db = TestDb::new().await;

    // This should not error even if party doesn't exist
    let result = delete_party(&test_db.pool, 99999).await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_list_parties_empty() {
    let test_db = TestDb::new().await;

    let parties = list_parties(&test_db.pool)
        .await
        .expect("Failed to list parties");

    assert_eq!(parties.len(), 0);
}

#[tokio::test]
async fn test_list_parties_multiple() {
    let test_db = TestDb::new().await;

    // Create multiple parties
    let party1_data = random_party_data();
    let party2_data = random_party_data();
    let party3_data = random_party_data();

    let date1 = Utc.with_ymd_and_hms(2024, 6, 1, 12, 0, 0).unwrap();
    let date2 = Utc.with_ymd_and_hms(2024, 7, 1, 14, 0, 0).unwrap();

    let party1 = create_party(&test_db.pool, &party1_data.0, &party1_data.1, &party1_data.2, Some(date1))
        .await
        .expect("Failed to create party 1");

    let party2 = create_party(&test_db.pool, &party2_data.0, &party2_data.1, &party2_data.2, None)
        .await
        .expect("Failed to create party 2");

    let party3 = create_party(&test_db.pool, &party3_data.0, &party3_data.1, &party3_data.2, Some(date2))
        .await
        .expect("Failed to create party 3");

    // List parties
    let parties = list_parties(&test_db.pool)
        .await
        .expect("Failed to list parties");

    assert_eq!(parties.len(), 3);
    
    // Check they're ordered by ID
    assert!(parties[0].id <= parties[1].id);
    assert!(parties[1].id <= parties[2].id);

    // Verify all created parties are in the list
    let party_ids: Vec<i32> = parties.iter().map(|p| p.id).collect();
    assert!(party_ids.contains(&party1.id));
    assert!(party_ids.contains(&party2.id));
    assert!(party_ids.contains(&party3.id));
}

#[tokio::test]
async fn test_party_fields_validation() {
    let test_db = TestDb::new().await;

    // Test with empty strings (should work)
    let party = create_party(&test_db.pool, "", "", "", None)
        .await
        .expect("Failed to create party with empty strings");

    assert_eq!(party.name, "");
    assert_eq!(party.location, "");
    assert_eq!(party.description, "");
    assert!(party.date.is_none());
}

#[tokio::test]
async fn test_party_fields_long_data() {
    let test_db = TestDb::new().await;

    // Test with reasonably long strings
    let long_name = "A".repeat(200);
    let long_location = "B".repeat(200);
    let long_description = "C".repeat(1000);

    let party = create_party(&test_db.pool, &long_name, &long_location, &long_description, None)
        .await
        .expect("Failed to create party with long data");

    assert_eq!(party.name, long_name);
    assert_eq!(party.location, long_location);
    assert_eq!(party.description, long_description);
}

#[tokio::test]
async fn test_party_date_precision() {
    let test_db = TestDb::new().await;
    let (name, location, description) = random_party_data();

    // Test with precise timestamp
    let precise_date = Utc.with_ymd_and_hms(2024, 3, 15, 14, 30, 45).unwrap();

    let party = create_party(&test_db.pool, &name, &location, &description, Some(precise_date))
        .await
        .expect("Failed to create party");

    // Retrieve and verify precision is maintained
    let retrieved_party = get_party(&test_db.pool, party.id)
        .await
        .expect("Failed to get party");

    assert_eq!(retrieved_party.date.unwrap().timestamp(), precise_date.timestamp());
}