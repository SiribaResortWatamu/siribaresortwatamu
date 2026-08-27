/**
 * Domain types mirroring supabase/migrations/0001_schema.sql.
 *
 * These are maintained by hand so the app has no build-time dependency on a
 * live database. If you change a migration, change the matching type here.
 */

export type ContentStatus = "draft" | "published" | "hidden" | "archived";
export type BookingStatus =
  | "pending"
  | "held"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";
export type PaymentStatus =
  | "unpaid"
  | "deposit_required"
  | "partially_paid"
  | "paid"
  | "refunded";
export type BookingSource =
  | "website"
  | "airbnb"
  | "booking_com"
  | "admin"
  | "whatsapp"
  | "other";
export type EnquiryStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "confirmed"
  | "cancelled"
  | "completed";
export type TransferStatus =
  | "pending"
  | "confirmed"
  | "driver_assigned"
  | "in_progress"
  | "completed"
  | "cancelled";
export type HousekeepingStatus =
  | "available"
  | "occupied"
  | "cleaning"
  | "ready"
  | "maintenance";
export type MessageStatus = "unread" | "read" | "replied" | "archived";
export type PricingMethod =
  | "fixed"
  | "per_person"
  | "per_vehicle"
  | "hourly"
  | "on_enquiry";
export type PriceDisplayMode = "show_price" | "from_price" | "on_enquiry";
export type BlockReason =
  | "maintenance"
  | "owner_stay"
  | "private_event"
  | "external_ical"
  | "other";
export type BlockSource = "admin" | "airbnb" | "booking_com" | "other";
export type ResourceStatus = "active" | "inactive";

export interface Amenity {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  display_order: number;
  is_featured: boolean;
  status: ContentStatus;
}

export interface Photo {
  id: string;
  storage_path: string;
  alt_text: string | null;
  display_order: number;
  is_cover: boolean;
}

export interface ApartmentPhoto extends Photo {
  apartment_id: string;
}

