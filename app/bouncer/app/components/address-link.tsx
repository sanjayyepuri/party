"use client";

import { useState, useRef, useEffect } from "react";

interface AddressLinkProps {
  location: string;
}

export function AddressLink({ location }: AddressLinkProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  const encoded = encodeURIComponent(location);

  return (
    <span ref={containerRef} className="relative inline">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="underline decoration-dotted underline-offset-2 cursor-pointer hover:decoration-solid transition-all text-left"
      >
        {location}
      </button>
      {open && (
        <span className="absolute left-0 top-full mt-1 z-50 bg-white/95 backdrop-blur-sm border border-black/10 rounded-lg shadow-lg py-1 min-w-[200px] flex flex-col">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encoded}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm text-black/80 hover:bg-black/5 transition-colors text-left"
          >
            Open in Google Maps
          </a>
          <a
            href={`https://maps.apple.com/?q=${encoded}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm text-black/80 hover:bg-black/5 transition-colors text-left"
          >
            Open in Apple Maps
          </a>
        </span>
      )}
    </span>
  );
}
