import { z } from "zod";

export const bookingRequestSchema = z
  .object({
    apartmentId: z.string().uuid(),
    arrival: z.string().date(),
    departure: z.string().date(),
    adults: z.coerce.number().int().min(1).max(20),
    children: z.coerce.number().int().min(0).max(20),
    guestName: z.string().trim().min(1).max(200),
    guestEmail: z.string().trim().email().max(200),
    guestPhone: z.string().trim().max(50).optional(),
    specialRequests: z.string().trim().max(2000).optional(),
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
  guestName: z.string().trim().min(1).max(200),
  guestEmail: z.string().trim().email().max(200),
  notes: z.string().trim().max(2000).optional(),
});

export type SafariBookingRequest = z.infer<typeof safariBookingRequestSchema>;

export const contactRequestSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(50).optional(),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1).max(5000),
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
});

export type ApartmentInput = z.infer<typeof apartmentInputSchema>;