export interface Apartment {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  property_type: string;
  location: string | null;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  beds: number;
  nightly_rate: number;
  currency: string;
  min_nights: number;
  cleaning_fee: number;
  deposit_percent: number;
  amenity_ids: string[];
  housekeeping: HousekeepingStatus;
  status: ContentStatus;
  display_order: number;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  og_image_path: string | null;
  airbnb_ical_url: string | null;
  booking_com_ical_url: string | null;
  ical_export_token: string;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApartmentWithPhotos extends Apartment {
  apartment_photos: ApartmentPhoto[];
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  country: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  booking_reference: string;
  guest_id: string | null;
  apartment_id: string | null;
  apartment_name_snapshot: string;
  guest_name_snapshot: string;
  guest_email_snapshot: string;
  guest_phone_snapshot: string | null;
  check_in: string;
  check_out: string;
  guests_count: number;
  nights: number;
  rate_snapshot: number;
  cleaning_fee_snapshot: number;
  total_snapshot: number;
  currency: string;
  deposit_required: number;
  amount_paid: number;
  balance: number;
  payment_method: string | null;
  payment_reference: string | null;
  payment_date: string | null;
  payment_notes: string | null;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  source: BookingSource;
  hold_expires_at: string | null;
  special_requests: string | null;
  notes: string | null;
  external_uid: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlockedDate {
  id: string;
  apartment_id: string | null;
  start_date: string;
  end_date: string;
  reason: BlockReason;
  source: BlockSource;
  note: string | null;
  external_uid: string | null;
  created_at: string;
}

export interface SafariPackage {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  destination: string | null;
  duration: string | null;
  duration_days: number;
  starting_location: string | null;
  ending_location: string | null;
  safari_type: string | null;
  price: number;
  currency: string;
  price_display_mode: PriceDisplayMode;
  highlights: string[];
  included: string[];
  excluded: string[];
  optional_extras: string[];
  important_info: string | null;
  status: ContentStatus;
  display_order: number;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  og_image_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface SafariItineraryDay {
  id: string;
  safari_id: string;
  day_number: number;
  title: string;
  description: string | null;
  activities: string[];
  accommodation: string | null;
  meals: string | null;
  display_order: number;
}

export interface SafariPhoto extends Photo {
  safari_id: string;
}

export interface SafariWithDetail extends SafariPackage {
  safari_photos: SafariPhoto[];
  safari_itinerary_days: SafariItineraryDay[];
}

export interface SafariEnquiry {
  id: string;
  reference: string;
  safari_id: string | null;
  safari_name_snapshot: string;
  guest_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  travel_date: string | null;
  date_flexible: boolean;
  adults: number;
  children: number;
  travellers: number;
  special_requests: string | null;
  status: EnquiryStatus;
  quoted_amount: number | null;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransferService {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  service_type: string;
  pickup_locations: string[];
  dropoff_locations: string[];
  vehicle_type: string | null;
  passenger_capacity: number;
  luggage_capacity: number;
  journey_time: string | null;
  pricing_method: PricingMethod;
  price: number;
  currency: string;
  included: string[];
  excluded: string[];
  additional_charges: string[];
  status: ContentStatus;
  display_order: number;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  og_image_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransferPhoto extends Photo {
  transfer_id: string;
}

export interface TransferWithPhotos extends TransferService {
  transfer_photos: TransferPhoto[];
}

export interface Vehicle {
  id: string;
  name: string;
  registration: string;
  vehicle_type: string;
  capacity: number;
  luggage_capacity: number;
  status: ResourceStatus;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  photo_path: string | null;
  licence_no: string | null;
  vehicle_id: string | null;
  status: ResourceStatus;
  notes: string | null;
}

export interface TransferBooking {
  id: string;
  reference: string;
  transfer_id: string | null;
  transfer_name_snapshot: string;
  guest_id: string | null;
  passenger_name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  pickup_location: string;
  dropoff_location: string;
  transfer_date: string;
  pickup_time: string | null;
  passengers: number;
  luggage: number;
  flight_number: string | null;
  train_number: string | null;
  special_instructions: string | null;
  driver_id: string | null;
  vehicle_id: string | null;
  pricing_method_snapshot: PricingMethod;
  unit_price_snapshot: number;
  price_snapshot: number;
  currency: string;
  amount_paid: number;
  balance: number;
  payment_method: string | null;
  payment_reference: string | null;
  payment_status: PaymentStatus;
  booking_status: TransferStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: MessageStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityEntry {
  id: string;
  kind: string;
  title: string;
  detail: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

export interface SiteSettings {
  id: boolean;
  property_name: string;
  tagline: string | null;
  logo_path: string | null;
  logo_light_path: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tripadvisor_url: string | null;
  map_embed_url: string | null;
  default_currency: string;
  hold_duration_hours: number;
  booking_terms: string | null;
  cancellation_policy: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  default_deposit_percent: number;
  hide_prices: boolean;
  usd_to_kes_rate: number;
  owner_email: string | null;
  notify_on_booking: boolean;
  notify_on_enquiry: boolean;
  notify_on_transfer: boolean;
  notify_on_message: boolean;
  pre_arrival_days: number;
  post_stay_days: number;
  arrival_information: string | null;
  review_url: string | null;
  updated_at: string;
}

/** The subset of settings the public site is allowed to read. */
export type PublicSettings = Pick<
  SiteSettings,
  | "property_name"
  | "tagline"
  | "logo_path"
  | "logo_light_path"
  | "address"
  | "phone"
  | "whatsapp"
  | "email"
  | "facebook_url"
  | "instagram_url"
  | "tripadvisor_url"
  | "map_embed_url"
  | "default_currency"
  | "hide_prices"
  | "usd_to_kes_rate"
  | "check_in_time"
  | "check_out_time"
  | "booking_terms"
  | "cancellation_policy"
>;

export interface DashboardStats {
  pending_bookings: number;
  confirmed_bookings: number;
  arrivals_today: number;
  departures_today: number;
  current_guests: number;
  outstanding_balance: number;
  safari_enquiries: number;
  transfer_requests: number;
  unread_messages: number;
  rooms_needing_clean: number;
}
