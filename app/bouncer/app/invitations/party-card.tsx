import Link from "next/link";
import type { Party } from "@/lib/types";
import { ReceiptCanvas } from "@/lib/webgl/receipt-canvas";
import { CloudCanvas } from "@/lib/webgl/cloud-canvas";
import { LocalDateTime } from "@/app/components/local-date-time";

interface PartyCardProps {
  party: Party;
}

export function PartyCard({ party }: PartyCardProps) {
  const hasReceiptPreview =
    party.slug === "housewarming-2024" || party.slug === "launch-party-2026";
  const hasCloudPreview = party.slug === "whats-the-move-2026";

  return (
    <div className="group w-[calc(50%-0.5rem)] md:w-auto">
      <Link href={`/parties/${party.slug}`} className="block" prefetch={true}>
        <div className="relative backdrop-blur-md rounded-lg p-6 border-2 border-black transition-all duration-300 group-hover:border-black cursor-pointer flex flex-col overflow-hidden aspect-[3/4] md:w-[240px] md:h-[320px]">
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

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full justify-start">
            <h3
              className={`text-xl font-semibold mb-4 transition-colors text-left line-clamp-3 ${
                hasCloudPreview
                  ? "text-black/90 group-hover:text-black"
                  : "text-black/90 group-hover:text-black"
              }`}
            >
              {party.name}
            </h3>
            <p
              className={`text-sm text-left leading-relaxed ${
                hasCloudPreview ? "text-black/70" : "text-black/70"
              }`}
            >
              <LocalDateTime dateTime={party.time} mode="date" />
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
