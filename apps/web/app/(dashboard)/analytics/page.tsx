"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, Brain, Calendar } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Simulation {
  id: string;
  status: string;
  created_at: string;
  type: string;
}

interface Twin {
  id: string;
  type: string;
  is_active: boolean;
  created_at: string;
}

interface UsageMetric {
  event_type: string;
  created_at: string;
}

interface AnalyticsData {
  simulations: Simulation[];
  twins: Twin[];
  usageMetrics: UsageMetric[];
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

function ChartCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-64 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[280px] w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

function InsightsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-56 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TwinTypesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-3 w-60 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-2 w-24 rounded-full" />
                <Skeleton className="h-5 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [
        { data: simulations },
        { data: twins },
        { data: usageMetrics },
      ] = await Promise.all([
        supabase
          .from("simulations")
          .select("id, status, created_at, type")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("digital_twins")
          .select("id, type, is_active, created_at")
          .eq("user_id", user.id),
        supabase
          .from("usage_metrics")
          .select("event_type, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      setData({
        simulations: simulations ?? [],
        twins: twins ?? [],
        usageMetrics: usageMetrics ?? [],
      });
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <TwinTypesSkeleton />
          <InsightsSkeleton />
        </div>
      </div>
    );
  }

  const simulations = data?.simulations ?? [];
  const twins = data?.twins ?? [];
  const usageMetrics = data?.usageMetrics ?? [];

  const totalSims = simulations.length;
  const completedSims = simulations.filter((s) => s.status === "completed").length;
  const failedSims = simulations.filter((s) => s.status === "failed").length;
  const successRate = totalSims > 0 ? Math.round((completedSims / totalSims) * 100) : 0;
  const activeTwins = twins.filter((t) => t.is_active).length;

  const simsByDay: Record<string, { completed: number; failed: number; total: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0]!;
    simsByDay[key] = { completed: 0, failed: 0, total: 0 };
  }

  simulations.forEach((sim) => {
    const day = sim.created_at.split("T")[0]!;
    if (simsByDay[day]) {
      simsByDay[day].total += 1;
      if (sim.status === "completed") simsByDay[day].completed += 1;
      if (sim.status === "failed") simsByDay[day].failed += 1;
    }
  });

  const usageChartData = Object.entries(simsByDay).map(([date, counts]) => ({
    date: date.slice(5),
    ...counts,
  }));

  const simsByType: Record<string, number> = {};
  simulations.forEach((sim) => {
    const label = sim.type.replace(/_/g, " ");
    simsByType[label] = (simsByType[label] ?? 0) + 1;
  });
  const typeChartData = Object.entries(simsByType).map(([name, count]) => ({
    name,
    count,
  }));

  const twinTypes: Record<string, number> = {};
  twins.forEach((t) => {
    const label = t.type.replace(/_/g, " ");
    twinTypes[label] = (twinTypes[label] ?? 0) + 1;
  });

  const eventTypeCounts: Record<string, number> = {};
  usageMetrics.forEach((m) => {
    eventTypeCounts[m.event_type] = (eventTypeCounts[m.event_type] ?? 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Insights into your simulation and twin usage.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Simulations
            </CardTitle>
            <Activity className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSims}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedSims} completed, {failedSims} failed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all simulation types
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Twins
            </CardTitle>
            <Brain className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeTwins}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Of {twins.length} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Activity Events
            </CardTitle>
            <Calendar className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{usageMetrics.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 100 tracked events
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Simulation Activity (30 days)</CardTitle>
            <CardDescription>Daily simulation runs over the last month</CardDescription>
          </CardHeader>
          <CardContent>
            {usageChartData.some((d) => d.total > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={usageChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} name="Total" dot={false} />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" dot={false} />
                  <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} name="Failed" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                No activity data yet. Run some simulations to see trends.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Simulations by Type</CardTitle>
            <CardDescription>Distribution across simulation categories</CardDescription>
          </CardHeader>
          <CardContent>
            {typeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={typeChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis className="text-xs" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Simulations" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                No simulations yet. Create one to start tracking.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Twin Types</CardTitle>
            <CardDescription>Breakdown of your digital twins by category</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(twinTypes).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(twinTypes).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{type}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-purple-500"
                          style={{
                            width: `${(count / (twins.length || 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No digital twins created yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Key Insights</CardTitle>
            <CardDescription>Automated analysis of your usage patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {totalSims === 0 && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  Get started by creating your first simulation to unlock insights.
                </div>
              )}
              {totalSims > 0 && successRate >= 80 && (
                <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                  Great job! Your simulation success rate is {successRate}%, indicating well-configured models.
                </div>
              )}
              {totalSims > 0 && successRate < 50 && (
                <div className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                  Your success rate is {successRate}%. Consider reviewing your simulation parameters.
                </div>
              )}
              {activeTwins > 0 && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  You have {activeTwins} active digital twin{activeTwins !== 1 ? "s" : ""} powering your simulations.
                </div>
              )}
              {Object.entries(eventTypeCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([eventType, count]) => (
                  <div key={eventType} className="rounded-lg bg-muted/50 p-3 text-sm">
                    <span className="font-medium">{eventType.replace(/_/g, " ")}</span>
                    <span className="text-muted-foreground"> — {count} event{count !== 1 ? "s" : ""} tracked</span>
                  </div>
                ))}
              {totalSims === 0 && activeTwins === 0 && Object.keys(eventTypeCounts).length === 0 && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  No activity yet. Start by creating a digital twin and running a simulation.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
