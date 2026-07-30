"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { apartmentInputSchema, type ApartmentInput } from "@/lib/validation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return supabase;
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "apartment"
  );
}

async function uniqueSlug(
  supabase: SupabaseClient<Database>,
  base: string,
  excludeId?: string
): Promise<string> {
  let candidate = base;
  let attempt = 2;
  // Small, bounded loop — the admin's apartment list is never large enough
  // for this to matter performance-wise.
  while (true) {
    let query = supabase.from("apartments").select("id").eq("slug", candidate);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${attempt++}`;
  }
}

function revalidatePublicPages() {
  revalidatePath("/");
  revalidatePath("/accommodation");
  revalidatePath("/admin/apartments");
}

export async function createApartment(input: ApartmentInput): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const parsed = apartmentInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const { data: maxOrderRow } = await supabase
    .from("apartments")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const slug = await uniqueSlug(supabase, slugify(data.slug || data.name));

  const { error } = await supabase.from("apartments").insert({
    slug,
    name: data.name,
    description: data.description,
    features: data.features,
    price_usd: data.price_usd,
    guests: data.guests,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    feature_on_homepage: data.feature_on_homepage,
    sort_order: data.sort_order ?? (maxOrderRow?.sort_order ?? 0) + 1,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePublicPages();
  return { ok: true };
}

export async function updateApartment(id: string, input: ApartmentInput): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const parsed = apartmentInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const slug = await uniqueSlug(supabase, slugify(data.slug || data.name), id);

  const { error } = await supabase
    .from("apartments")
    .update({
      slug,
      name: data.name,
      description: data.description,
      features: data.features,
      price_usd: data.price_usd,
      guests: data.guests,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      feature_on_homepage: data.feature_on_homepage,
      ...(data.sort_order !== undefined ? { sort_order: data.sort_order } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePublicPages();
  revalidatePath(`/accommodation/${slug}`);
  return { ok: true };
}

// Bound directly to a <form action>, which requires a void-returning
// signature — errors here are rare enough (toggling one's own apartment
// list) that surfacing them via a thrown error / default error boundary is
// an acceptable tradeoff versus threading a result object through a form.
export async function setApartmentArchived(id: string, archived: boolean): Promise<void> {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("apartments")
    .update({ is_archived: archived })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePublicPages();
}
