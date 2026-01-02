import { betterAuth } from "better-auth";
import { passkey } from "@better-auth/passkey";
import { emailOTP } from "better-auth/plugins";
import { Pool } from "pg";
import { sendOTPEmail } from "./email-service";

// Create a connection pool for Neon PostgreSQL
if (!process.env.NEON_POSTGRES_URL) {
  throw new Error("NEON_POSTGRES_URL environment variable is not set");
}

// Automatically detect base URL from Vercel or use localhost
const getBaseURL = () => {
  let baseURL: string;

  if (process.env.NEXT_PUBLIC_APP_URL) {
    baseURL = process.env.NEXT_PUBLIC_APP_URL;
  } else if (process.env.VERCEL_URL) {
    // Check if it's localhost - use http:// for localhost, https:// for production
    const host = process.env.VERCEL_URL;
    if (host.startsWith("localhost") || host.includes("localhost:")) {
      baseURL = `http://${host}`;
    } else {
      baseURL = `https://${host}`;
    }
  } else {
    baseURL = "http://localhost:3000";
  }

  return baseURL;
};

// Get Relying Party ID from base URL (domain only, no protocol/port)
const getRpID = () => {
  if (process.env.BETTER_AUTH_PASSKEY_RP_ID) {
    return process.env.BETTER_AUTH_PASSKEY_RP_ID;
  }
  const baseURL = getBaseURL();
  try {
    const url = new URL(baseURL);
    return url.hostname; // Extract just the hostname (domain)
  } catch {
    // Fallback for localhost
    return "localhost";
  }
};

// Get Relying Party Name
const getRpName = () => {
  return process.env.BETTER_AUTH_PASSKEY_RP_NAME || "Party Platform";
};

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
