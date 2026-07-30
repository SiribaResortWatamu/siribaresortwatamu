// Shared field validators for guest-facing forms (booking, safari enquiry,
// contact). Runs the same shape of checks the server-side zod schemas in
// lib/validation.ts enforce, but inline and immediately, so a malformed or
// deliberately hostile submission (e.g. markup in a name field, aimed at
// whatever eventually renders or emails that value) is rejected before it
// ever reaches the network — not just relied on to fail politely server-side.

const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}'’.\-\s]{0,199}$/u;
const EMAIL_PATTERN = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
const PHONE_PATTERN = /^\+?[\d\s().-]{7,20}$/;
const MARKUP_PATTERN = /[<>]/;

export function validateName(value: string): string | null {
  const v = value.trim();
  if (!v) return "Name is required.";
  if (!NAME_PATTERN.test(v)) return "Name can only contain letters, spaces, and - ' .";
  return null;
}

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return "Email is required.";
  if (!EMAIL_PATTERN.test(v)) return "Enter a valid email address.";
  return null;
}

export function validatePhone(value: string, required = true): string | null {
  const v = value.trim();
  if (!v) return required ? "Phone number is required." : null;
  if (!PHONE_PATTERN.test(v)) return "Enter a valid phone number.";
  return null;
}

export function validateFreeText(
  value: string,
  { required = false, maxLength = 2000 }: { required?: boolean; maxLength?: number } = {}
): string | null {
  const v = value.trim();
  if (!v) return required ? "This field is required." : null;
  if (MARKUP_PATTERN.test(v)) return "Angle brackets ( < > ) aren't allowed here.";
  if (v.length > maxLength) return `Keep it under ${maxLength} characters.`;
  return null;
}
