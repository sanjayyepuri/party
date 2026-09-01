import type { Party } from "@/lib/types";
import { LocalDateTime } from "@/app/components/local-date-time";

interface SimplePartyPreviewProps {
  party: Party;
}

export function SimplePartyPreview({ party }: SimplePartyPreviewProps) {
  return (
    <>
      <div
        className="absolute inset-0 z-0 flex flex-col bg-white text-black"
        aria-hidden="true"
      >
        <div className="flex min-h-0 flex-1 flex-col justify-between px-3 py-4 md:px-4 md:py-5">
          <p className="text-[32px] font-bold uppercase leading-[0.76] tracking-[-0.1em] md:text-[39px]">
            Keep
            <br />
            It
            <br />
            Simple,
            <br />
            Stupid
          </p>
          <p className="text-right text-[9px] uppercase tracking-tight">
            <LocalDateTime dateTime={party.time} mode="date" />
          </p>
        </div>

        <div className="grid h-[32%] shrink-0 grid-cols-4 border-t-2 border-black">
          <div className="col-span-1 flex items-center justify-center border-r-2 border-black p-2">
            <div className="aspect-square w-full rounded-full bg-black" />
          </div>
          <p className="col-span-3 flex items-center justify-between overflow-hidden bg-black px-2 text-[clamp(0.875rem,3vw,1.25rem)] font-bold uppercase leading-none tracking-[-0.04em] text-white">
            Open <span className="text-[0.65em]">↗</span>
          </p>
        </div>
      </div>

      <span className="sr-only">
        {party.name}. <LocalDateTime dateTime={party.time} mode="date" />. Open
        invitation.
      </span>
    </>
  );
}
