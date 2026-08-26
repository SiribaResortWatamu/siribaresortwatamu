import { PageHeader } from "@/components/admin/ui";
import { SafariForm } from "@/components/admin/safari-form";

export const metadata = { title: "New Safari" };

export default function NewSafariPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add safari"
        subtitle="Build the itinerary day by day. The public page is generated for you."
        back={{ href: "/admin/safaris", label: "Safaris" }}
      />
      <SafariForm />
    </div>
  );
}
