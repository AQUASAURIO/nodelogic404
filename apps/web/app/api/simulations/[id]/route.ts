import { NextResponse } from "next/server";
import type { Simulation } from "@repo/shared/types";
import { simulationSchema } from "@repo/shared/validators";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await supabase
    .from("simulations")
    .select("*, simulation_results(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Simulation not found" }, { status: 404 });
  }

  return NextResponse.json({ simulation: data as Simulation & { simulation_results: unknown[] } });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const partialSchema = simulationSchema.partial();
  const parsed = partialSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { data: existing, error: fetchError } = await supabase
    .from("simulations")
    .select("id, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Simulation not found" }, { status: 404 });
  }

  if (existing.status === "running") {
    return NextResponse.json(
      { error: "Cannot modify a running simulation" },
      { status: 409 }
    );
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (updateData.digital_twin_id === null) {
    updateData.digital_twin_id = null;
  }
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("simulations")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ simulation: data as Simulation });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: existing, error: fetchError } = await supabase
    .from("simulations")
    .select("id, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Simulation not found" }, { status: 404 });
  }

  if (existing.status === "running") {
    return NextResponse.json(
      { error: "Cannot delete a running simulation. Cancel it first." },
      { status: 409 }
    );
  }

  await supabase
    .from("simulation_results")
    .delete()
    .eq("simulation_id", id);

  const { error } = await supabase
    .from("simulations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
