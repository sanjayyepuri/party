import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FallInvitation } from "../fall-invitation";
import type { Party } from "@/lib/types";
import { createCalendarEvent } from "../calendar-event";

jest.mock("../fall-spiral", () => ({ FallSpiral: () => <div /> }));
jest.mock("../../[slug]/rsvp-form", () => ({
  RsvpForm: ({ partyId }: { partyId: string }) => (
    <div data-testid="rsvp-form">{partyId}</div>
  ),
}));
jest.mock("../../[slug]/guest-list", () => ({
  GuestList: () => <div data-testid="guest-list" />,
}));

const party: Party = {
  party_id: "fall-party",
  name: "Time to Fall",
  time: "2026-11-14T01:00:00Z",
  location: "123 Autumn Street",
  description: "Bring a friend.\nStay a little longer.",
  slug: "time-to-fall-2026",
  created_at: "2026-11-05T00:00:00Z",
  updated_at: "2026-11-05T00:00:00Z",
  deleted_at: null,
};

describe("FallInvitation", () => {
  it("shows the confirmed date in preview without creating a real RSVP", () => {
    render(<FallInvitation mode="preview" />);
    expect(
      screen.getByRole("heading", { name: "Time to Fall" })
    ).toBeInTheDocument();
    expect(screen.getByText("November 13, 2026")).toBeInTheDocument();
    expect(screen.getByText("To be announced")).toBeInTheDocument();
    expect(screen.getByText("7:30 PM Eastern")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Back to invitations/ })
    ).toHaveAttribute("href", "/invitations");
    expect(screen.queryByTestId("rsvp-form")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("keeps RSVP and guests visible without expanding anything", () => {
    render(
      <FallInvitation
        mode="live"
        party={party}
        partyRsvps={[]}
        partyRsvpsError={null}
        currentUserId="host"
      />
    );
    expect(screen.getByTestId("rsvp-form")).toBeVisible();
    expect(screen.getByTestId("guest-list")).toBeVisible();
    expect(screen.getByTestId("rsvp-form").closest("details")).toBeNull();
  });

  it("uses the real party and RSVP flow and preserves the host's line breaks", () => {
    render(
      <FallInvitation
        mode="live"
        party={party}
        partyRsvps={[]}
        partyRsvpsError={null}
        currentUserId="host"
      />
    );
    expect(screen.getByTestId("rsvp-form")).toHaveTextContent("fall-party");
    expect(screen.getByTestId("guest-list")).toBeInTheDocument();
    expect(screen.getByText("123 Autumn Street")).toBeInTheDocument();
    expect(screen.getByText(/Bring a friend/)).toHaveStyle({
      whiteSpace: "pre-wrap",
    });
  });

  it("reports a guest list error while keeping RSVP available", () => {
    render(
      <FallInvitation
        mode="live"
        party={party}
        partyRsvps={null}
        partyRsvpsError="Connection lost"
        currentUserId="host"
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Connection lost");
    expect(screen.getByTestId("rsvp-form")).toBeInTheDocument();
    expect(screen.queryByTestId("guest-list")).not.toBeInTheDocument();
  });

  it("offers a single event download beside the date without calendar setup", () => {
    render(
      <FallInvitation
        mode="live"
        party={party}
        partyRsvps={[]}
        partyRsvpsError={null}
        currentUserId="host"
      />
    );
    const link = screen.getByRole("link", { name: "Add to calendar" });
    expect(link).toHaveAttribute("download", "time-to-fall-2026.ics");
    expect(link.parentElement).toContainElement(
      screen.getByText("November 13, 2026")
    );
    const calendar = decodeURIComponent(
      link.getAttribute("href")!.split(",").slice(1).join(",")
    );
    expect(calendar).toContain("DTSTART:20261114T010000Z");
    expect(calendar).toContain("SUMMARY:Time to Fall");
    expect(calendar).toContain(
      "DESCRIPTION:Bring a friend.\\nStay a little longer."
    );
    expect(screen.queryByText("Feed URL")).not.toBeInTheDocument();
    expect(screen.queryByText("Rotate Token")).not.toBeInTheDocument();
  });

  it("escapes calendar text and folds long Unicode lines without corrupting them", () => {
    const name = "Autumn 🍂, friends; ".repeat(12);
    const calendar = createCalendarEvent({
      ...party,
      name,
      description: "Hello\r\nEND:VEVENT\r\nBEGIN:VEVENT",
    });
    for (const line of calendar.split("\r\n")) {
      expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
    }
    const unfolded = calendar.replace(/\r\n /g, "");
    expect(unfolded).toContain("SUMMARY:" + name.replace(/[,;]/g, "\\$&"));
    expect(unfolded).toContain("DESCRIPTION:Hello\\nEND:VEVENT\\nBEGIN:VEVENT");
    expect(calendar.match(/^BEGIN:VEVENT$/gm)).toHaveLength(1);
  });
});
