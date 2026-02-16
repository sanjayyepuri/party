import { LogoutButton } from "@/components/auth/logout-button";
import { PartyCardList } from "./party-card-list";
import { NextPartyHighlight } from "./next-party-highlight";
import type { Party } from "@/lib/types";

interface InvitationsContentProps {
  userName: string;
  parties: Party[];
  partiesError: string | null;
}

export function InvitationsContent({
  userName,
  parties,
  partiesError,
}: InvitationsContentProps) {
  const now = new Date();
  const sortedParties = [...parties].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
  );

  // Find the next party (earliest future party)
  const nextParty = sortedParties.reduce<Party | null>((closest, party) => {
    const partyTime = new Date(party.time);
    if (partyTime < now) {
      return closest;
    }
    if (!closest) {
      return party;
    }
    const closestTime = new Date(closest.time);
    return partyTime < closestTime ? party : closest;
  }, null);

  // Separate previous parties (parties in the past), already sorted most recent first.
  const previousParties = sortedParties.filter((party) => {
    const partyTime = new Date(party.time);
    return partyTime < now;
  });

  return (
    <div className="">
      <div className="flex-1">
        <h1 className="lowercase text-4xl mb-6">hey {userName}.</h1>
        <p className="text-lg opacity-80 mb-4">welcome to the party.</p>

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
            <>
              {/* Next Party Highlight */}
              {nextParty && (
                <div className="mb-8 pt-6 border-t border-white/20">
                  <NextPartyHighlight party={nextParty} />
                </div>
              )}

              {/* Previous Parties */}
              {previousParties.length > 0 && (
                <div className="pt-6 border-t border-white/20">
                  <PartyCardList parties={previousParties} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Account management */}
        <div className="flex flex-col gap-2 mb-8">
          <a
            href="/settings"
            className="flex items-center gap-2 hover:opacity-100 opacity-80 transition-opacity text-sm"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
            manage account
          </a>

          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
