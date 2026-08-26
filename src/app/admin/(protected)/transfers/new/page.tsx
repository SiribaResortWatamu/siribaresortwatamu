import { PageHeader } from "@/components/admin/ui";
import { TransferForm } from "@/components/admin/transfer-form";

export const metadata = { title: "New Transfer Service" };

export default function NewTransferPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add transfer service"
        subtitle="Its public page and booking form are created from the template."
        back={{ href: "/admin/transfers", label: "Transfers" }}
      />
      <TransferForm />
    </div>
  );
}
