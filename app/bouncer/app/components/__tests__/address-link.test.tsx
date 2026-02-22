import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddressLink } from "../address-link";

describe("AddressLink", () => {
  const location = "123 Main St, New York, NY 10001";

  it("renders the location text as a button", () => {
    render(<AddressLink location={location} />);
    expect(screen.getByRole("button", { name: location })).toBeInTheDocument();
  });

  it("dropdown is closed initially", () => {
    render(<AddressLink location={location} />);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens dropdown when button is clicked", async () => {
    const user = userEvent.setup();
    render(<AddressLink location={location} />);

    await user.click(screen.getByRole("button"));

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("closes dropdown when button is clicked again", async () => {
    const user = userEvent.setup();
    render(<AddressLink location={location} />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("button"));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("renders Google Maps and Apple Maps links with correct URLs", async () => {
    const user = userEvent.setup();
    render(<AddressLink location={location} />);

    await user.click(screen.getByRole("button"));

    const encoded = encodeURIComponent(location);

    const googleLink = screen.getByRole("menuitem", { name: /Google Maps/i });
    expect(googleLink).toHaveAttribute(
      "href",
      `https://www.google.com/maps/search/?api=1&query=${encoded}`
    );

    const appleLink = screen.getByRole("menuitem", { name: /Apple Maps/i });
    expect(appleLink).toHaveAttribute(
      "href",
      `https://maps.apple.com/?q=${encoded}`
    );
  });

  it("URL encodes special characters in the location", async () => {
    const user = userEvent.setup();
    const locationWithSpaces = "Central Park, New York";
    render(<AddressLink location={locationWithSpaces} />);

    await user.click(screen.getByRole("button"));

    const encoded = encodeURIComponent(locationWithSpaces);
    const googleLink = screen.getByRole("menuitem", { name: /Google Maps/i });
    expect(googleLink).toHaveAttribute(
      "href",
      expect.stringContaining(encoded)
    );
  });

  it("closes dropdown when Escape key is pressed", async () => {
    const user = userEvent.setup();
    render(<AddressLink location={location} />);

    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes dropdown when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <AddressLink location={location} />
        <div data-testid="outside">Outside</div>
      </div>
    );

    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByTestId("outside"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("sets aria-haspopup and updates aria-expanded on the button", async () => {
    const user = userEvent.setup();
    render(<AddressLink location={location} />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-haspopup", "true");
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });
});
