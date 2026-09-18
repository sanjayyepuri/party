import { LocalDateTime } from "./local-date-time";
import { partyCalendarDownloadPath } from "@/lib/api-paths";
import type { ReactNode } from "react";

interface InvitationDateTimeProps {
  partyId: string;
  dateTime: string;
  separator?: ReactNode;
}

export function InvitationDateTime({
  partyId,
  dateTime,
  separator = " at ",
}: InvitationDateTimeProps) {
  const calendarPath = partyCalendarDownloadPath(partyId);

  return (
    <a
      href={calendarPath}
      className="inline no-underline transition-opacity hover:opacity-70"
      title="Add to calendar"
    >
      <span className="inline">
        <svg
          aria-hidden="true"
          width="1em"
          height="1em"
          className="mr-[0.35em] inline-block align-[-0.08em]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" />
        </svg>
        <LocalDateTime
          dateTime={dateTime}
          mode="date"
          className="underline decoration-current underline-offset-2"
        />
        {separator}
        <LocalDateTime
          dateTime={dateTime}
          mode="time"
          className="underline decoration-current underline-offset-2"
        />
      </span>
      <span className="sr-only">Add to calendar</span>
    </a>
  );
}
