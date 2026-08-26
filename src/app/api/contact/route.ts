import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { contactRequestSchema } from "@/lib/validation";
import { sendContactNotification } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = contactRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid message", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const supabase = createAdminClient();

  const { error: insertError } = await supabase.from("messages").insert({
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    subject: input.subject || null,
    message: input.message,
  });

  if (insertError) {
    console.error("Contact message insert failed:", insertError);
    return NextResponse.json({ error: "Could not send message" }, { status: 500 });
  }

  await sendContactNotification(input);

  return NextResponse.json({ ok: true }, { status: 201 });
}
