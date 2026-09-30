"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primary btn-sm">
      <Printer size={14} strokeWidth={1.8} />
      Print / Save as PDF
    </button>
  );
}
