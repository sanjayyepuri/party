import { getServerSession } from "@ory/nextjs/app";
import { redirect } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface PartyDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PartyDetailPage({ params }: PartyDetailPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const partyId = parseInt(id, 10);

  try {
    const [party, rsvps] = await Promise.all([
      api.getParty(partyId),
      api.getPartyRsvps(partyId),
    ]);

    const statusCounts = {
      Pending: rsvps.filter((r) => r.status === "Pending").length,
      Accepted: rsvps.filter((r) => r.status === "Accepted").length,
      Maybe: rsvps.filter((r) => r.status === "Maybe").length,
      Declined: rsvps.filter((r) => r.status === "Declined").length,
    };

    return (
      <div className="">
        <Link
          href="/parties"
          className="inline-block mb-6 text-sm uppercase tracking-wider hover:underline"
        >
          ← Back to Parties
        </Link>

        <div className="mb-8">
          <h1 className="tracking-tighter uppercase font-semibold text-4xl mb-4">
            {party.name}
          </h1>
          <p className="text-lg mb-4">{party.description}</p>
          <p className="text-gray-600">
            <span className="font-semibold">Location:</span> {party.address}
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 uppercase tracking-tight">
            RSVP Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border border-gray-300">
              <div className="text-2xl font-bold">{statusCounts.Accepted}</div>
              <div className="text-sm text-gray-600">Accepted</div>
            </div>
            <div className="p-4 border border-gray-300">
              <div className="text-2xl font-bold">{statusCounts.Maybe}</div>
              <div className="text-sm text-gray-600">Maybe</div>
            </div>
            <div className="p-4 border border-gray-300">
              <div className="text-2xl font-bold">{statusCounts.Declined}</div>
              <div className="text-sm text-gray-600">Declined</div>
            </div>
            <div className="p-4 border border-gray-300">
              <div className="text-2xl font-bold">{statusCounts.Pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4 uppercase tracking-tight">
            Guest List
          </h2>
          {rsvps.length === 0 ? (
            <p className="text-gray-600">No guests invited yet.</p>
          ) : (
            <div className="space-y-2">
              {rsvps.map((rsvp) => (
                <div
                  key={rsvp.id}
                  className="flex items-center justify-between p-4 border border-gray-300"
                >
                  <div className="font-medium">{rsvp.guest_name}</div>
                  <div
                    className={`px-3 py-1 text-sm uppercase tracking-wider ${
                      rsvp.status === "Accepted"
                        ? "bg-green-100 text-green-800"
                        : rsvp.status === "Maybe"
                        ? "bg-yellow-100 text-yellow-800"
                        : rsvp.status === "Declined"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {rsvp.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Failed to load party details:", error);
    return (
      <div className="">
        <Link
          href="/parties"
          className="inline-block mb-6 text-sm uppercase tracking-wider hover:underline"
        >
          ← Back to Parties
        </Link>
        <h1 className="tracking-tighter uppercase font-semibold text-4xl mb-4">
          Error
        </h1>
        <p className="text-red-600">
          Failed to load party details. Please try again later.
        </p>
      </div>
    );
  }
}
