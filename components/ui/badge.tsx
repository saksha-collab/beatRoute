import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border border-border-subtle bg-surface-elevated text-text-primary",
        secondary:
          "border border-border-subtle bg-surface-hover text-text-secondary",
        outline:
          "border border-border-strong text-text-primary bg-transparent",
        savings:
          "border border-emerald-500/30 bg-emerald-950/60 text-emerald-400 shadow-glowSavings",
        caution:
          "border border-amber-500/30 bg-amber-950/60 text-amber-400",
        danger:
          "border border-rose-500/30 bg-rose-950/60 text-rose-400",
        live:
          "border border-cyan-500/40 bg-cyan-950/60 text-cyan-300 shadow-glowCyan",
        curated:
          "border border-purple-500/40 bg-purple-950/60 text-purple-300 shadow-glowPurple",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  pulsingDot?: boolean;
}

function Badge({ className, variant, pulsingDot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {pulsingDot && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
