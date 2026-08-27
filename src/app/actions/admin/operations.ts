"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { sendMail } from "@/lib/email";
import { formatDate, formatMoney } from "@/lib/format";
import type { Driver, TransferBooking } from "@/lib/types";

/**
 * Everything the owner runs day to day that is not a stay: drivers and
 * vehicles, safari enquiries, transfer requests, messages, guests and the
 * site-wide settings.
 */

function textField(value: FormDataEntryValue | null): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function numberField(value: FormDataEntryValue | null, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// =====================================================================
// Vehicles
// =====================================================================
export async function saveVehicle(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = textField(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const registration = String(formData.get("registration") ?? "").trim().toUpperCase();

  if (!name) return actionError("A vehicle name is required.", { name: "Required" });
  if (!registration) {
    return actionError("A registration is required.", { registration: "Required" });
  }

  const record = {
    name,
    registration,
    vehicle_type: String(formData.get("vehicle_type") ?? "Saloon").trim(),
    capacity: Math.max(1, numberField(formData.get("capacity"), 4)),
    luggage_capacity: Math.max(0, numberField(formData.get("luggage_capacity"), 2)),
    status: formData.get("status") === "inactive" ? "inactive" : "active",
  };

  const db = supabaseAdmin();
  const { error } = id
    ? await db.from("vehicles").update(record).eq("id", id)
    : await db.from("vehicles").insert(record);

  if (error) {
    return error.code === "23505"
      ? actionError("That registration is already on another vehicle.", {
          registration: "Already in use",
        })
      : actionError(`Could not save: ${error.message}`);
  }

  revalidatePath("/admin/drivers");
  return actionSuccess(id ? "Vehicle updated" : "Vehicle added");
}

export async function deleteVehicle(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Drivers and transfers keep their rows; they simply lose the link.
  await supabaseAdmin().from("vehicles").delete().eq("id", id);
  revalidatePath("/admin/drivers");
}

// =====================================================================
// Drivers
// =====================================================================
export async function saveDriver(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = textField(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name) return actionError("A driver name is required.", { name: "Required" });
  if (!phone) return actionError("A phone number is required.", { phone: "Required" });

  const record = {
    name,
    phone,
    whatsapp: textField(formData.get("whatsapp")),
    email: textField(formData.get("email")),
    licence_no: textField(formData.get("licence_no")),
    vehicle_id: textField(formData.get("vehicle_id")),
    status: formData.get("status") === "inactive" ? "inactive" : "active",
    notes: textField(formData.get("notes")),
    photo_path: textField(formData.get("photo_path")),
  };

  const db = supabaseAdmin();
  const { error } = id
    ? await db.from("drivers").update(record).eq("id", id)
    : await db.from("drivers").insert(record);

  if (error) return actionError(`Could not save: ${error.message}`);

  revalidatePath("/admin/drivers");
  return actionSuccess(id ? "Driver updated" : "Driver added");
}

export async function deleteDriver(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabaseAdmin().from("drivers").delete().eq("id", id);
  revalidatePath("/admin/drivers");
}

// =====================================================================
// Safari enquiries
// =====================================================================
export async function updateSafariEnquiry(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return actionError("Unknown enquiry.");

  const status = z
    .enum(["new", "contacted", "quoted", "confirmed", "cancelled", "completed"])
    .safeParse(formData.get("status"));

  const quoted = formData.get("quotedAmount");

  const { error } = await supabaseAdmin()
    .from("safari_enquiries")
    .update({
      status: status.success ? status.data : "new",
      quoted_amount:
        typeof quoted === "string" && quoted.trim() ? numberField(quoted) : null,
      notes: textField(formData.get("notes")),
      travel_date: textField(formData.get("travelDate")),
    })
    .eq("id", id);

  if (error) return actionError(`Could not save: ${error.message}`);

  revalidatePath("/admin/safaris/enquiries");
  revalidatePath(`/admin/safaris/enquiries/${id}`);
  revalidatePath("/admin");

  return actionSuccess("Enquiry updated");
}

// =====================================================================
// Transfer requests
// =====================================================================
export async function updateTransferRequest(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return actionError("Unknown transfer request.");

  const status = z
    .enum([
      "pending",
      "confirmed",
      "driver_assigned",
      "in_progress",
      "completed",
      "cancelled",
    ])
    .safeParse(formData.get("status"));

  const driverId = textField(formData.get("driverId"));
  const db = supabaseAdmin();

  // Assigning a driver implies the request is at least at that stage.
  let resolvedStatus = status.success ? status.data : "pending";
  if (driverId && resolvedStatus === "pending") resolvedStatus = "driver_assigned";

  const price = formData.get("price");

  const { data, error } = await db
    .from("transfer_bookings")
    .update({
      booking_status: resolvedStatus,
      driver_id: driverId,
      vehicle_id: textField(formData.get("vehicleId")),
      price_snapshot:
        typeof price === "string" && price.trim() ? Math.max(0, numberField(price)) : undefined,
      amount_paid: Math.max(0, numberField(formData.get("amountPaid"))),
      payment_method: textField(formData.get("paymentMethod")),
      payment_reference: textField(formData.get("paymentReference")),
      pickup_time: textField(formData.get("pickupTime")),
      notes: textField(formData.get("notes")),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) return actionError(`Could not save: ${error.message}`);

  const transfer = data as TransferBooking | null;

  // Tell the driver what they have been given.
  if (transfer && driverId && formData.get("notifyDriver") === "on") {
    await notifyDriver(driverId, transfer);
  }

  revalidatePath("/admin/transfers/requests");
  revalidatePath(`/admin/transfers/requests/${id}`);
  revalidatePath("/admin");

  return actionSuccess("Transfer request updated");
}

async function notifyDriver(driverId: string, transfer: TransferBooking) {
  const { data } = await supabaseAdmin()
    .from("drivers")
    .select("*")
    .eq("id", driverId)
    .maybeSingle();

  const driver = data as Driver | null;
  if (!driver?.email) return;

  await sendMail({
    to: driver.email,
    subject: `Transfer assigned — ${formatDate(transfer.transfer_date)} — ${transfer.reference}`,
    heading: "You have a transfer",
    intro: `Hello ${driver.name.split(" ")[0]}, here are the details for your next job.`,
    rows: [
      { label: "Reference", value: transfer.reference },
      { label: "Date", value: formatDate(transfer.transfer_date) },
      { label: "Pick-up time", value: transfer.pickup_time?.slice(0, 5) ?? "To confirm" },
      { label: "Pick-up", value: transfer.pickup_location },
      { label: "Drop-off", value: transfer.dropoff_location },
      { label: "Passenger", value: transfer.passenger_name },
      { label: "Phone", value: transfer.phone ?? transfer.whatsapp ?? "—" },
      { label: "Passengers", value: String(transfer.passengers) },
      { label: "Luggage", value: String(transfer.luggage) },
      ...(transfer.flight_number
        ? [{ label: "Flight", value: transfer.flight_number }]
        : []),
      ...(transfer.train_number ? [{ label: "Train", value: transfer.train_number }] : []),
      {
        label: "Fare",
        value: formatMoney(transfer.price_snapshot, transfer.currency),
      },
    ],
    body: transfer.special_instructions
      ? [`Instructions: ${transfer.special_instructions}`]
      : undefined,
  });
}

// =====================================================================
// Messages
// =====================================================================
export async function setMessageStatus(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = z
    .enum(["unread", "read", "replied", "archived"])
    .safeParse(formData.get("status"));

  if (!id || !status.success) return;

  await supabaseAdmin()
    .from("messages")
    .update({ status: status.data })
    .eq("id", id);

  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function saveMessageNote(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return actionError("Unknown message.");

  const { error } = await supabaseAdmin()
    .from("messages")
    .update({ admin_note: textField(formData.get("note")) })
    .eq("id", id);

  if (error) return actionError(`Could not save: ${error.message}`);

  revalidatePath("/admin/messages");
  return actionSuccess("Note saved");
}

// =====================================================================
// Guests
// =====================================================================
export async function saveGuest(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return actionError("Unknown guest.");

  const { error } = await supabaseAdmin()
    .from("guests")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      phone: textField(formData.get("phone")),
      whatsapp: textField(formData.get("whatsapp")),
      country: textField(formData.get("country")),
      notes: textField(formData.get("notes")),
    })
    .eq("id", id);

  if (error) return actionError(`Could not save: ${error.message}`);

  revalidatePath("/admin/guests");
  revalidatePath(`/admin/guests/${id}`);

  return actionSuccess("Guest updated");
}

// =====================================================================
// Site settings
// =====================================================================
export async function saveSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const record = {
    property_name: String(formData.get("property_name") ?? "").trim() || "Siriba Resort Watamu",
    tagline: textField(formData.get("tagline")),
    logo_path: textField(formData.get("logo_path")),
    logo_light_path: textField(formData.get("logo_light_path")),
    address: textField(formData.get("address")),
    phone: textField(formData.get("phone")),
    whatsapp: textField(formData.get("whatsapp")),
    email: textField(formData.get("email")),
    facebook_url: textField(formData.get("facebook_url")),
    instagram_url: textField(formData.get("instagram_url")),
    tripadvisor_url: textField(formData.get("tripadvisor_url")),
    map_embed_url: textField(formData.get("map_embed_url")),

    default_currency: String(formData.get("default_currency") ?? "KES").trim() || "KES",
    hold_duration_hours: Math.max(0, numberField(formData.get("hold_duration_hours"), 3)),
    booking_terms: textField(formData.get("booking_terms")),
    cancellation_policy: textField(formData.get("cancellation_policy")),
    check_in_time: textField(formData.get("check_in_time")),
    check_out_time: textField(formData.get("check_out_time")),
    default_deposit_percent: Math.min(
      100,
      Math.max(0, numberField(formData.get("default_deposit_percent"), 30)),
    ),

    hide_prices: formData.get("hide_prices") === "on",
    usd_to_kes_rate: Math.max(0, numberField(formData.get("usd_to_kes_rate"), 129)),

    owner_email: textField(formData.get("owner_email")),
    notify_on_booking: formData.get("notify_on_booking") === "on",
    notify_on_enquiry: formData.get("notify_on_enquiry") === "on",
    notify_on_transfer: formData.get("notify_on_transfer") === "on",
    notify_on_message: formData.get("notify_on_message") === "on",

    pre_arrival_days: Math.max(0, numberField(formData.get("pre_arrival_days"), 3)),
    post_stay_days: Math.max(0, numberField(formData.get("post_stay_days"), 1)),
    arrival_information: textField(formData.get("arrival_information")),
    review_url: textField(formData.get("review_url")),
  };

  const { error } = await supabaseAdmin()
    .from("site_settings")
    .update(record)
    .eq("id", true);

  if (error) return actionError(`Could not save: ${error.message}`);

  // Settings touch the header, footer and every price on the site.
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");

  return actionSuccess("Settings saved", {
    detail: record.hide_prices
      ? "Prices are hidden across the public website."
      : undefined,
  });
}
