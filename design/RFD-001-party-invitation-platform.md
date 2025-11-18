# RFD 001: Single-Party Invitation Platform

## Metadata

- **Authors**: Sanjay
- **State**: Draft
- **Discussion**: TBD

## Problem Statement

I need a platform for hosting single-party events with bespoke invitations that prioritizes design customization over feature breadth. Existing solutions either lack personalization (Evite) or create coordination chaos (manual texting). The system must optimize for one exceptional party at a time, with the ability to deploy multiple custom frontend experiences that all consume the same party data.

## Requirements

### Functional Requirements

**FR1: Code-based access**
Guests access invitations via memorable, shareable codes without account creation.

**FR2: Phone-based identity**
Guests identified by phone numbers for return access and communication.

**FR3: RSVP with plus-ones**
Collect attendance status, guest names, plus-one details, and dietary restrictions.

**FR4: Single-party constraint**
System maintains exactly one active party, simplifying data model and enabling deeper customization.

**FR5: Custom invitation rendering**
Each party renders with completely custom UI components while sharing core data providers.

### Non-Functional Requirements

**NFR1: Sub-second load times**
Initial invitation load completes within 800ms.

**NFR2: Mobile-first**
Primary interaction model assumes mobile devices.

**NFR3: High availability**
99.9% uptime during party planning periods.

## Architecture

### Components

**Multiple Frontend Deployments (Next.js)**
- Each party gets its own custom frontend deployment
- All deployments consume the same backend API
- Completely custom invitation components per deployment
- Shared React data providers for state management

**Single Backend Service (Rust + gRPC)**
- Party and guest data management
- Code validation and generation
- API endpoints serving all frontend deployments

**Single Database (PostgreSQL)**
- Two-entity model: Party, Guest
- Phone number encryption at rest
- One active party serves all frontend deployments

### Data Model

```
Party: id, title, description, date, location, code
Guest: id, party_id, phone, name, rsvp_status, plus_ones, dietary_notes
```

Single-party constraint eliminates complex relationships and enables aggressive query optimization. Multiple frontend deployments can run simultaneously, all rendering the same party data with different custom designs.

### Guest Flow

```
Code Entry → Party Preview → RSVP Form → Confirmation → Full Invitation
```

Return access via code re-entry or phone number verification.

## Security

- Invitation codes as bearer tokens (no sessions)
- Rate limiting on code attempts (10/hour per IP)
- Phone number encryption at rest
- HTTPS enforcement and input validation

## Implementation Phases

**Phase 1: Core Flow**
Basic party lookup, RSVP form, guest persistence with single theme.

**Phase 2: Custom Invitations**  
Data providers + separate frontend deployments with custom invitation components for 3-5 distinct design experiences.

**Phase 3: Enhanced Features**
Return access, RSVP updates, plus-one management.

## Success Metrics

- Code-to-RSVP conversion rate >95%
- Page load time <800ms
- System availability 99.9% during active party periods

## Open Questions

1. Phone verification via SMS or trust-based return access?
2. Data retention policy after party completion?
3. Image/asset storage strategy for custom invitations?

## Conclusion

This platform succeeds by doing one thing exceptionally well: creating beautiful, functional party invitations through focused constraints and custom implementation per deployment. The technical architecture serves this goal through single-party data optimization while enabling multiple simultaneous frontend experiences, each with completely custom designs consuming the same underlying party data.