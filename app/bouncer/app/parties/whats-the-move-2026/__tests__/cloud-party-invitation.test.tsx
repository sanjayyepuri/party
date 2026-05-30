import { render, screen } from "@testing-library/react";
import { CloudPartyInvitation } from "../cloud-party-invitation";

jest.mock("@/lib/webgl/cloud-canvas", () => ({
  CloudCanvas: () => <div data-testid="cloud-canvas" />,
}));

jest.mock("../../[slug]/rsvp-form", () => ({
  RsvpForm: () => <div data-testid="rsvp-form" />,
}));

jest.mock("../../[slug]/guest-list", () => ({
  GuestList: () => <div data-testid="guest-list" />,
}));

jest.mock("@/app/components/local-date-time", () => ({
  LocalDateTime: ({ mode }: { mode: string }) => <span>{mode}</span>,
}));

jest.mock("@/app/components/address-link", () => ({
  AddressLink: ({ location }: { location: string }) => <span>{location}</span>,
}));

describe("CloudPartyInvitation", () => {
  it("preserves line breaks in the party description", () => {
    render(
      <CloudPartyInvitation
        party={{
          party_id: "party-123",
          name: "What's the Move?",
          time: "2026-05-31T00:00:00Z",
          location: "TBD",
          description: "First line\nSecond line",
          slug: "whats-the-move-2026",
          created_at: "2026-05-10T00:00:00Z",
          updated_at: "2026-05-10T00:00:00Z",
          deleted_at: null,
        }}
        partyRsvps={[]}
        partyRsvpsError={null}
        currentUserId="user-123"
      />
    );

    const description = screen.getByText(
      (_, element) => element?.textContent === "First line\nSecond line"
    );

    expect(description).toHaveClass("whitespace-pre-wrap");
  });
});
