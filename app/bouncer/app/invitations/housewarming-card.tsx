import Link from "next/link";
import type { Party } from "@/lib/types";
import { InvitationShaderCanvas } from "@/lib/webgl/invitation-shader-canvas";

interface HousewarmingCardProps {
  party: Party;
}

export function HousewarmingCard({ party }: HousewarmingCardProps) {
  const partyDate = new Date(party.time);
  const formattedDate = partyDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link href={`/parties/${party.slug}`} className="block" prefetch={true}>
      <div className="relative  rounded-lg p-6 border-2 border-black transition-all duration-300 hover:border-black cursor-pointer flex flex-col overflow-hidden aspect-[3/4] md:w-[240px] md:h-[320px]">
        {/* Shader canvas background */}
        <div className="absolute inset-0 rounded-lg overflow-hidden z-0 backdrop-blur-sm">
          <InvitationShaderCanvas className="w-full h-full" brightness={0.4} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full justify-start backdrop-blur-md rounded-lg p-6">
          <h1 className="text-3xl mb-4 font-extrabold text-white transition-colors text-left line-clamp-3">
            {party.name}
          </h1>
          <p className="text-base md:text-lg text-left leading-relaxed font-bold text-white/90">
            {formattedDate}
          </p>
        </div>
      </div>
    </Link>
  );
}
