import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FallInvitation } from "../fall-invitation";

jest.mock("../fall-spiral", () => ({ FallSpiral: () => <div /> }));
jest.mock("../invitation-copy", () => {
  const { invitationCopy } = jest.requireActual("../invitation-copy");
  return {
    invitationCopy: {
      ...invitationCopy,
      title: { firstLine: "Stay", connector: "a", secondLine: "While" },
      event: {
        ...invitationCopy.event,
        location: "The Garden",
        description: "A note from the host.",
      },
      poster: {
        ...invitationCopy.poster,
        caption: "Custom caption.",
        italicCaption: "Another line.",
        edition: "Winter edition",
      },
      footer: "See you there.",
    },
  };
});

test("renders customized copy from the content file without layout edits", () => {
  render(<FallInvitation mode="preview" />);
  expect(
    screen.getByRole("heading", { name: "Stay a While" })
  ).toBeInTheDocument();
  expect(screen.getByText(/Custom caption/)).toHaveTextContent("Another line.");
  expect(screen.getByText("Winter edition")).toBeInTheDocument();
  expect(screen.getByText("The Garden")).toBeInTheDocument();
  expect(screen.getByText("A note from the host.")).toBeInTheDocument();
  expect(screen.getByText("See you there.")).toBeInTheDocument();
});
