"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Party } from "@/lib/types";

interface PartyCardProps {
  party: Party;
}

export function PartyCard({ party }: PartyCardProps) {
  const partyDate = new Date(party.time);
  const formattedDate = partyDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.div
      layoutId={`party-card-${party.party_id}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <Link href={`/parties/${party.slug}`} className="block" prefetch={true}>
        <div
          className="relative bg-white/90 backdrop-blur-sm rounded-lg p-6 border-2 border-black/10 shadow-[0_4px_6px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-300 group-hover:shadow-[0_8px_12px_rgba(0,0,0,0.15),0_16px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] group-hover:border-black/20 cursor-pointer flex flex-col overflow-hidden"
          style={{ width: "240px", height: "320px" }}
        >
          {/* Inner shadow for depth */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/40 to-transparent pointer-events-none z-0" />

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full justify-start">
            <h3 className="text-xl font-semibold mb-4 text-black/90 group-hover:text-black transition-colors text-left line-clamp-3">
              {party.name}
            </h3>
            <p className="text-sm text-black/70 text-left leading-relaxed">
              {formattedDate}
            </p>
          </div>

          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/60 to-transparent rounded-bl-full pointer-events-none" />
        </div>
      </Link>
    </motion.div>
  );
}
