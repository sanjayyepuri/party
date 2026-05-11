import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { fetchPartyBySlug, fetchPartyRsvps } from "@/lib/api-client";
import { CloudPartyInvitation } from "./cloud-party-invitation";

export default async function May30CloudPartyPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  let party;
  let partyError: string | null = null;
  try {
    party = await fetchPartyBySlug("whats-the-move-2026");
  } catch (error) {
    partyError =
      error instanceof Error ? error.message : "Failed to load party";
  }

  if (!party && !partyError) {
    notFound();
  }

  if (partyError || !party) {
    return (
      <div className="p-4">
        <div className="mb-6">
          <Link
            href="/invitations"
            className="text-sm opacity-80 transition-opacity hover:opacity-100"
          >
            ← Back to invitations
          </Link>
        </div>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-medium">Error loading party</p>
          <p className="text-sm">{partyError || "Party not found"}</p>
        </div>
      </div>
    );
  }

  let partyRsvps: Awaited<ReturnType<typeof fetchPartyRsvps>> | null = null;
  let partyRsvpsError: string | null = null;
  try {
    partyRsvps = await fetchPartyRsvps(party.party_id);
  } catch (error) {
    partyRsvpsError =
      error instanceof Error ? error.message : "Failed to load party RSVPs";
  }

  return (
    <CloudPartyInvitation
      party={party}
      partyRsvps={partyRsvps}
      partyRsvpsError={partyRsvpsError}
      currentUserId={session.user.id}
    />
  );
}
