import { NextResponse } from "next/server";
import type { DigitalTwin } from "@repo/shared/types";
import { digitalTwinSchema } from "@repo/shared/validators";
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
    .from("digital_twins")
    .select("*, twin_history(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Digital twin not found" }, { status: 404 });
  }

  return NextResponse.json({ digitalTwin: data as DigitalTwin & { twin_history: unknown[] } });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const partialSchema = digitalTwinSchema.partial();
  const parsed = partialSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { data: existing, error: fetchError } = await supabase
    .from("digital_twins")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Digital twin not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("digital_twins")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ digitalTwin: data as DigitalTwin });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: existing, error: fetchError } = await supabase
    .from("digital_twins")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Digital twin not found" }, { status: 404 });
  }

  const { data: linkedSims } = await supabase
    .from("simulations")
    .select("id, status")
    .eq("digital_twin_id", id)
    .eq("user_id", user.id);

  if (linkedSims && linkedSims.some((s) => s.status === "running")) {
    return NextResponse.json(
      { error: "Cannot delete twin with running simulations. Wait for completion or cancel them first." },
      { status: 409 }
    );
  }

  await supabase
    .from("simulations")
    .update({ digital_twin_id: null, updated_at: new Date().toISOString() })
    .eq("digital_twin_id", id)
    .eq("user_id", user.id);

  await supabase
    .from("twin_history")
    .delete()
    .eq("twin_id", id);

  const { error } = await supabase
    .from("digital_twins")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
