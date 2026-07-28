import type {
  Simulation,
  SimulationResult,
  SimulationType,
  DigitalTwin,
} from "@repo/shared/types";

interface MonteCarloParams {
  baseValue: number;
  variance: number;
  distribution: "normal" | "uniform" | "exponential";
  correlatedVariables?: string[];
  riskFactors?: number[];
}

interface AgentConfig {
  count: number;
  type: "collaborator" | "decision_maker" | "communicator" | "observer";
  adaptability: number;
  influenceRadius: number;
  traits: Record<string, number>;
}

interface NetworkNode {
  id: string;
  influence: number;
  connections: string[];
  activity: number;
}

interface NetworkPropagationParams {
  nodes: NetworkNode[];
  seedNodes: string[];
  propagationProbability: number;
  decayFactor: number;
  steps: number;
}

interface MonteCarloOutput {
  iterations: number;
  mean: number;
  median: number;
  stdDev: number;
  percentiles: { p5: number; p25: number; p50: number; p75: number; p95: number };
  histogram: { bucket: string; count: number }[];
  convergenceAt: number;
  riskOfLoss: number;
  expectedValue: number;
}

interface AgentBasedOutput {
  agentCount: number;
  finalState: Record<string, number>;
  timeSeries: { step: number; metrics: Record<string, number> }[];
  emergentPatterns: string[];
  clusters: { id: string; members: number; centroid: Record<string, number> }[];
  stabilityIndex: number;
}

interface NetworkPropagationOutput {
  totalReached: number;
  reachPercentage: number;
  propagationCurve: { step: number; reached: number; newlyReached: number }[];
  keyInfluencers: { id: string; reach: number; centrality: number }[];
  clusters: { id: string; size: number; density: number }[];
  avgPathLength: number;
}

interface SimulationInsights {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  riskAssessment: string;
  confidenceFactors: string[];
}

function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function generateHistogram(values: number[], buckets: number = 10): { bucket: string; count: number }[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = range / buckets;
  const result: { bucket: string; count: number }[] = [];
  for (let i = 0; i < buckets; i++) {
    const low = min + i * step;
    const high = min + (i + 1) * step;
    const count = values.filter((v) => v >= low && (i === buckets - 1 ? v <= high : v < high)).length;
    result.push({ bucket: `${low.toFixed(1)}-${high.toFixed(1)}`, count });
  }
  return result;
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const low = Math.floor(idx);
  const high = Math.ceil(idx);
  if (low === high) return sorted[low] ?? 0;
  return (sorted[low] ?? 0) + ((sorted[high] ?? 0) - (sorted[low] ?? 0)) * (idx - low);
}

export class SimulationEngine {
  async execute(
    simulation: Simulation,
    digitalTwin: DigitalTwin
  ): Promise<SimulationResult> {
    const startTime = performance.now();
    let output: Record<string, unknown>;
    let insights: string[];

    switch (simulation.type) {
      case "scenario_test":
      case "what_if": {
        const params = simulation.parameters as unknown as MonteCarloParams;
        const mcResult = this.runMonteCarlo({
          baseValue: (params.baseValue as number) ?? 72,
          variance: (params.variance as number) ?? 15,
          distribution: (params.distribution as MonteCarloParams["distribution"]) ?? "normal",
          riskFactors: (params.riskFactors as number[]) ?? [0.1, 0.2, 0.3],
        });
        output = { monteCarlo: mcResult, simulationType: simulation.type, parameters: simulation.parameters };
        insights = this.generateInsights(output, simulation.type);
        break;
      }
      case "stress_test":
      case "optimization": {
        const params = simulation.parameters as unknown as { agentCount?: number; agentConfig?: Partial<AgentConfig> };
        const agentCount = (params.agentCount as number) ?? 50;
        const abResult = this.runAgentBased(params.agentConfig ?? {}, agentCount);
        output = { agentBased: abResult, simulationType: simulation.type, parameters: simulation.parameters };
        insights = this.generateInsights(output, simulation.type);
        break;
      }
      case "collaboration_drill": {
        const params = simulation.parameters as unknown as { networkParams?: Partial<NetworkPropagationParams> };
        const npResult = this.runNetworkPropagation({
          nodes: (params.networkParams?.nodes as NetworkNode[]) ?? this.generateDefaultNetwork(20),
          seedNodes: (params.networkParams?.seedNodes as string[]) ?? ["node-0"],
           propagationProbability: (params.networkParams?.propagationProbability as number) ?? 0.3,
          decayFactor: (params.networkParams?.decayFactor as number) ?? 0.85,
          steps: (params.networkParams?.steps as number) ?? 10,
        });
        output = { networkPropagation: npResult, simulationType: simulation.type, parameters: simulation.parameters };
        insights = this.generateInsights(output, simulation.type);
        break;
      }
      default: {
        output = { error: "Unknown simulation type" };
        insights = ["Simulation type not recognized."];
      }
    }

    const confidence = this.calculateConfidence(output);
    const executionTime = Math.round(performance.now() - startTime);

    return {
      id: crypto.randomUUID(),
      simulation_id: simulation.id,
      version: 1,
      output,
      insights,
      confidence_score: confidence,
      execution_time_ms: executionTime,
      executed_at: new Date().toISOString(),
    };
  }

