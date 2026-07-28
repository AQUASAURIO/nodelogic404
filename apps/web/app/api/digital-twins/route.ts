import { NextResponse } from "next/server";
import type { DigitalTwin } from "@repo/shared/types";
import { digitalTwinSchema } from "@repo/shared/validators";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("digital_twins")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ digitalTwins: data as DigitalTwin[] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = digitalTwinSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .single();

  const { data: twinCount, error: countError } = await supabase
    .from("digital_twins")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (!countError && twinCount !== null) {
    const planStatus = subscription?.status ?? "active";
    const isPaid = planStatus === "active" || planStatus === "trialing";
    if (!isPaid && (twinCount as unknown as number) >= 1) {
      return NextResponse.json(
        { error: "Free plan limit reached. Upgrade to create more digital twins." },
        { status: 403 }
      );
    }
  }

  const { data, error } = await supabase
    .from("digital_twins")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      type: parsed.data.type,
      config: parsed.data.config,
      state: {},
      metadata: {},
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ digitalTwin: data as DigitalTwin }, { status: 201 });
}
