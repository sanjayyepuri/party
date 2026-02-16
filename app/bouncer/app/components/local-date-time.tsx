"use client";

import { useEffect, useMemo, useState } from "react";

type DisplayMode = "date" | "time";

interface LocalDateTimeProps {
  dateTime: string;
  mode: DisplayMode;
  className?: string;
}

function formatValue(
  dateTime: string,
  mode: DisplayMode,
  timeZone?: string
): string {
  const parsedDate = new Date(dateTime);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateTime;
  }

  const baseOptions: Intl.DateTimeFormatOptions =
    mode === "date"
      ? {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      : {
          hour: "numeric",
          minute: "2-digit",
        };

  return parsedDate.toLocaleString("en-US", {
    ...baseOptions,
    ...(timeZone ? { timeZone } : {}),
  });
}

export function LocalDateTime({ dateTime, mode, className }: LocalDateTimeProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const displayValue = useMemo(() => {
    // Render UTC on the server and first paint to avoid hydration mismatch,
    // then switch to the viewer's local timezone after mount.
    return formatValue(dateTime, mode, isMounted ? undefined : "UTC");
  }, [dateTime, isMounted, mode]);

  return (
    <time dateTime={dateTime} className={className} suppressHydrationWarning>
      {displayValue}
    </time>
  );
}
