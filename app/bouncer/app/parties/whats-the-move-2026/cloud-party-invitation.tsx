"use client";

import Link from "next/link";
import type { Party, RsvpWithUser } from "@/lib/types";
import { LocalDateTime } from "@/app/components/local-date-time";
import { AddressLink } from "@/app/components/address-link";
import { CloudCanvas } from "@/lib/webgl/cloud-canvas";
import { RsvpForm } from "../[slug]/rsvp-form";
import { GuestList } from "../[slug]/guest-list";

interface CloudPartyInvitationProps {
  party: Party;
  partyRsvps: RsvpWithUser[] | null;
  partyRsvpsError: string | null;
  currentUserId: string;
}

const previewWeather = {
  temperature: "72°F",
  condition: "partly cloudy",
  wind: "SSW 8 mph",
  sunset: "8:19 PM",
};

const dividerStyle = {
  borderColor: "rgba(255, 255, 255, 0.18)",
};

export function CloudPartyInvitation({
  party,
  partyRsvps,
  partyRsvpsError,
  currentUserId,
}: CloudPartyInvitationProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#e7f7ff] text-slate-950">
      <div className="pointer-events-none fixed inset-0 z-0">
        <CloudCanvas className="h-full w-full" />
      </div>

      <div className="pointer-events-none fixed inset-x-0 top-0 z-[1] flex justify-between px-4 py-3 text-[11px] uppercase text-slate-700/70 md:px-6">
        <span>may 30</span>
        <span>
          {previewWeather.temperature} / {previewWeather.condition}
        </span>
      </div>

      <main
        className="fixed inset-0 mx-auto flex min-h-screen w-full max-w-4xl flex-col overflow-y-auto px-4 pb-6 pt-14 md:px-6 md:pt-16"
        style={{ zIndex: 20 }}
      >
        <div className="mb-2">
          <Link
            href="/invitations"
            className="inline-flex text-[11px] uppercase text-slate-700 transition-colors hover:text-slate-950"
          >
            back
          </Link>
        </div>

        <div className="grid gap-2 text-xs text-slate-800/88">
          <section className="border-y py-2" style={dividerStyle}>
            <div className="mb-2 flex items-center justify-between gap-3 uppercase text-slate-600/76">
              <span>party</span>
              <span>may 30</span>
            </div>
            <h1 className="text-[22px] leading-none text-slate-950 md:text-[33px]">
              {party.name}
            </h1>
          </section>

          <section
            className="grid border-b py-2 md:grid-cols-[120px_1fr]"
            style={dividerStyle}
          >
            <div className="uppercase text-slate-500">time</div>
            <div>
              <LocalDateTime dateTime={party.time} mode="date" />{" "}
              <span className="text-slate-500">/</span>{" "}
              <LocalDateTime dateTime={party.time} mode="time" />
            </div>
          </section>

          <section
            className="grid border-b py-2 md:grid-cols-[120px_1fr]"
            style={dividerStyle}
          >
            <div className="uppercase text-slate-500">where</div>
            <AddressLink location={party.location} />
          </section>

          <section
            className="grid border-b py-2 md:grid-cols-[120px_1fr]"
            style={dividerStyle}
          >
            <div className="uppercase text-slate-500">weather</div>
            <div className="grid gap-1 md:grid-cols-4">
              <div>{previewWeather.temperature}</div>
              <div>{previewWeather.condition}</div>
              <div>{previewWeather.wind}</div>
              <div>sunset {previewWeather.sunset}</div>
            </div>
          </section>

          {party.description && (
            <section
              className="grid border-b py-2 md:grid-cols-[120px_1fr]"
              style={dividerStyle}
            >
              <div className="uppercase text-slate-500">note</div>
              <p className="max-w-[68ch] leading-relaxed text-slate-800/88">
                {party.description}
              </p>
            </section>
          )}

          <section
            className="grid border-b py-2 md:grid-cols-[120px_1fr]"
            style={dividerStyle}
          >
            <div className="uppercase text-slate-500">rsvp</div>
            <div className="[&>div]:space-y-2 [&_.bg-black]:bg-slate-950 [&_.rounded]:rounded-none [&_.text-lg]:text-base">
              <RsvpForm partyId={party.party_id} />
            </div>
          </section>

          <section
            className="grid border-b py-2 md:grid-cols-[120px_1fr]"
            style={dividerStyle}
          >
            <div className="uppercase text-slate-500">guests</div>
            <div className="[&_.rounded]:rounded-none [&_.text-xl]:text-base">
              {partyRsvpsError && (
                <div className="border border-red-200 bg-red-50 p-3 text-red-800">
                  <p className="font-medium">Error loading guest list</p>
                  <p className="text-sm">{partyRsvpsError}</p>
                </div>
              )}
              {!partyRsvpsError && partyRsvps && (
                <GuestList rsvps={partyRsvps} currentUserId={currentUserId} />
              )}
              {!partyRsvpsError && !partyRsvps && (
                <div className="border p-3 text-slate-700" style={dividerStyle}>
                  Loading guest list...
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
