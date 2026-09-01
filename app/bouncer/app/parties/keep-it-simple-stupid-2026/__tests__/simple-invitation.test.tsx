import { render, screen } from "@testing-library/react";
import { SimpleInvitation } from "../simple-invitation";

jest.mock("../../[slug]/rsvp-form", () => ({
  RsvpForm: ({ variant }: { variant: string }) => (
    <div data-testid="rsvp-form" data-variant={variant} />
  ),
}));

jest.mock("../../[slug]/guest-list", () => ({
  GuestList: ({ variant }: { variant: string }) => (
    <div data-testid="guest-list" data-variant={variant} />
  ),
}));

jest.mock("@/app/components/local-date-time", () => ({
  LocalDateTime: ({ mode }: { mode: string }) => <span>{mode}</span>,
}));

jest.mock("@/app/components/address-link", () => ({
  AddressLink: ({ location }: { location: string }) => <span>{location}</span>,
}));

const party = {
  party_id: "party-123",
  name: "Keep It Simple, Stupid",
  time: "2026-09-01T00:00:00Z",
  location: "Somewhere simple",
  description: "No theme.\nNo fuss.",
  slug: "keep-it-simple-stupid-2026",
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
  deleted_at: null,
};

describe("SimpleInvitation", () => {
  it("renders the party details and monochrome RSVP experience", () => {
    render(
      <SimpleInvitation
        party={party}
        partyRsvps={[]}
        partyRsvpsError={null}
        currentUserId="user-123"
      />
    );

    expect(
      screen.getByRole("heading", { name: party.name })
    ).toBeInTheDocument();
    expect(screen.getByText("Somewhere simple")).toBeInTheDocument();
    const description = screen.getByText(
      (_, element) =>
        element?.tagName === "P" &&
        element.textContent === "No theme.\nNo fuss."
    );
    expect(description).toHaveClass("whitespace-pre-wrap");
    expect(screen.getByTestId("rsvp-form")).toHaveAttribute(
      "data-variant",
      "monochrome"
    );
    expect(screen.getByTestId("guest-list")).toHaveAttribute(
      "data-variant",
      "monochrome"
    );
  });
});
