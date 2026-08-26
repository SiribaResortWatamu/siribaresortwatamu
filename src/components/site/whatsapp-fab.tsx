"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * Persistent contact button. It stays out of the way on the admin side and
 * sits above the mobile safe area so it never covers a form's submit button.
 */
export function WhatsAppFab({ whatsapp }: { whatsapp: string | null }) {
  const pathname = usePathname();
  const href = whatsappLink(
    whatsapp,
    "Hello! I'd like to ask about Siriba Resort Watamu.",
  );

  if (!href || pathname.startsWith("/admin")) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed right-5 bottom-5 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-[#1faa54] text-white shadow-[0_8px_24px_-6px_rgba(31,170,84,0.6)] transition-transform duration-300 hover:scale-105 sm:right-7 sm:bottom-7"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <MessageCircle size={24} strokeWidth={1.75} />
    </a>
  );
}
