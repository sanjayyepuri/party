/**
 * Settings Page
 *
 * User account settings and passkey management.
 *
 * Sections:
 * - Profile Information: Display name and email
 * - Passkey Management: Full CRUD for passkeys
 * - Navigation: Back to invitations
 *
 * Authentication:
 * - Server-side session check
 * - Redirects to login if unauthenticated
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PasskeyManagement } from "@/components/auth/passkey-management";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function SettingsPage() {
  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If no session, redirect to login page
  if (!session) {
    redirect("/auth/login");
  }

  const userName = session.user.name || "User";
  const userEmail = session.user.email;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8">Account Settings</h1>

        <div className="space-y-8">
          {/* Profile Information Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-medium mb-4">Profile Information</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Name
                </label>
                <p className="text-lg">{userName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email
                </label>
                <p className="text-lg">{userEmail}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Profile editing will be available soon.
            </p>
          </div>

          {/* Passkey Management Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <PasskeyManagement />
          </div>

          {/* Account Actions Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-medium mb-4">Account Actions</h2>
            <LogoutButton />
          </div>

          {/* Navigation */}
          <div className="pt-4">
            <a
              href="/invitations"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Invitations
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
