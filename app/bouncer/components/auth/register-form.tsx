"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate name and email before proceeding
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    
    if (!trimmedName) {
      setError("Name is required");
      return;
    }
    if (!trimmedEmail) {
      setError("Email is required");
      return;
    }

    setLoading(true);

    try {
      const result = await (signUp as any).passkey(
        {
          name: trimmedName,
          email: trimmedEmail,
          callbackURL: "/invitations",
        },
        {
          onRequest: () => {
            // Request started - browser will show passkey creation prompt
          },
          onSuccess: () => {
            // Success - redirect will be handled by callbackURL
            router.push("/invitations");
            router.refresh();
          },
          onError: (ctx: { error?: { message?: string } }) => {
            const errorMessage = ctx.error?.message || "Failed to create account with passkey";
            
            // Provide user-friendly error messages
            if (errorMessage.includes("NotAllowedError") || errorMessage.includes("cancelled")) {
              setError("Passkey creation was cancelled. Please try again.");
            } else if (errorMessage.includes("NotSupportedError")) {
              setError("Passkeys are not supported in this browser. Please use a modern browser that supports WebAuthn.");
            } else if (errorMessage.includes("InvalidStateError")) {
              setError("A passkey already exists for this account.");
            } else {
              setError(errorMessage);
            }
            setLoading(false);
          },
        }
      );

      // Fallback error handling
      if (result?.error) {
        const errorMessage = result.error.message || "Failed to create account with passkey";
        if (errorMessage.includes("NotAllowedError") || errorMessage.includes("cancelled")) {
          setError("Passkey creation was cancelled. Please try again.");
        } else {
          setError(errorMessage);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error("Passkey registration error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  // Check if passkeys are supported
  const isPasskeySupported = typeof window !== "undefined" && 
    typeof window.PublicKeyCredential !== "undefined";

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Create Account</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {!isPasskeySupported && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded">
          Your browser does not support passkeys. Please use a modern browser that supports WebAuthn.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !isPasskeySupported}
          className="w-full bg-black text-white py-3 px-4 rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Creating passkey...</span>
            </>
          ) : (
            <>
              <span>🔐</span>
              <span>Create Account with Passkey</span>
            </>
          )}
        </button>

        <p className="text-sm text-gray-600 text-center">
          You&apos;ll be prompted to create a passkey using your device&apos;s biometric authentication or security key.
        </p>
      </form>

      <div className="mt-6 text-center text-sm">
        Already have an account?{" "}
        <a href="/auth/login" className="text-blue-600 hover:underline">
          Sign in
        </a>
      </div>
    </div>
  );
}
