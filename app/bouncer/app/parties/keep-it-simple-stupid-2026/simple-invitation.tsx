"use client";

import Link from "next/link";
import type { Party, RsvpWithUser } from "@/lib/types";
import { AddressLink } from "@/app/components/address-link";
import { LocalDateTime } from "@/app/components/local-date-time";
import { GuestList } from "../[slug]/guest-list";
import { RsvpForm } from "../[slug]/rsvp-form";

interface SimpleInvitationProps {
  party: Party;
  partyRsvps: RsvpWithUser[] | null;
  partyRsvpsError: string | null;
  currentUserId: string;
}

export function SimpleInvitation({
  party,
  partyRsvps,
  partyRsvpsError,
  currentUserId,
}: SimpleInvitationProps) {
  return (
    <article className="min-h-screen bg-white text-black">
      <header className="grid grid-cols-4 border-2 border-black text-[11px] uppercase">
        <Link
          href="/invitations"
          className="col-span-3 border-r-2 border-black p-3 hover:bg-black hover:text-white focus-visible:bg-black focus-visible:text-white"
        >
          ← Invitations
        </Link>
        <p className="p-3 text-right">No. 03</p>
      </header>

      <div className="grid grid-cols-4 border-x-2 border-b-2 border-black">
        <div
          className="col-span-1 min-h-24 border-r-2 border-black bg-black"
          aria-hidden="true"
        />
        <p className="col-span-3 self-end p-3 text-right text-[11px] uppercase leading-tight">
          But how could you live
          <br />
          and have no story to tell?
          <br />
          - Dostoevsky
        </p>
      </div>

      <div className="border-x-2 border-b-2 border-black px-3 py-5 sm:px-5">
        <h1 className="sr-only">{party.name}</h1>
        <p
          aria-hidden="true"
          className="break-words text-[clamp(3.6rem,18vw,7.25rem)] font-bold uppercase leading-[0.76] tracking-[-0.1em]"
        >
          Keep
          <br />
          It
          <br />
          Simple,
        </p>
      </div>

      <div className="grid grid-cols-4 border-x-2 border-b-2 border-black">
        <div className="col-span-1 flex items-center justify-center border-r-2 border-black p-3">
          <div
            className="aspect-square w-full max-w-20 rounded-full bg-black"
            aria-hidden="true"
          />
        </div>
        <p className="col-span-3 overflow-hidden bg-black px-3 py-4 text-[clamp(2.5rem,14vw,6rem)] font-bold uppercase leading-[0.78] tracking-[-0.09em] text-white">
          Stupid
        </p>
      </div>

      <section className="grid grid-cols-4 border-x-2 border-b-2 border-black">
        <h2 className="col-span-1 border-r-2 border-black p-3 text-[11px] font-normal uppercase">
          When
        </h2>
        <p className="col-span-3 p-3 text-lg font-bold uppercase leading-tight sm:text-2xl">
          <LocalDateTime dateTime={party.time} mode="date" />
          <br />
          <LocalDateTime dateTime={party.time} mode="time" />
        </p>
      </section>

      <section className="grid grid-cols-4 border-x-2 border-b-2 border-black">
        <h2 className="col-span-1 border-r-2 border-black p-3 text-[11px] font-normal uppercase">
          Where
        </h2>
        <p className="col-span-3 break-words p-3 text-lg font-bold uppercase leading-tight sm:text-2xl">
          <AddressLink location={party.location} />
        </p>
      </section>

      {party.description ? (
        <section className="border-x-2 border-b-2 border-black p-3 sm:p-5">
          <p className="max-w-md whitespace-pre-wrap text-sm leading-relaxed">
            {party.description}
          </p>
        </section>
      ) : null}

      <section className="border-x-2 border-b-2 border-black p-3 sm:p-5">
        <div className="mb-8">
          <h2 className="text-2xl font-bold uppercase tracking-tight sm:text-4xl">
            RSVP
          </h2>
        </div>
        <RsvpForm partyId={party.party_id} variant="monochrome" />
      </section>

      <section className="border-x-2 border-b-2 border-black p-3 sm:p-5">
        {partyRsvpsError ? (
          <div role="alert" className="border-2 border-black p-4">
            <p className="font-bold uppercase">Guest list unavailable</p>
            <p className="mt-2 text-sm">{partyRsvpsError}</p>
          </div>
        ) : null}
        {!partyRsvpsError && partyRsvps ? (
          <GuestList
            rsvps={partyRsvps}
            currentUserId={currentUserId}
            variant="monochrome"
          />
        ) : null}
        {!partyRsvpsError && !partyRsvps ? (
          <p className="border-t-2 border-black pt-4 text-sm">
            Loading guest list…
          </p>
        ) : null}
      </section>

      <footer className="grid grid-cols-4 border-x-2 border-b-2 border-black text-[11px] uppercase">
        <p className="col-span-3 border-r-2 border-black p-3">
          Have you considered just being stupid?
        </p>
        <p className="p-3 text-right">2026</p>
      </footer>
    </article>
  );
}
