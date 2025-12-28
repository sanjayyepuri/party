/**
 * WebAuthn Utility Functions
 *
 * Pure, functional utilities for WebAuthn (passkey) operations.
 * All functions in this module are:
 * - Side-effect free (except I/O operations clearly marked)
 * - Deterministic (same input → same output)
 * - Composable
 * - Fully typed
 *
 * Design Philosophy:
 * This module follows functional programming principles to ensure
 * predictability, testability, and maintainability. Each function
 * does one thing well and can be composed with others.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * WebAuthn support profile
 *
 * Describes the capabilities of the current browser/device
 */
export interface WebAuthnSupport {
  /** Whether basic WebAuthn API is available */
  supported: boolean;

  /** Whether conditional UI (autofill) is supported */
  conditionalUISupported: boolean;

  /** Whether platform authenticator is available (Touch ID, Face ID, etc.) */
  platformAuthenticatorAvailable: boolean;

  /** Error message if support check failed */
  error?: string;
}

/**
 * WebAuthn error types
 *
 * Discriminated union for type-safe error handling
 */
export type WebAuthnError =
  | { type: "NotAllowedError"; message: string }
  | { type: "InvalidStateError"; message: string }
  | { type: "NotSupportedError"; message: string }
  | { type: "SecurityError"; message: string }
  | { type: "AbortError"; message: string }
  | { type: "ConstraintError"; message: string }
  | { type: "UnknownError"; message: string };

// ============================================================================
// Browser Capability Detection
// ============================================================================

/**
 * Check if WebAuthn is supported in current browser
 *
 * Pure function (I/O): Reads browser capabilities
 *
 * Checks for:
 * 1. PublicKeyCredential API availability
 * 2. Conditional UI / autofill support
 * 3. Platform authenticator availability
 *
 * @returns Promise resolving to support profile
 *
 * @example
 * const support = await checkWebAuthnSupport();
 * if (support.supported) {
 *   // Show passkey UI
 * } else {
 *   // Fallback to magic link
 * }
 */
