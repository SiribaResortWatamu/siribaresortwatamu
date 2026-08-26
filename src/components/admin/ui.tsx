import Link from "next/link";
import { humanise } from "@/lib/format";
import { cn } from "@/lib/utils";

/* =====================================================================
   Admin UI kit — denser than the public site, same palette.
   ===================================================================== */

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
}: {
  title: string;
  subtitle?: string;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="mb-2 inline-block text-xs font-medium text-ocean transition-colors hover:text-ocean-dark"
          >
            ← {back.label}
          </Link>
        )}
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  description,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("panel overflow-hidden", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            {title && <h2 className="font-display text-base font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(bodyClassName ?? "p-5")}>{children}</div>
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-16 text-center">
      {icon && (
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sand-deep text-ink-muted">
          {icon}
        </span>
      )}
      <h3 className="font-display text-base font-semibold">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Tables
   --------------------------------------------------------------------- */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line px-4 py-3 text-[0.7rem] font-medium tracking-[0.08em] text-ink-muted uppercase",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      className={cn(
        "border-b border-line/70 px-4 py-3.5 align-middle",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

/* ---------------------------------------------------------------------
   Status pills
   --------------------------------------------------------------------- */
const TONES = {
  neutral: "bg-sand-deep text-ink-muted",
  ocean: "bg-ocean-soft text-ocean-dark",
  terracotta: "bg-terracotta-soft text-terracotta-dark",
  green: "bg-[#dff0e4] text-[#1f6b3a]",
  amber: "bg-[#fbeed3] text-[#8a5d12]",
  red: "bg-[#fbe1dc] text-[#a3402c]",
} as const;

type Tone = keyof typeof TONES;

/** One place that decides what colour every status in the system is. */
const STATUS_TONES: Record<string, Tone> = {
  // Content
  draft: "neutral",
  published: "green",
  hidden: "amber",
  archived: "neutral",
  // Bookings
  pending: "amber",
  held: "terracotta",
  confirmed: "green",
  cancelled: "red",
  completed: "ocean",
  no_show: "red",
  // Payments
  unpaid: "red",
  deposit_required: "amber",
  partially_paid: "amber",
  paid: "green",
  refunded: "neutral",
  // Enquiries
  new: "terracotta",
  contacted: "amber",
  quoted: "ocean",
  // Transfers
  driver_assigned: "ocean",
  in_progress: "ocean",
  // Messages
  unread: "terracotta",
  read: "neutral",
  replied: "green",
  // Housekeeping
  available: "green",
  occupied: "ocean",
  cleaning: "amber",
  ready: "green",
  maintenance: "red",
  // Resources
  active: "green",
  inactive: "neutral",
};

export function StatusPill({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  if (!status) return <span className="text-ink-muted">—</span>;
  const tone = STATUS_TONES[status] ?? "neutral";
  return <span className={cn("pill", TONES[tone], className)}>{humanise(status)}</span>;
}

export function Tag({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={cn("pill", TONES[tone], className)}>{children}</span>;
}

/* ---------------------------------------------------------------------
   Stats
   --------------------------------------------------------------------- */
export function StatCard({
  label,
  value,
  hint,
  href,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  icon?: React.ReactNode;
  tone?: "neutral" | "attention";
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.7rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              "shrink-0",
              tone === "attention" ? "text-terracotta" : "text-ocean",
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </>
  );

  const classes = cn(
    "panel p-5 transition-shadow",
    href && "hover:shadow-[var(--shadow-soft)]",
    tone === "attention" && "border-terracotta/40 bg-terracotta-soft/25",
  );

  return href ? (
    <Link href={href} className={classes}>
      {inner}
    </Link>
  ) : (
    <div className={classes}>{inner}</div>
  );
}

/* ---------------------------------------------------------------------
   Misc
   --------------------------------------------------------------------- */
export function DescriptionList({
  items,
}: {
  items: { label: string; value: React.ReactNode }[];
}) {
  return (
    <dl className="divide-y divide-line/70">
      {items.map(({ label, value }) => (
        <div key={label} className="flex items-baseline justify-between gap-6 py-2.5">
          <dt className="shrink-0 text-xs tracking-[0.06em] text-ink-muted uppercase">
            {label}
          </dt>
          <dd className="min-w-0 text-right text-sm">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
