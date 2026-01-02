import { sendOTPEmail } from "../email-service";
import { Resend } from "resend";

// Mock Resend
jest.mock("resend");

describe("email-service", () => {
  const originalEnv = process.env;
  let mockResendInstance: {
    emails: {
      send: jest.Mock;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    mockResendInstance = {
      emails: {
        send: jest.fn().mockResolvedValue({ id: "test-email-id" }),
      },
    };
    (Resend as jest.MockedClass<typeof Resend>).mockImplementation(
      () => mockResendInstance as any
    );
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("sendOTPEmail", () => {
    it("sends email via Resend when API key is configured", async () => {
      process.env.RESEND_API_KEY = "test-api-key";
      process.env.RESEND_FROM_EMAIL = "Test <[email protected]>";

      await sendOTPEmail({
        email: "[email protected]",
        otp: "123456",
        type: "sign-in",
      });

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith({
        from: "Test <[email protected]>",
        to: "[email protected]",
        subject: "Verify your email to create your account",
        html: expect.stringContaining("123456"),
        text: expect.stringContaining("123456"),
      });
    });

    it("throws error when RESEND_FROM_EMAIL is not set but RESEND_API_KEY is set", async () => {
      process.env.RESEND_API_KEY = "test-api-key";
      delete process.env.RESEND_FROM_EMAIL;

      await expect(
        sendOTPEmail({
          email: "[email protected]",
          otp: "123456",
          type: "sign-in",
        })
      ).rejects.toThrow("RESEND_FROM_EMAIL environment variable is required");
    });

    it("logs to console when RESEND_API_KEY is not set", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      delete process.env.RESEND_API_KEY;

      await sendOTPEmail({
        email: "[email protected]",
        otp: "123456",
        type: "sign-in",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Email OTP] RESEND_API_KEY not set")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[email protected]")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("123456")
      );
      expect(mockResendInstance.emails.send).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("uses correct subject for sign-in type", async () => {
      process.env.RESEND_API_KEY = "test-api-key";
      process.env.RESEND_FROM_EMAIL = "Test <[email protected]>";

      await sendOTPEmail({
        email: "[email protected]",
        otp: "123456",
        type: "sign-in",
      });

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Verify your email to create your account",
        })
      );
    });

    it("uses correct subject for sign-up type", async () => {
      process.env.RESEND_API_KEY = "test-api-key";
      process.env.RESEND_FROM_EMAIL = "Test <[email protected]>";

      await sendOTPEmail({
        email: "[email protected]",
        otp: "123456",
        type: "sign-up",
      });

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Verify your email to create your account",
        })
      );
    });

    it("uses correct subject for email-verification type", async () => {
      process.env.RESEND_API_KEY = "test-api-key";
      process.env.RESEND_FROM_EMAIL = "Test <[email protected]>";

      await sendOTPEmail({
        email: "[email protected]",
        otp: "123456",
        type: "email-verification",
      });

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Verify your email address",
        })
      );
    });

    it("uses correct subject for forget-password type", async () => {
      process.env.RESEND_API_KEY = "test-api-key";
      process.env.RESEND_FROM_EMAIL = "Test <[email protected]>";

      await sendOTPEmail({
        email: "[email protected]",
        otp: "123456",
        type: "forget-password",
      });

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Reset your password",
        })
      );
    });

    it("includes OTP in both HTML and text email content", async () => {
      process.env.RESEND_API_KEY = "test-api-key";
      process.env.RESEND_FROM_EMAIL = "Test <[email protected]>";

      await sendOTPEmail({
        email: "[email protected]",
        otp: "987654",
        type: "sign-in",
      });

      const callArgs = mockResendInstance.emails.send.mock.calls[0][0];
      expect(callArgs.html).toContain("987654");
      expect(callArgs.text).toContain("987654");
    });

    it("throws error when Resend API call fails", async () => {
      process.env.RESEND_API_KEY = "test-api-key";
      process.env.RESEND_FROM_EMAIL = "Test <[email protected]>";
      const apiError = new Error("Resend API error");
      mockResendInstance.emails.send.mockRejectedValue(apiError);
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(
        sendOTPEmail({
          email: "[email protected]",
          otp: "123456",
          type: "sign-in",
        })
      ).rejects.toThrow("Resend API error");

      // Verify error logging includes detailed information
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Email OTP] Failed to send email via Resend:"),
        expect.objectContaining({
          message: "Resend API error",
          to: "[email protected]",
        })
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Email OTP] Full error object:"),
        apiError
      );

      consoleErrorSpy.mockRestore();
    });

    it("includes expiration message in email content", async () => {
      process.env.RESEND_API_KEY = "test-api-key";
      process.env.RESEND_FROM_EMAIL = "Test <[email protected]>";

      await sendOTPEmail({
        email: "[email protected]",
        otp: "123456",
        type: "sign-in",
      });

      const callArgs = mockResendInstance.emails.send.mock.calls[0][0];
      expect(callArgs.html).toContain("expire in 5 minutes");
      expect(callArgs.text).toContain("expire in 5 minutes");
    });

    it("escapes HTML special characters in OTP and subject", async () => {
      process.env.RESEND_API_KEY = "test-api-key";

      await sendOTPEmail({
        email: "[email protected]",
        otp: "<script>alert('xss')</script>",
        type: "sign-in",
      });

      const callArgs = mockResendInstance.emails.send.mock.calls[0][0];
      // Verify HTML is escaped
      expect(callArgs.html).toContain("&lt;script&gt;");
      expect(callArgs.html).toContain("&lt;/script&gt;");
      expect(callArgs.html).not.toContain("<script>");
      // Plain text should contain the raw value
      expect(callArgs.text).toContain("<script>alert('xss')</script>");
    });
  });
});
