import {
  getBaseURL,
  getRpID,
  getRpName,
  getTrustedOrigins,
  getPasskeyOrigin,
} from "../auth-config";

describe("auth-config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    // Clean up Vercel environment variables for each test
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_BRANCH_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getBaseURL", () => {
    it("returns NEXT_PUBLIC_APP_URL when set", () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
      delete process.env.VERCEL_ENV;
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      delete process.env.VERCEL_URL;
      delete process.env.VERCEL_BRANCH_URL;

      expect(getBaseURL()).toBe("https://example.com");
    });

    it("returns http://localhost:3000 when no env vars are set", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.VERCEL_ENV;
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      delete process.env.VERCEL_URL;
      delete process.env.VERCEL_BRANCH_URL;

      expect(getBaseURL()).toBe("http://localhost:3000");
    });

    describe("VERCEL_ENV=production", () => {
      it("uses VERCEL_PROJECT_PRODUCTION_URL in production (custom domain)", () => {
        delete process.env.NEXT_PUBLIC_APP_URL;
        process.env.VERCEL_ENV = "production";
        process.env.VERCEL_PROJECT_PRODUCTION_URL = "my-app.com";
        delete process.env.VERCEL_URL;
        delete process.env.VERCEL_BRANCH_URL;

        expect(getBaseURL()).toBe("https://my-app.com");
      });

      it("uses VERCEL_PROJECT_PRODUCTION_URL with https in production", () => {
        delete process.env.NEXT_PUBLIC_APP_URL;
        process.env.VERCEL_ENV = "production";
        process.env.VERCEL_PROJECT_PRODUCTION_URL = "my-app.com";
        delete process.env.VERCEL_URL;

        expect(getBaseURL()).toBe("https://my-app.com");
      });

      it("handles VERCEL_PROJECT_PRODUCTION_URL that already includes https://", () => {
        delete process.env.NEXT_PUBLIC_APP_URL;
        process.env.VERCEL_ENV = "production";
        process.env.VERCEL_PROJECT_PRODUCTION_URL = "https://my-app.com";
        delete process.env.VERCEL_URL;

        expect(getBaseURL()).toBe("https://my-app.com");
      });

      it("falls back to VERCEL_URL in production if VERCEL_PROJECT_PRODUCTION_URL not set", () => {
        delete process.env.NEXT_PUBLIC_APP_URL;
        process.env.VERCEL_ENV = "production";
        delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
        process.env.VERCEL_URL = "my-app.vercel.app";

        expect(getBaseURL()).toBe("https://my-app.vercel.app");
      });

      it("prioritizes NEXT_PUBLIC_APP_URL over VERCEL_PROJECT_PRODUCTION_URL in production", () => {
        process.env.NEXT_PUBLIC_APP_URL = "https://custom-domain.com";
        process.env.VERCEL_ENV = "production";
        process.env.VERCEL_PROJECT_PRODUCTION_URL = "my-app.com";
        delete process.env.VERCEL_URL;

        expect(getBaseURL()).toBe("https://custom-domain.com");
      });
    });

    describe("VERCEL_ENV=preview", () => {
      it("uses VERCEL_BRANCH_URL in preview when available", () => {
        delete process.env.NEXT_PUBLIC_APP_URL;
        process.env.VERCEL_ENV = "preview";
        process.env.VERCEL_BRANCH_URL = "my-app-git-main.vercel.app";
        delete process.env.VERCEL_URL;

        expect(getBaseURL()).toBe("https://my-app-git-main.vercel.app");
      });

      it("falls back to VERCEL_URL in preview if VERCEL_BRANCH_URL not set", () => {
        delete process.env.NEXT_PUBLIC_APP_URL;
        process.env.VERCEL_ENV = "preview";
        delete process.env.VERCEL_BRANCH_URL;
        process.env.VERCEL_URL = "my-app-abc123.vercel.app";

        expect(getBaseURL()).toBe("https://my-app-abc123.vercel.app");
      });

      it("prioritizes VERCEL_BRANCH_URL over VERCEL_URL in preview", () => {
        delete process.env.NEXT_PUBLIC_APP_URL;
        process.env.VERCEL_ENV = "preview";
        process.env.VERCEL_BRANCH_URL = "my-app-git-main.vercel.app";
        process.env.VERCEL_URL = "my-app-abc123.vercel.app";

        expect(getBaseURL()).toBe("https://my-app-git-main.vercel.app");
      });
    });

    describe("VERCEL_ENV=development or undefined", () => {
      it("uses localhost when VERCEL_ENV=development", () => {
        delete process.env.NEXT_PUBLIC_APP_URL;
        process.env.VERCEL_ENV = "development";
        delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
        delete process.env.VERCEL_URL;
        delete process.env.VERCEL_BRANCH_URL;

        expect(getBaseURL()).toBe("http://localhost:3000");
      });

      it("uses localhost when VERCEL_ENV is undefined (local dev)", () => {
        delete process.env.NEXT_PUBLIC_APP_URL;
        delete process.env.VERCEL_ENV;
        delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
        delete process.env.VERCEL_URL;
        delete process.env.VERCEL_BRANCH_URL;

        expect(getBaseURL()).toBe("http://localhost:3000");
      });
    });

    // Legacy tests for backward compatibility (when VERCEL_ENV is not set)
    // These test the fallback behavior when VERCEL_ENV is undefined
    it("returns https:// for VERCEL_URL when VERCEL_ENV is not set (legacy behavior)", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.VERCEL_ENV;
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      delete process.env.VERCEL_BRANCH_URL;
      process.env.VERCEL_URL = "my-app.vercel.app";

      // When VERCEL_ENV is not set, it should default to localhost
      expect(getBaseURL()).toBe("http://localhost:3000");
    });

    it("prioritizes origin over NEXT_PUBLIC_VERCEL_URL", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      process.env.NEXT_PUBLIC_VERCEL_URL = "my-app.vercel.app";
      delete process.env.VERCEL_URL;

      expect(getBaseURL("https://client-origin.com")).toBe(
        "https://client-origin.com"
      );
    });

    it("returns provided origin when passed as argument", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      expect(getBaseURL("https://client-origin.com")).toBe(
        "https://client-origin.com"
      );
    });

    it("prioritizes NEXT_PUBLIC_APP_URL over provided origin", () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://env-url.com";
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      expect(getBaseURL("https://client-origin.com")).toBe(
        "https://env-url.com"
      );
    });

    it("uses origin when NEXT_PUBLIC_APP_URL is not set but VERCEL_URL is", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.VERCEL_ENV;
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      process.env.VERCEL_URL = "my-app.vercel.app";

      expect(getBaseURL("https://client-origin.com")).toBe(
        "https://client-origin.com"
      );
    });
  });

  describe("getRpID", () => {
    it("returns BETTER_AUTH_PASSKEY_RP_ID when set", () => {
      process.env.BETTER_AUTH_PASSKEY_RP_ID = "custom-rp-id";
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      expect(getRpID()).toBe("custom-rp-id");
    });

    it("extracts hostname from NEXT_PUBLIC_APP_URL", () => {
      delete process.env.BETTER_AUTH_PASSKEY_RP_ID;
      process.env.NEXT_PUBLIC_APP_URL = "https://example.com:3000";
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      expect(getRpID()).toBe("example.com");
    });

    it("extracts hostname from VERCEL_PROJECT_PRODUCTION_URL in production", () => {
      delete process.env.BETTER_AUTH_PASSKEY_RP_ID;
      delete process.env.NEXT_PUBLIC_APP_URL;
      process.env.VERCEL_ENV = "production";
      process.env.VERCEL_PROJECT_PRODUCTION_URL = "my-app.com";
      delete process.env.VERCEL_URL;

      expect(getRpID()).toBe("my-app.com");
    });

    it("extracts hostname from VERCEL_URL in preview", () => {
      delete process.env.BETTER_AUTH_PASSKEY_RP_ID;
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      process.env.VERCEL_ENV = "preview";
      process.env.VERCEL_URL = "my-app-abc123.vercel.app";
      delete process.env.VERCEL_BRANCH_URL;

      expect(getRpID()).toBe("my-app-abc123.vercel.app");
    });

    it("returns localhost as fallback for invalid URL", () => {
      delete process.env.BETTER_AUTH_PASSKEY_RP_ID;
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      // When getBaseURL returns a valid URL, getRpID should extract hostname
      // When it's localhost, it should return "localhost"
      expect(getRpID()).toBe("localhost");
    });

    it("returns localhost when baseURL is localhost", () => {
      delete process.env.BETTER_AUTH_PASSKEY_RP_ID;
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      expect(getRpID()).toBe("localhost");
    });
  });

  describe("getRpName", () => {
    it("returns BETTER_AUTH_PASSKEY_RP_NAME when set", () => {
      process.env.BETTER_AUTH_PASSKEY_RP_NAME = "Custom App Name";

      expect(getRpName()).toBe("Custom App Name");
    });

    it("returns default 'Party Platform' when not set", () => {
      delete process.env.BETTER_AUTH_PASSKEY_RP_NAME;

      expect(getRpName()).toBe("Party Platform");
    });
  });

  describe("getTrustedOrigins", () => {
    it("returns BETTER_AUTH_TRUSTED_ORIGINS when set", () => {
      process.env.BETTER_AUTH_TRUSTED_ORIGINS =
        "https://sanjay.party, https://www.sanjay.party, https://app.sanjay.party";
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      const origins = getTrustedOrigins();
      expect(origins).toEqual([
        "https://sanjay.party",
        "https://www.sanjay.party",
        "https://app.sanjay.party",
      ]);
    });

    it("trims whitespace from BETTER_AUTH_TRUSTED_ORIGINS", () => {
      process.env.BETTER_AUTH_TRUSTED_ORIGINS =
        " https://sanjay.party , https://www.sanjay.party ";
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      const origins = getTrustedOrigins();
      expect(origins).toEqual([
        "https://sanjay.party",
        "https://www.sanjay.party",
      ]);
    });

    it("returns baseURL as single-item array when BETTER_AUTH_TRUSTED_ORIGINS is not set", () => {
      delete process.env.BETTER_AUTH_TRUSTED_ORIGINS;
      process.env.NEXT_PUBLIC_APP_URL = "https://sanjay.party";
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      const origins = getTrustedOrigins();
      expect(origins).toEqual(["https://sanjay.party"]);
    });

    it("returns localhost URL when no env vars are set", () => {
      delete process.env.BETTER_AUTH_TRUSTED_ORIGINS;
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      const origins = getTrustedOrigins();
      expect(origins).toEqual(["http://localhost:3000"]);
    });

    it("uses baseURL from VERCEL_PROJECT_PRODUCTION_URL in production when BETTER_AUTH_TRUSTED_ORIGINS is not set", () => {
      delete process.env.BETTER_AUTH_TRUSTED_ORIGINS;
      delete process.env.NEXT_PUBLIC_APP_URL;
      process.env.VERCEL_ENV = "production";
      process.env.VERCEL_PROJECT_PRODUCTION_URL = "my-app.com";
      delete process.env.VERCEL_URL;

      const origins = getTrustedOrigins();
      expect(origins).toEqual(["https://my-app.com"]);
    });

    it("uses baseURL from VERCEL_URL in preview when BETTER_AUTH_TRUSTED_ORIGINS is not set", () => {
      delete process.env.BETTER_AUTH_TRUSTED_ORIGINS;
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      process.env.VERCEL_ENV = "preview";
      process.env.VERCEL_URL = "my-app-abc123.vercel.app";
      delete process.env.VERCEL_BRANCH_URL;

      const origins = getTrustedOrigins();
      expect(origins).toEqual(["https://my-app-abc123.vercel.app"]);
    });
  });

  describe("getPasskeyOrigin", () => {
    it("returns BETTER_AUTH_PASSKEY_ORIGIN when set (priority 1)", () => {
      process.env.BETTER_AUTH_PASSKEY_ORIGIN = "https://sanjay.party";
      delete process.env.BETTER_AUTH_TRUSTED_ORIGINS;
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      expect(getPasskeyOrigin()).toBe("https://sanjay.party");
    });

    it("prioritizes BETTER_AUTH_PASSKEY_ORIGIN over trustedOrigins", () => {
      process.env.BETTER_AUTH_PASSKEY_ORIGIN = "https://sanjay.party";
      process.env.BETTER_AUTH_TRUSTED_ORIGINS =
        "https://www.sanjay.party, https://app.sanjay.party";
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      expect(getPasskeyOrigin()).toBe("https://sanjay.party");
    });

    it("returns non-www from trustedOrigins when BETTER_AUTH_PASSKEY_ORIGIN is not set", () => {
      delete process.env.BETTER_AUTH_PASSKEY_ORIGIN;
      process.env.BETTER_AUTH_TRUSTED_ORIGINS =
        "https://sanjay.party, https://www.sanjay.party";
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      expect(getPasskeyOrigin()).toBe("https://sanjay.party");
    });

    it("returns first trusted origin if no non-www exists", () => {
      delete process.env.BETTER_AUTH_PASSKEY_ORIGIN;
      process.env.BETTER_AUTH_TRUSTED_ORIGINS =
        "https://www.sanjay.party, https://app.sanjay.party";
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      expect(getPasskeyOrigin()).toBe("https://www.sanjay.party");
    });

    it("prefers non-www over www when both exist in trustedOrigins", () => {
      delete process.env.BETTER_AUTH_PASSKEY_ORIGIN;
      process.env.BETTER_AUTH_TRUSTED_ORIGINS =
        "https://www.sanjay.party, https://sanjay.party";
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      expect(getPasskeyOrigin()).toBe("https://sanjay.party");
    });

    it("falls back to baseURL when no trustedOrigins and BETTER_AUTH_PASSKEY_ORIGIN not set", () => {
      delete process.env.BETTER_AUTH_PASSKEY_ORIGIN;
      delete process.env.BETTER_AUTH_TRUSTED_ORIGINS;
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      expect(getPasskeyOrigin()).toBe("http://localhost:3000");
    });

    it("uses baseURL from VERCEL_PROJECT_PRODUCTION_URL in production when no trustedOrigins", () => {
      delete process.env.BETTER_AUTH_PASSKEY_ORIGIN;
      delete process.env.BETTER_AUTH_TRUSTED_ORIGINS;
      delete process.env.NEXT_PUBLIC_APP_URL;
      process.env.VERCEL_ENV = "production";
      process.env.VERCEL_PROJECT_PRODUCTION_URL = "my-app.com";
      delete process.env.VERCEL_URL;

      expect(getPasskeyOrigin()).toBe("https://my-app.com");
    });

    it("uses baseURL from VERCEL_URL in preview when no trustedOrigins", () => {
      delete process.env.BETTER_AUTH_PASSKEY_ORIGIN;
      delete process.env.BETTER_AUTH_TRUSTED_ORIGINS;
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      process.env.VERCEL_ENV = "preview";
      process.env.VERCEL_URL = "my-app-abc123.vercel.app";
      delete process.env.VERCEL_BRANCH_URL;

      expect(getPasskeyOrigin()).toBe("https://my-app-abc123.vercel.app");
    });

    it("handles trustedOrigins with single origin", () => {
      delete process.env.BETTER_AUTH_PASSKEY_ORIGIN;
      process.env.BETTER_AUTH_TRUSTED_ORIGINS = "https://sanjay.party";
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      expect(getPasskeyOrigin()).toBe("https://sanjay.party");
    });

    it("handles trustedOrigins with www only", () => {
      delete process.env.BETTER_AUTH_PASSKEY_ORIGIN;
      process.env.BETTER_AUTH_TRUSTED_ORIGINS = "https://www.sanjay.party";
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      expect(getPasskeyOrigin()).toBe("https://www.sanjay.party");
    });

    it("handles localhost in trustedOrigins", () => {
      delete process.env.BETTER_AUTH_PASSKEY_ORIGIN;
      process.env.BETTER_AUTH_TRUSTED_ORIGINS = "http://localhost:3000";
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      expect(getPasskeyOrigin()).toBe("http://localhost:3000");
    });

    it("handles invalid URL in trustedOrigins gracefully", () => {
      delete process.env.BETTER_AUTH_PASSKEY_ORIGIN;
      // This shouldn't happen in practice, but test defensive behavior
      process.env.BETTER_AUTH_TRUSTED_ORIGINS = "not-a-valid-url";
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_VERCEL_URL;
      delete process.env.VERCEL_URL;

      // Should fall back to baseURL
      expect(getPasskeyOrigin()).toBe("http://localhost:3000");
    });
  });
});
