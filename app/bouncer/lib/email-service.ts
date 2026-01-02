/**
 * Email service for sending OTP verification emails via Resend
 */

import { Resend } from "resend";

// Better Auth emailOTP plugin types
// The type can be "sign-up", "sign-in", "email-verification", "forget-password", or other strings
type OTPType =
  | "sign-up"
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | string;

interface SendOTPParams {
  email: string;
  otp: string;
  type: OTPType;
}

/**
 * Safely escape text for inclusion in HTML
 */
const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

/**
 * Get the email subject based on OTP type
 * Handles Better Auth's emailOTP plugin types
 */
const getOTPSubject = (type: OTPType): string => {
  switch (type) {
    case "sign-up":
    case "sign-in":
      // Both sign-up and sign-in use the same message for account creation/verification
      return "Verify your email to create your account";
    case "email-verification":
      return "Verify your email address";
    case "forget-password":
      return "Reset your password";
    default:
      return "Your verification code";
  }
};

/**
 * Generate HTML email template for OTP
 */
const generateOTPEmailHTML = (subject: string, otp: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${escapeHtml(subject)}</h2>
      <p>Your verification code is:</p>
      <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
        ${escapeHtml(otp)}
      </div>
      <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
      <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
    </div>
  `;
};

/**
 * Generate plain text email template for OTP
 */
const generateOTPEmailText = (otp: string): string => {
  return `Your verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`;
};

/**
 * Get Resend client (lazy initialization for testability)
 * Returns null if API key is not configured (for development)
 */
const getResendClient = (): Resend | null => {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
};

/**
 * Get the "from" email address
 * Throws an error if RESEND_FROM_EMAIL is not set when RESEND_API_KEY is configured
 */
const getFromEmail = (): string => {
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error(
      "RESEND_FROM_EMAIL environment variable is required when RESEND_API_KEY is set. " +
        "Please set RESEND_FROM_EMAIL to a valid email address in the format: " +
        "'email@example.com' or 'Name <email@example.com>'"
    );
  }
  return fromEmail;
};

/**
 * Send OTP verification email via Resend
 * Falls back to console logging if Resend is not configured
 */
export const sendOTPEmail = async ({
  email,
  otp,
  type,
}: SendOTPParams): Promise<void> => {
  // Lazy initialization for testability (checks env var on each call)
  const resend = getResendClient();

  // If Resend is not configured, log to console for development
  if (!resend) {
    console.log(
      `[Email OTP] RESEND_API_KEY not set. OTP for ${email}: ${otp} (type: ${type})`
    );
    return;
  }

  // Get from email (will throw if not set)
  let fromEmail: string;
  try {
    fromEmail = getFromEmail();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Email OTP] Configuration error:", errorMessage);
    throw error;
  }

  const subject = getOTPSubject(type);
  const html = generateOTPEmailHTML(subject, otp);
  const text = generateOTPEmailText(otp);

  // Log request details for debugging
  console.log("[Email OTP] Sending email:", {
    to: email,
    from: fromEmail,
    subject: subject,
    type: type,
  });

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: subject,
      html: html,
      text: text,
    });

    // Log success (Resend returns { data: { id: string } } on success)
    if (result.data && "id" in result.data) {
      console.log("[Email OTP] Email sent successfully:", {
        emailId: result.data.id,
        to: email,
      });
    } else {
      console.log("[Email OTP] Email sent successfully to:", email);
    }
  } catch (error: unknown) {
    // Enhanced error logging with detailed information
    const errorDetails: Record<string, unknown> = {
      message: error instanceof Error ? error.message : String(error),
      to: email,
      from: fromEmail,
      subject: subject,
      type: type,
    };

    // Try to extract additional error information if available
    if (error && typeof error === "object") {
      if ("name" in error) errorDetails.name = error.name;
      if ("statusCode" in error) errorDetails.statusCode = error.statusCode;
      if ("response" in error) {
        try {
          errorDetails.response = error.response;
        } catch {
          // Ignore if response can't be serialized
        }
      }
    }

    console.error("[Email OTP] Failed to send email via Resend:", errorDetails);
    console.error("[Email OTP] Full error object:", error);

    // Re-throw so Better Auth can handle the error state
    throw error;
  }
};