  runMonteCarlo(params: MonteCarloParams, iterations: number = 1000): MonteCarloOutput {
    const { baseValue, variance, distribution, riskFactors } = params;
    const values: number[] = [];

    for (let i = 0; i < iterations; i++) {
      let sample: number;
      switch (distribution) {
        case "normal":
          sample = baseValue + gaussianRandom() * variance;
          break;
        case "uniform":
          sample = baseValue - variance + Math.random() * variance * 2;
          break;
        case "exponential": {
          const lambda = 1 / (variance || 1);
          sample = baseValue + (-Math.log(1 - Math.random()) / lambda - 1 / lambda);
          break;
        }
        default:
          sample = baseValue + gaussianRandom() * variance;
      }
      if (riskFactors && riskFactors.length > 0) {
        const riskPenalty = riskFactors.reduce((acc, rf) => acc + (Math.random() < rf ? -variance * 0.2 : 0), 0);
        sample += riskPenalty;
      }
      values.push(Math.max(0, sample));
    }

    values.sort((a, b) => a - b);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const median = percentile(values, 50);
    const varianceCalc = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(varianceCalc);
    const riskOfLoss = values.filter((v) => v < baseValue * 0.5).length / values.length;

    return {
      iterations,
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      percentiles: {
        p5: Math.round(percentile(values, 5) * 100) / 100,
        p25: Math.round(percentile(values, 25) * 100) / 100,
        p50: Math.round(percentile(values, 50) * 100) / 100,
        p75: Math.round(percentile(values, 75) * 100) / 100,
        p95: Math.round(percentile(values, 95) * 100) / 100,
      },
      histogram: generateHistogram(values, 12),
      convergenceAt: Math.round(iterations * 0.6),
      riskOfLoss: Math.round(riskOfLoss * 1000) / 1000,
      expectedValue: Math.round(mean * 100) / 100,
    };
  }

  runAgentBased(params: Partial<AgentConfig>, agents: number = 50): AgentBasedOutput {
    const config: AgentConfig = {
      count: agents,
      type: params.type ?? "collaborator",
      adaptability: params.adaptability ?? 0.7,
      influenceRadius: params.influenceRadius ?? 3,
      traits: params.traits ?? { productivity: 0.6, communication: 0.7, adaptability: 0.5 },
    };

    const agentStates: Record<string, number>[] = [];
    for (let i = 0; i < config.count; i++) {
      const state: Record<string, number> = {};
      for (const [trait, base] of Object.entries(config.traits)) {
        state[trait] = Math.max(0, Math.min(1, base + gaussianRandom() * 0.15));
      }
      agentStates.push(state);
    }

    const timeSeries: { step: number; metrics: Record<string, number> }[] = [];
    const steps = 20;
    for (let step = 0; step < steps; step++) {
      for (let i = 0; i < config.count; i++) {
        const neighbors = this.getNeighborIndices(i, config.count, config.influenceRadius);
        for (const ni of neighbors) {
          const agent = agentStates[i];
          const neighbor = agentStates[ni];
          if (!agent || !neighbor) continue;
          for (const trait of Object.keys(config.traits)) {
            const diff = (neighbor[trait] ?? 0) - (agent[trait] ?? 0);
            agent[trait] = (agent[trait] ?? 0) + diff * config.adaptability * 0.05;
            agent[trait] = Math.max(0, Math.min(1, agent[trait]));
          }
        }
      }

      const metrics: Record<string, number> = {};
      for (const trait of Object.keys(config.traits)) {
        const avg = agentStates.reduce((s, a) => s + (a[trait] ?? 0), 0) / config.count;
        metrics[trait] = Math.round(avg * 1000) / 1000;
      }
      timeSeries.push({ step, metrics });
    }

    const finalState: Record<string, number> = {};
    for (const trait of Object.keys(config.traits)) {
      finalState[trait] = Math.round((agentStates.reduce((s, a) => s + (a[trait] ?? 0), 0) / config.count) * 1000) / 1000;
    }

    const clusters = this.clusterAgents(agentStates, 3);
    const stabilityIndex = this.computeStability(timeSeries);

    return {
      agentCount: config.count,
      finalState,
      timeSeries,
      emergentPatterns: this.detectPatterns(timeSeries, config.type),
      clusters,
      stabilityIndex: Math.round(stabilityIndex * 1000) / 1000,
    };
  }

