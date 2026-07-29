// Hand-written types matching supabase/migrations/0001_init.sql.
// If the schema changes, update this alongside the migration file. (A fuller
// setup would generate this via `supabase gen types typescript`, once the
// Supabase CLI is linked to the project — not required to get started.)

export type ApartmentFeature = { icon: string; text: string };

export type Apartment = {
  id: string;
  slug: string;
  name: string;
  description: string;
  features: ApartmentFeature[];
  price_usd: number;
  guests: number;
  bedrooms: number;
  bathrooms: number;
  is_archived: boolean;
  feature_on_homepage: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ApartmentPhoto = {
  id: string;
  apartment_id: string;
  storage_path: string;
  order: number;
  is_cover: boolean;
  created_at: string;
};

export type Booking = {
  id: string;
  apartment_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  arrival: string;
  departure: string;
  adults: number;
  children: number;
  nights: number;
  price_per_night_usd: number;
  total_price_usd: number;
  special_requests: string | null;
  status: "pending" | "confirmed" | "cancelled";
  payment_status: "unpaid" | "paid";
  source: "site" | "admin";
  created_at: string;
  updated_at: string;
};

export type SafariPackage = {
  id: string;
  slug: string;
  name: string;
  duration_label: string | null;
  description: string;
  price_usd: number | null;
  images: string[];
  is_archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SafariBooking = {
  id: string;
  safari_package_id: string | null;
  safari_name: string;
  guest_name: string;
  guest_email: string;
  travel_date: string | null;
  adults: number;
  children: number;
  notes: string | null;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type BlockedDate = {
  id: string;
  apartment_id: string | null; // null = applies to all apartments
  start_date: string;
  end_date: string;
  reason: string | null;
  created_by: string | null;
  created_at: string;
};

export type SiteSettings = {
  id: 1;
  show_prices: boolean;
  usd_to_kes_rate: number;
};

export type ApartmentUnavailability = {
  apartment_id: string;
  start_date: string;
  end_date: string;
};

// `Relationships` is required by @supabase/postgrest-js's GenericTable /
// GenericNonUpdatableView shape even though we never define foreign-key
// relationship metadata here — omitting it makes every query silently
// resolve to `never` instead of a real row type.
type TableDef<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      apartments: TableDef<
        Apartment,
        Omit<Apartment, "id" | "created_at" | "updated_at"> & { id?: string }
      >;
      apartment_photos: TableDef<
        ApartmentPhoto,
        Omit<ApartmentPhoto, "id" | "created_at"> & { id?: string }
      >;
      bookings: TableDef<
        Booking,
        Omit<Booking, "id" | "nights" | "created_at" | "updated_at"> & { id?: string }
      >;
      safari_packages: TableDef<
        SafariPackage,
        Omit<SafariPackage, "id" | "created_at" | "updated_at"> & { id?: string }
      >;
      safari_bookings: TableDef<
        SafariBooking,
        Omit<SafariBooking, "id" | "created_at"> & { id?: string }
      >;
      messages: TableDef<ContactMessage, Omit<ContactMessage, "id" | "created_at"> & { id?: string }>;
      blocked_dates: TableDef<
        BlockedDate,
        Omit<BlockedDate, "id" | "created_at"> & { id?: string }
      >;
      site_settings: TableDef<SiteSettings, SiteSettings>;
    };
    Views: {
      public_apartment_unavailability: {
        Row: ApartmentUnavailability;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
  };
};
