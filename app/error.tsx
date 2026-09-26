"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("BeatRoute Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <ErrorState
        title="Application Exception"
        message="BeatRoute encountered an unexpected runtime error while calculating tour arbitrage."
        code={error.digest || "RUNTIME_CRASH"}
        technicalDetails={error.message}
        onRetry={() => reset()}
      />
    </div>
  );
}
