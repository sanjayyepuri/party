'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the hardcoded party
    router.replace('/example-party');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-amber-950">Redirecting to party invitation...</p>
      </div>
    </div>
  );
}