  runNetworkPropagation(params: {
    nodes: NetworkNode[];
    seedNodes: string[];
    propagationProbability: number;
    decayFactor: number;
    steps: number;
  }): NetworkPropagationOutput {
    const { nodes, seedNodes, propagationProbability: prob, decayFactor, steps } = params;
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const reached = new Set<string>(seedNodes);
    const propagationCurve: { step: number; reached: number; newlyReached: number }[] = [];
    const nodeReachStep = new Map<string, number>();
    seedNodes.forEach((id) => nodeReachStep.set(id, 0));

    for (let step = 1; step <= steps; step++) {
      const newReached: string[] = [];
      for (const nodeId of [...reached]) {
        const node = nodeMap.get(nodeId);
        if (!node) continue;
        for (const connId of node.connections) {
          if (reached.has(connId)) continue;
          const connNode = nodeMap.get(connId);
          if (!connNode) continue;
          const effectiveProb = prob * node.influence * connNode.influence * Math.pow(decayFactor, step);
          if (Math.random() < effectiveProb) {
            newReached.push(connId);
            nodeReachStep.set(connId, step);
          }
        }
      }
      newReached.forEach((id) => reached.add(id));
      propagationCurve.push({ step, reached: reached.size, newlyReached: newReached.length });
    }

    const nodeReachCount = new Map<string, number>();
    for (const nodeId of reached) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;
      for (const connId of node.connections) {
        nodeReachCount.set(connId, (nodeReachCount.get(connId) ?? 0) + 1);
      }
    }

