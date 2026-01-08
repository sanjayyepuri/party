import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { fetchParties } from "@/lib/api-client";
import type { Party } from "@/lib/types";
import { InvitationsContent } from "./invitations-content";

export default async function InvitationsPage() {
  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If no session, redirect to home page
  if (!session) {
    redirect("/");
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
    <InvitationsContent
      userName={userName}
      parties={parties}
      partiesError={partiesError}
    />
  );
}
