"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, Play, GitBranch, Zap, Target, Flame, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { SIMULATION_TYPES } from "@repo/shared/constants";

const typeIcons = {
  scenario_test: Target,
  what_if: Zap,
  stress_test: Flame,
  optimization: GitBranch,
  collaboration_drill: Users,
};

function StepIndicator({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: string[];
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
              i < currentStep
                ? "bg-primary text-primary-foreground"
                : i === currentStep
                ? "bg-primary/20 text-primary ring-2 ring-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          <span
            className={cn(
              "hidden text-sm sm:block",
              i === currentStep ? "font-medium text-foreground" : "text-muted-foreground"
            )}
          >
            {step}
          </span>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "mx-2 h-px w-8 sm:w-12",
                i < currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

interface SimulationConfig {
  name: string;
  description: string;
  twin_id: string;
  parameters: Record<string, string>;
}

const defaultParameters: Record<string, { label: string; placeholder: string }[]> = {
  scenario_test: [
    { label: "Scenario Name", placeholder: "e.g. Team Restructure" },
    { label: "Variables to Test", placeholder: "e.g. team_size, communication_frequency" },
    { label: "Duration (weeks)", placeholder: "e.g. 12" },
  ],
  what_if: [
    { label: "Hypothesis", placeholder: "e.g. Doubling team size improves velocity" },
    { label: "Parameters to Vary", placeholder: "e.g. team_size, sprint_length" },
    { label: "Evaluation Criteria", placeholder: "e.g. delivery_time, quality_score" },
  ],
  stress_test: [
    { label: "Stress Factor", placeholder: "e.g. workload_multiplier" },
    { label: "Intensity Level", placeholder: "e.g. high" },
    { label: "Recovery Measurement", placeholder: "e.g. bounce_back_time" },
  ],
  optimization: [
    { label: "Optimization Goal", placeholder: "e.g. minimize_delivery_time" },
    { label: "Constraints", placeholder: "e.g. budget_limit, team_capacity" },
    { label: "Iteration Count", placeholder: "e.g. 100" },
  ],
  collaboration_drill: [
    { label: "Drill Scenario", placeholder: "e.g. Cross-team handoff" },
    { label: "Participants", placeholder: "e.g. engineering, design, product" },
    { label: "Success Metrics", placeholder: "e.g. handoff_time, error_rate" },
  ],
};

export default function NewSimulationPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [config, setConfig] = useState<SimulationConfig>({
    name: "",
    description: "",
    twin_id: "",
    parameters: {},
  });

  const selectedType = SIMULATION_TYPES.find((t) => t.value === config.parameters._type);

  const handleTypeSelect = (type: string) => {
    setConfig((prev) => ({
      ...prev,
      parameters: { _type: type },
    }));
  };

  const handleParameterChange = (key: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      parameters: { ...prev.parameters, [key]: value },
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          type: config.parameters._type,
          digital_twin_id: config.twin_id || null,
          parameters: Object.fromEntries(
            Object.entries(config.parameters).filter(([k]) => k !== "_type")
          ),
        }),
      });

      if (res.ok) {
        const { id } = await res.json();
        router.push(`/simulations/${id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return !!config.parameters._type;
    if (step === 1) return !!config.name.trim();
    return true;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Simulation</h1>
          <p className="text-muted-foreground">
            Create and configure a new simulation run.
          </p>
        </div>
      </div>

      <StepIndicator
        currentStep={step}
        steps={["Select Type", "Configure", "Review & Launch"]}
      />

      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Choose Simulation Type</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {SIMULATION_TYPES.map((type) => {
              const Icon = typeIcons[type.value] ?? Play;
              const isSelected = config.parameters._type === type.value;
              return (
                <button
                  key={type.value}
                  onClick={() => handleTypeSelect(type.value)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span className="font-medium">{type.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Simulation Name</Label>
              <Input
                id="name"
                placeholder="e.g. Q3 Team Restructure Analysis"
                value={config.name}
                onChange={(e) => setConfig((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What are you testing or exploring?"
                value={config.description}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
          </div>

          {selectedType && (
            <div className="space-y-4">
              <h3 className="font-medium">Parameters for {selectedType.label}</h3>
              {defaultParameters[config.parameters._type as string]?.map((param) => (
                <div key={param.label} className="space-y-2">
                  <Label>{param.label}</Label>
                  <Input
                    placeholder={param.placeholder}
                    value={config.parameters[param.label] ?? ""}
                    onChange={(e) =>
                      handleParameterChange(param.label, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Review & Launch</h2>
          <Card>
            <CardHeader>
              <CardTitle>{config.name || "Unnamed Simulation"}</CardTitle>
              <CardDescription>{config.description || "No description"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Type:</span>
                <Badge variant="info">{selectedType?.label}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Parameters</p>
                <dl className="space-y-2 rounded-lg bg-muted/50 p-3">
                  {Object.entries(config.parameters)
                    .filter(([k]) => k !== "_type")
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <dt className="text-muted-foreground">{key}</dt>
                        <dd className="font-medium">{value || "\u2014"}</dd>
                      </div>
                    ))}
                </dl>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          className={cn(buttonVariants({ variant: "outline" }))}
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </button>
        {step < 2 ? (
          <button
            className={cn(buttonVariants())}
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        ) : (
          <button
            className={cn(buttonVariants({ variant: "gradient" }))}
            onClick={handleSubmit}
            disabled={isSubmitting || !canProceed()}
          >
            <Play className="mr-2 h-4 w-4" />
            {isSubmitting ? "Creating..." : "Launch Simulation"}
          </button>
        )}
      </div>
    </div>
  );
}
