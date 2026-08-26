import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Every price on the public site goes through here, so the global
 * "hide prices" setting in the admin dashboard genuinely hides all of them.
 */
export function Price({
  amount,
  currency,
  hidden,
  suffix,
  prefix,
  onEnquiry,
  className,
  size = "md",
}: {
  amount: number;
  currency: string;
  hidden: boolean;
  suffix?: string;
  prefix?: string;
  onEnquiry?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const scale = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-3xl",
  }[size];

  if (hidden || onEnquiry || !amount) {
    return (
      <span className={cn("font-display font-semibold text-ocean", scale, className)}>
        Price on enquiry
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      {prefix && (
        <span className="text-xs font-normal tracking-wide text-ink-muted">{prefix}</span>
      )}
      <span className={cn("font-display font-semibold text-ink", scale)}>
        {formatMoney(amount, currency)}
      </span>
      {suffix && <span className="text-xs font-normal text-ink-muted">{suffix}</span>}
    </span>
  );
}
