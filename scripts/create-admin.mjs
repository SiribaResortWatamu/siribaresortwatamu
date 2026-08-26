#!/usr/bin/env node
/**
 * Provision a dashboard account.
 *
 *   node scripts/create-admin.mjs owner@example.com "Full Name"
 *
 * Creates the Supabase auth user (email pre-confirmed, no password set),
 * grants it dashboard access via `admin_users`, and prints a one-time link
 * the person uses to choose their own password. No password is ever set or
 * handled by this script.
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Minimal .env.local reader — this runs outside Next, which would normally
// load these for us.
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const email = process.argv[2];
const fullName = process.argv[3] ?? null;
if (!email) {
  console.error('Usage: node scripts/create-admin.mjs owner@example.com "Full Name"');
  process.exit(1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

// 1. The auth user ---------------------------------------------------
let userId;

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  email_confirm: true,
});

if (createError) {
  if (!/already|registered|exists/i.test(createError.message)) {
    console.error("Could not create the auth user:", createError.message);
    process.exit(1);
  }
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const existing = list?.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!existing) {
    console.error("User reportedly exists but could not be found.");
    process.exit(1);
  }
  userId = existing.id;
  console.log(`Auth user already existed — reusing ${userId}`);
} else {
  userId = created.user.id;
  console.log(`Auth user created — ${userId}`);
}

// 2. Dashboard access ------------------------------------------------
const { error: grantError } = await supabase
  .from("admin_users")
  .upsert(
    { user_id: userId, email, full_name: fullName, role: "owner" },
    { onConflict: "user_id" },
  );

if (grantError) {
  console.error("Could not grant dashboard access:", grantError.message);
  process.exit(1);
}
console.log("Dashboard access granted (admin_users).");

// 3. A link for them to set their own password -----------------------
const { data: link, error: linkError } = await supabase.auth.admin.generateLink({
  type: "recovery",
  email,
  options: { redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/admin` },
});

if (linkError) {
  console.error(
    `\nAccount is ready, but the password link could not be generated: ${linkError.message}`,
  );
  console.error(
    "Use 'Send password recovery' from Supabase → Authentication → Users instead.",
  );
  process.exit(0);
}

console.log("\nOpen this once to choose a password:\n");
console.log(link.properties.action_link);
console.log("\nThen sign in at /admin with that email and password.");
