"use client";

import { useEffect, useMemo, useState } from "react";
import { rotateCalendarFeedTokenClient } from "@/lib/api-client-client";

interface CalendarFeedControlsProps {
  initialFeedPath: string;
  title?: string;
  description?: string;
}

function toWebcalUrl(url: string): string {
  return url.replace(/^https?:/, "webcal:");
}

async function copyText(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback for environments without Clipboard API.
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

export function CalendarFeedControls({
  initialFeedPath,
  title = "Calendar Feed",
  description = "Keep your calendar in sync with upcoming invitations.",
}: CalendarFeedControlsProps) {
  const [origin, setOrigin] = useState("");
  const [feedPath, setFeedPath] = useState(initialFeedPath);
  const [isRotating, setIsRotating] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const fullFeedUrl = useMemo(() => {
    if (!origin) {
      return feedPath;
    }
    return `${origin}${feedPath}`;
  }, [origin, feedPath]);
  const webcalUrl = origin ? toWebcalUrl(fullFeedUrl) : undefined;

  const handleCopy = async () => {
    setIsCopying(true);
    setCopyMessage(null);
    setError(null);

    try {
      await copyText(fullFeedUrl);
      setCopyMessage("Calendar feed URL copied.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to copy URL");
    } finally {
      setIsCopying(false);
    }
  };

  const handleRotate = async () => {
    setIsRotating(true);
    setCopyMessage(null);
    setError(null);

    try {
      const response = await rotateCalendarFeedTokenClient();
      setFeedPath(response.feed_path);
      setCopyMessage("Calendar link reset. The old link no longer works.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to rotate feed token"
      );
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="p-4 bg-white/50 rounded border border-black/10">
      <h2 className="text-lg font-semibold text-black/90 mb-2">{title}</h2>
      <p className="text-sm text-black/70 mb-3">{description}</p>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {webcalUrl && (
            <a
              href={webcalUrl}
              className="bg-black text-center text-white px-4 py-2 rounded hover:bg-gray-800 text-sm"
            >
              Subscribe in calendar app
            </a>
          )}
          <a
            href={fullFeedUrl}
            download="party-invitations.ics"
            className="bg-black/80 text-center text-white px-4 py-2 rounded hover:bg-black text-sm"
          >
            Download invitations
          </a>
          <button
            type="button"
            onClick={handleRotate}
            disabled={isRotating || isCopying}
            className="border border-black/30 text-black/70 px-4 py-2 rounded hover:border-black/60 hover:text-black disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
          >
            {isRotating ? "Resetting..." : "Reset calendar link"}
          </button>
        </div>

        <details className="pt-2">
          <summary className="cursor-pointer text-sm text-black/60 hover:text-black/80">
            Advanced feed options
          </summary>
          <div className="space-y-3 pt-3">
            <label
              className="block text-sm text-black/70"
              htmlFor="calendar-feed-url"
            >
              Feed URL
            </label>
            <input
              id="calendar-feed-url"
              type="text"
              readOnly
              value={fullFeedUrl}
              className="w-full rounded border border-black/20 bg-white/80 px-3 py-2 text-sm text-black/80"
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleCopy}
                disabled={isCopying || isRotating}
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                {isCopying ? "Copying..." : "Copy URL"}
              </button>
            </div>
          </div>
        </details>
      </div>

      {copyMessage && (
        <p role="status" className="text-sm text-green-700 mt-3">
          {copyMessage}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700 mt-3">
          {error}
        </p>
      )}
    </div>
  );
}
