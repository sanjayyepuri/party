import { getServerSession } from "@ory/nextjs/app";
import Link from "next/link";

export default async function HomePage() {
  const session = await getServerSession();
  const isAuthenticated = !!session;

  return (
    <div className="">
      <h1 className="tracking-tighter uppercase font-semibold text-4xl mb-3">
        a space for my friends to stay in touch.
      </h1>
      <p className="mb-5">
        My friend list on social media has become heavily diluted. This means
        there are many people that I have never spent time with -- folks I had
        met once and never had the time or opportunity to reach out again.
      </p>
      <p className="mb-5">
        I have an amazing community of friends who I do spend a meaningful
        amount of time with. It&apos;s these people I want to create a space for
        -- a place where the noise of media and all of its distractions
        disappears.
      </p>
      <p className="mb-5">
        This community will be open, but the entry will be backwards. It&apos;s
        not an invitation to reach out. It&apos;s an automatic invitation to
        events I host.
      </p>
      <div className="mt-8">
        <Link
          href={isAuthenticated ? "/parties" : "/auth/login"}
          className="inline-block px-6 py-3 bg-black text-white uppercase tracking-wider font-semibold hover:bg-gray-800 transition-colors"
        >
          Enter
        </Link>
      </div>
    </div>
  );
}
