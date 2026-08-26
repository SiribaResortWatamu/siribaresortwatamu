# Siriba Resort Watamu

A premium coastal resort website with an integrated booking engine, CMS and
lightweight property management system.

The guiding principle: **content is created in the admin dashboard and rendered
through reusable frontend templates.** Adding a room, a safari, a transfer
service, a driver, a photo, a price or an itinerary never requires a code
change.

---

## What's here

| Area | What it does |
| --- | --- |
| **Public site** | Home, Accommodation, Safaris, Transfers, Amenities, About, Contact, plus generated detail pages at `/accommodation/[slug]`, `/safaris/[slug]` and `/transfers/[slug]` |
| **Booking engine** | Availability calendar, server-side pricing, temporary holds, database-enforced double-booking protection |
| **CMS** | Draft → Preview → Publish → Hide → Archive for accommodation, safaris, transfers and amenities |
| **Dashboard** | Arrivals, departures, guests in house, outstanding balances, enquiries, transfer requests, unread messages, room status, activity feed |
| **Calendar** | Month / week / day views, colour-coded by source, with manual date blocking |
| **Channels** | Two-way iCal sync with Airbnb and Booking.com |
| **Operations** | Guests, drivers, vehicles, payment tracking, safari enquiries, transfer dispatch, contact messages |
| **Automation** | Hold expiry, pre-arrival and post-stay guest emails, stay completion, housekeeping status |

---

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Supabase (Postgres, Auth, Storage) · Resend · Vercel

---

## Getting started

### 1. Create a Supabase project

