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
