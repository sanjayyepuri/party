---
author: Sanjay Yepuri
state: Draft
discussion: TBD
---

# RFD 007: Identity Integration Between Ory and Application Database

## Metadata

- **Authors**: Sanjay Yepuri
- **State**: Draft
- **Discussion**: TBD
- **Related RFDs**: RFD-005 (Technology Stack), RFD-006 (Party Schemas)

## Problem Statement

The party invitation platform currently uses two separate data stores with no explicit connection:

1. **Ory Network** - Manages authentication, sessions, and user identities
2. **Neon PostgreSQL** - Stores application data (parties, guests, RSVPs)

This creates a critical gap: when a user authenticates through Ory, we have no direct way to associate their session with a `guest` record in our database. Without this mapping, we cannot:

- Automatically populate guest information from authenticated users
- Query which parties a logged-in user has RSVP'd to
- Enforce authorization rules (e.g., only the guest who created an RSVP can modify it)
- Track user activity across sessions
- Provide personalized experiences based on authentication state

We need a clear strategy to bridge these two systems while maintaining loose coupling to preserve our ability to migrate authentication providers in the future.

## Requirements

### Functional Requirements

**FR1: Identity Mapping**
Every authenticated Ory user must have a corresponding `guest` record in the application database.

**FR2: Automatic Guest Creation**
On first authentication, the system must automatically create a guest record using identity information from Ory.

**FR3: Bidirectional Lookup**
The system must support efficient lookup in both directions:
- Given an Ory identity ID, find the corresponding guest
- Given a guest ID, determine if they're authenticated

**FR4: Data Synchronization**
Guest contact information (email, phone) should be synchronized from Ory identity traits to enable offline queries and reduce API calls.

**FR5: Authorization Context**
Authenticated requests must have access to both the Ory session data and the application's guest_id for use in business logic.

### Non-Functional Requirements

**NFR1: Minimal Latency Impact**
Identity mapping should add minimal overhead to request processing (<50ms).

**NFR2: Provider Agnostic**
The integration pattern should make it possible to swap authentication providers without changing application logic.

**NFR3: Data Consistency**
Guest records must remain consistent with Ory identities. Stale data is acceptable for non-critical fields (name, email) but not for identity mapping.

**NFR4: Failure Resilience**
The application should handle Ory service unavailability gracefully, allowing read-only operations on cached guest data when possible.

## Architecture Alternatives

### Alternative 1: Foreign Key with Identity ID Column (Recommended)

**Design:**
Add an `ory_identity_id` column to the existing `guest` table that references the unique identifier from Ory's identity system.

**Schema Changes:**
```sql
ALTER TABLE guest 
  ADD COLUMN ory_identity_id TEXT UNIQUE;

CREATE INDEX idx_guest_ory_identity 
  ON guest(ory_identity_id);
```

**Updated Guest Model:**
```rust
pub struct Guest {
    pub guest_id: String,
    pub ory_identity_id: Option<String>,  // New field
    pub name: String,
    pub email: String,
    pub phone: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}
```

**Authentication Flow:**
```
1. User authenticates via Ory → receives session cookie
2. Middleware validates session with Ory's /sessions/whoami endpoint
3. Extract identity.id from session response
4. Query: SELECT * FROM guest WHERE ory_identity_id = $1
5. If guest exists:
   - Use existing guest_id
   - Optionally sync traits (email, name, phone) if changed
6. If guest does not exist:
   - INSERT new guest with ory_identity_id and traits from Ory
   - Generate new guest_id
7. Store both AuthSession and guest_id in request extensions
8. Downstream handlers access guest_id for RSVP operations
```

**Pros:**
- ✅ Simple, single foreign key relationship
- ✅ Standard SQL joins work (guest → RSVP → party)
- ✅ Fast lookups with indexed column
- ✅ Minimal data duplication (only identity ID stored)
- ✅ Easy to migrate providers (just change the identity_id source)
- ✅ Application data remains queryable even if Ory is down
- ✅ Supports guest records without authentication (manual entry)

