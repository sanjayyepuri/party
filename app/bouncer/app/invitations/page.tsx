import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function LogoutLink() {
  return (
    <form action="/api/auth/sign-out" method="POST">
      <button
        type="submit"
        className="inline-block hover:underline transition-all opacity-60 hover:opacity-100 bg-transparent border-none cursor-pointer p-0 text-inherit font-inherit"
      >
        sign out
      </button>
    </form>
  );
}

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

            <LogoutLink />
          </div>
        </div>
      </div>
    </div>
  );
}
