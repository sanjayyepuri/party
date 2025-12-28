import { betterAuth } from "better-auth";
import { passkey } from "@better-auth/passkey";
import { magicLink } from "better-auth/plugins";
import { Pool } from "pg";
import { sendMagicLinkRegistrationEmail, sendMagicLinkLoginEmail } from "./email";

// ============================================================================
// Environment Validation
// ============================================================================

if (!process.env.NEON_POSTGRES_URL) {
  throw new Error("NEON_POSTGRES_URL environment variable is not set");
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get base URL for the application
 *
 * Priority order:
 * 1. NEXT_PUBLIC_APP_URL (explicit configuration)
 * 2. VERCEL_URL (automatic on Vercel deployments)
 * 3. localhost:3000 (development fallback)
 *
 * @returns Base URL string (e.g., "https://example.com" or "http://localhost:3000")
 */
const getBaseURL = (): string => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

/**
 * Get Relying Party ID for WebAuthn
 *
 * The RP ID must be:
 * - A valid domain name (e.g., "example.com")
 * - "localhost" for local development
 * - NOT an IP address (except 127.0.0.1 treated as localhost)
 *
 * @returns RP ID string
 */
const getPasskeyRPID = (): string => {
  if (process.env.NEXT_PUBLIC_RP_ID) {
    return process.env.NEXT_PUBLIC_RP_ID;
  }

  // For localhost, use "localhost"
  const baseURL = getBaseURL();
  if (baseURL.includes("localhost") || baseURL.includes("127.0.0.1")) {
    return "localhost";
  }

  // For production, extract domain from URL
  try {
    const url = new URL(baseURL);
    return url.hostname;
  } catch {
    return "localhost"; // Fallback
  }
};

// ============================================================================
// Better Auth Configuration
// ============================================================================

export const auth = betterAuth({
  // Database connection
  database: new Pool({
    connectionString: process.env.NEON_POSTGRES_URL,
  }),

  // Disable password authentication (migrating to passkeys)
  emailAndPassword: {
    enabled: false,
  },

  // Plugins
  plugins: [
    // Passkey authentication (WebAuthn)
    passkey({
      // Relying Party ID: domain name for production, "localhost" for dev
      rpID: getPasskeyRPID(),

      // Relying Party Name: display name shown to users
      rpName: "Party Invitation Platform",

      // Origin: full URL of the application
      origin: getBaseURL(),

      // Authenticator selection criteria
      authenticatorSelection: {
        // Prefer platform authenticators (Face ID, Touch ID, Windows Hello)
        // These are more convenient and typically more secure than USB keys
        authenticatorAttachment: "platform",

        // Require resident keys (credential stored on device)
        // This enables:
        // - Conditional UI / autofill in compatible browsers
        // - Passwordless flow (no need to enter username first)
        // - Better UX overall
        residentKey: "required",

        // Always require user verification (biometric or PIN)
        // This ensures:
        // - Strong authentication (something you have + something you are)
        // - Protection even if device is stolen
        userVerification: "required",
      },
    }),

    // Magic link authentication (for registration and recovery)
    magicLink({
      // Token expiration time (5 minutes)
      // Balance between security (shorter) and UX (longer)
      expiresIn: 300,

      // Allow new user creation via magic link
      disableSignUp: false,

      // Email sending function
      // This is called when a magic link needs to be sent
      sendMagicLink: async ({ email, url, token }, request) => {
        // Determine if this is registration or login based on user existence
        // The request object contains metadata about the auth attempt

        try {
          // Send appropriate email template
          // Note: Better Auth handles user creation and session management
          await sendMagicLinkLoginEmail(email, url);
        } catch (error) {
          console.error("Failed to send magic link email:", error);
          throw new Error("Failed to send login link. Please try again.");
        }
      },
    }),
  ],

  // User schema
  user: {
    additionalFields: {
      // Phone number (optional)
      // Matches guest table schema for future integration
      phone: {
        type: "string",
        required: false,
      },
    },
  },

  // Session configuration
  session: {
    // Session duration: 7 days
    // After this, user must re-authenticate
    expiresIn: 60 * 60 * 24 * 7,

    // Session refresh age: 1 day
    // If session is older than this, it will be refreshed on next request
    // This extends the session without requiring re-authentication
    updateAge: 60 * 60 * 24,

    // Cookie cache
    cookieCache: {
      // Enable caching user data in cookie
      enabled: true,
      // Cache duration: 5 minutes
      // Reduces database queries for user data
      maxAge: 5 * 60,
    },
  },

  // Base configuration
  baseURL: getBaseURL(),
  basePath: "/handlers/auth",
  trustedOrigins: [getBaseURL()],
});

// ============================================================================
// Type Exports
// ============================================================================

export type Session = typeof auth.$Infer.Session;
