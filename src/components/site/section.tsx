import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  align?: "left" | "center";
  action?: { href: string; label: string };
  className?: string;
}) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        centered
          ? "items-center text-center"
          : "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className={cn(centered ? "max-w-2xl" : "max-w-2xl")}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className={cn("display-lg", eyebrow && "mt-3")}>{title}</h2>
        {intro && <p className="mt-5 rich-text">{intro}</p>}
      </div>

      {action && (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium text-ocean transition-colors hover:text-ocean-dark"
        >
          {action.label}
          <ArrowRight
            size={16}
            strokeWidth={1.75}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      )}
    </div>
  );
}

/** Thin decorative rule used between hero content and the page body. */
export function Rule({ className }: { className?: string }) {
  return <span className={cn("block h-px w-14 bg-terracotta", className)} />;
}
