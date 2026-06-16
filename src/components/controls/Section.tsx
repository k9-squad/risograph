import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  title: string;
  number?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, number, children, className }: SectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        {number && (
          <span className="font-mono text-[10px] text-muted-foreground">{number}</span>
        )}
        <h3 className="font-display text-base font-medium">{title}</h3>
        <span className="ml-2 h-px flex-1 bg-border" />
      </div>
      {children}
    </section>
  );
}
