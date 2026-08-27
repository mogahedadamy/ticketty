import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-16 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 rounded-2xl bg-muted p-3 text-muted-foreground">{icon}</div>
      ) : null}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}