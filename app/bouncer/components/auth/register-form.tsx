"use client";

import { useState, useEffect } from "react";
import { passkey, signIn, emailOtp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

type Step = "email" | "otp" | "passkey";

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPasskeySupported, setIsPasskeySupported] = useState(true); // Default to true to avoid hydration mismatch

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate name and email before proceeding
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    
    if (!trimmedName) {
      setError("Name is required");
      return;
    }
    if (!trimmedEmail) {
      setError("Email is required");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Send OTP to email
      // Use "sign-in" type which will allow account creation if user doesn't exist
      const otpResult = await emailOtp.sendVerificationOtp({
        email: trimmedEmail,
        type: "sign-in",
      });

      if (otpResult.error) {
        setError(otpResult.error.message || "Failed to send verification code");
        setLoading(false);
        return;
      }

      // Move to OTP verification step
      setStep("otp");
      setLoading(false);
    } catch (err) {
      console.error("OTP send error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp.trim()) {
      setError("Verification code is required");
      return;
    }

    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      const trimmedName = name.trim();

      // Step 2: Verify OTP and sign in (creates account if doesn't exist)
      const signInResult = await signIn.emailOtp({
        email: trimmedEmail,
        otp: otp.trim(),
      });

      if (signInResult.error) {
        const errorMessage = signInResult.error.message || "Invalid verification code";
        if (errorMessage.includes("expired") || errorMessage.includes("invalid")) {
          setError("Invalid or expired verification code. Please request a new one.");
        } else {
          setError(errorMessage);
        }
        setLoading(false);
        return;
      }

      // Step 3: Update user name if provided (since signIn doesn't set name)
      // Note: This might require a separate API call if better-auth doesn't support it
      // For now, we'll proceed to passkey creation

      // Step 4: Move to passkey creation step
      setStep("passkey");
      setLoading(false);
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handlePasskeyCreation = async () => {
    setError("");
    setLoading(true);

    try {
      const trimmedName = name.trim();

      // Step 5: Add passkey to the account
      const passkeyResult = await passkey.addPasskey({
        name: `${trimmedName}'s Passkey`,
      });

      if (passkeyResult.error) {
        const errorMessage = passkeyResult.error.message || "Failed to create passkey";
        
        // Provide user-friendly error messages
        if (errorMessage.includes("NotAllowedError") || errorMessage.includes("cancelled")) {
          setError("Passkey creation was cancelled. Please try again.");
        } else if (errorMessage.includes("NotSupportedError")) {
          setError("Passkeys are not supported in this browser. Please use a modern browser that supports WebAuthn.");
        } else if (errorMessage.includes("InvalidStateError")) {
          setError("A passkey already exists for this account.");
        } else {
          setError(errorMessage);
        }
        setLoading(false);
        return;
      }

      // Success - redirect to invitations
      router.push("/invitations");
      router.refresh();
    } catch (err) {
      console.error("Passkey creation error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      const otpResult = await emailOtp.sendVerificationOtp({
        email: trimmedEmail,
        type: "sign-in",
      });

      if (otpResult.error) {
        setError(otpResult.error.message || "Failed to resend verification code");
      } else {
        setError(""); // Clear any previous errors
        // Show success message (you could add a success state here)
      }
      setLoading(false);
    } catch (err) {
      console.error("OTP resend error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  // Check if passkeys are supported (client-side only to avoid hydration mismatch)
  useEffect(() => {
    setIsPasskeySupported(
      typeof window !== "undefined" && 
      typeof window.PublicKeyCredential !== "undefined"
    );
  }, []);

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Create Account</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {!isPasskeySupported && step === "passkey" && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded">
          Your browser does not support passkeys. Please use a modern browser that supports WebAuthn.
        </div>
      )}

      {step === "email" && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 px-4 rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Sending verification code...</span>
              </>
            ) : (
              <>
                <span>📧</span>
                <span>Send Verification Code</span>
              </>
            )}
          </button>

          <p className="text-sm text-gray-600 text-center">
            We&apos;ll send a verification code to your email address.
          </p>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              We&apos;ve sent a verification code to <strong>{email}</strong>. Please enter it below.
            </p>
            <label htmlFor="otp" className="block text-sm font-medium mb-1">
              Verification Code
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              maxLength={6}
              placeholder="000000"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
              disabled={loading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-black text-white py-3 px-4 rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>✓</span>
                <span>Verify Code</span>
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              className="text-sm text-blue-600 hover:underline disabled:text-gray-400"
            >
              Resend code
            </button>
          </div>
        </form>
      )}

      {step === "passkey" && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded">
            <p className="font-medium">Email verified!</p>
            <p className="text-sm mt-1">Now let&apos;s create a passkey for secure authentication.</p>
          </div>

          <button
            type="button"
            onClick={handlePasskeyCreation}
            disabled={loading || !isPasskeySupported}
            className="w-full bg-black text-white py-3 px-4 rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Creating passkey...</span>
              </>
            ) : (
              <>
                <span>🔐</span>
                <span>Create Passkey</span>
              </>
            )}
          </button>

          <p className="text-sm text-gray-600 text-center">
            You&apos;ll be prompted to create a passkey using your device&apos;s biometric authentication or security key.
          </p>
        </div>
      )}

      <div className="mt-6 text-center text-sm">
        Already have an account?{" "}
        <a href="/auth/login" className="text-blue-600 hover:underline">
          Sign in
        </a>
      </div>
    </div>
  );
}
