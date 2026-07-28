import type { DigitalTwin, TwinType } from "@repo/shared/types";

interface TwinState {
  health: number;
  efficiency: number;
  activityLevel: number;
  lastSyncAt: string;
  metrics: Record<string, number>;
  trends: Record<string, "up" | "down" | "stable">;
  alerts: { severity: "info" | "warning" | "critical"; message: string; timestamp: string }[];
}

interface StateDiff {
  changedFields: string[];
  additions: Record<string, unknown>;
  removals: string[];
  modifications: { field: string; oldValue: unknown; newValue: unknown }[];
  summary: string;
}

interface PredictionResult {
  predictedState: TwinState;
  confidenceInterval: { lower: Record<string, number>; upper: Record<string, number> };
  riskFactors: string[];
  recommendedActions: string[];
  timeHorizon: number;
}

const TWIN_INITIAL_STATES: Record<TwinType, () => Partial<TwinState>> = {
  collaboration_workflow: () => ({
    health: 0.75 + Math.random() * 0.2,
    efficiency: 0.6 + Math.random() * 0.25,
    activityLevel: 0.5 + Math.random() * 0.3,
    metrics: {
      taskCompletionRate: 0.7 + Math.random() * 0.2,
      avgResponseTime: 2 + Math.random() * 3,
      bottleneckCount: Math.floor(Math.random() * 5),
      handoffEfficiency: 0.6 + Math.random() * 0.3,
    },
  }),
  team_dynamics: () => ({
    health: 0.7 + Math.random() * 0.25,
    efficiency: 0.65 + Math.random() * 0.25,
    activityLevel: 0.55 + Math.random() * 0.3,
    metrics: {
      cohesionScore: 0.6 + Math.random() * 0.3,
      conflictIndex: Math.random() * 0.4,
      meetingLoad: 5 + Math.floor(Math.random() * 15),
      satisfactionScore: 0.6 + Math.random() * 0.35,
    },
  }),
  decision_process: () => ({
    health: 0.7 + Math.random() * 0.2,
    efficiency: 0.55 + Math.random() * 0.3,
    activityLevel: 0.4 + Math.random() * 0.4,
    metrics: {
      avgDecisionTime: 1 + Math.random() * 7,
      stakeholderAlignment: 0.5 + Math.random() * 0.4,
      reversalsCount: Math.floor(Math.random() * 3),
      informationCompleteness: 0.6 + Math.random() * 0.3,
    },
  }),
  communication_pattern: () => ({
    health: 0.65 + Math.random() * 0.3,
    efficiency: 0.6 + Math.random() * 0.25,
    activityLevel: 0.6 + Math.random() * 0.3,
    metrics: {
      messageVolume: 20 + Math.floor(Math.random() * 80),
      avgResponseTime: 0.5 + Math.random() * 4,
      channelSpread: 1 + Math.floor(Math.random() * 5),
      noiseRatio: Math.random() * 0.3,
    },
  }),
  project_flow: () => ({
    health: 0.7 + Math.random() * 0.25,
    efficiency: 0.55 + Math.random() * 0.3,
    activityLevel: 0.5 + Math.random() * 0.35,
    metrics: {
      velocity: 5 + Math.floor(Math.random() * 20),
      cycleTime: 1 + Math.random() * 10,
      wipLimit: 3 + Math.floor(Math.random() * 8),
      onTimeDelivery: 0.6 + Math.random() * 0.35,
    },
  }),
};

function clamp(value: number, min: number = 0, max: number = 1): number {
  return Math.min(Math.max(value, min), max);
}

function computeTrend(values: number[]): "up" | "down" | "stable" {
  if (values.length < 2) return "stable";
  const recent = values.slice(-3);
  const older = values.slice(0, 3);
  const avgRecent = recent.reduce((s, v) => s + v, 0) / recent.length;
  const avgOlder = older.reduce((s, v) => s + v, 0) / older.length;
  const diff = avgRecent - avgOlder;
  if (diff > 0.05) return "up";
  if (diff < -0.05) return "down";
  return "stable";
}

