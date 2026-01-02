import { getBaseURL, getRpID, getRpName } from "../auth-config";

describe("auth-config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getBaseURL", () => {
    it("returns NEXT_PUBLIC_APP_URL when set", () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
      delete process.env.VERCEL_URL;

      expect(getBaseURL()).toBe("https://example.com");
    });

    it("returns http://localhost:3000 when no env vars are set", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.VERCEL_URL;

      expect(getBaseURL()).toBe("http://localhost:3000");
    });

    it("returns http:// for localhost VERCEL_URL", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      process.env.VERCEL_URL = "localhost:3000";

      expect(getBaseURL()).toBe("http://localhost:3000");
    });

    it("returns http:// for VERCEL_URL starting with localhost", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      process.env.VERCEL_URL = "localhost";

      expect(getBaseURL()).toBe("http://localhost");
    });

    it("returns https:// for production VERCEL_URL", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      process.env.VERCEL_URL = "my-app.vercel.app";

      expect(getBaseURL()).toBe("https://my-app.vercel.app");
    });

    it("handles VERCEL_URL that already includes https:// protocol", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      process.env.VERCEL_URL = "https://my-app.vercel.app";

      expect(getBaseURL()).toBe("https://my-app.vercel.app");
    });

    it("handles VERCEL_URL that already includes http:// protocol", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      process.env.VERCEL_URL = "http://localhost:3000";

      expect(getBaseURL()).toBe("http://localhost:3000");
    });

    it("prioritizes NEXT_PUBLIC_APP_URL over VERCEL_URL", () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://custom-domain.com";
      process.env.VERCEL_URL = "my-app.vercel.app";

      expect(getBaseURL()).toBe("https://custom-domain.com");
    });

    it("returns provided origin when passed as argument", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.VERCEL_URL;

      expect(getBaseURL("https://client-origin.com")).toBe("https://client-origin.com");
    });

    it("prioritizes NEXT_PUBLIC_APP_URL over provided origin", () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://env-url.com";
      delete process.env.VERCEL_URL;

      expect(getBaseURL("https://client-origin.com")).toBe("https://env-url.com");
    });

    it("uses origin when NEXT_PUBLIC_APP_URL is not set but VERCEL_URL is", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      process.env.VERCEL_URL = "my-app.vercel.app";

      expect(getBaseURL("https://client-origin.com")).toBe("https://client-origin.com");
    });
  });

  describe("getRpID", () => {
    it("returns BETTER_AUTH_PASSKEY_RP_ID when set", () => {
      process.env.BETTER_AUTH_PASSKEY_RP_ID = "custom-rp-id";
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.VERCEL_URL;

      expect(getRpID()).toBe("custom-rp-id");
    });

    it("extracts hostname from NEXT_PUBLIC_APP_URL", () => {
      delete process.env.BETTER_AUTH_PASSKEY_RP_ID;
      process.env.NEXT_PUBLIC_APP_URL = "https://example.com:3000";

      expect(getRpID()).toBe("example.com");
    });

    it("extracts hostname from VERCEL_URL", () => {
      delete process.env.BETTER_AUTH_PASSKEY_RP_ID;
      delete process.env.NEXT_PUBLIC_APP_URL;
      process.env.VERCEL_URL = "my-app.vercel.app";

      expect(getRpID()).toBe("my-app.vercel.app");
    });

    it("returns localhost as fallback for invalid URL", () => {
      delete process.env.BETTER_AUTH_PASSKEY_RP_ID;
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.VERCEL_URL;

      // When getBaseURL returns a valid URL, getRpID should extract hostname
      // When it's localhost, it should return "localhost"
      expect(getRpID()).toBe("localhost");
    });

    it("returns localhost when baseURL is localhost", () => {
      delete process.env.BETTER_AUTH_PASSKEY_RP_ID;
      delete process.env.NEXT_PUBLIC_APP_URL;
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
});
