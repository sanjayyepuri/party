import { PartyCard } from "./party-card";
import type { Party } from "@/lib/types";

interface PartyCardListProps {
  parties: Party[];
}

export function PartyCardList({ parties }: PartyCardListProps) {
  return (
    <div className="flex flex-wrap gap-4 md:gap-6">
      {parties.map((party) => (
        <PartyCard key={party.party_id} party={party} />
      ))}
    </div>
  );
}
