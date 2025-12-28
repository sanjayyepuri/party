/**
 * WebAuthn Type Definitions
 *
 * Type-safe abstractions for WebAuthn/Passkey authentication.
 * These types model the domain of passwordless authentication,
 * providing compile-time guarantees and excellent IDE support.
 *
 * Design Philosophy:
 * - Algebraic data types for error handling
 * - Discriminated unions for type safety
 * - Precise types mirror WebAuthn spec
 * - No runtime dependencies (pure types)
 *
 * References:
 * - W3C WebAuthn Level 3: https://w3c.github.io/webauthn/
 * - Better Auth Passkey Plugin: https://better-auth.com/docs/plugins/passkey
 */

// ============================================================================
// Browser Capability Types
// ============================================================================

/**
 * WebAuthn Support Profile
 *
 * Comprehensive browser capability detection result.
 * This type aggregates all WebAuthn-related capabilities
 * to enable progressive enhancement.
 *
 * Usage:
 * ```typescript
 * const support = await checkWebAuthnSupport();
 * if (support.conditionalUISupported) {
 *   // Enable autofill experience
 * } else if (support.supported) {
 *   // Enable manual passkey trigger
 * } else {
 *   // Fallback to magic link
 * }
 * ```
 */
export type WebAuthnSupport = {
  /**
   * Core WebAuthn API availability
   * True if PublicKeyCredential is defined
   */
  supported: boolean;

  /**
   * Conditional UI (autofill) support
   * True if browser supports mediation: "conditional"
   * Requires Chrome 119+, Safari 17+, or Edge 119+
   */
  conditionalUISupported: boolean;

  /**
   * Platform authenticator availability
   * True if built-in biometric (Touch ID, Face ID, Windows Hello) exists
   * Does not guarantee user has enrolled biometric
   */
  platformAuthenticatorAvailable: boolean;

  /**
   * Error message if capability detection failed
   * Undefined if detection succeeded
   */
  error?: string;
};

/**
 * Authentication Method Selection
 *
 * Discriminated union of available auth methods.
 * Used for progressive enhancement strategy.
 */
export type AuthMethod =
  | "passkey-conditional" // Best: Autofill with passkey
  | "passkey-manual" // Good: Manual passkey trigger
  | "magic-link"; // Fallback: Email link

// ============================================================================
// WebAuthn Error Types
// ============================================================================

/**
 * WebAuthn Error Categories
 *
 * Algebraic data type for WebAuthn errors.
 * Discriminated union enables exhaustive pattern matching.
 *
 * Each variant represents a specific error condition
 * with semantic meaning for error handling.
 *
 * Design: Sum type (OR relationship between variants)
 */
export type WebAuthnError =
  /**
   * User cancelled or timeout occurred
   * - User dismissed browser prompt
   * - User cancelled biometric scan
   * - Request timeout (default 60s)
   */
  | { type: "NotAllowedError"; message: string }

  /**
   * Credential already registered
   * - Attempting to register duplicate passkey
   * - Same authenticator used twice
   */
  | { type: "InvalidStateError"; message: string }

  /**
   * Browser doesn't support WebAuthn
   * - Missing PublicKeyCredential API
   * - Insecure context (non-HTTPS)
   */
  | { type: "NotSupportedError"; message: string }

  /**
   * Security policy violation
   * - RP ID mismatch
   * - Origin not allowed
   * - User verification failed
   */
  | { type: "SecurityError"; message: string }

  /**
   * Operation aborted by user agent
   * - User navigated away
   * - Component unmounted
   */
  | { type: "AbortError"; message: string }

  /**
   * Unknown or unexpected error
   * - Network errors
   * - Server errors
   * - Uncategorized errors
   */
  | { type: "UnknownError"; message: string };

/**
 * Error Type Guard
 *
 * Type predicate for narrowing error types.
 *
 * @example
 * ```typescript
 * if (isWebAuthnError(error, "NotAllowedError")) {
 *   // TypeScript knows error.type === "NotAllowedError"
 *   console.log("User cancelled:", error.message);
 * }
 * ```
 */
