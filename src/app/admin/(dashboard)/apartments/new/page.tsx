import ApartmentForm from "@/components/admin/ApartmentForm";

export default function NewApartmentPage() {
  return (
    <div>
      <header className="mb-8 border-b border-hairline pb-4">
        <h2 className="font-display text-2xl text-ink">Add Apartment</h2>
      </header>
      <div className="max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
        <ApartmentForm mode="create" />
      </div>
    </div>
  );
}
