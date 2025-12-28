/**
 * Login Page
 *
 * Passwordless authentication with passkeys and magic links.
 * Uses PasskeyLoginForm component which provides:
 * - Passkey authentication with conditional UI autofill
 * - Magic link fallback for unsupported browsers
 * - Mode switching between authentication methods
 * - Graceful degradation
 */

import { PasskeyLoginForm } from "@/components/auth/passkey-login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <PasskeyLoginForm />
    </div>
  );
}
