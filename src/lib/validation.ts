import { z } from "zod";

// Mirrors lib/client-validation.ts — same rules enforced server-side so a
// direct API call (bypassing the form entirely) can't submit anything the
// inline client validation would have rejected.
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}'’.\-\s]{0,199}$/u;
const PHONE_PATTERN = /^\+?[\d\s().-]{7,20}$/;
const MARKUP_PATTERN = /[<>]/;

const nameField = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(200)
  .regex(NAME_PATTERN, "Name contains invalid characters");

const phoneField = z
  .string()
  .trim()
  .max(50)
  .regex(PHONE_PATTERN, "Enter a valid phone number");

const freeTextField = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .refine((v) => !MARKUP_PATTERN.test(v), "Angle brackets ( < > ) aren't allowed");

export const bookingRequestSchema = z
  .object({
    apartmentId: z.string().uuid(),
    arrival: z.string().date(),
    departure: z.string().date(),
    adults: z.coerce.number().int().min(1).max(20),
    children: z.coerce.number().int().min(0).max(20),
    guestName: nameField,
    guestEmail: z.string().trim().email().max(200),
    guestPhone: phoneField,
    specialRequests: freeTextField(2000).optional(),
  })
  .refine((data) => data.departure > data.arrival, {
    message: "Departure must be after arrival",
    path: ["departure"],
  });

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

export const safariBookingRequestSchema = z.object({
  safariPackageId: z.string().uuid(),
  travelDate: z.string().date().optional(),
  adults: z.coerce.number().int().min(1).max(20),
  children: z.coerce.number().int().min(0).max(20),
  guestName: nameField,
  guestEmail: z.string().trim().email().max(200),
  notes: freeTextField(2000).optional(),
});

export type SafariBookingRequest = z.infer<typeof safariBookingRequestSchema>;

export const contactRequestSchema = z.object({
  name: nameField,
  email: z.string().trim().email().max(200),
  phone: phoneField.optional(),
  subject: z.string().trim().max(200).optional(),
  message: freeTextField(5000).min(1, "Message is required"),
});

export type ContactRequest = z.infer<typeof contactRequestSchema>;

export const apartmentFeatureSchema = z.object({
  icon: z.string().trim().min(1).max(50),
  text: z.string().trim().min(1).max(200),
});

export const apartmentInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().max(100).optional(),
  description: z.string().trim().max(3000).default(""),
  price_usd: z.coerce.number().min(0),
  guests: z.coerce.number().int().min(1).max(50),
  bedrooms: z.coerce.number().int().min(0).max(20),
  bathrooms: z.coerce.number().int().min(0).max(20),
  feature_on_homepage: z.boolean().default(false),
  sort_order: z.coerce.number().int().optional(),
  features: z.array(apartmentFeatureSchema).max(30).default([]),
  seo_title: z.string().trim().max(70).optional(),
  seo_description: z.string().trim().max(200).optional(),
});

export type ApartmentInput = z.infer<typeof apartmentInputSchema>;

export const blockedDateInputSchema = z
  .object({
    apartmentId: z.string().uuid().nullable(),
    startDate: z.string().date(),
    endDate: z.string().date(),
    reason: z.string().trim().max(300).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export type BlockedDateInput = z.infer<typeof blockedDateInputSchema>;
