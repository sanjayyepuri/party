import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { fetchPartyBySlug, fetchPartyRsvps } from "@/lib/api-client";
import { HousewarmingInvitation } from "./housewarming-invitation";
import Link from "next/link";

export default async function HousewarmingPartyPage() {
  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If no session, redirect to home page
  if (!session) {
    redirect("/");
  }

  // Fetch party by slug
  let party;
  let partyError: string | null = null;
  try {
    party = await fetchPartyBySlug("housewarming-2024");
  } catch (error) {
    partyError =
      error instanceof Error ? error.message : "Failed to load party";
  }

  // If party not found, show 404
  if (!party && !partyError) {
    notFound();
  }

  // If there was an error fetching, show error
  if (partyError || !party) {
    return (
      <div className="">
        <div className="mb-6">
          <Link
            href="/invitations"
            className="text-sm opacity-80 hover:opacity-100 transition-opacity"
          >
            ← Back to invitations
          </Link>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">
          <p className="font-medium">Error loading party</p>
          <p className="text-sm">{partyError || "Party not found"}</p>
        </div>
      </div>
    );
  }

  // Fetch all RSVPs for this party
  let partyRsvps: Awaited<ReturnType<typeof fetchPartyRsvps>> | null = null;
  let partyRsvpsError: string | null = null;
  try {
    partyRsvps = await fetchPartyRsvps(party.party_id);
  } catch (error) {
    partyRsvpsError =
      error instanceof Error ? error.message : "Failed to load party RSVPs";
  }

  return (
    <HousewarmingInvitation
      party={party}
      partyRsvps={partyRsvps}
      partyRsvpsError={partyRsvpsError}
      currentUserId={session.user.id}
    />
  );
}
