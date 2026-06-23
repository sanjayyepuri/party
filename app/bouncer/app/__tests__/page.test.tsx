import { render, screen } from "@testing-library/react";
import HomePage from "../page";

jest.mock("@/components/auth/login-button", () => ({
  LoginButton: () => <button type="button">Sign in</button>,
}));

describe("HomePage", () => {
  it("defines party as a mission-oriented group", async () => {
    const component = await HomePage();
    render(component);

    expect(
      screen.getByRole("heading", { name: "a space for my friends", level: 1 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "party", level: 3 })
    ).toHaveClass("text-2xl");
    expect(screen.getByText("PAR-tee")).toBeInTheDocument();
    const definition = screen.getByText(
      /a group of people assembled to complete a mission together/i
    );

    expect(definition).toBeInTheDocument();
    expect(definition.closest("blockquote")).toHaveClass("border-l-4");
    expect(
      screen.getByText(
        /away from the noise of social media, built for the moments/i
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/not for the masses/i)).toBeInTheDocument();
  });
});