At [supabase.com](https://supabase.com), then copy your keys from
**Project Settings → API**.

### 2. Configure the environment

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only.** Never expose to the browser |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally, your domain in production |
| `RESEND_API_KEY` | Optional. Without it, emails are logged to the console instead of sent |
| `EMAIL_FROM` | Verified sender, e.g. `Siriba Resort <bookings@yourdomain.co.ke>` |
| `CRON_SECRET` | Long random string. Protects the scheduled jobs |

### 3. Run the migrations

In the Supabase **SQL Editor**, run these in order:

1. `supabase/migrations/0001_schema.sql` — tables, enums, constraints
2. `supabase/migrations/0002_functions.sql` — triggers and business rules
3. `supabase/migrations/0003_rls.sql` — row level security
4. `supabase/migrations/0004_storage.sql` — the `media` bucket
5. `supabase/migrations/0005_seed.sql` — demo content (optional but recommended)

With the Supabase CLI instead:

```bash
supabase db push
```

### 4. Create your admin account

Supabase Dashboard → **Authentication → Users → Add user** (set a password and
tick *Auto Confirm*). Then, in the SQL Editor, grant that user dashboard access:

```sql
insert into admin_users (user_id, email, full_name, role)
select id, email, 'Your Name', 'owner' from auth.users where email = 'you@example.com';
```

Only rows in `admin_users` can reach `/admin` — a bare Supabase account is not
enough. Turn off public sign-ups under **Authentication → Providers** as well.

### 5. Run it

```bash
npm run dev
```

The website is at `http://localhost:3000` and the dashboard at
`http://localhost:3000/admin`.

---

## How the important rules are enforced

**Pricing is never taken from the browser.** Booking forms post dates and
counts only. `src/lib/pricing.ts` computes the total on the server from the
rate stored on the record, and that figure is frozen onto the booking as a
snapshot so a later rate change cannot rewrite history.

**Double-booking is impossible, not merely discouraged.** `bookings` carries a
Postgres exclusion constraint:

```sql
exclude using gist (
  apartment_id with =,
  daterange(check_in, check_out, '[)') with &&
) where (booking_status in ('pending','held','confirmed','completed'))
```

Two concurrent requests for the same nights cannot both succeed, regardless of
what the application does. Blocked dates are enforced by a matching trigger.

**Imported calendars never bury a direct booking.** When a synced Airbnb or
Booking.com entry overlaps a live direct booking, the guard trigger drops the
imported row and the direct booking stands. An *admin* block in the same
situation raises an error naming the booking, so the owner decides.

**Archived content keeps its history.** Bookings store
`apartment_name_snapshot`, `rate_snapshot` and `total_snapshot`; enquiries and
transfers store their own name snapshots. Nothing referenced by a booking can
be hard-deleted — the UI offers Archive instead.

**Only published content is public.** Row level security grants `anon` a
`select` on published rows and nothing else. Every mutation runs through a
server action using the service-role key.

---

## Scheduled jobs

`vercel.json` registers three cron jobs. Each requires
`Authorization: Bearer $CRON_SECRET`.

| Route | Schedule | Job |
| --- | --- | --- |
| `/api/cron/sync-calendars` | every 2 hours | Import Airbnb and Booking.com reservations |
| `/api/cron/expire-holds` | every 15 minutes | Release unconfirmed holds |
| `/api/cron/guest-messages` | daily, 06:00 | Complete departed stays, send pre-arrival and post-stay emails |

Run one by hand:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.co.ke/api/cron/sync-calendars
```

Not on Vercel? Point any scheduler at the same URLs with the same header.

---

## Connecting Airbnb and Booking.com

1. **Admin → Accommodation → [room] → Channel calendars.**
2. Paste their export URLs into the Airbnb and Booking.com fields.
3. Copy **Our calendar feed** and paste it into the same listing on their side.

Direct bookings then block those nights on Airbnb and Booking.com, and their
reservations block them here. All feed URLs are also listed under
**Admin → Settings → Integrations**.

Each feed URL carries an unguessable per-apartment token, and publishes dates
only — never a guest's name or contact details.

---

## Project layout

```
src/
  app/
    (site)/            Public website
    admin/
      login/           Sign-in (unguarded)
      (protected)/     Dashboard — guarded by layout + middleware + RLS
    actions/
      public.ts        Booking, enquiry, transfer and contact submissions
      admin/           CMS, bookings and operations actions
    api/
      ical/[token]/    Outgoing availability feed
      cron/            Scheduled jobs
  components/
    site/              Public UI
    admin/             Dashboard UI
  lib/
    pricing.ts         Server-side pricing — the only place totals are computed
    sync.ts            Channel calendar import
    ical.ts            iCalendar parsing and generation
    supabase/          admin (service role) · server (session) · public (anon) · client (browser)
supabase/migrations/   Schema, functions, RLS, storage, seed
```

---

## Day-to-day use

**Add a room:** Accommodation → Add New → fill in → Publish. The page at
`/accommodation/your-slug` exists immediately, with gallery, availability
calendar and booking form.

**Add a safari:** Safaris → Add New Safari → **+ Add Day** for each day of the
itinerary. There is no maximum, and days renumber themselves when reordered.

**Add a transfer:** Transfers → Add New Transfer → choose a pricing method
(fixed, per person, per vehicle, hourly, or on enquiry).

**Take a phone booking:** Bookings → New Booking. The database will refuse
anything that clashes.

**Block dates:** Calendar → Block dates. One apartment, several, or the whole
property.

**Hide all prices:** Settings → Pricing → *Hide all prices*. Every rate on the
public site becomes "Price on enquiry"; forms keep working.

---

## Notes

- **Legal pages.** `/privacy-policy` and `/terms` are a reasonable starting
  point written for this business, not legal advice. Have them reviewed.
- **Demo photography.** The seed data points at Unsplash URLs so the site looks
  right before any upload. Replace them with real photos through the admin
  gallery; uploads go to Supabase Storage and both forms work side by side.
- **Back-to-back dates.** The public calendar disables every occupied night, so
  a guest cannot select a departure day that is also someone's arrival day.
  The database permits it — take those bookings by phone or WhatsApp.
- **Currency.** Rates are stored per record with their own currency code. The
  USD→KES rate in Settings is a reference figure for quoting by hand; there is
  no automatic conversion.

## Commands

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```
