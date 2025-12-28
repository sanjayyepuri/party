/**
 * Authentication Type Definitions
 *
 * Type-safe abstractions for the authentication system.
 * These types model users, sessions, and authentication flows.
 *
 * Design Philosophy:
 * - Algebraic data types for exhaustive pattern matching
 * - Minimal types that compose well
 * - Clear separation: domain types vs API types
 * - Type predicates for runtime type narrowing
 *
 * Architecture:
 * - Better Auth manages sessions and users
 * - Magic links for initial registration
 * - Passkeys for biometric authentication
 * - No passwords stored anywhere
 */

// ============================================================================
// User Types
// ============================================================================

/**
 * User Record
 *
 * Core user data from Better Auth.
 * This represents an authenticated user account.
 *
 * Design: Product type (all fields must be present)
 */
export type User = {
  /**
   * Unique user identifier
   * Used as foreign key in related tables
   */
  id: string;

  /**
   * User's full name
   * Collected during registration
   */
  name: string;

  /**
   * User's email address
   * Primary identifier for magic links
   * Must be unique across all users
   */
  email: string;

  /**
   * Email verification status
   * True after clicking magic link
   */
  emailVerified: boolean;

  /**
   * Profile image URL
   * Optional, may be null
   */
  image?: string | null;

  /**
   * Account creation timestamp
   * ISO 8601 format
   */
  createdAt: string;

  /**
   * Last update timestamp
   * ISO 8601 format
   */
  updatedAt: string;
};

/**
 * User Profile
 *
 * Public-facing user data.
 * Subset of User type with sensitive fields removed.
 */
export type UserProfile = Pick<User, "id" | "name" | "email" | "image">;

/**
 * User Registration Input
 *
 * Data required to create a new user account.
 */
export type UserRegistrationInput = {
  /**
   * User's full name
   * Minimum 2 characters
   */
  name: string;

  /**
   * User's email address
   * Must be valid email format
   */
  email: string;
};

// ============================================================================
// Session Types
// ============================================================================

/**
 * Session Record
 *
 * Active authentication session.
 * Created after successful login (passkey or magic link).
 *
 * Design: Sessions are ephemeral and revocable.
 */
export type Session = {
  /**
   * Session identifier
   * Used in session cookies
   */
  id: string;

  /**
   * Associated user ID
   */
  userId: string;

  /**
   * User data embedded in session
   * Denormalized for performance
   */
  user: User;

  /**
   * Session creation time
   */
  createdAt: string;

  /**
   * Session expiration time
   * After this time, session is invalid
   */
  expiresAt: string;

  /**
   * IP address of session creation
   * For audit logs
   */
  ipAddress?: string;

  /**
   * User agent string
   * For device identification
   */
  userAgent?: string;
};

/**
 * Session State
 *
 * Discriminated union for session loading states.
 * Enables exhaustive pattern matching in components.
 *
 * @example
 * ```typescript
 * function renderContent(state: SessionState) {
 *   switch (state.type) {
 *     case "loading":
 *       return <Spinner />;
 *     case "authenticated":
 *       return <Dashboard user={state.session.user} />;
 *     case "unauthenticated":
 *       return <LoginPrompt />;
 *   }
 * }
 * ```
 */
export type SessionState =
  | { type: "loading" }
  | { type: "authenticated"; session: Session }
  | { type: "unauthenticated" };

/**
 * Type guard for authenticated sessions
 */
export function isAuthenticated(
  state: SessionState
): state is Extract<SessionState, { type: "authenticated" }> {
  return state.type === "authenticated";
}

// ============================================================================
// Magic Link Types
// ============================================================================

/**
 * Magic Link Send Request
 *
 * Parameters for sending a magic link email.
 */
export type MagicLinkSendRequest = {
  /**
   * Recipient email address
   */
  email: string;

  /**
   * Redirect URL after verification
   * Defaults to /invitations
   */
  callbackURL?: string;

  /**
   * Additional user data for registration
   * Only used if creating new account
   */
  data?: {
    name?: string;
  };
};

/**
 * Magic Link Verification Token
 *
 * Server-generated one-time token.
 * Sent in email, verified on callback.
 */
