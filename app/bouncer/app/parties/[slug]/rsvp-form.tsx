"use client";

import { useState, useEffect } from "react";
import type { Rsvp } from "@/lib/types";
import { fetchRsvpClient, updateRsvpClient } from "@/lib/api-client-client";

interface RsvpFormProps {
  partyId: string;
}

export function RsvpForm({ partyId }: RsvpFormProps) {
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
        setError(err instanceof Error ? err.message : "Failed to load RSVP");
      } finally {
        setIsLoading(false);
      }
    }

    loadRsvp();
  }, [partyId]);

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
      setError(err instanceof Error ? err.message : "Failed to update RSVP");
    } finally {
      setIsUpdating(false);
    }
  };

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "accepted", label: "Accepted" },
    { value: "declined", label: "Declined" },
  ];

  const getStatusColor = (status: string) => {
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
      return "Loading RSVP...";
    }
    if (error && !rsvp) {
      return error || "Failed to load RSVP";
    }
    if (isUpdating) {
      return "Updating RSVP...";
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
    return "Unknown";
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

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white/5 rounded border border-white/10">
        <div className="mb-4">
          <p className="text-sm opacity-80 mb-2">Current Status</p>
          <p className={`text-lg font-semibold ${getStatusTextColor()}`}>
            {getStatusText()}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm opacity-80 mb-2">Update Status</p>
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {statusOptions.map((option) => {
              const isActive = rsvp?.status === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={isDisabled || isActive}
                  className={`
                    flex-1 bg-black text-white py-3 px-4 rounded hover:bg-gray-800
                    disabled:bg-gray-400 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2 transition-all
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
