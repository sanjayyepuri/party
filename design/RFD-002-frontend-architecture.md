# RFD 002: Frontend Architecture and User Flow

## Metadata

- **Authors**: Sanjay
- **State**: Draft
- **Discussion**: TBD

## Problem Statement

Each party deployment needs a completely custom frontend that provides a seamless guest experience while maintaining consistent data flow and business logic. The frontend must handle code-based access, multi-step RSVP forms, and return visitor flows without creating UI component abstractions that limit design freedom.

## Requirements

### Functional Requirements

**FR1: Code-based entry**
Guests access invitations via URL with embedded codes or manual code entry form.

**FR2: Progressive disclosure**
Information reveals progressively: code validation → party preview → RSVP form → full invitation details.

**FR3: Return visitor handling**
Guests who have already RSVP'd can return via code to view full invitation details.

**FR4: Form state management**
RSVP forms handle validation, plus-one addition, and submission with appropriate error handling.

**FR5: Mobile-optimized interactions**
Primary interaction model assumes mobile devices with touch-based form controls.

### Non-Functional Requirements

**NFR1: Custom design freedom**
Each deployment can implement completely different UI/UX patterns without framework constraints.

**NFR2: Consistent data handling**
All deployments use identical API communication and state management patterns.

**NFR3: Fast initial load**
Code validation and party preview render within 400ms of page load.

## Architecture Overview

### Data Flow Architecture

Each frontend deployment follows identical data patterns while implementing completely custom UI:

```
[API Layer] ← [Data Providers] ← [Custom UI Components]
```

**API Layer**: Direct gRPC-web calls to backend service
**Data Providers**: React contexts managing party, guest, and form state  
**Custom UI Components**: Completely bespoke implementation per deployment

### Core Data Providers

**PartyProvider**
```jsx
const PartyContext = createContext({
  party: null,
  loading: boolean,
  error: string | null,
  validateCode: (code: string) => Promise<boolean>,
  fetchParty: () => Promise<void>
});
```

**GuestProvider**
```jsx
const GuestContext = createContext({
  guest: null,
  isReturningGuest: boolean,
  setGuestInfo: (info: GuestInfo) => void,
  addPlusOne: (plusOne: PlusOneInfo) => void,
  removePlusOne: (index: number) => void
});
```

**RSVPProvider**
```jsx
const RSVPContext = createContext({
  formData: RSVPFormData,
  validation: ValidationState,
  isSubmitting: boolean,
  submitRSVP: () => Promise<boolean>,
  updateField: (field: string, value: any) => void
});
```

## User Flow States

### State Machine

```
[Landing] → [Code Entry] → [Party Preview] → [RSVP Form] → [Confirmation] → [Full Invitation]
    ↓             ↓              ↓              ↓              ↓              ↓
[Direct Code] → [Invalid] → [Returning] → [Form Error] → [Submit Error] → [Success]
```

### State Definitions

**Landing State**
- URL without code parameter
- Renders code entry form
- Validates code on submission

**Party Preview State**
- Valid code entered
- Shows party title, date, basic info
- "RSVP" button to continue

**RSVP Form State**
- Collects guest information
- Phone number (required)
- Name (required)  
- Attendance status (required)
- Plus-ones (conditional)
- Dietary restrictions (optional)

**Confirmation State**
- Form submitted successfully
- Guest information saved
- Transition to full invitation

**Full Invitation State**
- Complete party details visible
- Guest can view their RSVP status
- Return visitors land here directly

### Error States

**Invalid Code**
- Code doesn't exist in system
- Clear error message with retry option

**Returning Guest Conflict**
- Phone number already exists for this party
- Option to view existing RSVP or contact host

**Form Validation Errors**
- Field-level validation feedback
- Form remains editable with highlighted errors

**Submission Errors**
- Network or server errors during RSVP
- Retry mechanism with form state preserved

## Custom Component Architecture

### Design Freedom Principles

Each deployment implements these states with complete UI autonomy:

**No Shared UI Components**
- Zero reusable React components between deployments
- Each frontend builds custom form controls, layouts, animations
- Design system defined per deployment, not globally

