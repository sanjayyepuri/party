"use client";

import { useState } from "react";
import type { Rsvp } from "@/lib/types";
import { updateRsvpClient } from "@/lib/api-client-client";

interface RsvpFormProps {
  initialRsvp: Rsvp;
  partyId: string;
}

export function RsvpForm({ initialRsvp, partyId }: RsvpFormProps) {
  const [rsvp, setRsvp] = useState<Rsvp>(initialRsvp);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === rsvp.status) {
      return; // No change needed
    }

    setIsUpdating(true);
    setError(null);
    setSuccess(false);

    try {
      const updatedRsvp = await updateRsvpClient({
        rsvp_id: rsvp.rsvp_id,
        status: newStatus,
      });
      setRsvp(updatedRsvp);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update RSVP"
      );
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

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white/5 rounded border border-white/10">
        <div className="mb-4">
          <p className="text-sm opacity-80 mb-2">Current Status</p>
          <p className={`text-lg font-semibold ${getStatusColor(rsvp.status)}`}>
            {statusOptions.find((opt) => opt.value === rsvp.status)?.label ||
              rsvp.status}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm opacity-80 mb-2">Update Status</p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                disabled={isUpdating || rsvp.status === option.value}
                className={`px-4 py-2 rounded border transition-all ${
                  rsvp.status === option.value
                    ? "bg-white/10 border-white/30 cursor-not-allowed"
                    : "border-white/20 hover:border-white/40 hover:bg-white/5"
                } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded text-green-800">
          <p className="font-medium">RSVP updated successfully!</p>
        </div>
      )}

      {isUpdating && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded text-gray-600">
          <p>Updating RSVP...</p>
        </div>
      )}
    </div>
  );
}

