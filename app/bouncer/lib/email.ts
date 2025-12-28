/**
 * Email Service Abstraction
 *
 * Provides a functional interface for sending emails through Resend.
 * This abstraction allows for easy switching between email providers
 * (Resend, SendGrid, AWS SES) by modifying only this file.
 *
 * Design Principles:
 * - Pure interface (side effects isolated to sendEmail function)
 * - Type-safe email parameters
 * - Composable email templates
 * - Error handling with meaningful messages
 */

import { Resend } from "resend";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Lazy initialization of Resend client
 * Only creates instance when actually sending email
 * Allows build to succeed even without API key
 */
function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY environment variable is not set. " +
      "Please add it to your .env file or configure another email provider."
    );
  }
  return new Resend(apiKey);
}

/**
 * Email sender configuration
 * Format: "Name <email@domain.com>"
 */
const DEFAULT_FROM = process.env.EMAIL_FROM || "Party Platform <noreply@localhost>";

// ============================================================================
// Types
// ============================================================================

/**
 * Email parameters
 * All fields required for type safety
 */
export interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Email template data
 * Used to generate HTML content
 */
export interface MagicLinkData {
  url: string;
  email: string;
  expiresInMinutes?: number;
}

// ============================================================================
// Core Email Function
// ============================================================================

/**
 * Send email via configured provider
 *
 * @param params Email parameters (to, subject, html)
 * @returns Promise that resolves when email sent
 * @throws Error if email sending fails
 *
 * Note: This is the only impure function in this module.
 * All other functions are pure template generators.
 */
export async function sendEmail({ to, subject, html }: EmailParams): Promise<void> {
  try {
    // Lazy initialization - only create Resend instance when needed
    const resend = getResendClient();

    const result = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
    });

    if (!result.data) {
      throw new Error("Email sending failed: No response data");
    }

    console.log(`Email sent successfully to ${to}: ${result.data.id}`);
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// ============================================================================
// Email Templates (Pure Functions)
// ============================================================================

/**
 * Generate magic link registration email HTML
 *
 * Pure function: Same input always produces same output
 *
 * @param data Magic link data
 * @returns HTML string for email body
 */
export function generateMagicLinkRegistrationEmail(data: MagicLinkData): string {
  const { url, email, expiresInMinutes = 5 } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Party Platform</title>
      </head>
      <body style="
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f5f5f5;
      ">
        <div style="
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        ">
          <!-- Header -->
          <div style="
            background: #000;
            color: #fff;
            padding: 32px 24px;
            text-align: center;
          ">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">
              Welcome to Party Platform
            </h1>
          </div>

          <!-- Body -->
          <div style="padding: 32px 24px;">
            <p style="margin: 0 0 16px; font-size: 16px;">
              Hi there,
            </p>
            <p style="margin: 0 0 24px; font-size: 16px;">
              Click the button below to complete your registration and set up secure biometric login.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${url}" style="
                display: inline-block;
                background: #000;
                color: #fff;
                text-decoration: none;
                padding: 14px 32px;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 600;
                transition: background 0.2s;
              ">
                Complete Registration
              </a>
            </div>

            <p style="margin: 24px 0 8px; font-size: 14px; color: #666;">
              Or copy and paste this link into your browser:
            </p>
            <p style="
              margin: 0 0 24px;
              padding: 12px;
              background: #f5f5f5;
              border-radius: 4px;
              font-size: 12px;
              word-break: break-all;
              color: #666;
            ">
              ${url}
            </p>

            <!-- Security Notice -->
            <div style="
              margin-top: 32px;
              padding: 16px;
              background: #f0f9ff;
              border-left: 4px solid #0284c7;
              border-radius: 4px;
            ">
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #0c4a6e;">
                🔒 Security Notice
              </p>
              <p style="margin: 0; font-size: 13px; color: #075985;">
                This link expires in <strong>${expiresInMinutes} minutes</strong> and can only be used once.<br>
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="
            padding: 24px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            text-align: center;
          ">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              Sent to ${email}<br>
              Party Invitation Platform
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate magic link login email HTML
 *
 * Pure function: Same input always produces same output
 *
 * @param data Magic link data
 * @returns HTML string for email body
 */
export function generateMagicLinkLoginEmail(data: MagicLinkData): string {
  const { url, email, expiresInMinutes = 5 } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sign in to Party Platform</title>
      </head>
      <body style="
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f5f5f5;
      ">
        <div style="
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        ">
          <!-- Header -->
          <div style="
            background: #000;
            color: #fff;
            padding: 32px 24px;
            text-align: center;
          ">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">
              Sign in to Party Platform
            </h1>
          </div>

          <!-- Body -->
          <div style="padding: 32px 24px;">
            <p style="margin: 0 0 16px; font-size: 16px;">
              Hi there,
            </p>
            <p style="margin: 0 0 24px; font-size: 16px;">
              Click the button below to sign in to your account.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${url}" style="
                display: inline-block;
                background: #000;
                color: #fff;
                text-decoration: none;
                padding: 14px 32px;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 600;
              ">
                Sign In
              </a>
            </div>

            <p style="margin: 24px 0 8px; font-size: 14px; color: #666;">
              Or copy and paste this link into your browser:
            </p>
            <p style="
              margin: 0 0 24px;
              padding: 12px;
              background: #f5f5f5;
              border-radius: 4px;
              font-size: 12px;
              word-break: break-all;
              color: #666;
            ">
              ${url}
            </p>

            <!-- Security Notice -->
            <div style="
              margin-top: 32px;
              padding: 16px;
              background: #f0f9ff;
              border-left: 4px solid #0284c7;
              border-radius: 4px;
            ">
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #0c4a6e;">
                🔒 Security Notice
              </p>
              <p style="margin: 0; font-size: 13px; color: #075985;">
                This link expires in <strong>${expiresInMinutes} minutes</strong> and can only be used once.<br>
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>

            <!-- Tip -->
            <div style="
              margin-top: 24px;
              padding: 16px;
              background: #fefce8;
              border-left: 4px solid #facc15;
              border-radius: 4px;
            ">
              <p style="margin: 0; font-size: 13px; color: #713f12;">
                <strong>Tip:</strong> Set up a passkey after signing in for faster, more secure logins without email links.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="
            padding: 24px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            text-align: center;
          ">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              Sent to ${email}<br>
              Party Invitation Platform
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Send magic link registration email
 *
 * Composes email template generation and sending
 *
 * @param to Recipient email address
 * @param url Magic link URL
 * @returns Promise that resolves when email sent
 */
export async function sendMagicLinkRegistrationEmail(to: string, url: string): Promise<void> {
  const html = generateMagicLinkRegistrationEmail({ url, email: to });
  await sendEmail({
    to,
    subject: "Complete your registration - Party Platform",
    html,
  });
}

/**
 * Send magic link login email
 *
 * Composes email template generation and sending
 *
 * @param to Recipient email address
 * @param url Magic link URL
 * @returns Promise that resolves when email sent
 */
export async function sendMagicLinkLoginEmail(to: string, url: string): Promise<void> {
  const html = generateMagicLinkLoginEmail({ url, email: to });
  await sendEmail({
    to,
    subject: "Sign in to Party Platform",
    html,
  });
}
