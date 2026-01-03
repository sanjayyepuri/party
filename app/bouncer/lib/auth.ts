import { betterAuth } from "better-auth";
import { passkey } from "@better-auth/passkey";
import { emailOTP } from "better-auth/plugins";
import { Pool } from "pg";
import { sendOTPEmail } from "./email-service";
import {
  getBaseURL,
  getRpID,
  getRpName,
  getTrustedOrigins,
  getPasskeyOrigin,
} from "./auth-config";

// Create a connection pool for Neon PostgreSQL
if (!process.env.NEON_POSTGRES_URL) {
  throw new Error("NEON_POSTGRES_URL environment variable is not set");
}

const baseURL = getBaseURL();
const rpID = getRpID();
const rpName = getRpName();
const passkeyOrigin = getPasskeyOrigin();

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.NEON_POSTGRES_URL,
  }),
  plugins: [
    passkey({
      rpID: rpID,
      rpName: rpName,
      origin: passkeyOrigin, // Canonical production domain, must be in trustedOrigins
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        try {
          // Use Resend to send OTP emails
          // The email-service handles fallback to console logging if RESEND_API_KEY is not set
          await sendOTPEmail({
            email,
            otp,
            type: type as string,
          });
        } catch (error) {
          // Log the error for debugging
          console.error("[Auth] Failed to send OTP email:", error);

          // Provide user-friendly error messages
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          // Check for specific error types and provide helpful messages
          if (
            errorMessage.includes("RESEND_FROM_EMAIL") ||
            errorMessage.includes("environment variable")
          ) {
            throw new Error(
              "Email service is not properly configured. Please contact support."
            );
          }

          if (
            errorMessage.includes("Invalid `from` field") ||
            errorMessage.includes("validation_error")
          ) {
            throw new Error(
              "Email service configuration error. Please contact support."
            );
          }

          // For other errors, provide a generic but helpful message
          throw new Error(
            "Unable to send verification email. Please check your email address and try again, or contact support if the problem persists."
          );
        }
      },
    }),
  ],
  // Disable email/password - using OTP + passkey flow instead
  emailAndPassword: {
    enabled: false,
  },
  user: {
    additionalFields: {
      // Match the guest table schema - store phone if provided
      phone: {
        type: "string",
        required: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day - refresh session if older than this
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes - cache user data in cookie
    },
  },
  baseURL: baseURL,
  basePath: "/handlers/auth",
  trustedOrigins: getTrustedOrigins(),
});

export type Session = typeof auth.$Infer.Session;