export function isWebAuthnError(
  error: WebAuthnError,
  type: WebAuthnError["type"]
): error is Extract<WebAuthnError, { type: typeof type }> {
  return error.type === type;
}

// ============================================================================
// Passkey Data Types
// ============================================================================

/**
 * Passkey Database Record
 *
 * Mirrors the passkey table schema.
 * Product type (AND relationship between fields).
 *
 * This type represents the server's view of a passkey credential.
 * It contains public key data and metadata, but never the private key
 * (which stays on the authenticator device).
 */
export type Passkey = {
  /**
   * Unique identifier (UUID or random string)
   * Primary key in database
   */
  id: string;

  /**
   * User-friendly name for the passkey
   * Examples: "MacBook Pro Touch ID", "iPhone Face ID"
   * Null if user didn't provide custom name
   */
  name: string | null;

  /**
   * Credential identifier (Base64URL-encoded)
   * This is the credentialId from WebAuthn
   * Unique across all passkeys
   */
  credentialID: string;

  /**
   * Public key (COSE_Key format, Base64URL-encoded)
   * Used to verify authentication signatures
   * Corresponds to private key on authenticator
   */
  publicKey: string;

  /**
   * Signature counter
   * Increments with each authentication
   * Used to detect cloned authenticators
   * Must strictly increase (or stay at 0 for security keys)
   */
  counter: number;

  /**
   * Authenticator type
   * - "platform": Built-in biometric (Touch ID, Face ID, Windows Hello)
   * - "cross-platform": External security key (USB, NFC, BLE)
   */
  deviceType: "platform" | "cross-platform";

  /**
   * Backup eligibility flag
   * True if credential is backed up to cloud
   * Examples: iCloud Keychain, Google Password Manager
   */
  backedUp: boolean;

  /**
   * Supported transports (comma-separated)
   * Examples: "internal", "usb", "nfc", "ble"
   * Null if not provided by authenticator
   */
  transports: string | null;

  /**
   * Authenticator Attestation GUID
   * Identifies authenticator model
   * Used for allowlist/denylist policies
   * Null if attestation was "none"
   */
  aaguid: string | null;

  /**
   * Creation timestamp
   * ISO 8601 format from PostgreSQL
   */
  createdAt: string;

  /**
   * User ID foreign key
   * References user table
   */
  userId: string;
};

/**
 * Passkey Creation Input
 *
 * Data required to register a new passkey.
 * Minimal subset of Passkey type.
 */
export type PasskeyCreateInput = {
  /**
   * Optional custom name
   * Auto-generated if not provided
   */
  name?: string;
};

/**
 * Passkey List Item
 *
 * Lightweight view for listing user's passkeys.
 * Omits sensitive fields like publicKey.
 */
export type PasskeyListItem = Pick<
  Passkey,
  "id" | "name" | "deviceType" | "backedUp" | "createdAt"
>;

// ============================================================================
// WebAuthn Registration Types (Attestation Flow)
// ============================================================================

/**
 * Registration Options
 *
 * Server-generated parameters for credential creation.
 * Sent to client before navigator.credentials.create().
 */
export type RegistrationOptions = {
  /**
   * Random challenge (Base64URL-encoded)
   * Prevents replay attacks
   * Must be cryptographically random (≥16 bytes)
   */
  challenge: string;

  /**
   * Relying Party information
   */
  rp: {
    /** RP identifier (domain) */
    id: string;
    /** Human-readable name */
    name: string;
  };

  /**
   * User information
   */
  user: {
    /** User ID (must be unique, ≤64 bytes) */
    id: string;
    /** Display name */
    name: string;
    /** Email or username */
    displayName: string;
  };

  /**
   * Supported public key algorithms (COSE algorithm IDs)
   * Preference order matters
   * Common values:
   * - -7: ES256 (ECDSA with SHA-256)
   * - -8: EdDSA
   * - -257: RS256 (RSASSA-PKCS1-v1_5 with SHA-256)
   */
  pubKeyCredParams: Array<{ type: "public-key"; alg: number }>;

  /**
   * Timeout in milliseconds
   * How long user has to complete registration
   */
  timeout?: number;

  /**
   * Authenticator selection criteria
   */
  authenticatorSelection?: {
    /** Prefer platform or cross-platform authenticators */
    authenticatorAttachment?: "platform" | "cross-platform";
    /** Resident key requirement */
    residentKey?: "discouraged" | "preferred" | "required";
    /** User verification requirement */
    userVerification?: "discouraged" | "preferred" | "required";
  };

  /**
   * Attestation conveyance preference
   * - "none": No attestation (privacy-preserving)
   * - "indirect": Anonymized attestation
   * - "direct": Full attestation with AAGUID
   */
  attestation?: "none" | "indirect" | "direct";

  /**
   * Existing credentials to exclude
   * Prevents duplicate registration
   */
  excludeCredentials?: Array<{
    type: "public-key";
    id: string;
    transports?: Array<"usb" | "nfc" | "ble" | "internal">;
  }>;
};

