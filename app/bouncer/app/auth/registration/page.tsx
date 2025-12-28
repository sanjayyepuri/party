/**
 * Registration Page
 *
 * Passwordless registration flow using magic links.
 * User journey:
 * 1. Enter name and email
 * 2. Receive magic link in email
 * 3. Click link → account created + session established
 * 4. Redirected to passkey setup page
 *
 * Design Philosophy:
 * - No passwords required
 * - Minimal friction
 * - Clear user feedback at each step
 */

import { MagicLinkRegistrationForm } from "@/components/auth/magic-link-registration-form";

export default function RegistrationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <MagicLinkRegistrationForm />
    </div>
  );
}
