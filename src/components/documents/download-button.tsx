import { Download } from "lucide-react";

/** The only way to take a document away: an A4 PDF. */
export function DownloadButton({ token }: { token: string }) {
  return (
    <a href={`/d/${token}/pdf`} download className="btn btn-primary btn-sm">
      <Download size={14} strokeWidth={1.8} />
      Download PDF
    </a>
  );
}