export async function checkWebAuthnSupport(): Promise<WebAuthnSupport> {
  // Check basic API availability
  const supported = !!(
    typeof window !== "undefined" &&
    window.PublicKeyCredential &&
    typeof navigator?.credentials?.create === "function" &&
    typeof navigator?.credentials?.get === "function"
  );

  if (!supported) {
    return {
      supported: false,
      conditionalUISupported: false,
      platformAuthenticatorAvailable: false,
      error: "WebAuthn not supported in this browser",
    };
  }

  // Check conditional UI (autofill) support
  let conditionalUISupported = false;
  try {
    if (PublicKeyCredential.isConditionalMediationAvailable) {
      conditionalUISupported = await PublicKeyCredential.isConditionalMediationAvailable();
    }
  } catch (error) {
    console.warn("Conditional UI check failed:", error);
    // Not a fatal error - browser just doesn't support autofill
  }

  // Check platform authenticator availability
  let platformAuthenticatorAvailable = false;
  try {
    if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      platformAuthenticatorAvailable =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch (error) {
    console.warn("Platform authenticator check failed:", error);
    // Not a fatal error - user might still have USB keys
  }

  return {
    supported: true,
    conditionalUISupported,
    platformAuthenticatorAvailable,
  };
}

/**
 * Check if conditional UI (autofill) is supported
 *
 * Pure function (I/O): Queries browser capability
 *
 * Conditional UI allows passkeys to appear in browser autofill dropdown,
 * providing seamless authentication without explicit button clicks.
 *
 * Supported in:
 * - Chrome/Edge 119+
 * - Safari 17+ (iOS and macOS)
 * - Not yet in Firefox (as of 122)
 *
 * @returns Promise resolving to boolean
 */
export async function isConditionalUISupported(): Promise<boolean> {
  try {
    if (
      typeof window === "undefined" ||
      !window.PublicKeyCredential ||
      !PublicKeyCredential.isConditionalMediationAvailable
    ) {
      return false;
    }
    return await PublicKeyCredential.isConditionalMediationAvailable();
  } catch {
    return false;
  }
}

/**
 * Check if platform authenticator is available
 *
 * Pure function (I/O): Queries browser capability
 *
 * Platform authenticators are built into the device:
 * - iOS/macOS: Touch ID, Face ID (Secure Enclave)
 * - Windows: Windows Hello (TPM, facial recognition, fingerprint)
 * - Android: Fingerprint, face unlock
 *
 * @returns Promise resolving to boolean
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  try {
    if (
      typeof window === "undefined" ||
      !window.PublicKeyCredential ||
      !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
    ) {
      return false;
    }
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Error name to user-friendly message mapping
 *
 * Pure data structure for error messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  NotAllowedError:
    "Authentication was cancelled or timed out. Please try again.",

  InvalidStateError:
    "This passkey is already registered for your account. Try using a different device or sign in instead.",

  NotSupportedError:
    "Your browser doesn't support passkeys. Please use a modern browser or sign in with email.",

  SecurityError:
    "Passkeys can only be used on secure (HTTPS) connections. If you're testing locally, use localhost instead of an IP address.",

  AbortError:
    "Authentication request was aborted. Please try again.",

  ConstraintError:
    "No suitable authenticator found. This might happen if you don't have a compatible biometric device. Try using email sign-in instead.",

  UnknownError:
    "An unexpected error occurred. Please try again or use email sign-in.",
};

/**
 * Map WebAuthn error to user-friendly message
 *
 * Pure function: Same error name always produces same message
 *
 * This function provides clear, actionable error messages for users
 * instead of technical jargon from the WebAuthn API.
 *
 * @param error Error object from WebAuthn API
 * @returns User-friendly error message
 *
 * @example
 * try {
 *   await navigator.credentials.create(...);
 * } catch (error) {
 *   const message = getWebAuthnErrorMessage(error);
 *   alert(message); // "Authentication was cancelled..."
 * }
 */
export function getWebAuthnErrorMessage(error: Error): string {
  const errorName = error.name;
  return ERROR_MESSAGES[errorName] || ERROR_MESSAGES.UnknownError;
}

/**
 * Categorize WebAuthn error for type-safe handling
 *
 * Pure function: Same error always produces same categorization
 *
 * Converts Error objects into discriminated union types
 * for type-safe error handling in TypeScript.
 *
 * @param error Error object from WebAuthn API
 * @returns Categorized error with type and message
 *
 * @example
 * const error = categorizeWebAuthnError(err);
 * switch (error.type) {
 *   case "NotAllowedError":
 *     // Handle cancellation
 *     break;
 *   case "SecurityError":
 *     // Show HTTPS warning
 *     break;
 * }
 */
export function categorizeWebAuthnError(error: Error): WebAuthnError {
  const validTypes: WebAuthnError["type"][] = [
    "NotAllowedError",
    "InvalidStateError",
    "NotSupportedError",
    "SecurityError",
    "AbortError",
    "ConstraintError",
  ];

  const errorType = validTypes.includes(error.name as WebAuthnError["type"])
    ? (error.name as WebAuthnError["type"])
    : "UnknownError";

  return {
    type: errorType,
    message: getWebAuthnErrorMessage(error),
  };
}

// ============================================================================
// Naming Utilities
// ============================================================================

/**
 * Generate human-readable passkey name
 *
 * Pure function: Same inputs always produce same output
 *
 * Creates descriptive names for passkeys based on device information.
 * Helps users identify which passkey they're using.
 *
 * @param customName Optional custom name from user
 * @param platform Navigator platform (default: navigator.platform)
 * @returns Formatted passkey name
 *
 * @example
 * formatPasskeyName() // "Mac - Dec 28, 2025"
 * formatPasskeyName("My Work Laptop") // "My Work Laptop"
 * formatPasskeyName(undefined, "Win32") // "Windows PC - Dec 28, 2025"
 */
export function formatPasskeyName(
  customName?: string,
  platform: string = typeof navigator !== "undefined" ? navigator.platform : "Unknown"
): string {
  // Use custom name if provided
  if (customName) {
    return customName;
  }

  // Map platform identifiers to friendly names
  const platformMap: Record<string, string> = {
    MacIntel: "Mac",
    "MacIntel (Apple Silicon)": "Mac",
    Win32: "Windows PC",
    Linux: "Linux PC",
    iPhone: "iPhone",
    iPad: "iPad",
    "Linux armv7l": "Android", // Android Chrome reports as Linux
    "Linux aarch64": "Android",
  };

  const deviceName = platformMap[platform] || "Device";

  // Format current date
  const date = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${deviceName} - ${date}`;
}

// ============================================================================
// Authentication Method Selection
// ============================================================================

/**
 * Available authentication methods
 *
 * Type-safe enumeration of auth methods
 */
export type AuthMethod =
  | "passkey-autofill" // Best: Passkey with conditional UI
  | "passkey-manual" // Good: Passkey with manual trigger
  | "magic-link"; // Fallback: Email-based authentication

/**
 * Select best authentication method based on browser capabilities
 *
 * Pure function: Same support profile always produces same method
 *
 * Decision tree:
 * 1. Passkey + conditional UI (best UX)
 * 2. Passkey + manual button (good UX)
 * 3. Magic link only (fallback)
 *
 * @param support WebAuthn support profile
 * @returns Recommended authentication method
 *
 * @example
 * const support = await checkWebAuthnSupport();
 * const method = selectAuthMethod(support);
 *
 * switch (method) {
 *   case "passkey-autofill":
 *     // Show email field with autofill
 *     break;
 *   case "passkey-manual":
 *     // Show passkey button
 *     break;
 *   case "magic-link":
 *     // Show email-only form
 *     break;
 * }
 */
export function selectAuthMethod(support: WebAuthnSupport): AuthMethod {
  if (!support.supported) {
    return "magic-link";
  }

  if (support.conditionalUISupported) {
    return "passkey-autofill";
  }

  return "passkey-manual";
}

// ============================================================================
// Browser Detection
// ============================================================================

/**
 * Detect browser name and version
 *
 * Pure function: Same user agent always produces same result
 *
 * Useful for analytics and debugging browser-specific issues.
 *
 * @param userAgent Navigator user agent (default: navigator.userAgent)
 * @returns Browser name and version
 *
 * @example
 * const browser = detectBrowser();
 * console.log(browser); // { name: "Chrome", version: "119" }
 */
export function detectBrowser(
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : ""
): { name: string; version: string } {
  // Chrome and Chromium-based browsers
  if (userAgent.includes("Chrome")) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    return { name: "Chrome", version: match?.[1] || "unknown" };
  }

  // Safari
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    const match = userAgent.match(/Version\/(\d+)/);
    return { name: "Safari", version: match?.[1] || "unknown" };
  }

  // Firefox
  if (userAgent.includes("Firefox")) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    return { name: "Firefox", version: match?.[1] || "unknown" };
  }

  // Edge
  if (userAgent.includes("Edg/")) {
    const match = userAgent.match(/Edg\/(\d+)/);
    return { name: "Edge", version: match?.[1] || "unknown" };
  }

  return { name: "Unknown", version: "unknown" };
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Check if browser meets minimum requirements for passkeys
 *
 * Pure function: Same browser data always produces same result
 *
 * Minimum requirements:
 * - Chrome/Edge 67+ (basic WebAuthn)
 * - Safari 14+ (basic WebAuthn)
 * - Firefox 60+ (basic WebAuthn)
 * - Chrome/Edge 119+ (conditional UI)
 * - Safari 16+ (conditional UI)
 *
 * @param browser Browser detection result
 * @returns Whether browser meets minimum requirements
 */
export function meetsMinimumRequirements(browser: {
  name: string;
  version: string;
}): boolean {
  const version = parseInt(browser.version, 10);

  if (isNaN(version)) {
    return false;
  }

  const minimumVersions: Record<string, number> = {
    Chrome: 67,
    Edge: 79, // Chromium-based Edge
    Safari: 14,
    Firefox: 60,
  };

  const minVersion = minimumVersions[browser.name];
  return minVersion ? version >= minVersion : false;
}

/**
 * Check if browser supports conditional UI
 *
 * Pure function: Same browser data always produces same result
 *
 * @param browser Browser detection result
 * @returns Whether conditional UI is likely supported
 */
export function supportsConditionalUI(browser: {
  name: string;
  version: string;
}): boolean {
  const version = parseInt(browser.version, 10);

  if (isNaN(version)) {
    return false;
  }

  // Chrome/Edge 119+, Safari 17+
  if ((browser.name === "Chrome" || browser.name === "Edge") && version >= 119) {
    return true;
  }

  if (browser.name === "Safari" && version >= 17) {
    return true;
  }

  return false;
}
