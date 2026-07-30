import { getAllSafariBookings } from "@/lib/admin-data";
import { updateSafariBookingStatus } from "@/lib/actions/admin";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function ActionButton({
  action,
  children,
  variant,
}: {
  action: () => Promise<void>;
  children: React.ReactNode;
  variant: "confirm" | "cancel";
}) {
  const variantClasses =
    variant === "confirm"
      ? "border-green-600 text-green-700 hover:bg-green-600 hover:text-white"
      : "border-red-600 text-red-700 hover:bg-red-600 hover:text-white";

  return (
    <form action={action}>
      <button
        type="submit"
        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${variantClasses}`}
      >
        {children}
      </button>
    </form>
  );
}

export default async function AdminSafarisPage() {
  const bookings = await getAllSafariBookings();

  return (
    <div>
      <header className="mb-8 border-b border-hairline pb-4">
        <h2 className="font-display text-2xl text-ink">Safari Excursions</h2>
      </header>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-ink-muted">
                <th className="pb-3">Requested</th>
                <th className="pb-3">Guest</th>
                <th className="pb-3">Safari Package</th>
                <th className="pb-3">Travel Date</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-ink-muted">
                    No safari bookings found
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="border-t border-hairline align-top">
                    <td className="py-3 whitespace-nowrap text-ink-muted">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <div className="font-medium text-ink">{b.guest_name}</div>
                      <div className="text-xs text-ink-muted">{b.guest_email}</div>
                      <div className="text-xs text-ink-muted">
                        {b.adults} Adults, {b.children} Children
                      </div>
                    </td>
                    <td className="py-3 text-ink-muted">{b.safari_name}</td>
                    <td className="py-3 text-ink-muted">{b.travel_date ?? "Flexible"}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${STATUS_STYLES[b.status]}`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {b.status !== "confirmed" && (
                          <ActionButton
                            variant="confirm"
                            action={updateSafariBookingStatus.bind(null, b.id, "confirmed")}
                          >
                            Confirm
                          </ActionButton>
                        )}
                        {b.status !== "cancelled" && (
                          <ActionButton
                            variant="cancel"
                            action={updateSafariBookingStatus.bind(null, b.id, "cancelled")}
                          >
                            Cancel
                          </ActionButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