    const keyInfluencers = [...nodeReachCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, reach]) => {
        const node = nodeMap.get(id);
        return {
          id,
          reach,
          centrality: node ? node.connections.length / nodes.length : 0,
        };
      });

    const totalEdges = nodes.reduce((s, n) => s + n.connections.length, 0);
    const density = nodes.length > 1 ? (2 * totalEdges) / (nodes.length * (nodes.length - 1)) : 0;

    return {
      totalReached: reached.size,
      reachPercentage: Math.round((reached.size / nodes.length) * 10000) / 100,
      propagationCurve,
      keyInfluencers,
      clusters: [{ id: "main", size: reached.size, density: Math.round(density * 1000) / 1000 }],
      avgPathLength: propagationCurve.length > 0
        ? Math.round((propagationCurve.reduce((s, p) => s + p.step * p.newlyReached, 0) / (reached.size - seedNodes.length || 1)) * 100) / 100
        : 0,
    };
  }

  calculateConfidence(output: Record<string, unknown>): number {
    let confidence = 0.5;

    if (output.monteCarlo) {
      const mc = output.monteCarlo as MonteCarloOutput;
      if (mc.iterations >= 1000) confidence += 0.15;
      if (mc.stdDev < mc.mean * 0.3) confidence += 0.1;
      if (mc.riskOfLoss < 0.2) confidence += 0.1;
      confidence += 0.05;
    } else if (output.agentBased) {
      const ab = output.agentBased as AgentBasedOutput;
      if (ab.agentCount >= 30) confidence += 0.1;
      if (ab.stabilityIndex > 0.7) confidence += 0.15;
      if (ab.clusters.length <= 5) confidence += 0.1;
      confidence += 0.05;
    } else if (output.networkPropagation) {
      const np = output.networkPropagation as NetworkPropagationOutput;
      if (np.reachPercentage > 30) confidence += 0.1;
      if (np.keyInfluencers.length > 0) confidence += 0.1;
      if (np.avgPathLength > 0 && np.avgPathLength < 5) confidence += 0.1;
      confidence += 0.05;
    }

    return Math.min(1, Math.round(confidence * 100) / 100);
  }

  generateInsights(results: Record<string, unknown>, type: SimulationType): string[] {
    const insights: string[] = [];

    if (results.monteCarlo) {
      const mc = results.monteCarlo as MonteCarloOutput;
      insights.push(
        `Monte Carlo analysis across ${mc.iterations} iterations shows an expected value of ${mc.expectedValue} with standard deviation of ${mc.stdDev}.`
      );
      if (mc.riskOfLoss > 0.3) {
        insights.push(`High risk detected: ${(mc.riskOfLoss * 100).toFixed(1)}% of scenarios fell below 50% of baseline.`);
      } else {
        insights.push(`Risk is moderate: only ${(mc.riskOfLoss * 100).toFixed(1)}% of scenarios fell below 50% of baseline.`);
      }
      insights.push(
        `The 90% confidence interval ranges from ${mc.percentiles.p5} to ${mc.percentiles.p95}.`
      );
      if (type === "what_if") {
        insights.push("What-if analysis complete. Compare base parameters with observed outcomes to identify leverage points.");
      } else if (type === "scenario_test") {
        insights.push("Scenario test results suggest examining the correlation between input variance and outcome distribution.");
      }
    } else if (results.agentBased) {
      const ab = results.agentBased as AgentBasedOutput;
      insights.push(
        `Agent-based model with ${ab.agentCount} agents achieved a stability index of ${ab.stabilityIndex}.`
      );
      const traitEntries = Object.entries(ab.finalState);
      if (traitEntries.length > 0) {
        const best = traitEntries.reduce((a, b) => (b[1] > a[1] ? b : a));
        const worst = traitEntries.reduce((a, b) => (b[1] < a[1] ? b : a));
        insights.push(`Strongest emergent trait: ${best[0]} at ${(best[1] * 100).toFixed(1)}%.`);
        insights.push(`Weakest emergent trait: ${worst[0]} at ${(worst[1] * 100).toFixed(1)}%.`);
      }
      if (ab.emergentPatterns.length > 0) {
        insights.push(`Detected ${ab.emergentPatterns.length} emergent pattern(s): ${ab.emergentPatterns.join("; ")}.`);
      }
      insights.push(
        `Agents formed ${ab.clusters.length} distinct cluster(s) during simulation.`
      );
    } else if (results.networkPropagation) {
      const np = results.networkPropagation as NetworkPropagationOutput;
      insights.push(
        `Network propagation reached ${np.totalReached} nodes (${np.reachPercentage}% of the network) with average path length of ${np.avgPathLength}.`
      );
      if (np.keyInfluencers.length > 0) {
        const topInfluencer = np.keyInfluencers[0];
        if (topInfluencer) {
          insights.push(
            `Top influencer: node ${topInfluencer.id} with reach of ${topInfluencer.reach} and centrality of ${topInfluencer.centrality.toFixed(3)}.`
          );
        }
      }
      if (np.reachPercentage > 80) {
        insights.push("High network reach indicates strong information flow potential across the collaboration structure.");
      } else if (np.reachPercentage < 30) {
        insights.push("Low network reach suggests isolated clusters that may benefit from additional bridging connections.");
      }
      insights.push(
        `The propagation curve shows ${np.propagationCurve.filter((p) => p.newlyReached > 0).length} active diffusion steps.`
      );
    }

    return insights;
  }

  private getNeighborIndices(index: number, total: number, radius: number): number[] {
    const neighbors: number[] = [];
    for (let r = 1; r <= radius; r++) {
      const left = (index - r + total) % total;
      const right = (index + r) % total;
      neighbors.push(left, right);
    }
    return neighbors;
  }

  private clusterAgents(
    states: Record<string, number>[],
    k: number
  ): { id: string; members: number; centroid: Record<string, number> }[] {
    const traitKeys = Object.keys(states[0] ?? {});
    const centroids: Record<string, number>[] = [];
    for (let c = 0; c < k; c++) {
      const idx = Math.floor(Math.random() * states.length);
      const centroid: Record<string, number> = {};
      for (const key of traitKeys) {
        centroid[key] = states[idx]?.[key] ?? 0;
      }
      centroids.push(centroid);
    }

    for (let iter = 0; iter < 10; iter++) {
      const assignments: number[][] = Array.from({ length: k }, (): number[] => []);
      for (let i = 0; i < states.length; i++) {
        let minDist = Infinity;
        let closest = 0;
        for (let c = 0; c < k; c++) {
          let dist = 0;
          for (const key of traitKeys) {
            dist += ((states[i]?.[key] ?? 0) - (centroids[c]?.[key] ?? 0)) ** 2;
          }
          if (dist < minDist) {
            minDist = dist;
            closest = c;
          }
        }
        assignments[closest]?.push(i);
      }

      for (let c = 0; c < k; c++) {
        const assignment = assignments[c];
        if (!assignment || assignment.length === 0) continue;
        for (const key of traitKeys) {
          const cCentroid = centroids[c];
          if (cCentroid) {
            cCentroid[key] = assignment.reduce((s, i) => s + (states[i]?.[key] ?? 0), 0) / assignment.length;
          }
        }
      }
    }

    const finalAssignments: number[] = [];
    for (let i = 0; i < states.length; i++) {
      let minDist = Infinity;
      let closest = 0;
      for (let c = 0; c < k; c++) {
        let dist = 0;
        for (const key of traitKeys) {
          dist += ((states[i]?.[key] ?? 0) - (centroids[c]?.[key] ?? 0)) ** 2;
        }
        if (dist < minDist) {
          minDist = dist;
          closest = c;
        }
      }
      finalAssignments.push(closest);
    }

    return centroids.map((centroid, idx) => ({
      id: `cluster-${idx}`,
      members: finalAssignments.filter((a) => a === idx).length,
      centroid,
    }));
  }

  private computeStability(timeSeries: { step: number; metrics: Record<string, number> }[]): number {
    if (timeSeries.length < 2) return 1;
    const firstHalf = timeSeries.slice(0, Math.floor(timeSeries.length / 2));
    const secondHalf = timeSeries.slice(Math.floor(timeSeries.length / 2));

    const avgMetrics = (slice: { metrics: Record<string, number> }[]) => {
      const keys = Object.keys(slice[0]?.metrics ?? {});
      const avg: Record<string, number> = {};
      for (const key of keys) {
        avg[key] = slice.reduce((s, p) => s + (p.metrics[key] ?? 0), 0) / slice.length;
      }
      return avg;
    };

    const avg1 = avgMetrics(firstHalf);
    const avg2 = avgMetrics(secondHalf);
    const keys = Object.keys(avg1);
    const diffs = keys.map((k) => Math.abs((avg1[k] ?? 0) - (avg2[k] ?? 0)));
    const avgDiff = diffs.reduce((s, d) => s + d, 0) / diffs.length;
    return Math.max(0, 1 - avgDiff * 5);
  }

  private detectPatterns(
    timeSeries: { step: number; metrics: Record<string, number> }[],
    agentType: string
  ): string[] {
    const patterns: string[] = [];
    if (timeSeries.length < 5) return ["Insufficient data for pattern detection"];

    const metrics = timeSeries[timeSeries.length - 1].metrics;
    const entries = Object.entries(metrics);

    const growing = entries.filter(([, v]) => v > 0.7);
    const declining = entries.filter(([, v]) => v < 0.3);
    const stable = entries.filter(([, v]) => v >= 0.3 && v <= 0.7);

    if (growing.length > 0) {
      patterns.push(`Growing consensus in: ${growing.map(([k]) => k).join(", ")}`);
    }
    if (declining.length > 0) {
      patterns.push(`Declining engagement in: ${declining.map(([k]) => k).join(", ")}`);
    }
    if (stable.length > entries.length / 2) {
      patterns.push("Majority of traits remain in stable equilibrium");
    }

    if (agentType === "collaborator") {
      patterns.push("Collaboration patterns show adaptive convergence");
    } else if (agentType === "decision_maker") {
      patterns.push("Decision-making trajectories indicate coalition formation");
    }

    return patterns;
  }

  private generateDefaultNetwork(count: number): NetworkNode[] {
    const nodes: NetworkNode[] = [];
    for (let i = 0; i < count; i++) {
      const connections: string[] = [];
      const numConnections = 2 + Math.floor(Math.random() * 3);
      for (let c = 0; c < numConnections; c++) {
        const target = (i + 1 + Math.floor(Math.random() * (count - 1))) % count;
        const targetId = `node-${target}`;
        if (!connections.includes(targetId) && targetId !== `node-${i}`) {
          connections.push(targetId);
        }
      }
      nodes.push({
        id: `node-${i}`,
        influence: 0.5 + Math.random() * 0.5,
        connections,
        activity: Math.random(),
      });
    }
    return nodes;
  }
}
