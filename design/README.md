# Design Documentation

This directory contains all design documentation for the party invitation platform, following the Request for Discussion (RFD) format pioneered by Oxide Computer Company.

## RFD Structure

RFDs are numbered sequentially and cover different aspects of the system design:

- **RFD 001**: Core system architecture and requirements
- **RFD 002**: Frontend architecture and user flow

## RFD Format

Each RFD follows a consistent structure:

- **Problem Statement**: Clear articulation of what we're solving
- **Requirements**: Functional and non-functional requirements
- **Architecture**: Technical design and component relationships
- **Implementation Strategy**: Phased approach to building the system
- **Success Metrics**: How we measure success
- **Open Questions**: Unresolved decisions requiring discussion

## Current RFDs

### [RFD 001: Party Invitation Platform](./RFD-001-party-invitation-platform.md)
Defines the core system architecture for single-party invitation hosting with custom frontend deployments and shared backend infrastructure.

### [RFD 002: Frontend Architecture](./RFD-002-frontend-architecture.md)
Specifies the frontend architecture using React data providers and custom invitation components, enabling unlimited design freedom while maintaining consistent business logic.

## Contributing

When proposing significant changes or new features:

1. Create a new RFD with the next sequential number
2. Follow the established format and structure
3. Focus on clear problem definition and technical rationale
4. Include implementation strategy and success criteria