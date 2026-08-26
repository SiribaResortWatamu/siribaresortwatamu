import { getAllBookings, getAllBlockedDates, getAllApartmentsForAdmin } from "@/lib/admin-data";
import AdminCalendarView from "@/components/admin/AdminCalendarView";

export default async function AdminCalendarPage() {
  const [bookings, blockedDates, apartments] = await Promise.all([
    getAllBookings(),
    getAllBlockedDates(),
    getAllApartmentsForAdmin(),
  ]);

  return (
    <div>
      <header className="mb-8 border-b border-hairline pb-4">
        <h2 className="font-display text-2xl text-ink">Availability Calendar</h2>
      </header>
      <AdminCalendarView bookings={bookings} blockedDates={blockedDates} apartments={apartments} />
    </div>
  );
}
