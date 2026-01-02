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
 */
const getFromEmail = (): string => {
  return process.env.RESEND_FROM_EMAIL || "Party Platform <[email protected]>";
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
  const fromEmail = getFromEmail();

  // If Resend is not configured, log to console for development
  if (!resend) {
    console.log(
      `[Email OTP] RESEND_API_KEY not set. OTP for ${email}: ${otp} (type: ${type})`
    );
    return;
  }

  try {
    const subject = getOTPSubject(type);
    const html = generateOTPEmailHTML(subject, otp);
    const text = generateOTPEmailText(otp);

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: subject,
      html: html,
      text: text,
    });
  } catch (error) {
    // Log error and re-throw so Better Auth can handle the error state
    console.error("[Email OTP] Failed to send email via Resend:", error);
    throw error;
  }
};