**Consistent Data Contracts**
- All deployments consume identical provider interfaces
- Form data structures standardized across deployments
- API communication handled uniformly

**Custom Styling Approaches**
- Deployments can use CSS modules, Tailwind, styled-components, or vanilla CSS
- No constraints on animation libraries or UI frameworks
- Complete freedom over responsive breakpoints and layouts

### Example Implementation Patterns

**Sunset Dinner Deployment**
```jsx
function SunsetDinnerInvitation() {
  const { party } = useParty();
  const { guest } = useGuest();
  const { formData, submitRSVP } = useRSVP();

  return (
    <div className="min-h-screen bg-gradient-sunset">
      <div className="elegant-serif-container">
        {/* Completely custom UI implementation */}
        <ElegantTitle>{party.title}</ElegantTitle>
        <WarmGradientForm onSubmit={submitRSVP} />
      </div>
    </div>
  );
}
```

**House Party Deployment**
```jsx
function HousePartyInvitation() {
  const { party } = useParty();
  const { guest } = useGuest();
  const { formData, submitRSVP } = useRSVP();

  return (
    <div className="neon-party-background">
      <div className="bold-modern-layout">
        {/* Completely different UI approach */}
        <NeonTitle>{party.title}</NeonTitle>
        <BeatMatchingForm onSubmit={submitRSVP} />
      </div>
    </div>
  );
}
```

## Implementation Strategy

### Phase 1: Provider Infrastructure
Build the core data management layer:
- API client for gRPC-web communication
- Context providers for party, guest, and RSVP state
- Hook interfaces for consuming provider data
- Basic error handling and loading states

Success criteria: Providers manage all data flow without UI dependencies.

### Phase 2: Reference Implementation
Create one complete custom invitation:
- Full user flow from code entry to final confirmation
- Custom form controls and validation UI
- Mobile-responsive design
- Error state handling

Success criteria: Complete guest experience with custom design.

### Phase 3: Multiple Deployments
Build 2-3 additional custom frontends:
- Each with distinct visual identity and interaction patterns
- Shared provider infrastructure
- Independent styling and animation approaches

Success criteria: Visually distinct invitations with consistent data behavior.

## Testing Strategy

### Provider Testing
Unit tests for each context provider:
- State management logic
- API communication
- Error handling
- Form validation

### Custom Component Testing  
Each deployment tests its own components:
- User interaction flows
- Form submission scenarios
- Mobile responsiveness
- Error state rendering

### Integration Testing
Cross-deployment consistency:
- All deployments produce identical API calls
- Form data structures match across implementations
- Error handling behaves consistently

### End-to-End Testing
Complete user flows for each deployment:
- Code entry to RSVP completion
- Return visitor access
- Mobile device testing
- Error recovery scenarios

## Performance Considerations

### Initial Load Optimization
- Server-side rendering for code validation
- Preload critical party data
- Minimize JavaScript bundle size per deployment

### Form Interaction Performance
- Client-side validation for immediate feedback
- Optimistic UI updates during submission
- Progressive enhancement for JavaScript-disabled users

### Mobile Performance
- Touch-optimized form controls
- Reduced animation complexity on low-end devices
- Efficient image loading for custom graphics

## Success Metrics

- Code validation time <200ms
- Form completion rate >95% (started to submitted)
- Mobile usability score >90 on Lighthouse
- Cross-deployment API consistency 100%

## Open Questions

1. Should deployments share any utility functions, or maintain complete independence?
2. How do we handle custom assets (images, fonts) across multiple deployments?
3. What's the deployment strategy for updates that don't affect the current active party?
4. Should we implement service worker caching for offline invitation viewing?

## Conclusion

This architecture enables unlimited creative freedom for each party's invitation experience while maintaining robust, consistent data management. By separating data providers from UI implementation, each deployment becomes a focused, custom experience that can fully express the character of its specific event.

The system succeeds when each invitation feels completely unique while the underlying infrastructure remains invisible to both guests and the deployment process.