**Cons:**
- ⚠️ Requires schema migration
- ⚠️ Need to handle identity sync on every authenticated request
- ⚠️ Guest traits (email/phone) may drift from Ory if not synced regularly

**Implementation Complexity:** Low

### Alternative 2: Separate Identity Mapping Table

**Design:**
Create a dedicated `identity_mapping` table to map Ory identities to guest records.

**Schema Changes:**
```sql
CREATE TABLE identity_mapping (
    mapping_id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,              -- 'ory', 'auth0', etc.
    external_identity_id TEXT NOT NULL,  -- Provider's identity ID
    guest_id TEXT NOT NULL REFERENCES guest(guest_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    UNIQUE(provider, external_identity_id)
);

CREATE INDEX idx_identity_mapping_guest 
  ON identity_mapping(guest_id);

CREATE INDEX idx_identity_mapping_external 
  ON identity_mapping(provider, external_identity_id);
```

**Pros:**
- ✅ Supports multiple authentication providers per guest
- ✅ Clean separation of concerns
- ✅ Can track provider migration history
- ✅ Guest table remains unchanged

**Cons:**
- ⚠️ Adds extra join for every authenticated query
- ⚠️ More complex schema and queries
- ⚠️ Overkill for single-provider system
- ⚠️ Additional table to maintain

**Implementation Complexity:** Medium

### Alternative 3: Federated Queries (Real-time Ory Lookups)

**Design:**
Do not store identity information locally. On each authenticated request, fetch user details from Ory's API and temporarily associate with guest records via in-memory state.

**Flow:**
```
1. User authenticates → session cookie
2. On each request:
   a. Validate session with Ory
   b. Fetch identity details from Ory API
   c. Use email/phone from Ory to lookup guest in local DB
   d. Store temporary association in request context
3. No persistent identity mapping
```

**Pros:**
- ✅ No schema changes required
- ✅ Always has fresh identity data from Ory
- ✅ No sync logic needed

**Cons:**
- ❌ Extra API call to Ory on every authenticated request (high latency)
- ❌ Tight coupling to Ory's availability
- ❌ Cannot perform SQL joins across services
- ❌ Higher cost (more Ory API calls)
- ❌ Ambiguous matching (multiple guests with same email)
- ❌ Cannot work offline or with cached data
- ❌ Difficult to implement authorization rules efficiently

**Implementation Complexity:** Medium (simpler schema, complex runtime)

### Alternative 4: Dual-Write with Ory as Source of Truth

**Design:**
Store all user identity data in Ory and replicate it to local PostgreSQL via webhooks or background sync jobs.

**Flow:**
```
1. User updates profile in Ory
2. Ory webhook fires → hits our endpoint
3. Upsert guest record with Ory data
4. Application queries local DB only
```

**Pros:**
- ✅ Local queries don't hit Ory (fast)
- ✅ Eventually consistent data model
- ✅ Can function without Ory for reads

**Cons:**
- ❌ Requires webhook infrastructure
- ❌ Complex eventual consistency semantics
- ❌ Ory webhook configuration and reliability
- ❌ Data may be stale between sync intervals
- ❌ Need background jobs for polling if webhooks fail
- ❌ More infrastructure to maintain

**Implementation Complexity:** High

## Recommended Approach: Alternative 1 (Foreign Key Column)

For this platform's requirements, **Alternative 1** is the clear choice:

**Rationale:**
1. **Simplicity**: Single column addition with standard indexed lookups
2. **Performance**: No additional joins, minimal latency impact
3. **Flexibility**: Supports both authenticated and unauthenticated guests
4. **Migration Path**: Easy to switch providers by changing identity_id source
5. **Query Capability**: Full SQL expressiveness for application queries
6. **Failure Handling**: Guest data remains accessible even if Ory is down

The platform currently serves a single party at a time with a small guest list (human scale per RFD-003). Complex multi-provider identity federation (Alternative 2) and real-time federated queries (Alternative 3) are premature optimizations that add unnecessary complexity.

