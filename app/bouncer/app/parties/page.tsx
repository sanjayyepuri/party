import { getServerSession } from "@ory/nextjs/app";
import { redirect } from "next/navigation";
import Link from "next/link";

// Mock data for now - will be replaced with API call once backend has list endpoint
const mockParties = [
  {
    id: 1,
    name: "Summer BBQ",
    description: "Join us for a fun summer barbecue in the backyard!",
    address: "123 Main St",
  },
  {
    id: 2,
    name: "Game Night",
    description: "Board games, card games, and good company",
    address: "456 Oak Ave",
  },
];

export default async function PartiesPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  // TODO: Replace with actual API call when backend supports listing parties
  // const parties = await api.getParties();
  const parties = mockParties;

  return (
    <div className="">
      <h1 className="tracking-tighter uppercase font-semibold text-4xl mb-8">
        Parties
      </h1>

      {parties.length === 0 ? (
        <p className="text-gray-600">No parties available yet.</p>
      ) : (
        <div className="space-y-4">
          {parties.map((party) => (
            <Link
              key={party.id}
              href={`/parties/${party.id}`}
              className="block p-6 border border-gray-300 hover:border-black transition-colors"
            >
              <h2 className="text-2xl font-semibold mb-2">{party.name}</h2>
              <p className="text-gray-700 mb-2">{party.description}</p>
              <p className="text-sm text-gray-500">{party.address}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
