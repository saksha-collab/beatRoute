"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("BeatRoute Global Error:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="bg-[#08080c] text-white flex min-h-screen items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#12121b] border border-red-900/50 text-center shadow-2xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400">
            ⚠️
          </div>
          <h1 className="text-xl font-bold mb-2">Fatal System Crash</h1>
          <p className="text-sm text-gray-400 mb-6">
            A critical layout-level exception occurred. We have isolated the fault to protect application state.
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm transition-colors"
          >
            Reload BeatRoute
          </button>
        </div>
      </body>
    </html>
  );
}
