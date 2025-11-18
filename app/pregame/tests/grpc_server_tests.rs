mod common;

use pregame::server::{MyPartyService, party::party_service_server::PartyServiceServer};
use pregame::server::party::{
    party_service_client::PartyServiceClient,
    CreateGuestRequest, UpdateGuestRequest, GetRequest, DeleteRequest, Empty,
    CreatePartyRequest, UpdatePartyRequest,
    CreateInvitationRequest, UpdateInvitationRequest,
};
use common::{TestDb, random_guest_data, random_party_data};
use tonic::transport::Server;
use tonic::Request;
use tokio::net::TcpListener;
use tokio_stream::wrappers::TcpListenerStream;

async fn start_test_server(test_db: TestDb) -> (String, tokio::task::JoinHandle<()>) {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    let uri = format!("http://{}", addr);

    let party_service = MyPartyService::new(test_db.pool);

    let handle = tokio::spawn(async move {
        Server::builder()
            .add_service(PartyServiceServer::new(party_service))
            .serve_with_incoming(TcpListenerStream::new(listener))
            .await
            .expect("Server failed");
    });

    // Give server time to start
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    (uri, handle)
}

#[tokio::test]
async fn test_grpc_create_and_get_guest() {
    let test_db = TestDb::new().await;
    let (uri, _handle) = start_test_server(test_db).await;
    
    let mut client = PartyServiceClient::connect(uri).await.expect("Failed to connect");

    let (first_name, last_name, phone_number) = random_guest_data();

    // Create guest
    let create_request = Request::new(CreateGuestRequest {
        first_name: first_name.clone(),
        last_name: last_name.clone(),
        phone_number: phone_number.clone(),
    });

    let create_response = client.create_guest(create_request).await.expect("Failed to create guest");
    let created_guest = create_response.into_inner();

    assert_eq!(created_guest.first_name, first_name);
    assert_eq!(created_guest.last_name, last_name);
    assert_eq!(created_guest.phone_number, phone_number);
    assert!(created_guest.id > 0);

    // Get guest
    let get_request = Request::new(GetRequest { id: created_guest.id });
    let get_response = client.get_guest(get_request).await.expect("Failed to get guest");
    let retrieved_guest = get_response.into_inner();

    assert_eq!(retrieved_guest.id, created_guest.id);
    assert_eq!(retrieved_guest.first_name, first_name);
    assert_eq!(retrieved_guest.last_name, last_name);
    assert_eq!(retrieved_guest.phone_number, phone_number);
}

#[tokio::test]
async fn test_grpc_update_guest() {
    let test_db = TestDb::new().await;
    let (uri, _handle) = start_test_server(test_db).await;
    
    let mut client = PartyServiceClient::connect(uri).await.expect("Failed to connect");

    let (first_name, last_name, phone_number) = random_guest_data();

    // Create guest first
    let create_request = Request::new(CreateGuestRequest {
        first_name: first_name.clone(),
        last_name: last_name.clone(),
        phone_number: phone_number.clone(),
    });

    let create_response = client.create_guest(create_request).await.expect("Failed to create guest");
    let created_guest = create_response.into_inner();

    // Update guest
    let (new_first, new_last, new_phone) = random_guest_data();
    let update_request = Request::new(UpdateGuestRequest {
        id: created_guest.id,
        first_name: new_first.clone(),
        last_name: new_last.clone(),
        phone_number: new_phone.clone(),
    });

    let update_response = client.update_guest(update_request).await.expect("Failed to update guest");
    let updated_guest = update_response.into_inner();

    assert_eq!(updated_guest.id, created_guest.id);
    assert_eq!(updated_guest.first_name, new_first);
    assert_eq!(updated_guest.last_name, new_last);
    assert_eq!(updated_guest.phone_number, new_phone);
}

