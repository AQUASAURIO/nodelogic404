export const APP_NAME = "Nodelogic404";
export const APP_DESCRIPTION = "Digital twins & simulation for trusted collaboration in work & productivity";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://nodelogic404.com";

export const TWIN_TYPES = [
  { value: "collaboration_workflow", label: "Collaboration Workflow", icon: "Workflow" },
  { value: "team_dynamics", label: "Team Dynamics", icon: "Users" },
  { value: "decision_process", label: "Decision Process", icon: "GitBranch" },
  { value: "communication_pattern", label: "Communication Pattern", icon: "MessageSquare" },
  { value: "project_flow", label: "Project Flow", icon: "Kanban" },
] as const;

export const SIMULATION_TYPES = [
  { value: "scenario_test", label: "Scenario Test", description: "Test different scenarios with your digital twin" },
  { value: "what_if", label: "What If Analysis", description: "Explore hypothetical changes and their outcomes" },
  { value: "stress_test", label: "Stress Test", description: "Push your collaboration model to its limits" },
  { value: "optimization", label: "Optimization", description: "Find the optimal parameters for your workflow" },
  { value: "collaboration_drill", label: "Collaboration Drill", description: "Practice and refine collaboration patterns" },
] as const;

export const PRICING = {
  free: {
    name: "Free Trial",
    price: 0,
    period: "14 days",
    features: [
      "3 simulations",
      "1 digital twin",
      "1 collaborator",
      "Basic insights",
    ],
  },
  pro: {
    name: "Pro",
    price: 14.99,
    period: "month",
    features: [
      "Unlimited simulations",
      "10 digital twins",
      "5 collaborators",
      "Advanced insights & analytics",
      "Priority support",
      "Export reports",
    ],
  },
  team: {
    name: "Team",
    price: 49.99,
    period: "month",
    features: [
      "Everything in Pro",
      "Unlimited digital twins",
      "Unlimited collaborators",
      "Team dashboard",
      "Admin controls",
      "Custom integrations",
      "Dedicated support",
    ],
  },
} as const;
