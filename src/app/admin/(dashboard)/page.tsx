import { FaBed, FaCoins, FaPlaneArrival } from "react-icons/fa6";
import { getAdminStats } from "@/lib/admin-data";

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof FaBed;
  label: string;
  value: number;
  tone: "ocean" | "terracotta" | "green";
}) {
  const toneClasses = {
    ocean: "bg-ocean/10 text-ocean",
    terracotta: "bg-terracotta/10 text-terracotta",
    green: "bg-green-100 text-green-700",
  }[tone];

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${toneClasses}`}>
        <Icon />
      </div>
      <div>
        <h4 className="text-sm text-ink-muted">{label}</h4>
        <span className="font-display text-2xl font-semibold text-ink">{value}</span>
      </div>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  return (
    <div>
      <header className="mb-8 border-b border-hairline pb-4">
        <h2 className="font-display text-2xl text-ink">Overview</h2>
      </header>

      <div className="mb-10 grid gap-6 sm:grid-cols-3">
        <StatCard icon={FaBed} label="Active & Pending Rooms" value={stats.activeBookingsCount} tone="ocean" />
        <StatCard icon={FaCoins} label="Unpaid Bookings" value={stats.unpaidCount} tone="terracotta" />
        <StatCard icon={FaPlaneArrival} label="Total Safaris" value={stats.safariCount} tone="green" />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-display text-lg text-ink">Recent Booking Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-ink-muted">
                <th className="pb-3">Guest</th>
                <th className="pb-3">Apartment</th>
                <th className="pb-3">Check In</th>
                <th className="pb-3">Check Out</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Payment</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-ink-muted">
                    No recent activity
                  </td>
                </tr>
              ) : (
                stats.recentBookings.map((b) => (
                  <tr key={b.id} className="border-t border-hairline">
                    <td className="py-3 font-medium text-ink">{b.guest_name}</td>
                    <td className="py-3 text-ink-muted">{b.apartments?.name ?? "—"}</td>
                    <td className="py-3 text-ink-muted">{b.arrival}</td>
                    <td className="py-3 text-ink-muted">{b.departure}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-sand px-2 py-1 text-xs font-medium capitalize text-ink">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-sand px-2 py-1 text-xs font-medium capitalize text-ink">
                        {b.payment_status}
                      </span>
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
