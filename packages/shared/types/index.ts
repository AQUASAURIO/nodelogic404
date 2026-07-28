export type UserRole = "user" | "professional" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  organization_id: string | null;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: "free" | "pro" | "team" | "enterprise";
  created_at: string;
}

export type TwinType =
  | "collaboration_workflow"
  | "team_dynamics"
  | "decision_process"
  | "communication_pattern"
  | "project_flow";

export interface DigitalTwin {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  type: TwinType;
  config: Record<string, unknown>;
  state: Record<string, unknown>;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SimulationType =
  | "scenario_test"
  | "what_if"
  | "stress_test"
  | "optimization"
  | "collaboration_drill";

export type SimulationStatus = "draft" | "running" | "completed" | "failed" | "cancelled";

export interface Simulation {
  id: string;
  user_id: string;
  digital_twin_id: string | null;
  name: string;
  description: string | null;
  type: SimulationType;
  parameters: Record<string, unknown>;
  status: SimulationStatus;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface SimulationResult {
  id: string;
  simulation_id: string;
  version: number;
  output: Record<string, unknown>;
  insights: string[];
  confidence_score: number | null;
  execution_time_ms: number | null;
  executed_at: string;
}

export type CollaboratorPermission = "viewer" | "editor" | "admin";
export type ResourceType = "simulation" | "digital_twin" | "organization";

export interface Collaborator {
  id: string;
  owner_id: string;
  collaborator_id: string;
  permission: CollaboratorPermission;
  resource_type: ResourceType;
  resource_id: string;
  invited_at: string;
  accepted_at: string | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: "active" | "canceled" | "past_due" | "trialing" | "paused";
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageMetric {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}
