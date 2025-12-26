"use client";

import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="inline-block hover:underline transition-all opacity-60 hover:opacity-100 bg-transparent border-none cursor-pointer p-0 text-inherit font-inherit disabled:opacity-40"
    >
      {loading ? "signing out..." : "sign out"}
    </button>
  );
}