/**
 * Registration Response
 *
 * Client-generated attestation data.
 * Sent to server for verification and storage.
 */
export type RegistrationResponse = {
  /**
   * Credential ID (Base64URL)
   * Unique identifier for this credential
   */
  id: string;

  /**
   * Raw credential ID (ArrayBuffer, Base64URL-encoded)
   */
  rawId: string;

  /**
   * Response data
   */
  response: {
    /**
     * Client data JSON (Base64URL)
     * Contains challenge, origin, type
     */
    clientDataJSON: string;

    /**
     * Attestation object (Base64URL)
     * Contains authenticator data, attestation statement
     */
    attestationObject: string;

    /**
     * Supported transports
     */
    transports?: Array<"usb" | "nfc" | "ble" | "internal">;
  };

  /**
   * Credential type (always "public-key")
   */
  type: "public-key";
};

// ============================================================================
// WebAuthn Authentication Types (Assertion Flow)
// ============================================================================

/**
 * Authentication Options
 *
 * Server-generated parameters for authentication.
 * Sent to client before navigator.credentials.get().
 */
export type AuthenticationOptions = {
  /**
   * Random challenge (Base64URL-encoded)
   * Prevents replay attacks
   */
  challenge: string;

  /**
   * Timeout in milliseconds
   */
  timeout?: number;

  /**
   * Relying Party ID
   * Must match registration RP ID
   */
  rpId?: string;

  /**
   * Allowed credentials
   * If empty, user agent selects from all credentials
   */
  allowCredentials?: Array<{
    type: "public-key";
    id: string;
    transports?: Array<"usb" | "nfc" | "ble" | "internal">;
  }>;

  /**
   * User verification requirement
   */
  userVerification?: "discouraged" | "preferred" | "required";
};

/**
 * Authentication Response
 *
 * Client-generated assertion data.
 * Sent to server for signature verification.
 */
export type AuthenticationResponse = {
  /**
   * Credential ID used for authentication
   */
  id: string;

  /**
   * Raw credential ID
   */
  rawId: string;

  /**
   * Response data
   */
  response: {
    /**
     * Client data JSON (Base64URL)
     */
    clientDataJSON: string;

    /**
     * Authenticator data (Base64URL)
     * Contains RP ID hash, flags, counter
     */
    authenticatorData: string;

    /**
     * Signature (Base64URL)
     * Signed over authData + clientDataHash
     */
    signature: string;

    /**
     * User handle (Base64URL)
     * User ID from registration
     */
    userHandle?: string;
  };

  /**
   * Credential type
   */
  type: "public-key";
};

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Browser Platform Detection
 *
 * Detected operating system/platform.
 */
export type Platform =
  | "macOS"
  | "iOS"
  | "Windows"
  | "Android"
  | "Linux"
  | "Unknown";

/**
 * Browser Type Detection
 */
export type BrowserType =
  | "Chrome"
  | "Safari"
  | "Firefox"
  | "Edge"
  | "Opera"
  | "Unknown";

/**
 * Browser Info
 *
 * Combined browser and platform detection.
 */
export type BrowserInfo = {
  browser: BrowserType;
  platform: Platform;
  version?: string;
};

// ============================================================================
// Type Guards and Utility Functions
// ============================================================================
// All type exports are inline with their definitions above
