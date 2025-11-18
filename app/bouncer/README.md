# Bouncer - Party Invitation Frontend

A Next.js application for guest-facing party invitations with custom designs and seamless RSVP experiences.

## Overview

Bouncer is designed as a deployable frontend that creates bespoke invitation experiences for individual parties. Each deployment serves a single party with completely custom UI while sharing data providers for consistent functionality.

## Architecture

### Data Providers
- **PartyProvider**: Manages party data and code validation
- **GuestProvider**: Handles guest state and plus-one management  
- **RSVPProvider**: Form data, validation, and submission logic

### Custom Components
Each party deployment implements completely custom React components that consume the shared data providers, enabling unlimited design freedom while maintaining consistent business logic.

## Development

### Prerequisites
- Node.js 20+
- Docker (for backend services)

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Visit `http://localhost:3000/invite` to see the invitation flow

### Testing the Flow

The application includes mock data for development:
- Use invitation code `SUNSET24` to test the complete flow
- Try phone number `+15551234567` to test returning guest functionality

## Project Structure

```
app/
├── invite/           # Main invitation flow
├── layout.tsx        # Root layout
└── page.tsx         # Home page (redirects to /invite)

lib/
└── providers/       # Data management layer
    ├── types.ts     # TypeScript interfaces
    ├── api-client.ts    # API communication
    ├── PartyProvider.tsx
    ├── GuestProvider.tsx
    ├── RSVPProvider.tsx
    └── index.ts     # Provider exports
```

## Deployment Strategy

Each party gets its own frontend deployment:
- `sunset-dinner.vercel.app` → Custom SunsetDinner component
- `garden-brunch.vercel.app` → Custom GardenBrunch component  
- `house-warming.vercel.app` → Custom HouseWarming component

All deployments consume the same backend API but render with completely different custom designs.

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3000)
- `NEXT_PUBLIC_USE_REAL_API`: Set to 'true' to use real API instead of mocks

## API Integration

The frontend communicates with the Rust gRPC backend service (pregame) for:
- Party lookup by invitation code
- Guest RSVP submission
- Returning guest verification

## Custom Invitation Development

To create a custom invitation for a new party:

1. Create a new invitation component that uses the data providers
2. Implement completely custom UI using any styling approach
3. Deploy as a separate frontend instance
4. All RSVPs flow to the same backend database

Example:
```jsx
function CustomPartyInvitation() {
  const { party } = useParty();
  const { submitRSVP } = useRSVP();
  
  return (
    <div className="your-custom-design">
      {/* Completely custom UI implementation */}
    </div>
  );
}
```

## Contributing

When adding new features:
1. Maintain the separation between data providers and UI components
2. Ensure changes work across all custom invitation implementations
3. Add appropriate TypeScript types for new data structures
4. Test with both mock and real API data