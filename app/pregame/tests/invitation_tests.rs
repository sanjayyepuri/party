mod common;

use pregame::{
    create_guest, create_party, 
    create_invitation, get_invitation, update_invitation, delete_invitation, list_invitations,
    models::RsvpStatus
};
use common::{TestDb, random_guest_data, random_party_data};

async fn create_test_guest_and_party(test_db: &TestDb) -> (i32, i32) {
    let (first_name, last_name, phone_number) = random_guest_data();
    let guest = create_guest(&test_db.pool, &first_name, &last_name, &phone_number)
        .await
        .expect("Failed to create test guest");

    let (name, location, description) = random_party_data();
    let party = create_party(&test_db.pool, &name, &location, &description, None)
        .await
        .expect("Failed to create test party");

    (guest.id, party.id)
}

#[tokio::test]
async fn test_create_invitation_maybe() {
    let test_db = TestDb::new().await;
    let (guest_id, party_id) = create_test_guest_and_party(&test_db).await;

    let invitation = create_invitation(&test_db.pool, guest_id as i64, party_id as i64, &RsvpStatus::Maybe)
        .await
        .expect("Failed to create invitation");

    assert_eq!(invitation.guest_id, guest_id as i64);
    assert_eq!(invitation.party_id, party_id as i64);
    assert_eq!(invitation.status, RsvpStatus::Maybe);
    assert!(invitation.id > 0);
}

#[tokio::test]
async fn test_create_invitation_yes() {
    let test_db = TestDb::new().await;
    let (guest_id, party_id) = create_test_guest_and_party(&test_db).await;

    let invitation = create_invitation(&test_db.pool, guest_id as i64, party_id as i64, &RsvpStatus::Yes)
        .await
        .expect("Failed to create invitation");

    assert_eq!(invitation.guest_id, guest_id as i64);
    assert_eq!(invitation.party_id, party_id as i64);
    assert_eq!(invitation.status, RsvpStatus::Yes);
    assert!(invitation.id > 0);
}

#[tokio::test]
async fn test_create_invitation_no() {
    let test_db = TestDb::new().await;
    let (guest_id, party_id) = create_test_guest_and_party(&test_db).await;

    let invitation = create_invitation(&test_db.pool, guest_id as i64, party_id as i64, &RsvpStatus::No)
        .await
        .expect("Failed to create invitation");

    assert_eq!(invitation.guest_id, guest_id as i64);
    assert_eq!(invitation.party_id, party_id as i64);
    assert_eq!(invitation.status, RsvpStatus::No);
    assert!(invitation.id > 0);
}

