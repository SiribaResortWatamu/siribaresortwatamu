// Hand-written types matching supabase/migrations/0001_init.sql.
// If the schema changes, update this alongside the migration file. (A fuller
// setup would generate this via `supabase gen types typescript`, once the
// Supabase CLI is linked to the project — not required to get started.)

export type ApartmentFeature = { icon: string; text: string };
export type ExternalCalendarLink = { label: string; url: string };

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
  seo_title: string | null;
  seo_description: string | null;
  external_ical_urls: ExternalCalendarLink[];
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
  external_uid: string | null; // set when synced from an external iCal feed
  external_source: string | null; // e.g. "Airbnb" — the calendar label it came from
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

// Columns with a DB-side default (or that are nullable) don't need to be
// supplied on insert — mark them optional so callers can omit them.
type WithDefaults<T, DefaultedKeys extends keyof T> = Omit<T, DefaultedKeys | "id"> &
  Partial<Pick<T, DefaultedKeys>> & { id?: string };

// Updates are realistically always partial patches — any column except id/
// created_at can be included or left out, independent of what Insert allows.
type UpdateOf<Row, Omitted extends keyof Row = never> = Partial<
  Omit<Row, "id" | "created_at" | Omitted>
>;

export type Database = {
  public: {
    Tables: {
      apartments: TableDef<
        Apartment,
        WithDefaults<
          Omit<Apartment, "created_at" | "updated_at">,
          | "description"
          | "features"
          | "guests"
          | "bedrooms"
          | "bathrooms"
          | "is_archived"
          | "feature_on_homepage"
          | "sort_order"
          | "seo_title"
          | "seo_description"
          | "external_ical_urls"
        >,
        UpdateOf<Apartment>
      >;
      apartment_photos: TableDef<
        ApartmentPhoto,
        WithDefaults<Omit<ApartmentPhoto, "created_at">, "order" | "is_cover">
      >;
      bookings: TableDef<
        Booking,
        WithDefaults<
          Omit<Booking, "nights" | "created_at" | "updated_at">,
          | "guest_phone"
          | "adults"
          | "children"
          | "special_requests"
          | "status"
          | "payment_status"
          | "source"
        >,
        UpdateOf<Booking, "nights">
      >;
      safari_packages: TableDef<
        SafariPackage,
        WithDefaults<
          Omit<SafariPackage, "created_at" | "updated_at">,
          "description" | "duration_label" | "price_usd" | "images" | "is_archived" | "sort_order"
        >,
        UpdateOf<SafariPackage>
      >;
      safari_bookings: TableDef<
        SafariBooking,
        WithDefaults<
          Omit<SafariBooking, "created_at">,
          "safari_package_id" | "travel_date" | "adults" | "children" | "notes" | "status"
        >
      >;
      messages: TableDef<
        ContactMessage,
        WithDefaults<Omit<ContactMessage, "created_at">, "phone" | "subject" | "is_read">
      >;
      blocked_dates: TableDef<
        BlockedDate,
        WithDefaults<
          Omit<BlockedDate, "created_at">,
          "apartment_id" | "reason" | "created_by" | "external_uid" | "external_source"
        >
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
