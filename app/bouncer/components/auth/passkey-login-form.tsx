/**
 * Passkey Login Form Component
 *
 * Provides multiple authentication methods with progressive enhancement:
 * 1. Passkey with conditional UI (autofill) - Best UX
 * 2. Passkey with manual trigger - Good UX
 * 3. Magic link fallback - Universal compatibility
 *
 * Design Philosophy:
 * - Graceful degradation based on browser capabilities
 * - Clear user feedback and error handling
 * - Composable state management using custom hooks
 * - Functional component design
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { useWebAuthnSupport } from "@/lib/hooks/useWebAuthn";
import {
  getWebAuthnErrorMessage,
  selectAuthMethod,
  type AuthMethod,
} from "@/lib/webauthn-utils";

// ============================================================================
// Types
// ============================================================================

type AuthMode = "passkey" | "magic-link";

// ============================================================================
// Component
// ============================================================================

export function PasskeyLoginForm() {
  const router = useRouter();
  const { support, loading: supportLoading } = useWebAuthnSupport();

  // Form state
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<AuthMode>("passkey");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Determine best auth method based on capabilities
  const recommendedMethod: AuthMethod = support
    ? selectAuthMethod(support)
    : "magic-link";

  // ============================================================================
  // Conditional UI Effect
  // ============================================================================

  /**
   * Set up conditional UI (autofill) when supported
   *
   * Initiates passkey autofill in the background.
   * When user clicks email field, browser shows available passkeys.
   * If user selects one, authentication happens automatically.
   */
  useEffect(() => {
    // Only set up if:
    // 1. Conditional UI is supported
    // 2. We're in passkey mode
    // 3. Not currently loading
    if (!support?.conditionalUISupported || mode !== "passkey" || loading) {
      return;
    }

    let aborted = false;

    async function initiateConditionalUI() {
      try {
        // This call enables autofill but doesn't block
        // It will resolve if user selects a passkey from autofill
        // Pass autoFill: true to enable conditional UI
        const result = await signIn.passkey({
          autoFill: true,
        });

        // If we get here, user authenticated via autofill
        if (!aborted && result) {
          router.push("/invitations");
        }
      } catch (err) {
        // Errors here are expected when:
        // - User doesn't interact with autofill
        // - User closes autofill without selecting
        // - Component unmounts before completion
        // Not showing error to user as this is background operation
        console.debug("Conditional UI not used:", err);
      }
    }

    initiateConditionalUI();

    return () => {
      aborted = true;
    };
  }, [support?.conditionalUISupported, mode, loading, router]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle passkey authentication
   *
   * Triggered when user clicks "Sign in with passkey" button.
   * Shows browser's passkey selection UI.
   */
  const handlePasskeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Passkey authentication doesn't require email
      // Browser shows available passkeys for current domain
      await signIn.passkey();

      // Success - redirect to invitations
      router.push("/invitations");
    } catch (err) {
      // Map technical error to user-friendly message
      const message =
        err instanceof Error
          ? getWebAuthnErrorMessage(err)
          : "Failed to sign in with passkey. Please try again.";

      setError(message);
      console.error("Passkey login error:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle magic link authentication
   *
   * Sends email with one-time login link.
   * User clicks link in email to authenticate.
   */
  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await signIn.magicLink({
        email,
        callbackURL: "/invitations",
      });

      setMagicLinkSent(true);
    } catch (err) {
      setError("Failed to send login link. Please try again.");
      console.error("Magic link error:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle between passkey and magic link modes
   */
  const toggleMode = () => {
    setMode((prev) => (prev === "passkey" ? "magic-link" : "passkey"));
    setError("");
    setMagicLinkSent(false);
  };

  // ============================================================================
  // Render States
  // ============================================================================

  /**
   * Loading State
   * Show while checking browser capabilities
   */
  if (supportLoading) {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">Checking browser capabilities...</p>
        </div>
      </div>
    );
  }

  /**
   * Magic Link Sent State
   * Confirmation after sending magic link
   */
  if (magicLinkSent) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Check your email</h2>

        <p className="text-gray-600 mb-6">
          We sent a login link to <strong className="text-gray-900">{email}</strong>
        </p>

        <p className="text-sm text-gray-500 mb-6">
          The link expires in 5 minutes. Click it to sign in.
        </p>

        <button
          onClick={() => setMagicLinkSent(false)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Try a different method
        </button>
      </div>
    );
  }

  /**
   * Main Form State
   * Show authentication form based on mode and capabilities
   */
  const showPasskey = support?.supported && mode === "passkey";
  const showMagicLink = !support?.supported || mode === "magic-link";

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-center">Sign In</h2>

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

      {/* Passkey Form */}
      {showPasskey && (
        <form onSubmit={handlePasskeyLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-700">
              Email {support?.conditionalUISupported && "(optional)"}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // Enable autofill for passkeys
              autoComplete="username webauthn"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={
                support?.conditionalUISupported
                  ? "Click to see available passkeys"
                  : "your@email.com"
              }
              disabled={loading}
            />
            {support?.conditionalUISupported && (
              <p className="text-xs text-gray-500 mt-1">
                💡 Click the field above to see your saved passkeys
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? (
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
                Signing in...
              </span>
            ) : (
              "Sign in with passkey"
            )}
          </button>
        </form>
      )}

      {/* Magic Link Form */}
      {showMagicLink && (
        <form onSubmit={handleMagicLinkLogin} className="space-y-4">
          <div>
            <label htmlFor="email-magic" className="block text-sm font-medium mb-1 text-gray-700">
              Email
            </label>
            <input
              id="email-magic"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? "Sending link..." : "Send login link"}
          </button>
        </form>
      )}

      {/* Mode Toggle */}
      {support?.supported && (
        <div className="mt-4 text-center">
          <button
            onClick={toggleMode}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {mode === "passkey" ? "Use email instead" : "Use passkey instead"}
          </button>
        </div>
      )}

      {/* Unsupported Browser Warning */}
      {!support?.supported && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            Your browser doesn't support passkeys. We'll send you a login link via email instead.
          </p>
        </div>
      )}

      {/* Registration Link */}
      <div className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <a href="/auth/registration" className="text-blue-600 hover:text-blue-700 font-medium">
          Sign up
        </a>
      </div>
    </div>
  );
}
