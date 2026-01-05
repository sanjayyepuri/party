import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { fetchPartyBySlug, fetchRsvp } from "@/lib/api-client";
import Link from "next/link";
import { RsvpForm } from "./rsvp-form";

interface PartyPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PartyPage({ params }: PartyPageProps) {
  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If no session, redirect to home page
  if (!session) {
    redirect("/");
  }

  // Get slug from params
  const { slug } = await params;

  // Fetch party by slug
  let party;
  let partyError: string | null = null;
  try {
    party = await fetchPartyBySlug(slug);
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

  // Fetch user's RSVP for this party
  let rsvp;
  let rsvpError: string | null = null;
  try {
    rsvp = await fetchRsvp(party.party_id);
  } catch (error) {
    rsvpError = error instanceof Error ? error.message : "Failed to load RSVP";
  }

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
    <div className="">
      <div className="mb-6">
        <Link
          href="/invitations"
          className="text-sm opacity-80 hover:opacity-100 transition-opacity"
        >
          ← Back to invitations
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl mb-4">{party.name}</h1>
        <div className="space-y-2 text-lg opacity-80">
          <p>
            <strong>When:</strong> {formattedDate} at {formattedTime}
          </p>
          <p>
            <strong>Where:</strong> {party.location}
          </p>
        </div>
      </div>

      {party.description && (
        <div className="mb-8 p-4 bg-white/5 rounded border border-white/10">
          <p className="whitespace-pre-wrap">{party.description}</p>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl mb-4">RSVP</h2>
        {rsvpError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
            <p className="font-medium">Error loading RSVP</p>
            <p className="text-sm">{rsvpError}</p>
          </div>
        )}
        {!rsvpError && rsvp && <RsvpForm initialRsvp={rsvp} />}
        {!rsvpError && !rsvp && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded text-gray-600">
            <p>Loading RSVP...</p>
          </div>
        )}
      </div>
    </div>
  );
}
