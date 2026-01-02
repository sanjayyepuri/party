import { betterAuth } from "better-auth";
import { passkey } from "@better-auth/passkey";
import { emailOTP } from "better-auth/plugins";
import { Pool } from "pg";
import { sendOTPEmail } from "./email-service";
import { getBaseURL, getRpID, getRpName } from "./auth-config";

// Create a connection pool for Neon PostgreSQL
if (!process.env.NEON_POSTGRES_URL) {
  throw new Error("NEON_POSTGRES_URL environment variable is not set");
}

const baseURL = getBaseURL();
const rpID = getRpID();
const rpName = getRpName();

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.NEON_POSTGRES_URL,
  }),
  plugins: [
    passkey({
      rpID: rpID,
      rpName: rpName,
      origin: baseURL, // Must match trustedOrigins for validation
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Use Resend to send OTP emails
        // The email-service handles fallback to console logging if RESEND_API_KEY is not set
        await sendOTPEmail({
          email,
          otp,
          type: type as string,
        });
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
  trustedOrigins: [baseURL],
});

export type Session = typeof auth.$Infer.Session;
