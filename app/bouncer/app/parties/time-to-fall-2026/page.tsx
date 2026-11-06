import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { fetchPartyBySlug, fetchPartyRsvps } from "@/lib/api-client";
import { invitationCopy as copy } from "./invitation-copy";
import { FALL_PARTY_SLUG, invitationName } from "./invitation-content";
import { FallInvitation } from "./fall-invitation";

export const metadata: Metadata = {
  title: `${invitationName} · sanjay.party`,
  description: copy.preview.eyebrow,
};

export default async function TimeToFallPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  // A local design preview never loads private data or mounts the RSVP form.
  if (process.env.NODE_ENV === "development" && preview === "true") {
    return <FallInvitation mode="preview" />;
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  let party;
  try {
    party = await fetchPartyBySlug(FALL_PARTY_SLUG);
  } catch {
    return (
      <div role="alert">
        <a href="/invitations">{copy.navigation.back}</a>
        <h1>{copy.messages.invitationUnavailable}</h1>
        <p>{copy.messages.invitationError}</p>
      </div>
    );
  }
  if (!party) notFound();

  let partyRsvps: Awaited<ReturnType<typeof fetchPartyRsvps>> | null = null;
  let partyRsvpsError: string | null = null;
  try {
    partyRsvps = await fetchPartyRsvps(party.party_id);
  } catch (error) {
    partyRsvpsError =
      error instanceof Error ? error.message : copy.messages.retry;
  }

  return (
    <FallInvitation
      mode="live"
      party={party}
      partyRsvps={partyRsvps}
      partyRsvpsError={partyRsvpsError}
      currentUserId={session.user.id}
    />
  );
}
