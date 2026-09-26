import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-surface-elevated/70 border border-border-subtle/50",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
