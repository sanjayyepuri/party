"use client";

import { useState, useEffect } from "react";
import type { Rsvp } from "@/lib/types";
import { fetchRsvpClient, updateRsvpClient } from "@/lib/api-client-client";

export interface RsvpFormCopy {
  currentStatus: string;
  updateStatus: string;
  maybe: string;
  going: string;
  decline: string;
  loading: string;
  updating: string;
  unknown: string;
  loadError: string;
  updateError: string;
}

const defaultCopy: RsvpFormCopy = {
  currentStatus: "Current Status",
  updateStatus: "Update Status",
  maybe: "Maybe",
  going: "Going",
  decline: "Decline",
  loading: "Loading RSVP...",
  updating: "Updating RSVP...",
  unknown: "Unknown",
  loadError: "Failed to load RSVP",
  updateError: "Failed to update RSVP",
};

interface RsvpFormProps {
  partyId: string;
  variant?: "default" | "monochrome";
  copy?: Partial<RsvpFormCopy>;
}

export function RsvpForm({
  partyId,
  variant = "default",
  copy,
}: RsvpFormProps) {
  const labels = { ...defaultCopy, ...copy };
  const [rsvp, setRsvp] = useState<Rsvp | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch RSVP data on mount
  useEffect(() => {
    async function loadRsvp() {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedRsvp = await fetchRsvpClient(partyId);
        setRsvp(fetchedRsvp);
      } catch (err) {
        setError(err instanceof Error ? err.message : labels.loadError);
      } finally {
        setIsLoading(false);
      }
    }

    loadRsvp();
  }, [partyId, labels.loadError]);

  const handleStatusChange = async (newStatus: string) => {
    if (!rsvp || newStatus === rsvp.status) {
      return; // No change needed
    }

    setIsUpdating(true);
    setError(null);

    try {
      const updatedRsvp = await updateRsvpClient({
        rsvp_id: rsvp.rsvp_id,
        status: newStatus,
      });
      setRsvp(updatedRsvp);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.updateError);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusOptions = [
    { value: "pending", label: labels.maybe },
    { value: "accepted", label: labels.going },
    { value: "declined", label: labels.decline },
  ];

  const getStatusColor = (status: string) => {
    if (variant === "monochrome") {
      return "text-black";
    }

    switch (status) {
      case "accepted":
        return "text-green-600";
      case "declined":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  const getStatusText = () => {
    if (isLoading) {
      return labels.loading;
    }
    if (error && !rsvp) {
      return error || labels.loadError;
    }
    if (isUpdating) {
      return labels.updating;
    }
    if (error) {
      return error;
    }
    if (rsvp) {
      return (
        statusOptions.find((opt) => opt.value === rsvp.status)?.label ||
        rsvp.status
      );
    }
    return labels.unknown;
  };

  const getStatusTextColor = () => {
    if (isLoading || isUpdating) {
      return "text-gray-400";
    }
    if (error) {
      return "text-red-600";
    }
    if (rsvp) {
      return getStatusColor(rsvp.status);
    }
    return "text-gray-400";
  };

  const hasUnrecoverableError = error && !rsvp;
  const isDisabled = isLoading || isUpdating || hasUnrecoverableError;
  const isMonochrome = variant === "monochrome";

  return (
    <div className="space-y-4">
      <div
        className={
          isMonochrome
            ? "border-t-2 border-black pt-4"
            : "p-4 bg-white/5 rounded border border-white/10"
        }
      >
        <div className="mb-4">
          <p className="text-sm opacity-80 mb-2">{labels.currentStatus}</p>
          <p className={`text-lg font-semibold ${getStatusTextColor()}`}>
            {getStatusText()}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm opacity-80 mb-2">{labels.updateStatus}</p>
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {statusOptions.map((option) => {
              const isActive = rsvp?.status === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={isDisabled || isActive}
                  className={`
                    flex-1 bg-black text-white py-3 px-4 hover:bg-gray-800
                    disabled:bg-gray-400 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2 transition-colors
                    ${isMonochrome ? "rounded-none border-2 border-black uppercase tracking-tight disabled:border-gray-400" : "rounded"}
                    ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
