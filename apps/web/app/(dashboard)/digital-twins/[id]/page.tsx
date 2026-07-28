import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, Pencil, Play, Power, Clock, Settings, Activity } from "lucide-react";
import { formatDate, formatRelativeTime, cn } from "@/lib/utils";
import { TWIN_TYPES } from "@repo/shared/constants";

const twinTypeLabel = Object.fromEntries(
  TWIN_TYPES.map((t) => [t.value, t.label])
);

export default async function DigitalTwinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: twin } = await supabase
    .from("digital_twins")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!twin) {
    notFound();
  }

  const { data: recentChanges } = await supabase
    .from("simulations")
    .select("id, name, status, created_at")
    .eq("digital_twin_id", twin.id)
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const configEntries = Object.entries(twin.config ?? {});
  const stateEntries = Object.entries(twin.state ?? {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/digital-twins"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{twin.name}</h1>
            <Badge variant={twin.is_active ? "success" : "secondary"}>
              {twin.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {twinTypeLabel[twin.type] ?? twin.type} &middot; Created{" "}
            {formatDate(twin.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/digital-twins/${twin.id}/edit`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
          <Link
            href={`/simulations/new?twin=${twin.id}`}
            className={cn(buttonVariants())}
          >
            <Play className="mr-2 h-4 w-4" />
            Run Simulation
          </Link>
        </div>
      </div>

      {twin.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{twin.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Configuration</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {configEntries.length > 0 ? (
              <dl className="space-y-3">
                {configEntries.map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">
                      {key.replace(/_/g, " ")}
                    </dt>
                    <dd className="text-sm font-medium">
                      {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">No configuration set.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Current State</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {stateEntries.length > 0 ? (
              <dl className="space-y-3">
                {stateEntries.map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">
                      {key.replace(/_/g, " ")}
                    </dt>
                    <dd className="text-sm font-medium">
                      {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">No state data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Recent Changes</CardTitle>
          </div>
          <CardDescription>
            Simulations that have modified this twin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentChanges && recentChanges.length > 0 ? (
            <div className="space-y-3">
              {recentChanges.map((sim) => (
                <Link
                  key={sim.id}
                  href={`/simulations/${sim.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{sim.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(sim.created_at)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      sim.status === "completed"
                        ? "success"
                        : sim.status === "failed"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {sim.status}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No simulations have been run on this twin yet.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <button className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}>
          <Power className="mr-2 h-4 w-4" />
          Deactivate
        </button>
      </div>
    </div>
  );
}
