"use client";

import { useState } from "react";
import Image from "next/image";

interface ValidationResponse {
  valid: boolean;
  session?: {
    id: string;
    active: boolean;
    identity: {
      id: string;
      traits?: {
        email?: string;
        [key: string]: unknown;
      };
    };
  };
  error?: string;
}

export default function Home() {
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateSession = async () => {
    setIsValidating(true);
    setError(null);
    setValidationResult(null);

    try {
      const response = await fetch("http://localhost:3001/validate", {
        method: "POST",
        credentials: "include", // Include cookies
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data: ValidationResponse = await response.json();
      setValidationResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate session");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Ory Kratos Token Validation Test
          </h1>
          
          <div className="w-full max-w-md">
            <button
              onClick={validateSession}
              disabled={isValidating}
              className="w-full flex h-12 items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? "Validating..." : "Validate Session Token"}
            </button>

            {error && (
              <div className="mt-4 p-4 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">Error:</p>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {validationResult && (
              <div className={`mt-4 p-4 rounded-lg border ${
                validationResult.valid
                  ? "bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-800"
                  : "bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-800"
              }`}>
                <p className={`text-sm font-medium ${
                  validationResult.valid
                    ? "text-green-800 dark:text-green-200"
                    : "text-orange-800 dark:text-orange-200"
                }`}>
                  {validationResult.valid ? "✓ Session Valid" : "✗ Session Invalid"}
                </p>
                
                {validationResult.valid && validationResult.session && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs text-green-700 dark:text-green-300">
                      <span className="font-semibold">Session ID:</span>
                      <code className="ml-2 bg-green-200 dark:bg-green-800 px-2 py-0.5 rounded">
                        {validationResult.session.id}
                      </code>
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300">
                      <span className="font-semibold">Active:</span>
                      <code className="ml-2 bg-green-200 dark:bg-green-800 px-2 py-0.5 rounded">
                        {validationResult.session.active ? "true" : "false"}
                      </code>
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300">
                      <span className="font-semibold">Identity ID:</span>
                      <code className="ml-2 bg-green-200 dark:bg-green-800 px-2 py-0.5 rounded">
                        {validationResult.session.identity.id}
                      </code>
                    </div>
                    {validationResult.session.identity.traits?.email && (
                      <div className="text-xs text-green-700 dark:text-green-300">
                        <span className="font-semibold">Email:</span>
                        <code className="ml-2 bg-green-200 dark:bg-green-800 px-2 py-0.5 rounded">
                          {validationResult.session.identity.traits.email}
                        </code>
                      </div>
                    )}
                  </div>
                )}

                {validationResult.error && (
                  <p className="mt-2 text-xs text-orange-700 dark:text-orange-300">
                    {validationResult.error}
                  </p>
                )}
              </div>
            )}
          </div>

          <p className="max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400 mt-4">
            This page tests the backend API that validates Ory Kratos session tokens.
            Make sure you are logged in (visit{" "}
            <a href="/auth/login" className="font-medium text-zinc-950 dark:text-zinc-50 underline">
              /auth/login
            </a>
            ) and the backend server is running on port 3001.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="/auth/login"
          >
            Login
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="/settings"
          >
            Settings
          </a>
        </div>
      </main>
    </div>
  );
}
