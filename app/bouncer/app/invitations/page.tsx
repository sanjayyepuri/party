import { redirect } from "next/navigation";
import { getServerSession, getLogoutFlow } from "@ory/nextjs/app";
import { cookies } from "next/headers";

interface Party {
  party_id: string;
  name: string;
  time: string;
  location: string;
  description: string;
  slug: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

async function LogoutLink() {
  const flow = await getLogoutFlow();
  return (
    <a
      className="inline-block hover:underline transition-all opacity-60 hover:opacity-100"
      href={flow.logout_url}
    >
      sign out
    </a>
  );
}

async function getParties(): Promise<Party[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const cookieStore = await cookies();

    const cookieString = cookieStore.toString();

    // Debug: Log what cookies we're sending
    console.log("Cookies being sent:", cookieString);

    // Extract just the ory_session cookie
    const oryCookies = cookieStore
      .getAll()
      .filter((c) => c.name.startsWith("ory_session_"));
    console.log("Ory cookies found:", oryCookies);

    const response = await fetch(`${baseUrl}/api/bouncer/parties`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Failed to fetch parties:",
        response.status,
        response.statusText,
        errorText,
      );
      return [];
    }

    const parties = await response.json();
    return parties;
  } catch (error) {
    console.error("Error fetching parties:", error);
    return [];
  }
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
