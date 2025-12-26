import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function InvitationsPage() {
  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If no session, redirect to login page
  if (!session) {
    redirect("/auth/login");
  }

  // User is authenticated, show welcome message
  const userEmail = session.user.email || "there";

  return (
    <div className="">
      <div className="flex-1">
        <h1 className="text-4xl mb-6">hey {userEmail}.</h1>
        <p className="text-lg opacity-80 mb-8">welcome to the party.</p>

        {/* Parties Section */}
        <div className="mb-12">
          <h2 className="text-2xl mb-4">your invitations</h2>

          <div className="space-y-4 pt-6 border-t border-white/20">
            <a
              href="/settings"
              className="inline-block hover:underline transition-all"
            >
              manage your account →
            </a>
            <br />

            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
