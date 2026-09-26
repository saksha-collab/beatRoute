import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center p-6">
      <div className="h-16 w-16 rounded-full bg-surface-elevated border border-border-strong flex items-center justify-center text-indigo-400 mb-6">
        <Compass className="h-8 w-8 animate-spin-slow" />
      </div>
      <h2 className="text-3xl font-extrabold tracking-tight text-text-primary mb-2">
        404 — Route Not Found
      </h2>
      <p className="text-sm text-text-secondary max-w-sm mb-6">
        This concert corridor or tour route does not exist in the BeatRoute database.
      </p>
      <Link href="/">
        <Button variant="neon">Back to Live Dashboard</Button>
      </Link>
    </div>
  );
}
