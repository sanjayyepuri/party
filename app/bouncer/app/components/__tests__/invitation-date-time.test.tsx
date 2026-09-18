import { render, screen } from "@testing-library/react";
import { InvitationDateTime } from "../invitation-date-time";

describe("InvitationDateTime", () => {
  it("renders the localized date and a single-event calendar download", () => {
    render(
      <InvitationDateTime partyId="party 123" dateTime="2026-09-20T20:00:00Z" />
    );

    expect(screen.getAllByRole("time")).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: /add to calendar/i })
    ).toHaveAttribute("href", "/api/bouncer/parties/party%20123/calendar.ics");
    expect(
      screen.getByRole("link", { name: /add to calendar/i })
    ).not.toHaveAttribute("download");
  });

  it("allows long dates to wrap and supports themed separators", () => {
    const { container } = render(
      <InvitationDateTime
        partyId="party-123"
        dateTime="2026-09-20T20:00:00Z"
        separator=" / "
      />
    );

    expect(
      container.querySelector(".whitespace-nowrap")
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /add to calendar/i })
    ).toHaveTextContent("/");
  });

  it("supports a stacked date and time layout", () => {
    const { container } = render(
      <InvitationDateTime
        partyId="party-123"
        dateTime="2026-09-20T20:00:00Z"
        separator={<br />}
      />
    );

    expect(container.querySelector("br")).toBeInTheDocument();
  });
});
