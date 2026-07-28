import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Play, GitBranch, Users, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { formatRelativeTime, cn } from "@/lib/utils";

const statusVariant: Record<string, "success" | "warning" | "info" | "destructive" | "secondary"> = {
  completed: "success",
  running: "info",
  draft: "secondary",
  failed: "destructive",
  cancelled: "warning",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { count: simulationsCount },
    { count: twinsCount },
    { count: collaboratorsCount },
    { data: recentSimulations },
  ] = await Promise.all([
    supabase.from("simulations").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
    supabase.from("digital_twins").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
    supabase.from("collaborators").select("*", { count: "exact", head: true }).eq("owner_id", user!.id),
    supabase
      .from("simulations")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const successCount = recentSimulations?.filter((s) => s.status === "completed").length ?? 0;
  const totalRecent = recentSimulations?.length ?? 0;
  const successRate = totalRecent > 0 ? Math.round((successCount / totalRecent) * 100) : 0;

  const stats = [
    { title: "Total Simulations", value: simulationsCount ?? 0, icon: Play, color: "text-indigo-500" },
    { title: "Active Twins", value: twinsCount ?? 0, icon: GitBranch, color: "text-purple-500" },
    { title: "Collaborators", value: collaboratorsCount ?? 0, icon: Users, color: "text-pink-500" },
    { title: "Success Rate", value: `${successRate}%`, icon: TrendingUp, color: "text-emerald-500" },
  ];

  const firstName = user!.user_metadata?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your simulations and digital twins.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Simulations</CardTitle>
                <CardDescription>Your last 5 simulation runs</CardDescription>
              </div>
              <Link
                href="/simulations/new"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" })
                )}
              >
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentSimulations && recentSimulations.length > 0 ? (
                <div className="space-y-4">
                  {recentSimulations.map((sim) => (
                    <Link
                      key={sim.id}
                      href={`/simulations/${sim.id}`}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{sim.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {sim.type.replace(/_/g, " ")} &middot;{" "}
                          {formatRelativeTime(sim.created_at)}
                        </p>
                      </div>
                      <Badge variant={statusVariant[sim.status] ?? "secondary"}>
                        {sim.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Play className="h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No simulations yet. Create your first one to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started quickly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/simulations/new"
                className={cn(
                  buttonVariants({ className: "w-full justify-start" })
                )}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Simulation
              </Link>
              <Link
                href="/digital-twins/new"
                className={cn(
                  buttonVariants({ variant: "outline", className: "w-full justify-start" })
                )}
              >
                <GitBranch className="mr-2 h-4 w-4" />
                Create Digital Twin
              </Link>
              <Link
                href="/collaborators"
                className={cn(
                  buttonVariants({ variant: "outline", className: "w-full justify-start" })
                )}
              >
                <Users className="mr-2 h-4 w-4" />
                Invite Collaborator
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