#[tokio::test]
async fn test_create_duplicate_invitation() {
    let test_db = TestDb::new().await;
    let (guest_id, party_id) = create_test_guest_and_party(&test_db).await;

    // Create first invitation
    let _invitation1 = create_invitation(&test_db.pool, guest_id as i64, party_id as i64, &RsvpStatus::Maybe)
        .await
        .expect("Failed to create first invitation");

    // Try to create duplicate invitation (should fail due to unique constraint)
    let result = create_invitation(&test_db.pool, guest_id as i64, party_id as i64, &RsvpStatus::Yes).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_create_invitation_invalid_guest() {
    let test_db = TestDb::new().await;
    let (_, party_id) = create_test_guest_and_party(&test_db).await;

    // Try to create invitation with non-existent guest
    let result = create_invitation(&test_db.pool, 99999, party_id as i64, &RsvpStatus::Maybe).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_create_invitation_invalid_party() {
    let test_db = TestDb::new().await;
    let (guest_id, _) = create_test_guest_and_party(&test_db).await;

    // Try to create invitation with non-existent party
    let result = create_invitation(&test_db.pool, guest_id as i64, 99999, &RsvpStatus::Maybe).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_get_invitation() {
    let test_db = TestDb::new().await;
    let (guest_id, party_id) = create_test_guest_and_party(&test_db).await;

    // Create an invitation first
    let created_invitation = create_invitation(&test_db.pool, guest_id as i64, party_id as i64, &RsvpStatus::Yes)
        .await
        .expect("Failed to create invitation");

    // Get the invitation
    let retrieved_invitation = get_invitation(&test_db.pool, created_invitation.id)
        .await
        .expect("Failed to get invitation");

    assert_eq!(retrieved_invitation.id, created_invitation.id);
    assert_eq!(retrieved_invitation.guest_id, guest_id as i64);
    assert_eq!(retrieved_invitation.party_id, party_id as i64);
    assert_eq!(retrieved_invitation.status, RsvpStatus::Yes);
}

#[tokio::test]
async fn test_get_nonexistent_invitation() {
    let test_db = TestDb::new().await;

    let result = get_invitation(&test_db.pool, 99999).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_update_invitation_status() {
    let test_db = TestDb::new().await;
    let (guest_id, party_id) = create_test_guest_and_party(&test_db).await;

    // Create an invitation first
    let created_invitation = create_invitation(&test_db.pool, guest_id as i64, party_id as i64, &RsvpStatus::Maybe)
        .await
        .expect("Failed to create invitation");

    // Update the invitation status
    let updated_invitation = update_invitation(&test_db.pool, created_invitation.id, guest_id as i64, party_id as i64, &RsvpStatus::Yes)
        .await
        .expect("Failed to update invitation");

    assert_eq!(updated_invitation.id, created_invitation.id);
    assert_eq!(updated_invitation.guest_id, guest_id as i64);
    assert_eq!(updated_invitation.party_id, party_id as i64);
    assert_eq!(updated_invitation.status, RsvpStatus::Yes);
}

#[tokio::test]
async fn test_update_invitation_guest_and_party() {
    let test_db = TestDb::new().await;
    let (guest_id1, party_id1) = create_test_guest_and_party(&test_db).await;
    let (guest_id2, party_id2) = create_test_guest_and_party(&test_db).await;

    // Create an invitation first
    let created_invitation = create_invitation(&test_db.pool, guest_id1 as i64, party_id1 as i64, &RsvpStatus::Maybe)
        .await
        .expect("Failed to create invitation");

    // Update the invitation to different guest and party
    let updated_invitation = update_invitation(&test_db.pool, created_invitation.id, guest_id2 as i64, party_id2 as i64, &RsvpStatus::No)
        .await
        .expect("Failed to update invitation");

    assert_eq!(updated_invitation.id, created_invitation.id);
    assert_eq!(updated_invitation.guest_id, guest_id2 as i64);
    assert_eq!(updated_invitation.party_id, party_id2 as i64);
    assert_eq!(updated_invitation.status, RsvpStatus::No);
}

#[tokio::test]
async fn test_update_nonexistent_invitation() {
    let test_db = TestDb::new().await;
    let (guest_id, party_id) = create_test_guest_and_party(&test_db).await;

    let result = update_invitation(&test_db.pool, 99999, guest_id as i64, party_id as i64, &RsvpStatus::Yes).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_update_invitation_invalid_guest() {
    let test_db = TestDb::new().await;
    let (guest_id, party_id) = create_test_guest_and_party(&test_db).await;

    // Create an invitation first
    let created_invitation = create_invitation(&test_db.pool, guest_id as i64, party_id as i64, &RsvpStatus::Maybe)
        .await
        .expect("Failed to create invitation");

    // Try to update with invalid guest
    let result = update_invitation(&test_db.pool, created_invitation.id, 99999, party_id as i64, &RsvpStatus::Yes).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_update_invitation_invalid_party() {
    let test_db = TestDb::new().await;
    let (guest_id, party_id) = create_test_guest_and_party(&test_db).await;

    // Create an invitation first
    let created_invitation = create_invitation(&test_db.pool, guest_id as i64, party_id as i64, &RsvpStatus::Maybe)
        .await
        .expect("Failed to create invitation");

    // Try to update with invalid party
    let result = update_invitation(&test_db.pool, created_invitation.id, guest_id as i64, 99999, &RsvpStatus::Yes).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_delete_invitation() {
    let test_db = TestDb::new().await;
    let (guest_id, party_id) = create_test_guest_and_party(&test_db).await;

    // Create an invitation first
    let created_invitation = create_invitation(&test_db.pool, guest_id as i64, party_id as i64, &RsvpStatus::Maybe)
        .await
        .expect("Failed to create invitation");

    // Delete the invitation
    delete_invitation(&test_db.pool, created_invitation.id)
        .await
        .expect("Failed to delete invitation");

    // Try to get the deleted invitation
    let result = get_invitation(&test_db.pool, created_invitation.id).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_delete_nonexistent_invitation() {
    let test_db = TestDb::new().await;

    // This should not error even if invitation doesn't exist
    let result = delete_invitation(&test_db.pool, 99999).await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_list_invitations_empty() {
    let test_db = TestDb::new().await;

    let invitations = list_invitations(&test_db.pool)
        .await
        .expect("Failed to list invitations");

    assert_eq!(invitations.len(), 0);
}

#[tokio::test]
async fn test_list_invitations_multiple() {
    let test_db = TestDb::new().await;
    
    // Create test data
    let (guest_id1, party_id1) = create_test_guest_and_party(&test_db).await;
    let (guest_id2, party_id2) = create_test_guest_and_party(&test_db).await;
    let (guest_id3, party_id3) = create_test_guest_and_party(&test_db).await;

    // Create multiple invitations
    let invitation1 = create_invitation(&test_db.pool, guest_id1 as i64, party_id1 as i64, &RsvpStatus::Yes)
        .await
        .expect("Failed to create invitation 1");

    let invitation2 = create_invitation(&test_db.pool, guest_id2 as i64, party_id2 as i64, &RsvpStatus::No)
        .await
        .expect("Failed to create invitation 2");

    let invitation3 = create_invitation(&test_db.pool, guest_id3 as i64, party_id3 as i64, &RsvpStatus::Maybe)
        .await
        .expect("Failed to create invitation 3");

    // List invitations
    let invitations = list_invitations(&test_db.pool)
        .await
        .expect("Failed to list invitations");

    assert_eq!(invitations.len(), 3);
    
    // Check they're ordered by ID
    assert!(invitations[0].id <= invitations[1].id);
    assert!(invitations[1].id <= invitations[2].id);

    // Verify all created invitations are in the list
    let invitation_ids: Vec<i32> = invitations.iter().map(|i| i.id).collect();
    assert!(invitation_ids.contains(&invitation1.id));
    assert!(invitation_ids.contains(&invitation2.id));
    assert!(invitation_ids.contains(&invitation3.id));

    // Verify statuses are preserved
    let statuses: Vec<&RsvpStatus> = invitations.iter().map(|i| &i.status).collect();
    assert!(statuses.contains(&&RsvpStatus::Yes));
    assert!(statuses.contains(&&RsvpStatus::No));
    assert!(statuses.contains(&&RsvpStatus::Maybe));
}

#[tokio::test]
async fn test_invitation_cascade_delete_guest() {
    let test_db = TestDb::new().await;
    let (guest_id, party_id) = create_test_guest_and_party(&test_db).await;

    // Create an invitation
    let invitation = create_invitation(&test_db.pool, guest_id as i64, party_id as i64, &RsvpStatus::Yes)
        .await
        .expect("Failed to create invitation");

    // Delete the guest (should cascade delete the invitation)
    pregame::delete_guest(&test_db.pool, guest_id)
        .await
        .expect("Failed to delete guest");

    // Invitation should be gone
    let result = get_invitation(&test_db.pool, invitation.id).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_invitation_cascade_delete_party() {
    let test_db = TestDb::new().await;
    let (guest_id, party_id) = create_test_guest_and_party(&test_db).await;

    // Create an invitation
    let invitation = create_invitation(&test_db.pool, guest_id as i64, party_id as i64, &RsvpStatus::Yes)
        .await
        .expect("Failed to create invitation");

    // Delete the party (should cascade delete the invitation)
    pregame::delete_party(&test_db.pool, party_id)
        .await
        .expect("Failed to delete party");

    // Invitation should be gone
    let result = get_invitation(&test_db.pool, invitation.id).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_rsvp_status_conversion() {
    let test_db = TestDb::new().await;
    let (guest_id, party_id) = create_test_guest_and_party(&test_db).await;

    // Test all RSVP statuses
    let statuses = [RsvpStatus::Yes, RsvpStatus::No, RsvpStatus::Maybe];
    
    for status in &statuses {
        // Create invitation with this status
        let invitation = create_invitation(&test_db.pool, guest_id as i64, party_id as i64, status)
            .await
            .expect("Failed to create invitation");

        // Retrieve and verify status is preserved
        let retrieved = get_invitation(&test_db.pool, invitation.id)
            .await
            .expect("Failed to retrieve invitation");

        assert_eq!(retrieved.status, *status);

        // Clean up for next iteration
        delete_invitation(&test_db.pool, invitation.id)
            .await
            .expect("Failed to delete invitation");
    }
}