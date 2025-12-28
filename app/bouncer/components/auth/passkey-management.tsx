/**
 * Passkey Management Component
 *
 * Full CRUD interface for managing user's passkeys:
 * - List all passkeys
 * - Add new passkey
 * - Delete passkey (with confirmation)
 * - Display device information
 *
 * Design Philosophy:
 * - Clear visual hierarchy
 * - Confirmation before destructive actions
 * - Helpful empty states
 * - Educational content about passkeys
 */

"use client";

import { useState, useEffect } from "react";
import { passkey, useSession } from "@/lib/auth-client";
import { useWebAuthnSupport } from "@/lib/hooks/useWebAuthn";
import { getWebAuthnErrorMessage, formatPasskeyName } from "@/lib/webauthn-utils";

// ============================================================================
// Types
// ============================================================================

/**
 * Passkey data structure from Better Auth
 */
interface Passkey {
  id: string;
  name?: string | null;  // Can be undefined or null
  createdAt: Date | string;  // Can be Date object or ISO string
  deviceType: string;
  backedUp?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function PasskeyManagement() {
  const { data: session } = useSession();
  const { support } = useWebAuthnSupport();

  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ============================================================================
  // Data Loading
  // ============================================================================

  /**
   * Load user's passkeys from server
   *
   * Fetches all passkeys associated with current user.
   */
  const loadPasskeys = async () => {
    try {
      setError("");
      const response = await passkey.listUserPasskeys();

      // Better Auth returns a response object with data and error
      // Check if error exists
      if ("error" in response && response.error) {
        throw new Error(response.error.message || "Failed to load passkeys");
      }

      // Extract data from response
      const passkeys = "data" in response ? response.data : [];
      setPasskeys(passkeys || []);
    } catch (err) {
      setError("Failed to load passkeys");
      console.error("Failed to load passkeys:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load passkeys on mount
   */
  useEffect(() => {
    if (session) {
      loadPasskeys();
    }
  }, [session]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle adding new passkey
   *
   * Registers a new passkey for current device.
   */
  const handleAddPasskey = async () => {
    setError("");
    setAdding(true);

    try {
      // Generate friendly name
      const name = formatPasskeyName();

      // Register new passkey
      await passkey.addPasskey({
        name,
      });

      // Reload list to show new passkey
      await loadPasskeys();
    } catch (err) {
      const message =
        err instanceof Error
          ? getWebAuthnErrorMessage(err)
          : "Failed to add passkey";

      setError(message);
      console.error("Failed to add passkey:", err);
    } finally {
      setAdding(false);
    }
  };

  /**
   * Handle deleting passkey
   *
   * Removes a passkey after user confirmation.
   * Shows confirmation dialog for safety.
   */
  const handleDeletePasskey = async (id: string, name?: string | null) => {
    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to remove "${name || "this passkey"}"?\n\n` +
        "You won't be able to use it to sign in anymore."
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError("");

    try {
      await passkey.deletePasskey({ id });

      // Reload list to remove deleted passkey
      await loadPasskeys();
    } catch (err) {
      setError("Failed to remove passkey. Please try again.");
      console.error("Failed to delete passkey:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================================================
  // Render States
  // ============================================================================

  /**
   * Require Authentication
   */
  if (!session) {
    return (
      <div className="text-gray-600">
        Please sign in to manage your passkeys.
      </div>
    );
  }

  /**
   * Unsupported Browser
   */
  if (!support?.supported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5 text-yellow-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-900">Passkeys not supported</p>
            <p className="text-sm text-yellow-800 mt-1">
              Your browser doesn't support passkeys. Try using a modern browser like Chrome,
              Safari, or Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Loading State
   */
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Loading passkeys...</p>
      </div>
    );
  }

  /**
   * Main Management Interface
   */
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold mb-2">Your Passkeys</h2>
      <p className="text-gray-600 mb-6 text-sm">
        Manage biometric login methods for quick and secure access
      </p>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Passkey List */}
      <div className="space-y-4 mb-6">
        {passkeys.length === 0 ? (
          /* Empty State */
          <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-md">
            <div className="mb-4">
              <svg
                className="mx-auto w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No passkeys yet</h3>
            <p className="text-gray-600 text-sm mb-4">
              Add a passkey to enable quick biometric login
            </p>
          </div>
        ) : (
          /* Passkey Cards */
          passkeys.map((pk) => (
            <div
              key={pk.id}
              className="flex items-center justify-between p-4 border border-gray-300 rounded-md hover:border-gray-400 transition-colors"
            >
              <div className="flex items-center flex-1">
                {/* Icon */}
                <div className="mr-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {pk.name || "Unnamed passkey"}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                    <span>
                      Added {pk.createdAt instanceof Date
                        ? pk.createdAt.toLocaleDateString()
                        : new Date(pk.createdAt).toLocaleDateString()}
                    </span>
                    {pk.deviceType === "platform" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Built-in
                      </span>
                    )}
                    {pk.backedUp && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Backed up
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDeletePasskey(pk.id, pk.name)}
                disabled={deletingId === pk.id}
                className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ml-4"
              >
                {deletingId === pk.id ? "Removing..." : "Remove"}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Passkey Button */}
      <button
        onClick={handleAddPasskey}
        disabled={adding}
        className="bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
      >
        {adding ? (
          <span className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Adding...
          </span>
        ) : (
          "Add new passkey"
        )}
      </button>

      {/* Information Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="font-medium mb-2 text-blue-900">About passkeys</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>
            Passkeys use biometric authentication (fingerprint, face) or your device PIN for
            secure, passwordless sign-in.
          </p>
          <p>
            They're more secure than passwords and work across your devices when backed up to your
            account (iCloud, Google Password Manager).
          </p>
        </div>
      </div>
    </div>
  );
}
