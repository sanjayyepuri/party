import { LoginButton } from "@/components/auth/login-button";

export default async function HomePage() {
  return (
    <div className="">
      <h1 className="tracking-tighter uppercase font-semibold text-4xl mb-3">
        a space for my friends
      </h1>
      <p className="mb-5">
        I have an amazing group of friends in my life, and I want to create a
        community away from the noise of social media... A place where we can
        focus on sharing the moments that actually matter.
      </p>
      <p className="mb-5">
        We are returning to an older paradigm of technology: building not for
        the masses, but for a hyperlocal group of people. To start, the app will
        be simple:
      </p>
      <p className="mb-5">This is an open invitation to any event I host.</p>
      <div className="mt-8">
        <LoginButton />
      </div>
    </div>
  );
}
