import Link from "next/link";
import { FaPlus, FaPen, FaBoxArchive, FaClockRotateLeft } from "react-icons/fa6";
import { createClient } from "@/lib/supabase/server";
import { setApartmentArchived } from "@/lib/actions/apartments";
import type { Apartment } from "@/lib/supabase/types";

async function getAllApartments(): Promise<Apartment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("apartments")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export default async function AdminApartmentsPage() {
  const apartments = await getAllApartments();

  return (
    <div>
      <header className="mb-8 flex items-center justify-between border-b border-hairline pb-4">
        <h2 className="font-display text-2xl text-ink">Manage Apartments</h2>
        <Link
          href="/admin/apartments/new"
          className="flex items-center gap-2 rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover"
        >
          <FaPlus /> Add Apartment
        </Link>
      </header>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-ink-muted">
                <th className="pb-3">Order</th>
                <th className="pb-3">Name</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Homepage</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apartments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-ink-muted">
                    No apartments yet — add your first one.
                  </td>
                </tr>
              ) : (
                apartments.map((apt) => (
                  <tr
                    key={apt.id}
                    className={`border-t border-hairline ${apt.is_archived ? "opacity-50" : ""}`}
                  >
                    <td className="py-3 text-ink-muted">{apt.sort_order}</td>
                    <td className="py-3">
                      <div className="font-medium text-ink">{apt.name}</div>
                      <div className="text-xs text-ink-muted">/{apt.slug}</div>
                    </td>
                    <td className="py-3 text-ink-muted">${apt.price_usd}</td>
                    <td className="py-3 text-ink-muted">{apt.feature_on_homepage ? "Yes" : "—"}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          apt.is_archived
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {apt.is_archived ? "Archived" : "Active"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Link
                          href={`/admin/apartments/${apt.id}`}
                          className="flex items-center gap-1.5 rounded-md border border-hairline px-2.5 py-1 text-xs font-medium text-ink-muted hover:bg-sand"
                        >
                          <FaPen /> Edit
                        </Link>
                        {apt.is_archived ? (
                          <form action={setApartmentArchived.bind(null, apt.id, false)}>
                            <button
                              type="submit"
                              className="flex items-center gap-1.5 rounded-md border border-green-600 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-600 hover:text-white"
                            >
                              <FaClockRotateLeft /> Restore
                            </button>
                          </form>
                        ) : (
                          <form action={setApartmentArchived.bind(null, apt.id, true)}>
                            <button
                              type="submit"
                              className="flex items-center gap-1.5 rounded-md border border-red-600 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-600 hover:text-white"
                            >
                              <FaBoxArchive /> Archive
                            </button>
                          </form>
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
