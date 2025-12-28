/**
 * WebAuthn React Hooks
 *
 * Custom React hooks for managing WebAuthn state in components.
 * These hooks encapsulate common patterns and provide reactive state
 * management for passkey authentication.
 *
 * Design Philosophy:
 * - Hooks manage side effects and state
 * - Utilities remain pure functions
 * - Separation of concerns: hooks compose utilities
 */

"use client";

import { useState, useEffect } from "react";
import {
  checkWebAuthnSupport,
  isConditionalUISupported,
  isPlatformAuthenticatorAvailable,
  type WebAuthnSupport,
} from "../webauthn-utils";

// ============================================================================
// WebAuthn Support Hook
// ============================================================================

/**
 * Hook to check WebAuthn browser support
 *
 * Performs capability detection on mount and provides reactive state.
 * This hook runs asynchronous checks and updates state when complete.
 *
 * @returns Support profile and loading state
 *
 * @example
 * function MyComponent() {
 *   const { support, loading } = useWebAuthnSupport();
 *
 *   if (loading) return <div>Checking passkey support...</div>;
 *
 *   if (!support?.supported) {
 *     return <div>Use email sign-in instead</div>;
 *   }
 *
 *   return <div>Passkey sign-in available!</div>;
 * }
 */
export function useWebAuthnSupport() {
  const [support, setSupport] = useState<WebAuthnSupport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function detectSupport() {
      try {
        const result = await checkWebAuthnSupport();

        // Only update state if effect hasn't been cleaned up
        if (!cancelled) {
          setSupport(result);
        }
      } catch (error) {
        console.error("Failed to check WebAuthn support:", error);

        if (!cancelled) {
          setSupport({
            supported: false,
            conditionalUISupported: false,
            platformAuthenticatorAvailable: false,
            error: "Failed to check browser support",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    detectSupport();

    // Cleanup: prevent state updates after unmount
    return () => {
      cancelled = true;
    };
  }, []); // Run once on mount

  return { support, loading };
}

// ============================================================================
// Conditional UI Support Hook
// ============================================================================

/**
 * Hook to check conditional UI (autofill) support
 *
 * Lighter weight than useWebAuthnSupport - only checks autofill capability.
 * Useful when you already know WebAuthn is supported and just need to know
 * if you can enable autofill.
 *
 * @returns Whether conditional UI is supported and loading state
 *
 * @example
 * function LoginForm() {
 *   const { supported, loading } = useConditionalUISupport();
 *
 *   if (!loading && supported) {
 *     // Add autoComplete="username webauthn" to input
 *     // Initiate conditional mediation
 *   }
 * }
 */
export function useConditionalUISupport() {
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkSupport() {
      try {
        const result = await isConditionalUISupported();

        if (!cancelled) {
          setSupported(result);
        }
      } catch (error) {
        console.error("Failed to check conditional UI support:", error);

        if (!cancelled) {
          setSupported(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    checkSupport();

    return () => {
      cancelled = true;
    };
  }, []);

  return { supported, loading };
}

// ============================================================================
// Platform Authenticator Hook
// ============================================================================

/**
 * Hook to check platform authenticator availability
 *
 * Checks if built-in biometric authenticator (Touch ID, Face ID, Windows Hello)
 * is available on the current device.
 *
 * @returns Whether platform authenticator is available and loading state
 *
 * @example
 * function SetupPasskeyPage() {
 *   const { available, loading } = usePlatformAuthenticator();
 *
 *   if (loading) return <Loading />;
 *
 *   if (!available) {
 *     return <div>No biometric authenticator found. Try using a USB security key.</div>;
 *   }
 *
 *   return <div>Set up Touch ID / Face ID for quick sign-in</div>;
 * }
 */
export function usePlatformAuthenticator() {
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkAvailability() {
      try {
        const result = await isPlatformAuthenticatorAvailable();

        if (!cancelled) {
          setAvailable(result);
        }
      } catch (error) {
        console.error("Failed to check platform authenticator:", error);

        if (!cancelled) {
          setAvailable(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    checkAvailability();

    return () => {
      cancelled = true;
    };
  }, []);

  return { available, loading };
}

// ============================================================================
// Combined Support Hook (Convenience)
// ============================================================================

/**
 * Combined hook for complete WebAuthn capability detection
 *
 * Convenience hook that provides all capability information at once.
 * Use this when you need comprehensive capability data.
 *
 * @returns Complete capability profile
 *
 * @example
 * function AuthPage() {
 *   const capabilities = useWebAuthnCapabilities();
 *
 *   if (capabilities.loading) {
 *     return <LoadingScreen />;
 *   }
 *
 *   return (
 *     <div>
 *       <p>WebAuthn: {capabilities.webauthn ? "Yes" : "No"}</p>
 *       <p>Autofill: {capabilities.conditionalUI ? "Yes" : "No"}</p>
 *       <p>Biometric: {capabilities.platformAuthenticator ? "Yes" : "No"}</p>
 *     </div>
 *   );
 * }
 */
export function useWebAuthnCapabilities() {
  const { support: webauthnSupport, loading: webauthnLoading } = useWebAuthnSupport();
  const { supported: conditionalUI, loading: conditionalUILoading } = useConditionalUISupport();
  const { available: platformAuthenticator, loading: platformLoading } =
    usePlatformAuthenticator();

  const loading = webauthnLoading || conditionalUILoading || platformLoading;

  return {
    loading,
    webauthn: webauthnSupport?.supported ?? false,
    conditionalUI,
    platformAuthenticator,
    error: webauthnSupport?.error,
  };
}
