import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-semibold mb-8">Account Settings</h1>

      <div className="space-y-6">
        <div className="border-b pb-6">
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
        </div>

        <div className="pt-4">
          <p className="text-sm text-gray-500">
            Profile editing will be available soon.
          </p>
        </div>

        <div className="pt-4">
          <a href="/invitations" className="text-blue-600 hover:underline">
            ← Back to Invitations
          </a>
        </div>
      </div>
    </div>
  );
}
