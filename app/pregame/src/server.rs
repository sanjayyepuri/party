use sqlx::PgPool;
use crate::models::RsvpStatus;
use crate::{
    create_guest, get_guest, update_guest, delete_guest, list_guests,
    create_party, get_party, update_party, delete_party, list_parties,
    create_invitation, get_invitation, update_invitation, delete_invitation, list_invitations
};
use chrono::{DateTime, Utc};
use tonic::{transport::Server, Request, Response, Status};
use std::sync::Arc;

pub mod party {
    tonic::include_proto!("party");
}

use party::{
    party_service_server::{PartyService, PartyServiceServer},
    Empty, GetRequest, DeleteRequest,
    Guest, CreateGuestRequest, UpdateGuestRequest,
    Party as PartyMessage, CreatePartyRequest, UpdatePartyRequest,
    Invitation, CreateInvitationRequest, UpdateInvitationRequest,
    ListGuestsResponse, ListPartiesResponse, ListInvitationsResponse,
};

#[derive(Debug)]
pub struct MyPartyService {
    pool: Arc<PgPool>,
}

impl MyPartyService {
    pub fn new(pool: PgPool) -> Self {
        Self {
            pool: Arc::new(pool),
        }
    }
}

#[tonic::async_trait]
impl PartyService for MyPartyService {
    // Guest operations
    async fn create_guest(&self, request: Request<CreateGuestRequest>) -> Result<Response<Guest>, Status> {
        let req = request.into_inner();
        let guest = create_guest(&self.pool, &req.first_name, &req.last_name, &req.phone_number)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        
        Ok(Response::new(Guest {
            id: guest.id,
            first_name: guest.first_name,
            last_name: guest.last_name,
            phone_number: guest.phone_number,
        }))
    }