## Implementation Plan

### Phase 1: Schema Migration

**Migration Script:**
```sql
-- Add identity column
ALTER TABLE guest 
  ADD COLUMN ory_identity_id TEXT;

-- Add unique constraint
ALTER TABLE guest 
  ADD CONSTRAINT guest_ory_identity_unique 
  UNIQUE (ory_identity_id);

-- Add index for fast lookups
CREATE INDEX idx_guest_ory_identity 
  ON guest(ory_identity_id);
```

**CLI Command:**
```bash
cd app/guestbook
cargo run -- migrate-add-identity
```

### Phase 2: Update Data Models

**File:** `/app/pregame/src/model.rs`

```rust
pub struct Guest {
    pub guest_id: String,
    pub ory_identity_id: Option<String>,  // Add this field
    pub name: String,
    pub email: String,
    pub phone: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}
```

### Phase 3: Extend Auth Module

**File:** `/app/pregame/src/auth.rs`

Extend `AuthSession` to capture Ory identity details:

```rust
#[derive(Deserialize, Clone)]
pub struct AuthSession {
    pub active: bool,
    pub id: String,
    pub identity: Option<OryIdentity>,  // Add identity details
}

#[derive(Deserialize, Clone)]
pub struct OryIdentity {
    pub id: String,
    pub traits: IdentityTraits,
}

#[derive(Deserialize, Clone)]
pub struct IdentityTraits {
    pub email: Option<String>,
    pub phone: Option<String>,
    pub name: Option<String>,
}
```

### Phase 4: Implement Guest Lookup/Creation

**New File:** `/app/pregame/src/identity.rs`

```rust
pub async fn get_or_create_guest(
    db: &DbState,
    identity: &OryIdentity,
) -> Result<Guest, DbError> {
    // Try to find existing guest by identity_id
    let existing = db.client
        .query_opt(
            "SELECT * FROM guest WHERE ory_identity_id = $1 AND deleted_at IS NULL",
            &[&identity.id]
        )
        .await?;
    
    if let Some(row) = existing {
        return Ok(Guest::from_row(&row)?);
    }
    
    // Create new guest from Ory traits
    let guest_id = Uuid::new_v4().to_string();
    let now = Utc::now();
    
    db.client
        .execute(
            "INSERT INTO guest (guest_id, ory_identity_id, name, email, phone, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)",
            &[
                &guest_id,
                &identity.id,
                &identity.traits.name.unwrap_or_default(),
                &identity.traits.email.unwrap_or_default(),
                &identity.traits.phone.unwrap_or_default(),
                &now,
                &now,
            ],
        )
        .await?;
    
    // Fetch and return the new guest
    let row = db.client
        .query_one("SELECT * FROM guest WHERE guest_id = $1", &[&guest_id])
        .await?;
    
    Ok(Guest::from_row(&row)?)
}
```

### Phase 5: Update Auth Middleware

**File:** `/app/pregame/src/api/auth.rs`

```rust
pub async fn auth_middleware(
    State(ory_state): State<OryState>,
    State(db_state): State<DbState>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Existing validation logic
    let (cookie_name, session_token) = extract_cookie_access_token(request.headers())
        .ok_or(StatusCode::UNAUTHORIZED)?;
    
    let auth_session = validate_token(&ory_state, &cookie_name, &session_token)
        .await
        .map_err(|_| StatusCode::UNAUTHORIZED)?;
    
    // NEW: Get or create guest from identity
    let guest = if let Some(identity) = &auth_session.identity {
        get_or_create_guest(&db_state, identity)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    } else {
        return Err(StatusCode::UNAUTHORIZED);
    };
    
    // Store both session and guest in extensions
    request.extensions_mut().insert(auth_session);
    request.extensions_mut().insert(guest);
    
    Ok(next.run(request).await)
}
```

### Phase 6: Update Protected Endpoints

Protected endpoints can now access the `Guest` from request extensions:

