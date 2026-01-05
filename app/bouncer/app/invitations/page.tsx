import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { LogoutButton } from "@/components/auth/logout-button";
import { fetchParties } from "@/lib/api-client";
import type { Party } from "@/lib/types";
import Link from "next/link";

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
  const rawName = session.user?.name;
  const rawEmail = session.user?.email;
  const userName =
    typeof rawName === "string" && rawName.trim()
      ? rawName.trim().split(" ")[0].toLowerCase()
      : typeof rawEmail === "string" && rawEmail.trim()
        ? rawEmail.trim()
        : "there";

  // Fetch parties
  let parties: Party[] = [];
  let partiesError: string | null = null;
  try {
    parties = await fetchParties();
  } catch (error) {
    partiesError =
      error instanceof Error ? error.message : "Failed to load parties";
    parties = [];
  }

  return (
    <div className="">
      <div className="flex-1">
        <h1 className="lowercase text-4xl mb-6 ">hey {userName}.</h1>
        <p className="text-lg opacity-80 mb-8">welcome to the party.</p>
        <div className="space-y-4 pt-6 border-t border-white/20 mt-8">
          <a
            href="/settings"
            className="inline-block hover:underline transition-all"
          >
            manage your account →
          </a>
          <br />

          <LogoutButton />
        </div>

        {/* Parties Section */}
        <div className="mb-12">
          <h2 className="text-2xl mb-4">your invitations</h2>

          {partiesError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
              <p className="font-medium">Error loading parties</p>
              <p className="text-sm">{partiesError}</p>
            </div>
          )}

          {!partiesError && parties.length === 0 && (
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded text-gray-600">
              <p>No parties available at the moment.</p>
            </div>
          )}

          {!partiesError && parties.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-white/20">
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
                });
                return (
                  <Link
                    key={party.party_id}
                    href={`/parties/${party.slug}`}
                    className="block p-4 border border-white/20 rounded hover:border-white/40 transition-all hover:bg-white/5"
                  >
                    <h3 className="text-xl font-semibold mb-2">{party.name}</h3>
                    <div className="space-y-1 text-sm opacity-80">
                      <p>
                        {formattedDate} at {formattedTime}
                      </p>
                      <p>{party.location}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