#[tokio::test]
async fn test_grpc_delete_guest() {
    let test_db = TestDb::new().await;
    let (uri, _handle) = start_test_server(test_db).await;
    
    let mut client = PartyServiceClient::connect(uri).await.expect("Failed to connect");

    let (first_name, last_name, phone_number) = random_guest_data();

    // Create guest first
    let create_request = Request::new(CreateGuestRequest {
        first_name,
        last_name,
        phone_number,
    });

    let create_response = client.create_guest(create_request).await.expect("Failed to create guest");
    let created_guest = create_response.into_inner();

    // Delete guest
    let delete_request = Request::new(DeleteRequest { id: created_guest.id });
    let delete_response = client.delete_guest(delete_request).await.expect("Failed to delete guest");
    assert!(delete_response.into_inner() == Empty {});

    // Try to get deleted guest (should fail)
    let get_request = Request::new(GetRequest { id: created_guest.id });
    let get_result = client.get_guest(get_request).await;
    assert!(get_result.is_err());
}

#[tokio::test]
async fn test_grpc_list_guests() {
    let test_db = TestDb::new().await;
    let (uri, _handle) = start_test_server(test_db).await;
    
    let mut client = PartyServiceClient::connect(uri).await.expect("Failed to connect");

    // Create multiple guests
    let guest1_data = random_guest_data();
    let guest2_data = random_guest_data();

    let _guest1 = client.create_guest(Request::new(CreateGuestRequest {
        first_name: guest1_data.0.clone(),
        last_name: guest1_data.1.clone(),
        phone_number: guest1_data.2.clone(),
    })).await.expect("Failed to create guest 1");

    let _guest2 = client.create_guest(Request::new(CreateGuestRequest {
        first_name: guest2_data.0.clone(),
        last_name: guest2_data.1.clone(),
        phone_number: guest2_data.2.clone(),
    })).await.expect("Failed to create guest 2");

    // List guests
    let list_request = Request::new(Empty {});
    let list_response = client.list_guests(list_request).await.expect("Failed to list guests");
    let guests = list_response.into_inner().guests;

    assert_eq!(guests.len(), 2);
    
    // Verify both guests are in the list
    let guest_names: Vec<String> = guests.iter().map(|g| format!("{} {}", g.first_name, g.last_name)).collect();
    assert!(guest_names.contains(&format!("{} {}", guest1_data.0, guest1_data.1)));
    assert!(guest_names.contains(&format!("{} {}", guest2_data.0, guest2_data.1)));
}

#[tokio::test]
async fn test_grpc_create_and_get_party() {
    let test_db = TestDb::new().await;
    let (uri, _handle) = start_test_server(test_db).await;
    
    let mut client = PartyServiceClient::connect(uri).await.expect("Failed to connect");

    let (name, location, description) = random_party_data();
    let date_str = "2024-12-31T20:00:00Z";

    // Create party
    let create_request = Request::new(CreatePartyRequest {
        name: name.clone(),
        location: location.clone(),
        description: description.clone(),
        date: Some(date_str.to_string()),
    });

    let create_response = client.create_party(create_request).await.expect("Failed to create party");
    let created_party = create_response.into_inner();

    assert_eq!(created_party.name, name);
    assert_eq!(created_party.location, location);
    assert_eq!(created_party.description, description);
    assert_eq!(created_party.date.as_ref().unwrap(), date_str);
    assert!(created_party.id > 0);

    // Get party
    let get_request = Request::new(GetRequest { id: created_party.id });
    let get_response = client.get_party(get_request).await.expect("Failed to get party");
    let retrieved_party = get_response.into_inner();

    assert_eq!(retrieved_party.id, created_party.id);
    assert_eq!(retrieved_party.name, name);
    assert_eq!(retrieved_party.location, location);
    assert_eq!(retrieved_party.description, description);
    assert_eq!(retrieved_party.date.as_ref().unwrap(), date_str);
}

#[tokio::test]
async fn test_grpc_create_party_without_date() {
    let test_db = TestDb::new().await;
    let (uri, _handle) = start_test_server(test_db).await;
    
    let mut client = PartyServiceClient::connect(uri).await.expect("Failed to connect");

    let (name, location, description) = random_party_data();

    // Create party without date
    let create_request = Request::new(CreatePartyRequest {
        name: name.clone(),
        location: location.clone(),
        description: description.clone(),
        date: None,
    });

    let create_response = client.create_party(create_request).await.expect("Failed to create party");
    let created_party = create_response.into_inner();

    assert_eq!(created_party.name, name);
    assert_eq!(created_party.location, location);
    assert_eq!(created_party.description, description);
    assert!(created_party.date.is_none());
    assert!(created_party.id > 0);
}

