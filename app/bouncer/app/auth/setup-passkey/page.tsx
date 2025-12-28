/**
 * Passkey Setup Page
 *
 * Post-magic-link registration flow:
 * 1. User clicks magic link in email
 * 2. Better Auth creates session
 * 3. User lands here to set up passkey
 * 4. Browser shows biometric prompt
 * 5. Passkey registered → redirect to /invitations
 *
 * User can skip if they prefer magic link only,
 * but we encourage passkey setup for better UX.
 *
 * Design Philosophy:
 * - Clear value proposition (why passkeys are better)
 * - Graceful handling of unsupported browsers
 * - Optional setup (skip button available)
 * - Helpful error messages
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { passkey, useSession } from "@/lib/auth-client";
import { useWebAuthnSupport } from "@/lib/hooks/useWebAuthn";
import { getWebAuthnErrorMessage, formatPasskeyName } from "@/lib/webauthn-utils";

// ============================================================================
// Component
// ============================================================================

export default function SetupPasskeyPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { support, loading: supportLoading } = useWebAuthnSupport();

  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");

  // ============================================================================
  // Authentication Check
  // ============================================================================

  /**
   * Redirect to login if not authenticated
   *
   * This page requires an active session (from magic link).
   * If user navigates here directly without session, redirect to login.
   */
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/login?redirect=/auth/setup-passkey");
    }
  }, [session, isPending, router]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle passkey registration
   *
   * Calls Better Auth passkey.addPasskey() which:
   * 1. Gets registration options from server
   * 2. Calls navigator.credentials.create()
   * 3. Sends attestation to server for verification
   * 4. Server stores public key in database
   */
  const handleSetupPasskey = async () => {
    setError("");
    setRegistering(true);

    try {
      // Generate friendly name for this passkey
      const name = formatPasskeyName();

      // Register passkey
      await passkey.addPasskey({
        name,
      });

      // Success - redirect to invitations
      router.push("/invitations");
    } catch (err) {
      // Map technical error to user-friendly message
      const message =
        err instanceof Error
          ? getWebAuthnErrorMessage(err)
          : "Failed to set up passkey";

      setError(message);
      console.error("Passkey registration error:", err);
    } finally {
      setRegistering(false);
    }
  };

  /**
   * Handle skip
   *
   * User chooses to skip passkey setup.
   * They can add one later from settings.
   */
  const handleSkip = () => {
    router.push("/invitations");
  };

  // ============================================================================
  // Render States
  // ============================================================================

  /**
   * Loading State
   * Show while checking session and browser capabilities
   */
  if (isPending || supportLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  /**
   * Unsupported Browser State
   * Show when WebAuthn is not supported
   */
  if (!support?.supported) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mb-4">Passkeys not supported</h2>

          <p className="text-gray-600 mb-6">
            Your browser doesn't support passkeys yet. You can continue using email login links.
          </p>

          <button
            onClick={handleSkip}
            className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 font-medium transition-colors"
          >
            Continue
          </button>

          <p className="text-xs text-gray-500 mt-4">
            Try using a modern browser like Chrome, Safari, or Edge for passkey support.
          </p>
        </div>
      </div>
    );
  }

  /**
   * Main Setup State
   * Prompt user to set up passkey
   */
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-blue-600"
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

        {/* Title */}
        <h2 className="text-2xl font-semibold mb-2">Set up biometric login</h2>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          Use your {support?.platformAuthenticatorAvailable ? "fingerprint, face, or" : ""} device
          PIN to sign in quickly and securely.
        </p>

        {/* Benefits */}
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6 text-left">
          <p className="text-sm font-medium text-green-900 mb-2">Why passkeys are better:</p>
          <ul className="text-sm text-green-800 space-y-1">
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>One-tap sign in (no email needed)</span>
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>More secure than passwords</span>
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Works on all your devices</span>
            </li>
          </ul>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-left">
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

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSetupPasskey}
            disabled={registering}
            className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {registering ? (
              <span className="flex items-center justify-center">
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
                Setting up...
              </span>
            ) : (
              "Set up passkey"
            )}
          </button>

          <button
            onClick={handleSkip}
            disabled={registering}
            className="w-full bg-white text-gray-700 py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Skip for now
          </button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 mt-4">
          You can always add a passkey later from your account settings.
        </p>
      </div>
    </div>
  );
}
