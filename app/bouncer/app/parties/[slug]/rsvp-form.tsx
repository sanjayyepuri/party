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

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded text-gray-600">
        <p>Loading RSVP...</p>
      </div>
    );
  }

  if (!rsvp) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">
        <p className="font-medium">Error</p>
        <p className="text-sm">{error || "Failed to load RSVP"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white/5 rounded border border-white/10">
        <div className="mb-4">
          <p className="text-sm opacity-80 mb-2">Current Status</p>
          <p
            className={`text-lg font-semibold ${isUpdating ? "text-gray-400" : getStatusColor(rsvp.status)}`}
          >
            {isUpdating
              ? "Updating RSVP..."
              : statusOptions.find((opt) => opt.value === rsvp.status)?.label ||
                rsvp.status}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm opacity-80 mb-2">Update Status</p>
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {statusOptions.map((option) => {
              const isActive = rsvp.status === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={isUpdating || isActive}
                  className={`
                    flex-1 bg-black text-white py-3 px-4 rounded hover:bg-gray-800
                    disabled:bg-gray-400 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2 transition-all
                    ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
