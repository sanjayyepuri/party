"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, authClient, useSession } from "@/lib/auth-client";

export function LoginButton() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(false);
  const [isPasskeySupported, setIsPasskeySupported] = useState(true); // Default to true to avoid hydration mismatch

  // Check if passkeys are supported (client-side only to avoid hydration mismatch)
  useEffect(() => {
    setIsPasskeySupported(
      typeof window !== "undefined" &&
        typeof window.PublicKeyCredential !== "undefined"
    );
  }, []);

  const handleButtonClick = async () => {
    // If user is authenticated, redirect to invitations
    if (session) {
      router.push("/invitations");
      return;
    }

    // If not authenticated, attempt login
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
            // On any error, redirect to login page
            router.push("/auth/login");
          },
        }
      );

      // Fallback error handling
      if (result?.error) {
        // On any error, redirect to login page
        router.push("/auth/login");
      }
    } catch (err) {
      // On any error, redirect to login page
      router.push("/auth/login");
    }
  };

  // Show loading state while session is being determined
  if (isPending) {
    return (
      <button
        type="button"
        disabled
        className="bg-gray-200 text-gray-500 py-3 px-6 rounded cursor-not-allowed flex items-center justify-center gap-2 transition-all"
      >
        <span className="animate-pulse">⋯</span>
        <span>Loading...</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleButtonClick}
      disabled={loading || (!session && !isPasskeySupported)}
      className="bg-black text-white py-3 px-6 rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
    >
      {loading ? (
        <>
          <span className="animate-spin">⏳</span>
          <span>Signing in...</span>
        </>
      ) : session ? (
        <>
          <span>→</span>
          <span>View Invitations</span>
        </>
      ) : (
        <>
          <span>🔐</span>
          <span>Sign in</span>
        </>
      )}
    </button>
  );
}