```rust
pub async fn create_rsvp(
    Extension(guest): Extension<Guest>,
    Path((party_id, _guest_id)): Path<(String, String)>,
    State(db): State<DbState>,
    Json(payload): Json<CreateRsvpRequest>,
) -> Result<Json<Rsvp>, StatusCode> {
    // Use guest.guest_id from authenticated user
    // Ignore URL guest_id parameter or validate it matches
    
    let rsvp_id = Uuid::new_v4().to_string();
    // ... create RSVP using guest.guest_id
}
```

## Security Considerations

**Identity Spoofing Prevention:**
- Never trust client-provided identity IDs
- Always derive identity from validated Ory session
- Validate that URL parameters (if they include guest_id) match authenticated guest

**Data Privacy:**
- `ory_identity_id` is a UUID, not PII
- Email/phone synced from Ory should respect user's privacy settings
- Consider encrypting PII fields at rest (email, phone)

**Session Hijacking:**
- Rely on Ory's session security (HTTPS-only cookies, CSRF protection)
- Short session TTLs configured in Ory
- Token refresh handled by Ory SDK

## Migration Strategy

**Backward Compatibility:**
Since `ory_identity_id` is nullable, existing guest records created before authentication will continue to work. These represent:
- Guests manually added by party hosts
- Guests from legacy invitation flows
- Future multi-channel invitations (SMS-only, etc.)

**Data Migration:**
No existing data needs migration. New authenticated users will automatically get the `ory_identity_id` populated on first login.

**Rollback Plan:**
If issues arise, the `ory_identity_id` column can be ignored by application logic without data loss. Simply revert code changes and optionally drop the column.

## Testing Strategy

**Unit Tests:**
- Test `get_or_create_guest()` with new and existing identities
- Test guest lookup by identity_id
- Test trait synchronization logic

**Integration Tests:**
- End-to-end authentication flow with guest creation
- RSVP creation with authenticated guest
- Multiple sessions for same identity (should reuse guest)
- Provider migration simulation (change identity_id format)

**Manual Testing:**
- Create new account via Ory → verify guest auto-creation
- Login with existing account → verify guest reuse
- Update profile in Ory → verify traits sync
- Test with Ory service down → verify graceful degradation

## Success Metrics

- **Identity Mapping Rate**: 100% of authenticated sessions have corresponding guest records
- **Lookup Latency**: <10ms for guest lookup by identity_id (database query)
- **Sync Success Rate**: >99.9% successful guest creation on first authentication
- **Zero Data Loss**: No orphaned RSVPs or identity mismatches

## Open Questions

1. **Trait Sync Frequency**: Should we sync Ory traits on every request or cache them?
   - **Proposal**: Cache for session duration, sync on session renewal

2. **Guest Merge**: What if user has both authenticated and unauthenticated guest records?
   - **Proposal**: Provide admin tool to merge guest records and migrate RSVPs

3. **Multi-Device Sessions**: Same Ory identity logging in from multiple devices?
   - **Resolution**: Ory handles this; we only care about identity_id, not session_id

4. **Guest Deletion**: When user deletes Ory account, should we soft-delete guest?
   - **Proposal**: Rely on Ory webhooks (future) or periodic cleanup job

## Future Enhancements

**Post-MVP Improvements:**
- Webhook listener for Ory account deletions
- Background job to sync trait changes from Ory
- Admin UI for manual guest/identity mapping
- Support for multiple identity providers per guest (Alternative 2)
- Offline mode with read-only access to cached guest data

## Conclusion

The foreign key approach (Alternative 1) provides the optimal balance of simplicity, performance, and flexibility for the party invitation platform. It maintains loose coupling with Ory while enabling rich application queries and authorization logic. The implementation is straightforward, requiring minimal schema changes and fitting naturally into the existing Axum middleware pattern.

This design positions the platform to evolve authentication strategies without major refactoring, aligning with the technology stack goals (RFD-005) of avoiding vendor lock-in while maintaining rapid development velocity.
