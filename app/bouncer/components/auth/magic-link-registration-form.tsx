/**
 * Magic Link Registration Form Component
 *
 * Passwordless registration flow:
 * 1. User enters name and email
 * 2. System sends magic link to email
 * 3. User clicks link → account created + session established
 * 4. Redirect to passkey setup page
 *
 * Design Philosophy:
 * - Minimal friction (no password required)
 * - Clear user feedback
 * - Validation with helpful messages
 * - Smooth transition to passkey setup
 */

"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";

// ============================================================================
// Component
// ============================================================================

export function MagicLinkRegistrationForm() {
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Validate form inputs
   *
   * Pure function: Returns validation errors without side effects
   *
   * @returns Error message or empty string if valid
   */
  const validateForm = (): string => {
    if (!name.trim()) {
      return "Please enter your name";
    }

    if (name.trim().length < 2) {
      return "Name must be at least 2 characters";
    }

    if (!email.trim()) {
      return "Please enter your email address";
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }

    return "";
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle form submission
   *
   * Validates input, sends magic link, shows confirmation
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Send magic link with user data
      // signIn.magicLink() handles both registration and login
      // If user doesn't exist, they'll be registered automatically
      await signIn.magicLink({
        email: email.trim(),
        // Name for new user creation
        name: name.trim(),
        // After magic link verification, redirect to passkey setup
        callbackURL: "/auth/setup-passkey",
      });

      setSent(true);
    } catch (err) {
      // Handle errors
      if (err instanceof Error && err.message.includes("already exists")) {
        setError("An account with this email already exists. Try signing in instead.");
      } else {
        setError("Failed to send registration link. Please try again.");
      }
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset form to try again
   */
  const handleTryAgain = () => {
    setSent(false);
    setError("");
  };

  // ============================================================================
  // Render
  // ============================================================================

  /**
   * Confirmation State
   * Show after successfully sending magic link
   */
  if (sent) {
    return (
      <div className="max-w-md mx-auto text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold mb-4">Check your email</h2>

        {/* Message */}
        <p className="text-gray-600 mb-2">
          We sent a registration link to
        </p>
        <p className="text-gray-900 font-semibold mb-6">{email}</p>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <p className="text-sm text-blue-900 mb-2">
            <strong>Next steps:</strong>
          </p>
          <ol className="text-sm text-blue-800 text-left space-y-1 list-decimal list-inside">
            <li>Click the link in your email</li>
            <li>Set up biometric login (passkey)</li>
            <li>Start managing your party invitations</li>
          </ol>
        </div>

        {/* Expiration Notice */}
        <p className="text-sm text-gray-500 mb-6">
          The link expires in 5 minutes.
        </p>

        {/* Try Again Button */}
        <button
          onClick={handleTryAgain}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Try a different email
        </button>
      </div>
    );
  }

  /**
   * Registration Form State
   * Main form for new user registration
   */
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-2 text-center">Create Account</h2>
      <p className="text-gray-600 mb-6 text-center text-sm">
        Get started with passwordless authentication
      </p>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-700">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your full name"
            disabled={loading}
            autoComplete="name"
          />
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your@email.com"
            disabled={loading}
            autoComplete="email"
          />
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-900">
            <strong>No password required!</strong>
          </p>
          <p className="text-xs text-blue-800 mt-1">
            We'll send you a secure link to complete registration and set up biometric login.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Sending link...
            </span>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <a href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
          Sign in
        </a>
      </div>

      {/* Security Notice */}
      <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <div>
            <p className="text-xs text-gray-700 font-medium">Secure & Private</p>
            <p className="text-xs text-gray-600 mt-1">
              Your data is encrypted and we never share your information with third parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
