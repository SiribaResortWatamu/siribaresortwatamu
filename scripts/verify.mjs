#!/usr/bin/env node
/**
 * Prove the database-level business rules actually hold.
 *
 * Everything happens inside a transaction that is rolled back at the end,
 * so this can be run against a live database without leaving anything behind.
 *
 *   DATABASE_URL="postgresql://..." node scripts/verify.mjs
 */

import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set DATABASE_URL.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  statement_timeout: 60_000,
});

let passed = 0;
let failed = 0;

function ok(name, detail = "") {
  passed += 1;
  console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}

function bad(name, detail = "") {
  failed += 1;
  console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

/** Run something expected to throw; pass if the error matches. */
async function expectRejection(name, sql, matcher) {
  try {
    await client.query("savepoint sp");
    await client.query(sql);
    await client.query("release savepoint sp");
    bad(name, "the database allowed it");
  } catch (error) {
    await client.query("rollback to savepoint sp");
    if (matcher(error)) {
      ok(name, error.message.split("\n")[0].slice(0, 90));
    } else {
      bad(name, `rejected, but unexpectedly: ${error.message.slice(0, 90)}`);
    }
  }
}

await client.connect();
await client.query("begin");

try {
  // -------------------------------------------------------------------
  console.log("\nSchema");
  // -------------------------------------------------------------------
  const tables = await client.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `);
  const names = tables.rows.map((r) => r.table_name);
  const expected = [
    "activity_log", "admin_users", "amenities", "apartment_photos", "apartments",
    "blocked_dates", "bookings", "drivers", "guest_message_log", "guests",
    "messages", "safari_enquiries", "safari_itinerary_days", "safari_packages",
    "safari_photos", "site_settings", "transfer_bookings", "transfer_photos",
    "transfer_services", "vehicles",
  ];
  const missing = expected.filter((t) => !names.includes(t));
  missing.length === 0
    ? ok(`${expected.length} tables present`)
    : bad("missing tables", missing.join(", "));

  const rls = await client.query(`
    select count(*)::int n from pg_tables
    where schemaname = 'public' and rowsecurity = false
      and tablename <> 'schema_migrations'
  `);
  rls.rows[0].n === 0
    ? ok("row level security enabled on every table")
    : bad("tables without RLS", String(rls.rows[0].n));

  // -------------------------------------------------------------------
  console.log("\nSeed content");
  // -------------------------------------------------------------------
  for (const [table, label] of [
    ["apartments", "apartments"],
    ["safari_packages", "safaris"],
    ["safari_itinerary_days", "itinerary days"],
    ["transfer_services", "transfer services"],
    ["amenities", "amenities"],
    ["drivers", "drivers"],
    ["vehicles", "vehicles"],
  ]) {
    const { rows } = await client.query(`select count(*)::int n from ${table}`);
    rows[0].n > 0 ? ok(`${rows[0].n} ${label}`) : bad(`no ${label} seeded`);
  }

  // -------------------------------------------------------------------
  console.log("\nBusiness rules");
  // -------------------------------------------------------------------
  const { rows: apt } = await client.query(
    "select id, name, nightly_rate, cleaning_fee, deposit_percent from apartments where slug = 'ocean-view-apartment'",
  );
  if (!apt.length) throw new Error("seed apartment missing");
  const apartment = apt[0];

  const insert = (checkIn, checkOut, status = "confirmed", name = "Test Guest") => `
    insert into bookings (
      apartment_id, apartment_name_snapshot, guest_name_snapshot,
      guest_email_snapshot, check_in, check_out, guests_count,
      rate_snapshot, total_snapshot, booking_status
    ) values (
      '${apartment.id}', '${apartment.name}', '${name}',
      '${name.toLowerCase().replace(/\W/g, "")}@example.com',
      '${checkIn}', '${checkOut}', 2, 12500, 25000, '${status}'
    )`;

  // A first booking should simply work.
  await client.query(insert("2027-03-10", "2027-03-14"));
  ok("booking created", "10–14 Mar 2027");

  await expectRejection(
    "overlapping booking rejected",
    insert("2027-03-12", "2027-03-16", "confirmed", "Clash Guest"),
    (e) => e.code === "23P01",
  );

  await expectRejection(
    "fully-contained overlap rejected",
    insert("2027-03-11", "2027-03-12", "confirmed", "Inner Guest"),
    (e) => e.code === "23P01",
  );

  // Check-out day == next check-in day must remain legal.
  await client.query(insert("2027-03-14", "2027-03-17", "confirmed", "Back To Back"));
  ok("back-to-back booking allowed", "checkout 14th, checkin 14th");

  // A cancelled booking must free its dates.
  await client.query(
    `update bookings set booking_status = 'cancelled' where guest_name_snapshot = 'Back To Back'`,
  );
  await client.query(insert("2027-03-14", "2027-03-17", "confirmed", "Replacement"));
  ok("cancelled booking frees its dates");

  // Blocked dates must stop a booking.
  await client.query(`
    insert into blocked_dates (apartment_id, start_date, end_date, reason, source, note)
    values ('${apartment.id}', '2027-05-01', '2027-05-08', 'maintenance', 'admin', 'Repainting')
  `);
  ok("admin block created", "1–8 May 2027");

  await expectRejection(
    "booking over a blocked period rejected",
    insert("2027-05-03", "2027-05-06", "confirmed", "Blocked Guest"),
    (e) => /unavailable/i.test(e.message),
  );

  await expectRejection(
    "admin block over a live booking rejected",
    `insert into blocked_dates (apartment_id, start_date, end_date, reason, source)
     values ('${apartment.id}', '2027-03-11', '2027-03-13', 'owner_stay', 'admin')`,
    (e) => /already occupies/i.test(e.message),
  );

  // An imported channel entry must yield to the direct booking, silently.
  const imported = await client.query(`
    insert into blocked_dates (apartment_id, start_date, end_date, reason, source, external_uid)
    values ('${apartment.id}', '2027-03-11', '2027-03-13', 'external_ical', 'airbnb', 'test-uid-1')
    returning id
  `);
  imported.rowCount === 0
    ? ok("imported block yields to a direct booking", "row silently skipped")
    : bad("imported block overwrote a direct booking");

  // -------------------------------------------------------------------
  console.log("\nDerived values");
  // -------------------------------------------------------------------
  const { rows: derived } = await client.query(`
    select booking_reference, nights, balance, payment_status
    from bookings where guest_name_snapshot = 'Test Guest'
  `);
  const b = derived[0];
  b.nights === 4 ? ok("nights computed", `${b.nights}`) : bad("nights wrong", String(b.nights));
  Number(b.balance) === 25000
    ? ok("balance computed", `${b.balance}`)
    : bad("balance wrong", String(b.balance));
  b.booking_reference?.startsWith("SRW-")
    ? ok("booking reference generated", b.booking_reference)
    : bad("no booking reference");

  await client.query(
    `update bookings set amount_paid = 10000 where guest_name_snapshot = 'Test Guest'`,
  );
  const { rows: partial } = await client.query(
    `select payment_status, balance from bookings where guest_name_snapshot = 'Test Guest'`,
  );
  partial[0].payment_status === "partially_paid"
    ? ok("payment status derived", `partially_paid, balance ${partial[0].balance}`)
    : bad("payment status wrong", partial[0].payment_status);

  // -------------------------------------------------------------------
  console.log("\nFunctions");
  // -------------------------------------------------------------------
  const avail = await client.query(
    `select is_apartment_available('${apartment.id}', '2027-03-12', '2027-03-13') a`,
  );
  avail.rows[0].a === false
    ? ok("is_apartment_available() sees the clash")
    : bad("is_apartment_available() missed the clash");

  const free = await client.query(
    `select is_apartment_available('${apartment.id}', '2027-09-01', '2027-09-05') a`,
  );
  free.rows[0].a === true
    ? ok("is_apartment_available() reports free dates")
    : bad("is_apartment_available() wrong on free dates");

  const unavailable = await client.query(
    `select count(*)::int n from get_unavailable_dates('${apartment.id}', '2027-03-01', '2027-04-01')`,
  );
  unavailable.rows[0].n > 0
    ? ok("get_unavailable_dates() returns nights", `${unavailable.rows[0].n} in Mar 2027`)
    : bad("get_unavailable_dates() returned nothing");

  const stats = await client.query("select dashboard_stats() s");
  stats.rows[0].s && typeof stats.rows[0].s === "object"
    ? ok("dashboard_stats() returns json", Object.keys(stats.rows[0].s).length + " metrics")
    : bad("dashboard_stats() failed");

  const settings = await client.query("select get_public_settings() s");
  const pub = settings.rows[0].s;
  pub && !("owner_email" in pub)
    ? ok("get_public_settings() withholds internal fields")
    : bad("get_public_settings() leaked internal fields");

  // Activity feed should have logged the bookings above.
  const activity = await client.query("select count(*)::int n from activity_log");
  activity.rows[0].n > 0
    ? ok("activity log populated", `${activity.rows[0].n} entries`)
    : bad("activity log empty");

  // -------------------------------------------------------------------
  console.log("\nHold expiry");
  // -------------------------------------------------------------------
  await client.query(`
    ${insert("2027-07-01", "2027-07-04", "held", "Expiring Hold")}
  `);
  await client.query(
    `update bookings set hold_expires_at = now() - interval '1 hour'
     where guest_name_snapshot = 'Expiring Hold'`,
  );
  const expired = await client.query("select expire_stale_holds() n");
  Number(expired.rows[0].n) >= 1
    ? ok("expire_stale_holds() released the hold", `${expired.rows[0].n} released`)
    : bad("expire_stale_holds() did nothing");

  const afterExpiry = await client.query(
    `select is_apartment_available('${apartment.id}', '2027-07-01', '2027-07-04') a`,
  );
  afterExpiry.rows[0].a === true
    ? ok("expired hold frees its dates")
    : bad("expired hold still blocking");
} finally {
  await client.query("rollback");
  await client.end();
}

console.log(`\n${passed} passed, ${failed} failed`);
console.log("(all test data rolled back)");
process.exit(failed === 0 ? 0 : 1);
