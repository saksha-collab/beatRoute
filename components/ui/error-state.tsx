"use client";

import * as React from "react";
import { AlertCircle, RefreshCw, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  code?: string;
  technicalDetails?: string;
  onRetry?: () => void;
  onExploreFeatured?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Concert Discovery Error",
  message = "We couldn't retrieve concert information for this selection. The live event registry might be down or rate-limited.",
  code,
  technicalDetails,
  onRetry,
  onExploreFeatured,
  className,
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <Card className={cn("border-rose-900/40 bg-surface-elevated/80 max-w-xl mx-auto my-8 overflow-hidden", className)}>
      <CardContent className="p-8 text-center flex flex-col items-center">
        <div className="h-14 w-14 rounded-full bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5 shadow-lg">
          <AlertCircle className="h-7 w-7" />
        </div>

        <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-secondary max-w-md mb-6 leading-relaxed">
          {message}
        </p>

        {code && (
          <span className="inline-block font-mono text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 px-3 py-1 rounded-full mb-6">
            Error Code: {code}
          </span>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <Button variant="default" onClick={onRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry Query
            </Button>
          )}
          {onExploreFeatured && (
            <Button variant="outline" onClick={onExploreFeatured} className="gap-2 border-purple-500/40 hover:bg-purple-950/40 text-purple-300">
              <Sparkles className="h-4 w-4 text-purple-400" />
              Switch to Featured Tours
            </Button>
          )}
        </div>

        {technicalDetails && (
          <div className="w-full mt-6 pt-6 border-t border-border-subtle text-left">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-text-muted hover:text-text-secondary flex items-center justify-between w-full"
            >
              <span>Technical Diagnostics</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showDetails && "rotate-180")} />
            </button>
            {showDetails && (
              <pre className="mt-2 p-3 rounded-lg bg-black/60 text-rose-300 font-mono text-xs overflow-x-auto border border-rose-950">
                {technicalDetails}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
