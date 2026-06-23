import { LoginButton } from "@/components/auth/login-button";

export default async function HomePage() {
  return (
    <div>
      <h1 className="tracking-tighter uppercase font-semibold text-4xl mb-3">
        a space for my friends
      </h1>
      <div className="mt-8 mb-2">
        <p className="mb-2 uppercase tracking-tighter text-sm">noun</p>
        <h3 className="tracking-tighter uppercase font-semibold text-2xl mb-3">
          party
        </h3>
      </div>
      <p className="mb-6 text-lg" aria-label="pronunciation">
        PAR-tee
      </p>
      <blockquote className="mb-7 border-l-4 border-black pl-4">
        <p>
          A group of people assembled to complete a mission together; a company
          bound by shared intent, mutual trust, and the work of showing up.
        </p>
      </blockquote>
      <p className="mb-5">
        This is a space for my friends, away from the noise of social media,
        built for the moments that actually matter.
      </p>
      <p className="mb-5">
        Not for the masses. For a hyperlocal group of people who show up when
        there is something to make happen.
      </p>
      <p className="mb-5">An open invitation to the next mission.</p>
      <div className="mt-8">
        <LoginButton />
      </div>
    </div>
  );
}
