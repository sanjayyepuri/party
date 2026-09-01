import Link from "next/link";
import type { Party } from "@/lib/types";
import { ReceiptCanvas } from "@/lib/webgl/receipt-canvas";
import { CloudCanvas } from "@/lib/webgl/cloud-canvas";
import { LocalDateTime } from "@/app/components/local-date-time";
import { SimplePartyPreview } from "./simple-party-preview";

interface NextPartyHighlightProps {
  party: Party;
}

export function NextPartyHighlight({ party }: NextPartyHighlightProps) {
  const hasReceiptPreview =
    party.slug === "housewarming-2024" || party.slug === "launch-party-2026";
  const hasCloudPreview = party.slug === "whats-the-move-2026";
  const hasSimplePreview = party.slug === "keep-it-simple-stupid-2026";

  return (
    <div className="mb-4 md:mb-8">
      <div className="flex gap-4 md:gap-6 items-start">
        {/* Card - same size as other cards */}
        <div className="w-[clamp(180px,42vw,240px)] flex-shrink-0">
          <Link
            href={`/parties/${party.slug}`}
            className="block"
            prefetch={true}
          >
            <div className="relative w-full backdrop-blur-md rounded-lg p-4 md:p-6 border-2 border-black transition-all duration-300 hover:border-black cursor-pointer flex flex-col overflow-hidden aspect-[3/4]">
              {/* Canvas preview for receipt-style invites */}
              {hasReceiptPreview && (
                <div className="absolute inset-0 rounded-lg overflow-hidden z-0 backdrop-blur-sm">
                  <ReceiptCanvas
                    className="w-full h-full"
                    pixelSize={8.0}
                    scale={0.5}
                  />
                </div>
              )}
              {hasCloudPreview && (
                <div className="absolute inset-0 rounded-lg overflow-hidden z-0">
                  <CloudCanvas className="h-full w-full" compact />
                </div>
              )}
              {hasSimplePreview && <SimplePartyPreview party={party} />}

              {/* Content */}
              <div
                className={`relative z-10 flex h-full flex-col justify-between ${
                  hasSimplePreview ? "invisible" : ""
                }`}
                aria-hidden={hasSimplePreview}
              >
                <div>
                  <h3
                    className={`text-xl font-semibold mb-4 transition-colors text-left leading-tight line-clamp-3 break-words ${
                      hasSimplePreview
                        ? "w-1/2 pr-2 text-white"
                        : "text-black/90 hover:text-black"
                    }`}
                  >
                    {party.name}
                  </h3>
                  <p
                    className={`text-sm text-left leading-relaxed ${
                      hasSimplePreview
                        ? "w-1/2 pr-2 text-white"
                        : "text-black/70"
                    }`}
                  >
                    <LocalDateTime dateTime={party.time} mode="date" />
                  </p>
                </div>
                <span
                  className={`inline-flex self-start items-center gap-1 text-[10px] uppercase tracking-[0.14em] ${
                    hasSimplePreview ? "text-white/75" : "text-black/55"
                  }`}
                >
                  open invitation <span aria-hidden="true">↗</span>
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Description - to the right of the card */}
        <div className="flex-1 min-w-0 pt-1 md:pt-2">
          <div className="text-sm md:text-xl text-black/80 leading-tight tracking-tighter break-words">
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
