"use client";

import { useState, useEffect } from "react";
import { signIn, authClient } from "@/lib/auth-client";

export function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPasskeySupported, setIsPasskeySupported] = useState(true); // Default to true to avoid hydration mismatch

  const handlePasskeySignIn = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await (signIn as any).passkey(
        {
          callbackURL: "/invitations",
        },
        {
          onRequest: () => {
            // Request started - browser will show passkey prompt
          },
          onSuccess: () => {
            // Success - redirect will be handled by callbackURL
            window.location.href = "/invitations";
          },
          onError: (ctx: { error?: { message?: string } }) => {
            const errorMessage =
              ctx.error?.message || "Failed to sign in with passkey";

            // Provide user-friendly error messages
            if (
              errorMessage.includes("NotAllowedError") ||
              errorMessage.includes("cancelled")
            ) {
              setError("Sign in was cancelled. Please try again.");
            } else if (errorMessage.includes("NotSupportedError")) {
              setError(
                "Passkeys are not supported in this browser. Please use a modern browser that supports WebAuthn."
              );
            } else if (errorMessage.includes("InvalidStateError")) {
              setError("No passkey found. Please register first.");
            } else {
              setError(errorMessage);
            }
            setLoading(false);
          },
        }
      );

      // Fallback error handling
      if (result?.error) {
        const errorMessage =
          result.error.message || "Failed to sign in with passkey";
        if (
          errorMessage.includes("NotAllowedError") ||
          errorMessage.includes("cancelled")
        ) {
          setError("Sign in was cancelled. Please try again.");
        } else {
          setError(errorMessage);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error("Passkey sign-in error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  // Check if passkeys are supported (client-side only to avoid hydration mismatch)
  useEffect(() => {
    setIsPasskeySupported(
      typeof window !== "undefined" &&
        typeof window.PublicKeyCredential !== "undefined"
    );

    // Optional: Preload passkeys for Conditional UI (autofill)
    // This enables browser autofill suggestions for passkeys
    if (
      typeof window !== "undefined" &&
      window.PublicKeyCredential &&
      (window.PublicKeyCredential as any).isConditionalMediationAvailable
    ) {
      const checkConditionalUI = async () => {
        try {
          const available = await (
            window.PublicKeyCredential as any
          ).isConditionalMediationAvailable();
          if (available) {
            // Preload passkeys for autofill
            // This will show passkey suggestions in browser autofill
            void authClient.signIn.passkey({ autoFill: true }).catch(() => {
              // Silently fail - this is just for preloading
            });
          }
        } catch {
          // Conditional UI not available - that's okay
        }
      };
      checkConditionalUI();
    }
  }, []);

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Sign In</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {!isPasskeySupported && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded">
          Your browser does not support passkeys. Please use a modern browser
          that supports WebAuthn.
        </div>
      )}

      <div className="space-y-4">
        <button
          type="button"
          onClick={handlePasskeySignIn}
          disabled={loading || !isPasskeySupported}
          className="w-full bg-black text-white py-3 px-4 rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Signing in with passkey...</span>
            </>
          ) : (
            <>
              <span>🔐</span>
              <span>Sign in with Passkey</span>
            </>
          )}
        </button>

        <p className="text-sm text-gray-600 text-center">
          Use your device&apos;s biometric authentication, security key, or
          passkey to sign in.
        </p>
      </div>

      <div className="mt-6 text-center text-sm">
        Don&apos;t have an account?{" "}
        <a href="/auth/registration" className="text-blue-600 hover:underline">
          Sign up
        </a>
      </div>
    </div>
  );
}
