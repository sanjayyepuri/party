import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { fetchPartyBySlug, fetchPartyRsvps } from "@/lib/api-client";
import { SimpleInvitation } from "./simple-invitation";

const PARTY_SLUG = "keep-it-simple-stupid-2026";

export default async function KeepItSimpleStupidPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  let party;
  let partyError: string | null = null;
  try {
    party = await fetchPartyBySlug(PARTY_SLUG);
  } catch (error) {
    partyError =
      error instanceof Error ? error.message : "Failed to load party";
  }

  if (!party && !partyError) {
    notFound();
  }

  if (partyError || !party) {
    return (
      <div className="border-2 border-black bg-white p-4 text-black">
        <Link href="/invitations" className="text-sm uppercase underline">
          ← Invitations
        </Link>
        <h1 className="mt-8 text-2xl font-bold uppercase">
          Error loading party
        </h1>
        <p className="mt-2 text-sm">{partyError || "Party not found"}</p>
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
    <SimpleInvitation
      party={party}
      partyRsvps={partyRsvps}
      partyRsvpsError={partyRsvpsError}
      currentUserId={session.user.id}
    />
  );
}
