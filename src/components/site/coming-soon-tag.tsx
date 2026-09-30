import { cn } from "@/lib/utils";

/** Marks an amenity that is planned or still being built. */
export function ComingSoonTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "pill bg-terracotta-soft text-terracotta-dark align-middle whitespace-nowrap",
        className,
      )}
    >
      Coming soon
    </span>
  );
}
