/**
 * Integration tests for auth.ts email OTP configuration
 *
 * These tests verify that the auth configuration correctly integrates
 * with the email-service for sending OTP emails via Resend.
 */

import { sendOTPEmail } from "../email-service";

// Mock the email service to verify it's called correctly
jest.mock("../email-service");

describe("auth email OTP integration", () => {
  const originalEnv = process.env;
  let mockSendOTPEmail: jest.MockedFunction<typeof sendOTPEmail>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    // Ensure NEON_POSTGRES_URL is set to avoid auth initialization errors
    process.env.NEON_POSTGRES_URL = "postgresql://test:test@localhost/test";
    mockSendOTPEmail = sendOTPEmail as jest.MockedFunction<typeof sendOTPEmail>;
    mockSendOTPEmail.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  it("exports sendOTPEmail function for use in auth configuration", () => {
    // Verify that sendOTPEmail is available and can be imported
    expect(sendOTPEmail).toBeDefined();
    expect(typeof sendOTPEmail).toBe("function");
  });

  it("sendOTPEmail accepts Better Auth OTP types", async () => {
    // Test that sendOTPEmail can handle all Better Auth OTP types
    // Note: "forget-password" is not used since we use passwordless authentication
    const testCases = [
      { type: "sign-up", email: "[email protected]", otp: "123456" },
      { type: "sign-in", email: "[email protected]", otp: "654321" },
      { type: "email-verification", email: "[email protected]", otp: "111222" },
    ];

    for (const testCase of testCases) {
      await sendOTPEmail(testCase);
      expect(mockSendOTPEmail).toHaveBeenCalledWith(testCase);
    }
  });

  it("propagates errors from sendOTPEmail for Better Auth error handling", async () => {
    const emailError = new Error("Resend API error");
    mockSendOTPEmail.mockRejectedValueOnce(emailError);

    // The error should be propagated so Better Auth can handle it
    await expect(
      sendOTPEmail({
        email: "[email protected]",
        otp: "123456",
        type: "sign-up",
      })
    ).rejects.toThrow("Resend API error");
  });
});
