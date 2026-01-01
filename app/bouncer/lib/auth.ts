import { betterAuth } from "better-auth";
// @ts-ignore - passkey plugin may not have type definitions
import { passkey } from "better-auth/plugins";
import { Pool } from "pg";

// Create a connection pool for Neon PostgreSQL
if (!process.env.NEON_POSTGRES_URL) {
  throw new Error("NEON_POSTGRES_URL environment variable is not set");
}

// Automatically detect base URL from Vercel or use localhost
const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
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

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.NEON_POSTGRES_URL,
  }),
  plugins: [
    passkey({
      rpID: getRpID(),
      rpName: getRpName(),
      origin: getBaseURL(),
    }),
  ],
  emailAndPassword: {
    enabled: false, // Disabled - using passkeys only
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
  baseURL: getBaseURL(),
  basePath: "/handlers/auth",
  trustedOrigins: [getBaseURL()],
});

export type Session = typeof auth.$Infer.Session;