export class DigitalTwinEngine {
  initialize(type: TwinType, config: Record<string, unknown>): DigitalTwin {
    const initialState = TWIN_INITIAL_STATES[type]();
    const state: TwinState = {
      health: 0.5,
      efficiency: 0.5,
      activityLevel: 0.5,
      lastSyncAt: new Date().toISOString(),
      metrics: {},
      trends: {},
      alerts: [],
      ...initialState,
    };

    if (typeof config.scale === "number") {
      const scale = config.scale as number;
      for (const key of Object.keys(state.metrics)) {
        state.metrics[key] = (state.metrics[key] ?? 0) * scale;
      }
    }

    if (typeof config.baseline === "object" && config.baseline !== null) {
      const baseline = config.baseline as Record<string, number>;
      for (const [key, value] of Object.entries(baseline)) {
        state.metrics[key] = value;
      }
    }

    return {
      id: crypto.randomUUID(),
      user_id: "",
      name: "",
      description: null,
      type,
      config,
      state: state as unknown as Record<string, unknown>,
      metadata: {
        initializedAt: new Date().toISOString(),
        version: 1,
        twinType: type,
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  sync(
    twin: DigitalTwin,
    realWorldData: Record<string, unknown>
  ): { twin: DigitalTwin; diff: StateDiff } {
    const currentState = twin.state as unknown as TwinState;
    const newState: TwinState = {
      ...currentState,
      lastSyncAt: new Date().toISOString(),
    };

    for (const [key, value] of Object.entries(realWorldData)) {
      if (typeof value === "number" && key in currentState.metrics) {
        const oldVal = currentState.metrics[key];
        newState.metrics[key] = clamp(value, 0, key.includes("Count") || key.includes("Volume") ? Infinity : 1);
        const historyKey = `history_${key}`;
        const history = (currentState as unknown as Record<string, unknown>)[historyKey] as number[] | undefined;
        const values = history ?? [];
        values.push(value);
        if (values.length > 30) values.shift();
        (newState as unknown as Record<string, unknown>)[historyKey] = values;
        newState.trends[key] = computeTrend([...values]);
      }
    }

    const metricValues = Object.values(newState.metrics);
    newState.health = clamp(metricValues.reduce((s, v) => s + v, 0) / metricValues.length);
    newState.efficiency = clamp(newState.metrics.taskCompletionRate ?? newState.metrics.velocity ?? newState.health);

    newState.alerts = [];
    if (newState.health < 0.3) {
      newState.alerts.push({ severity: "critical", message: "Twin health critically low", timestamp: new Date().toISOString() });
    } else if (newState.health < 0.5) {
      newState.alerts.push({ severity: "warning", message: "Twin health below optimal", timestamp: new Date().toISOString() });
    }

    for (const [key, trend] of Object.entries(newState.trends)) {
      if (trend === "down" && (newState.metrics[key] ?? 0) < 0.3) {
        newState.alerts.push({
          severity: "warning",
          message: `${key} is declining and below threshold`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const diff = this.diff(twin.state as Record<string, unknown>, newState as unknown as Record<string, unknown>);
    const updatedTwin: DigitalTwin = {
      ...twin,
      state: newState as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
      metadata: {
        ...((twin.metadata as Record<string, unknown>) ?? {}),
        lastSyncAt: new Date().toISOString(),
        syncCount: (((twin.metadata as Record<string, unknown>)?.syncCount as number) ?? 0) + 1,
      },
    };

    return { twin: updatedTwin, diff };
  }

  diff(
    oldState: Record<string, unknown>,
    newState: Record<string, unknown>
  ): StateDiff {
    const changedFields: string[] = [];
    const additions: Record<string, unknown> = {};
    const removals: string[] = [];
    const modifications: { field: string; oldValue: unknown; newValue: unknown }[] = [];

    const allKeys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);

    for (const key of allKeys) {
      const oldVal = oldState[key];
      const newVal = newState[key];

      if (oldVal === undefined && newVal !== undefined) {
        additions[key] = newVal;
        changedFields.push(key);
      } else if (oldVal !== undefined && newVal === undefined) {
        removals.push(key);
        changedFields.push(key);
      } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        modifications.push({ field: key, oldValue: oldVal, newValue: newVal });
        changedFields.push(key);
      }
    }

    const parts: string[] = [];
    const additionCount = Object.keys(additions).length;
    if (additionCount > 0) parts.push(`${additionCount} field(s) added`);
    if (removals.length > 0) parts.push(`${removals.length} field(s) removed`);
    if (modifications.length > 0) parts.push(`${modifications.length} field(s) modified`);

    return {
      changedFields,
      additions,
      removals,
      modifications,
      summary: parts.length > 0 ? parts.join(", ") : "No changes detected",
    };
  }

  predict(
    twin: DigitalTwin,
    steps: number
  ): PredictionResult {
    const currentState = twin.state as unknown as TwinState;
    const trends = currentState.trends ?? {};
    const metrics = currentState.metrics;
    const predictedMetrics: Record<string, number> = {};
    const lowerBounds: Record<string, number> = {};
    const upperBounds: Record<string, number> = {};

    for (const [key, value] of Object.entries(metrics)) {
      const trend = trends[key] ?? "stable";
      let rate = 0;
      if (trend === "up") rate = 0.02;
      else if (trend === "down") rate = -0.02;

      const predicted = clamp(value + rate * steps);
      predictedMetrics[key] = Math.round(predicted * 1000) / 1000;
      const uncertainty = Math.sqrt(steps) * 0.05;
      lowerBounds[key] = Math.round(Math.max(0, predicted - uncertainty) * 1000) / 1000;
      upperBounds[key] = Math.round(Math.min(1, predicted + uncertainty) * 1000) / 1000;
    }

    const predictedState: TwinState = {
      health: clamp(currentState.health + (trends.health === "up" ? 0.02 : trends.health === "down" ? -0.02 : 0) * steps),
      efficiency: clamp(currentState.efficiency + (trends.efficiency === "up" ? 0.015 : trends.efficiency === "down" ? -0.015 : 0) * steps),
      activityLevel: currentState.activityLevel,
      lastSyncAt: new Date().toISOString(),
      metrics: predictedMetrics,
      trends: { ...trends },
      alerts: [],
    };

    if (predictedState.health < 0.4) {
      predictedState.alerts.push({ severity: "warning", message: "Predicted health decline", timestamp: new Date().toISOString() });
    }

    const riskFactors: string[] = [];
    const recommendedActions: string[] = [];

    for (const [key, value] of Object.entries(predictedMetrics)) {
      if (value < 0.3) {
        riskFactors.push(`${key} predicted to reach critically low levels (${(value * 100).toFixed(1)}%)`);
        recommendedActions.push(`Investigate and improve ${key} metrics`);
      }
    }

    if (predictedState.health < 0.5) {
      riskFactors.push("Overall health trending toward unhealthy state");
      recommendedActions.push("Schedule comprehensive review of twin parameters");
    }

    if (riskFactors.length === 0) {
      riskFactors.push("No significant risks detected in the forecast horizon");
    }

    return {
      predictedState,
      confidenceInterval: { lower: lowerBounds, upper: upperBounds },
      riskFactors,
      recommendedActions,
      timeHorizon: steps,
    };
  }
}
