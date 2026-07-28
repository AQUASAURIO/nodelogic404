"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Loader2, RotateCcw } from "lucide-react";
import { formatRelativeTime, cn } from "@/lib/utils";
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
  name: string;
  description: string | null;
  type: string;
  status: string;
  progress: number;
  parameters: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface SimulationResult {
  id: string;
  output: Record<string, unknown>;
  insights: string[];
  confidence_score: number | null;
  execution_time_ms: number | null;
  executed_at: string;
}

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "info" | "destructive" | "secondary" }> = {
  completed: { label: "Completed", variant: "success" },
  running: { label: "Running", variant: "info" },
  draft: { label: "Draft", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "warning" },
};

export default function SimulationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSimulation = useCallback(async () => {
    try {
      const res = await fetch(`/api/simulations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSimulation(data.simulation);
        setResult(data.result ?? null);
      }
    } catch {
      setError("Failed to load simulation");
    }
  }, [id]);

  useEffect(() => {
    fetchSimulation();
  }, [fetchSimulation]);

  useEffect(() => {
    if (simulation?.status !== "running") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/simulations/${id}`);
        if (res.ok) {
          const data = await res.json();
          setSimulation(data.simulation);
          setResult(data.result ?? null);
          if (data.simulation.status !== "running") {
            setIsRunning(false);
          }
        }
      } catch {
        // poll error
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [simulation?.status, id]);

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/simulations/${id}/run`, { method: "POST" });
      if (res.ok) {
        fetchSimulation();
      } else {
        setError("Failed to start simulation");
        setIsRunning(false);
      }
    } catch {
      setError("Failed to start simulation");
      setIsRunning(false);
    }
  };

  if (!simulation && !error) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !simulation) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-destructive">{error}</p>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline", className: "mt-4" }))}
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const sim = simulation!;
  const status = (statusConfig[sim.status] ?? statusConfig.draft) as { label: string; variant: "success" | "warning" | "info" | "destructive" | "secondary" };
  const outputData = result?.output;
  const timeSeriesData = Array.isArray(outputData?.time_series)
    ? (outputData.time_series as { time: string; value: number }[])
    : null;
  const barData = Array.isArray(outputData?.categories)
    ? (outputData.categories as { name: string; value: number }[])
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{sim.name}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-muted-foreground">
            {sim.type.replace(/_/g, " ")} &middot; Created{" "}
            {formatRelativeTime(sim.created_at)}
          </p>
        </div>
        {(sim.status === "draft" || sim.status === "failed") && (
          <button
            className={cn(buttonVariants({ variant: "gradient" }))}
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isRunning ? "Starting..." : "Run Simulation"}
          </button>
        )}
        {sim.status === "completed" && (
          <button
            className={cn(buttonVariants({ variant: "outline" }))}
            onClick={handleRun}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Re-run
          </button>
        )}
      </div>

      {sim.status === "running" && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{sim.progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${sim.progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {sim.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{sim.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            {Object.entries(sim.parameters ?? {}).map(([key, value]) => (
              <div key={key} className="rounded-lg bg-muted/50 p-3">
                <dt className="text-xs text-muted-foreground">
                  {key.replace(/_/g, " ")}
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Results</CardTitle>
              {result.confidence_score != null && (
                <CardDescription>
                  Confidence: {Math.round(result.confidence_score * 100)}%
                  {result.execution_time_ms != null &&
                    ` \u00b7 Executed in ${(result.execution_time_ms / 1000).toFixed(1)}s`}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {timeSeriesData && timeSeriesData.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-3">Time Series</p>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="time" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {barData && barData.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-3">Category Breakdown</p>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {!timeSeriesData && !barData && outputData && (
                <div>
                  <p className="text-sm font-medium mb-2">Output Data</p>
                  <pre className="rounded-lg bg-muted p-4 text-xs overflow-x-auto">
                    {JSON.stringify(outputData, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {result.insights && result.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.insights.map((insight, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm"
                    >
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
