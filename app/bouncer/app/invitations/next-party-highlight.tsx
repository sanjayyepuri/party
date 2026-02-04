import Link from "next/link";
import type { Party } from "@/lib/types";
import { ReceiptCanvas } from "@/lib/webgl";

interface NextPartyHighlightProps {
  party: Party;
}

export function NextPartyHighlight({ party }: NextPartyHighlightProps) {
  const isHousewarming = party.slug === "housewarming-2024";

  return (
    <div className="mb-8 md:mb-12">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
        {/* Card - same size as other cards */}
        <div className="w-full md:w-auto">
          <Link
            href={`/parties/${party.slug}`}
            className="block"
            prefetch={true}
          >
            <div className="relative backdrop-blur-md rounded-lg p-6 border-2 border-black transition-all duration-300 hover:border-black cursor-pointer flex flex-col overflow-hidden aspect-[3/4] md:w-[240px] md:h-[320px]">
              {/* Canvas preview for housewarming */}
              {isHousewarming && (
                <div className="absolute inset-0 rounded-lg overflow-hidden z-0 backdrop-blur-sm">
                  <ReceiptCanvas
                    className="w-full h-full"
                    pixelSize={8.0}
                    scale={0.5}
                  />
                </div>
              )}

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full justify-start">
                <h3 className="text-xl font-semibold mb-4 text-black/90 hover:text-black transition-colors text-left line-clamp-3">
                  {party.name}
                </h3>
                <p className="text-sm text-black/70 text-left leading-relaxed">
                  {new Date(party.time).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </Link>
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
