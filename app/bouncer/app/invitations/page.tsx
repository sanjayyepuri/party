
import { redirect } from "next/navigation";
import { getServerSession, getLogoutFlow } from "@ory/nextjs/app";

async function LogoutLink() {
  const flow = await getLogoutFlow()
  return (
    <a className="inline-block hover:underline transition-all opacity-60 hover:opacity-100" href={flow.logout_url}>
      sign out
    </a>
  )
}

export default async function InvitationsPage() {
  // Check if user is authenticated
  const session = await getServerSession();

  // If no session, redirect to welcome page
  if (!session) {
    redirect("/auth/login");
  }

  // User is authenticated, show welcome message
  const userEmail = session.identity?.traits?.email || "there";

  return (
    <div className="">
      <div className="flex-1">
        <h1 className="text-4xl mb-6">hey {userEmail}.</h1>
        <p className="text-lg opacity-80 mb-8">welcome to the party.</p>

        <div className="space-y-4">
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
  );
}
