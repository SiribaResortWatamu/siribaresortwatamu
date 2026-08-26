/**
 * One-click WhatsApp links. The owner stores their number in Settings as
 * digits only (`254700000000`); anything else typed there is cleaned up
 * here rather than breaking the link.
 */
export function whatsappNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 9) return null;
  // A local Kenyan number (0712…) becomes the international form.
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  return digits;
}

export function whatsappLink(
  raw: string | null | undefined,
  message?: string,
): string | null {
  const number = whatsappNumber(raw);
  if (!number) return null;
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function telLink(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : null;
}