#[tokio::test]
async fn test_grpc_create_and_manage_invitation() {
    let test_db = TestDb::new().await;
    let (uri, _handle) = start_test_server(test_db).await;
    
    let mut client = PartyServiceClient::connect(uri).await.expect("Failed to connect");

    // Create guest and party first
    let guest_data = random_guest_data();
    let guest = client.create_guest(Request::new(CreateGuestRequest {
        first_name: guest_data.0,
        last_name: guest_data.1,
        phone_number: guest_data.2,
    })).await.expect("Failed to create guest").into_inner();

    let party_data = random_party_data();
    let party = client.create_party(Request::new(CreatePartyRequest {
        name: party_data.0,
        location: party_data.1,
        description: party_data.2,
        date: None,
    })).await.expect("Failed to create party").into_inner();

    // Create invitation
    let create_invitation_request = Request::new(CreateInvitationRequest {
        guest_id: guest.id as i64,
        party_id: party.id as i64,
        status: "maybe".to_string(),
    });

    let create_response = client.create_invitation(create_invitation_request).await.expect("Failed to create invitation");
    let created_invitation = create_response.into_inner();

    assert_eq!(created_invitation.guest_id, guest.id as i64);
    assert_eq!(created_invitation.party_id, party.id as i64);
    assert_eq!(created_invitation.status, "maybe");
    assert!(created_invitation.id > 0);

    // Update invitation status
    let update_request = Request::new(UpdateInvitationRequest {
        id: created_invitation.id,
        guest_id: guest.id as i64,
        party_id: party.id as i64,
        status: "yes".to_string(),
    });

    let update_response = client.update_invitation(update_request).await.expect("Failed to update invitation");
    let updated_invitation = update_response.into_inner();

    assert_eq!(updated_invitation.id, created_invitation.id);
    assert_eq!(updated_invitation.status, "yes");

    // Get invitation
    let get_request = Request::new(GetRequest { id: created_invitation.id });
    let get_response = client.get_invitation(get_request).await.expect("Failed to get invitation");
    let retrieved_invitation = get_response.into_inner();

    assert_eq!(retrieved_invitation.id, created_invitation.id);
    assert_eq!(retrieved_invitation.status, "yes");
}

#[tokio::test]
async fn test_grpc_invalid_invitation_status() {
    let test_db = TestDb::new().await;
    let (uri, _handle) = start_test_server(test_db).await;
    
    let mut client = PartyServiceClient::connect(uri).await.expect("Failed to connect");

    // Create guest and party first
    let guest_data = random_guest_data();
    let guest = client.create_guest(Request::new(CreateGuestRequest {
        first_name: guest_data.0,
        last_name: guest_data.1,
        phone_number: guest_data.2,
    })).await.expect("Failed to create guest").into_inner();

    let party_data = random_party_data();
    let party = client.create_party(Request::new(CreatePartyRequest {
        name: party_data.0,
        location: party_data.1,
        description: party_data.2,
        date: None,
    })).await.expect("Failed to create party").into_inner();

    // Try to create invitation with invalid status
    let create_invitation_request = Request::new(CreateInvitationRequest {
        guest_id: guest.id as i64,
        party_id: party.id as i64,
        status: "invalid".to_string(),
    });

    let result = client.create_invitation(create_invitation_request).await;
    assert!(result.is_err());
    
    if let Err(status) = result {
        assert_eq!(status.code(), tonic::Code::InvalidArgument);
    }
}

#[tokio::test]
async fn test_grpc_error_handling_nonexistent_resources() {
    let test_db = TestDb::new().await;
    let (uri, _handle) = start_test_server(test_db).await;
    
    let mut client = PartyServiceClient::connect(uri).await.expect("Failed to connect");

    // Try to get non-existent guest
    let get_request = Request::new(GetRequest { id: 99999 });
    let result = client.get_guest(get_request).await;
    assert!(result.is_err());

    // Try to get non-existent party
    let get_request = Request::new(GetRequest { id: 99999 });
    let result = client.get_party(get_request).await;
    assert!(result.is_err());

    // Try to get non-existent invitation
    let get_request = Request::new(GetRequest { id: 99999 });
    let result = client.get_invitation(get_request).await;
    assert!(result.is_err());
}