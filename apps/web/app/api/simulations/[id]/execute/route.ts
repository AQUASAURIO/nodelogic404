import { NextResponse } from "next/server";
import type { Simulation, SimulationResult } from "@repo/shared/types";
import { createClient } from "@/lib/supabase/server";
import { SimulationEngine } from "@/lib/simulation-engine/engine";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: simulation, error: fetchError } = await supabase
    .from("simulations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !simulation) {
    return NextResponse.json({ error: "Simulation not found" }, { status: 404 });
  }

  const sim = simulation as Simulation;

  if (sim.status === "running") {
    return NextResponse.json(
      { error: "Simulation is already running" },
      { status: 409 }
    );
  }

  if (sim.digital_twin_id) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .single();

    const { data: simCount } = await supabase
      .from("simulations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed");

    const planStatus = subscription?.status ?? "active";
    const isPaid = planStatus === "active" || planStatus === "trialing";
    if (!isPaid && (simCount as unknown as number) >= 3) {
      return NextResponse.json(
        { error: "Free plan execution limit reached." },
        { status: 403 }
      );
    }
  }

  await supabase
    .from("simulations")
    .update({ status: "running", progress: 10, updated_at: new Date().toISOString() })
    .eq("id", id);

  try {
    let digitalTwin = null;
    if (sim.digital_twin_id) {
      const { data: twin, error: twinError } = await supabase
        .from("digital_twins")
        .select("*")
        .eq("id", sim.digital_twin_id)
        .eq("user_id", user.id)
        .single();

      if (twinError || !twin) {
        await supabase
          .from("simulations")
          .update({ status: "failed", progress: 0, updated_at: new Date().toISOString() })
          .eq("id", id);
        return NextResponse.json(
          { error: "Associated digital twin not found" },
          { status: 404 }
        );
      }
      digitalTwin = twin;
    } else {
      digitalTwin = {
        id: "virtual",
        user_id: user.id,
        name: "Virtual Twin",
        description: null,
        type: "collaboration_workflow" as const,
        config: {},
        state: {},
        metadata: {},
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    await supabase
      .from("simulations")
      .update({ progress: 50, updated_at: new Date().toISOString() })
      .eq("id", id);

    const engine = new SimulationEngine();
    const result: SimulationResult = await engine.execute(sim, digitalTwin);

    await supabase
      .from("simulations")
      .update({ progress: 90, updated_at: new Date().toISOString() })
      .eq("id", id);

    const { error: insertError } = await supabase
      .from("simulation_results")
      .insert({
        simulation_id: result.simulation_id,
        version: result.version,
        output: result.output,
        insights: result.insights,
        confidence_score: result.confidence_score,
        execution_time_ms: result.execution_time_ms,
        executed_at: result.executed_at,
      });

    if (insertError) {
      await supabase
        .from("simulations")
        .update({ status: "failed", progress: 0, updated_at: new Date().toISOString() })
        .eq("id", id);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await supabase
      .from("simulations")
      .update({ status: "completed", progress: 100, updated_at: new Date().toISOString() })
      .eq("id", id);

    await supabase
      .from("usage_metrics")
      .insert({
        user_id: user.id,
        event_type: "simulation_executed",
        event_data: {
          simulation_id: id,
          type: sim.type,
          execution_time_ms: result.execution_time_ms,
        },
      });

    return NextResponse.json({
      simulation: { ...sim, status: "completed", progress: 100 } as Simulation,
      result,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    await supabase
      .from("simulations")
      .update({ status: "failed", progress: 0, updated_at: new Date().toISOString() })
      .eq("id", id);

    await supabase
      .from("usage_metrics")
      .insert({
        user_id: user.id,
        event_type: "simulation_failed",
        event_data: { simulation_id: id, error: errorMessage },
      });

    return NextResponse.json(
      { error: "Simulation execution failed", details: errorMessage },
      { status: 500 }
    );
  }
}