    async fn get_guest(&self, request: Request<GetRequest>) -> Result<Response<Guest>, Status> {
        let guest_id = request.into_inner().id;
        let guest = get_guest(&self.pool, guest_id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        
        Ok(Response::new(Guest {
            id: guest.id,
            first_name: guest.first_name,
            last_name: guest.last_name,
            phone_number: guest.phone_number,
        }))
    }

    async fn update_guest(&self, request: Request<UpdateGuestRequest>) -> Result<Response<Guest>, Status> {
        let req = request.into_inner();
        let guest = update_guest(&self.pool, req.id, &req.first_name, &req.last_name, &req.phone_number)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        
        Ok(Response::new(Guest {
            id: guest.id,
            first_name: guest.first_name,
            last_name: guest.last_name,
            phone_number: guest.phone_number,
        }))
    }

    async fn delete_guest(&self, request: Request<DeleteRequest>) -> Result<Response<Empty>, Status> {
        let guest_id = request.into_inner().id;
        delete_guest(&self.pool, guest_id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        
        Ok(Response::new(Empty {}))
    }

    async fn list_guests(&self, _request: Request<Empty>) -> Result<Response<ListGuestsResponse>, Status> {
        let guests = list_guests(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        
        let guest_messages: Vec<Guest> = guests.into_iter().map(|guest| Guest {
            id: guest.id,
            first_name: guest.first_name,
            last_name: guest.last_name,
            phone_number: guest.phone_number,
        }).collect();
        
        Ok(Response::new(ListGuestsResponse {
            guests: guest_messages,
        }))
    }

    // Party operations
    async fn create_party(&self, request: Request<CreatePartyRequest>) -> Result<Response<PartyMessage>, Status> {
        let req = request.into_inner();
        
        let date = if let Some(date_str) = req.date {
            Some(date_str.parse::<DateTime<Utc>>()
                .map_err(|e| Status::invalid_argument(format!("Invalid date format: {}", e)))?)
        } else {
            None
        };
        
        let party = create_party(&self.pool, &req.name, &req.location, &req.description, date)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        
        Ok(Response::new(PartyMessage {
            id: party.id,
            name: party.name,
            location: party.location,
            description: party.description,
            date: party.date.map(|d| d.to_rfc3339()),
        }))
    }

    async fn get_party(&self, request: Request<GetRequest>) -> Result<Response<PartyMessage>, Status> {
        let party_id = request.into_inner().id;
        let party = get_party(&self.pool, party_id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        
        Ok(Response::new(PartyMessage {
            id: party.id,
            name: party.name,
            location: party.location,
            description: party.description,
            date: party.date.map(|d| d.to_rfc3339()),
        }))
    }

    async fn update_party(&self, request: Request<UpdatePartyRequest>) -> Result<Response<PartyMessage>, Status> {
        let req = request.into_inner();
        
        let date = if let Some(date_str) = req.date {
            Some(date_str.parse::<DateTime<Utc>>()
                .map_err(|e| Status::invalid_argument(format!("Invalid date format: {}", e)))?)
        } else {
            None
        };
        
        let party = update_party(&self.pool, req.id, &req.name, &req.location, &req.description, date)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        
        Ok(Response::new(PartyMessage {
            id: party.id,
            name: party.name,
            location: party.location,
            description: party.description,
            date: party.date.map(|d| d.to_rfc3339()),
        }))
    }

    async fn delete_party(&self, request: Request<DeleteRequest>) -> Result<Response<Empty>, Status> {
        let party_id = request.into_inner().id;
        delete_party(&self.pool, party_id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        
        Ok(Response::new(Empty {}))
    }

    async fn list_parties(&self, _request: Request<Empty>) -> Result<Response<ListPartiesResponse>, Status> {
        let parties = list_parties(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        
        let party_messages: Vec<PartyMessage> = parties.into_iter().map(|party| PartyMessage {
            id: party.id,
            name: party.name,
            location: party.location,
            description: party.description,
            date: party.date.map(|d| d.to_rfc3339()),
        }).collect();
        
        Ok(Response::new(ListPartiesResponse {
            parties: party_messages,
        }))
    }

    // Invitation operations
    async fn create_invitation(&self, request: Request<CreateInvitationRequest>) -> Result<Response<Invitation>, Status> {
        let req = request.into_inner();
        
        let status = match req.status.as_str() {
            "no" => RsvpStatus::No,
            "yes" => RsvpStatus::Yes,
            "maybe" => RsvpStatus::Maybe,
            _ => return Err(Status::invalid_argument("Invalid status. Must be 'no', 'yes', or 'maybe'")),
        };
        
        let invitation = create_invitation(&self.pool, req.guest_id, req.party_id, &status)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        
        Ok(Response::new(Invitation {
            id: invitation.id,
            guest_id: invitation.guest_id,
            party_id: invitation.party_id,
            status: format!("{:?}", invitation.status).to_lowercase(),
        }))
    }

    async fn get_invitation(&self, request: Request<GetRequest>) -> Result<Response<Invitation>, Status> {
        let invitation_id = request.into_inner().id;
        let invitation = get_invitation(&self.pool, invitation_id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        
        Ok(Response::new(Invitation {
            id: invitation.id,
            guest_id: invitation.guest_id,
            party_id: invitation.party_id,
            status: format!("{:?}", invitation.status).to_lowercase(),
        }))
    }

    async fn update_invitation(&self, request: Request<UpdateInvitationRequest>) -> Result<Response<Invitation>, Status> {
        let req = request.into_inner();
        
        let status = match req.status.as_str() {
            "no" => RsvpStatus::No,
            "yes" => RsvpStatus::Yes,
            "maybe" => RsvpStatus::Maybe,
            _ => return Err(Status::invalid_argument("Invalid status. Must be 'no', 'yes', or 'maybe'")),
        };
        
        let invitation = update_invitation(&self.pool, req.id, req.guest_id, req.party_id, &status)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        
        Ok(Response::new(Invitation {
            id: invitation.id,
            guest_id: invitation.guest_id,
            party_id: invitation.party_id,
            status: format!("{:?}", invitation.status).to_lowercase(),
        }))
    }

    async fn delete_invitation(&self, request: Request<DeleteRequest>) -> Result<Response<Empty>, Status> {
        let invitation_id = request.into_inner().id;
        delete_invitation(&self.pool, invitation_id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        
        Ok(Response::new(Empty {}))
    }

    async fn list_invitations(&self, _request: Request<Empty>) -> Result<Response<ListInvitationsResponse>, Status> {
        let invitations = list_invitations(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        
        let invitation_messages: Vec<Invitation> = invitations.into_iter().map(|invitation| Invitation {
            id: invitation.id,
            guest_id: invitation.guest_id,
            party_id: invitation.party_id,
            status: format!("{:?}", invitation.status).to_lowercase(),
        }).collect();
        
        Ok(Response::new(ListInvitationsResponse {
            invitations: invitation_messages,
        }))
    }
}

pub async fn start_grpc_server(pool: PgPool) -> Result<(), Box<dyn std::error::Error>> {
    let addr = "[::1]:50051".parse()?;
    let party_service = MyPartyService::new(pool);

    println!("gRPC server listening on {}", addr);

    Server::builder()
        .add_service(PartyServiceServer::new(party_service))
        .serve(addr)
        .await?;

    Ok(())
}