export type MagicLinkToken = {
  /**
   * Token value (random string)
   * Should be cryptographically random
   */
  token: string;

  /**
   * Associated email address
   */
  email: string;

  /**
   * Expiration timestamp
   * Typically 5 minutes from creation
   */
  expiresAt: string;

  /**
   * Whether token has been used
   * Tokens are single-use
   */
  used: boolean;
};

// ============================================================================
// Authentication Flow Types
// ============================================================================

/**
 * Authentication Method
 *
 * Discriminated union of available auth methods.
 */
export type AuthenticationMethod =
  | { type: "passkey"; credentialId: string }
  | { type: "magic-link"; email: string };

/**
 * Authentication Result
 *
 * Result of authentication attempt.
 * Sum type for success/failure cases.
 */
export type AuthenticationResult =
  | { success: true; session: Session }
  | { success: false; error: AuthenticationError };

/**
 * Authentication Error
 *
 * Categorized authentication failures.
 */
export type AuthenticationError =
  | { type: "invalid-credentials"; message: string }
  | { type: "expired-token"; message: string }
  | { type: "user-not-found"; message: string }
  | { type: "email-not-verified"; message: string }
  | { type: "rate-limited"; message: string }
  | { type: "unknown"; message: string };

/**
 * Type guard for successful authentication
 */
export function isAuthSuccess(
  result: AuthenticationResult
): result is Extract<AuthenticationResult, { success: true }> {
  return result.success === true;
}

// ============================================================================
// Registration Flow Types
// ============================================================================

/**
 * Registration Result
 *
 * Result of registration attempt.
 */
export type RegistrationResult =
  | { success: true; user: User; redirectUrl: string }
  | { success: false; error: RegistrationError };

/**
 * Registration Error
 *
 * Categorized registration failures.
 */
export type RegistrationError =
  | { type: "email-exists"; message: string }
  | { type: "invalid-email"; message: string }
  | { type: "invalid-name"; message: string }
  | { type: "rate-limited"; message: string }
  | { type: "unknown"; message: string };

/**
 * Type guard for successful registration
 */
export function isRegistrationSuccess(
  result: RegistrationResult
): result is Extract<RegistrationResult, { success: true }> {
  return result.success === true;
}

// ============================================================================
// Email Types
// ============================================================================

/**
 * Email Template Type
 *
 * Available email templates.
 */
export type EmailTemplate =
  | "magic-link-login"
  | "magic-link-registration"
  | "email-verification";

/**
 * Email Send Parameters
 *
 * Generic email sending parameters.
 */
export type EmailParams = {
  /**
   * Recipient email address
   */
  to: string;

  /**
   * Email subject line
   */
  subject: string;

  /**
   * HTML email body
   */
  html: string;

  /**
   * Plain text fallback
   * Optional but recommended
   */
  text?: string;
};

/**
 * Email Send Result
 *
 * Result of email sending operation.
 */
export type EmailSendResult =
  | { success: true; messageId: string }
  | { success: false; error: string };

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Generic API Response
 *
 * Standard response wrapper for API endpoints.
 * Provides consistent error handling.
 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

/**
 * API Error
 *
 * Standardized API error format.
 */
export type ApiError = {
  /**
   * Error code for programmatic handling
   */
  code: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Additional error details
   * Optional debugging information
   */
  details?: unknown;
};

/**
 * Type guard for successful API responses
 */
export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is Extract<ApiResponse<T>, { success: true }> {
  return response.success === true;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Session Hook Result
 *
 * Return type for useSession hook.
 */
export type UseSessionResult = {
  /**
   * Current session data
   * Null if unauthenticated
   */
  data: Session | null;

  /**
   * Loading state
   * True while fetching session
   */
  isPending: boolean;

  /**
   * Error state
   * Null if no error
   */
  error: Error | null;

  /**
   * Refresh session data
   */
  refetch: () => Promise<void>;
};

/**
 * Authentication Hook Result
 *
 * Return type for authentication action hooks.
 */
export type UseAuthResult<TInput, TResult> = {
  /**
   * Execute authentication action
   */
  execute: (input: TInput) => Promise<TResult>;

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error state
   */
  error: Error | null;

  /**
   * Result data
   */
  data: TResult | null;

  /**
   * Reset hook state
   */
  reset: () => void;
};

// ============================================================================
// Type Guards and Utility Functions
// ============================================================================
// All type exports are inline with their definitions above
