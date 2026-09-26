import * as React from "react";
import { Music2, Sparkles } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title = "No Upcoming Indian Concerts Found",
  message = "This artist currently does not have confirmed tour dates in India on the live registry.",
  actionText = "Explore Featured Tours",
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("border-border-subtle bg-surface-elevated/60 max-w-lg mx-auto my-12 text-center", className)}>
      <CardContent className="p-8 flex flex-col items-center">
        <div className="h-16 w-16 rounded-full bg-surface-hover border border-border-strong flex items-center justify-center text-text-muted mb-4">
          <Music2 className="h-8 w-8 text-indigo-400 opacity-80" />
        </div>
        <h4 className="text-lg font-bold text-text-primary mb-2">{title}</h4>
        <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
          {message}
        </p>
        {onAction && (
          <Button variant="neon" onClick={onAction} className="gap-2">
            <Sparkles className="h-4 w-4" />
            {actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
