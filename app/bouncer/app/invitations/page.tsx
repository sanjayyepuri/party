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

  // Fetch parties
  const parties = await getParties();

  return (
    <div className="">
      <div className="flex-1">
        <h1 className="text-4xl mb-6">hey {userEmail}.</h1>
        <p className="text-lg opacity-80 mb-8">welcome to the party.</p>

        {/* Parties Section */}
        <div className="mb-12">
          <h2 className="text-2xl mb-4">your invitations</h2>

          {parties.length === 0 ? (
            <p className="opacity-60">no parties found. check back later!</p>
          ) : (
            <div className="space-y-6">
              {parties.map((party) => {
                const partyDate = new Date(party.time);
                const formattedDate = partyDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
                const formattedTime = partyDate.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });

                return (
                  <div
                    key={party.party_id}
                    className="border border-white/20 rounded-lg p-6 hover:border-white/40 transition-all"
                  >
                    <h3 className="text-2xl mb-2">{party.name}</h3>
                    <div className="space-y-1 opacity-80">
                      <p>
                        📅 {formattedDate} at {formattedTime}
                      </p>
                      <p>📍 {party.location}</p>
                      {party.description && (
                        <p className="mt-3">{party.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
  );
}
