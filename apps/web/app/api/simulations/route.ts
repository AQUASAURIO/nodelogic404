import { NextResponse } from "next/server";
import type { Simulation } from "@repo/shared/types";
import { simulationSchema } from "@repo/shared/validators";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("simulations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ simulations: data as Simulation[] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = simulationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (parsed.data.digital_twin_id) {
    const { data: twin, error: twinError } = await supabase
      .from("digital_twins")
      .select("id")
      .eq("id", parsed.data.digital_twin_id)
      .eq("user_id", user.id)
      .single();

    if (twinError || !twin) {
      return NextResponse.json(
        { error: "Digital twin not found or not owned by user" },
        { status: 404 }
      );
    }
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .single();

  const { data: simCount, error: countError } = await supabase
    .from("simulations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (!countError && simCount !== null) {
    const planStatus = subscription?.status ?? "active";
    const isPaid = planStatus === "active" || planStatus === "trialing";
    if (!isPaid && (simCount as unknown as number) >= 3) {
      return NextResponse.json(
        { error: "Free plan limit reached. Upgrade to create more simulations." },
        { status: 403 }
      );
    }
  }

  const { data, error } = await supabase
    .from("simulations")
    .insert({
      user_id: user.id,
      digital_twin_id: parsed.data.digital_twin_id ?? null,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      type: parsed.data.type,
      parameters: parsed.data.parameters,
      status: "draft",
      progress: 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ simulation: data as Simulation }, { status: 201 });
}
