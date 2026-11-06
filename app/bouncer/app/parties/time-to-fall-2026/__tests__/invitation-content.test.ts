import { invitationEvent, invitationDateMarks } from "../invitation-content";

jest.mock("../invitation-copy", () => {
  const { invitationCopy } = jest.requireActual("../invitation-copy");
  return {
    invitationCopy: {
      ...invitationCopy,
      title: { firstLine: "Stay", connector: "a", secondLine: "While" },
      event: {
        ...invitationCopy.event,
        time: "2026-12-05T00:30:00Z",
        location: "The Garden",
        description: "Custom note\nSecond line",
      },
    },
  };
});

test("uses file event details only as design-preview defaults", () => {
  expect(invitationEvent).toEqual({
    name: "Stay a While",
    time: "2026-12-05T00:30:00Z",
    location: "The Garden",
    description: "Custom note\nSecond line",
  });
});
test("derives decorative dates in the event timezone", () => {
  expect(invitationDateMarks("2026-12-05T00:30:00Z")).toEqual({
    roman: "XII / IV",
    postal: "04 DEC",
    year: "2026",
  });
});
