mod common;

use pregame::{create_guest, get_guest, update_guest, delete_guest, list_guests};
use common::{TestDb, random_guest_data};

#[tokio::test]
async fn test_create_guest() {
    let test_db = TestDb::new().await;
    let (first_name, last_name, phone_number) = random_guest_data();

    let guest = create_guest(&test_db.pool, &first_name, &last_name, &phone_number)
        .await
        .expect("Failed to create guest");

    assert_eq!(guest.first_name, first_name);
    assert_eq!(guest.last_name, last_name);
    assert_eq!(guest.phone_number, phone_number);
    assert!(guest.id > 0);
}

#[tokio::test]
async fn test_get_guest() {
    let test_db = TestDb::new().await;
    let (first_name, last_name, phone_number) = random_guest_data();

    // Create a guest first
    let created_guest = create_guest(&test_db.pool, &first_name, &last_name, &phone_number)
        .await
        .expect("Failed to create guest");

    // Get the guest
    let retrieved_guest = get_guest(&test_db.pool, created_guest.id)
        .await
        .expect("Failed to get guest");

    assert_eq!(retrieved_guest.id, created_guest.id);
    assert_eq!(retrieved_guest.first_name, first_name);
    assert_eq!(retrieved_guest.last_name, last_name);
    assert_eq!(retrieved_guest.phone_number, phone_number);
}

#[tokio::test]
async fn test_get_nonexistent_guest() {
    let test_db = TestDb::new().await;

    let result = get_guest(&test_db.pool, 99999).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_update_guest() {
    let test_db = TestDb::new().await;
    let (first_name, last_name, phone_number) = random_guest_data();

    // Create a guest first
    let created_guest = create_guest(&test_db.pool, &first_name, &last_name, &phone_number)
        .await
        .expect("Failed to create guest");

    // Update the guest
    let (new_first, new_last, new_phone) = random_guest_data();
    let updated_guest = update_guest(&test_db.pool, created_guest.id, &new_first, &new_last, &new_phone)
        .await
        .expect("Failed to update guest");

    assert_eq!(updated_guest.id, created_guest.id);
    assert_eq!(updated_guest.first_name, new_first);
    assert_eq!(updated_guest.last_name, new_last);
    assert_eq!(updated_guest.phone_number, new_phone);
}

#[tokio::test]
async fn test_update_nonexistent_guest() {
    let test_db = TestDb::new().await;
    let (first_name, last_name, phone_number) = random_guest_data();

    let result = update_guest(&test_db.pool, 99999, &first_name, &last_name, &phone_number).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_delete_guest() {
    let test_db = TestDb::new().await;
    let (first_name, last_name, phone_number) = random_guest_data();

    // Create a guest first
    let created_guest = create_guest(&test_db.pool, &first_name, &last_name, &phone_number)
        .await
        .expect("Failed to create guest");

    // Delete the guest
    delete_guest(&test_db.pool, created_guest.id)
        .await
        .expect("Failed to delete guest");

    // Try to get the deleted guest
    let result = get_guest(&test_db.pool, created_guest.id).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_delete_nonexistent_guest() {
    let test_db = TestDb::new().await;

    // This should not error even if guest doesn't exist
    let result = delete_guest(&test_db.pool, 99999).await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_list_guests_empty() {
    let test_db = TestDb::new().await;

    let guests = list_guests(&test_db.pool)
        .await
        .expect("Failed to list guests");

    assert_eq!(guests.len(), 0);
}

#[tokio::test]
async fn test_list_guests_multiple() {
    let test_db = TestDb::new().await;

    // Create multiple guests
    let guest1_data = random_guest_data();
    let guest2_data = random_guest_data();
    let guest3_data = random_guest_data();

    let guest1 = create_guest(&test_db.pool, &guest1_data.0, &guest1_data.1, &guest1_data.2)
        .await
        .expect("Failed to create guest 1");

    let guest2 = create_guest(&test_db.pool, &guest2_data.0, &guest2_data.1, &guest2_data.2)
        .await
        .expect("Failed to create guest 2");

    let guest3 = create_guest(&test_db.pool, &guest3_data.0, &guest3_data.1, &guest3_data.2)
        .await
        .expect("Failed to create guest 3");

    // List guests
    let guests = list_guests(&test_db.pool)
        .await
        .expect("Failed to list guests");

    assert_eq!(guests.len(), 3);
    
    // Check they're ordered by ID
    assert!(guests[0].id <= guests[1].id);
    assert!(guests[1].id <= guests[2].id);

    // Verify all created guests are in the list
    let guest_ids: Vec<i32> = guests.iter().map(|g| g.id).collect();
    assert!(guest_ids.contains(&guest1.id));
    assert!(guest_ids.contains(&guest2.id));
    assert!(guest_ids.contains(&guest3.id));
}

#[tokio::test]
async fn test_guest_fields_validation() {
    let test_db = TestDb::new().await;

    // Test with empty strings (should work)
    let guest = create_guest(&test_db.pool, "", "", "")
        .await
        .expect("Failed to create guest with empty strings");

    assert_eq!(guest.first_name, "");
    assert_eq!(guest.last_name, "");
    assert_eq!(guest.phone_number, "");
}

#[tokio::test]
async fn test_guest_fields_long_data() {
    let test_db = TestDb::new().await;

    // Test with reasonably long strings
    let long_name = "A".repeat(200);
    let long_phone = "1".repeat(19);

    let guest = create_guest(&test_db.pool, &long_name, &long_name, &long_phone)
        .await
        .expect("Failed to create guest with long data");

    assert_eq!(guest.first_name, long_name);
    assert_eq!(guest.last_name, long_name);
    assert_eq!(guest.phone_number, long_phone);
}