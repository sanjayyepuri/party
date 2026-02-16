import Link from "next/link";
import type { Party } from "@/lib/types";
import { HousewarmingCard } from "./housewarming-card";

interface NextPartyHighlightProps {
  party: Party;
}

export function NextPartyHighlight({ party }: NextPartyHighlightProps) {
  const isHousewarming = party.slug === "housewarming-2024";
  const partyDate = new Date(party.time);
  const formattedDate = partyDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mb-8 md:mb-12">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
        {/* Card - same size as other cards */}
        <div className="w-full md:w-auto">
          {isHousewarming ? (
            <HousewarmingCard party={party} />
          ) : (
            <Link
              href={`/parties/${party.slug}`}
              className="block"
              prefetch={true}
            >
              <div className="relative backdrop-blur-md rounded-lg p-6 border-2 border-black transition-all duration-300 hover:border-black cursor-pointer flex flex-col overflow-hidden aspect-[3/4] md:w-[240px] md:h-[320px]">
                {/* Content */}
                <div className="relative z-10 flex flex-col h-full justify-start">
                  <h3 className="text-2xl md:text-3xl mb-4 font-extrabold text-black/90 hover:text-black transition-colors text-left line-clamp-3">
                    {party.name}
                  </h3>
                  <p className="text-base md:text-lg text-left leading-relaxed font-bold text-black/70">
                    {formattedDate}
                  </p>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Description - to the right of the card */}
        <div className="flex-1 pt-2">
          <div className="text-2xl text-black/80 leading-tight tracking-tighter">
            {party.description || (
              <span className="opacity-60 italic">
                No description available.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
