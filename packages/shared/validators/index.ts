import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const digitalTwinSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  type: z.enum([
    "collaboration_workflow",
    "team_dynamics",
    "decision_process",
    "communication_pattern",
    "project_flow",
  ]),
  config: z.record(z.unknown()).default({}),
});

export const simulationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  digital_twin_id: z.string().uuid().optional(),
  type: z.enum([
    "scenario_test",
    "what_if",
    "stress_test",
    "optimization",
    "collaboration_drill",
  ]),
  parameters: z.record(z.unknown()).default({}),
});

export const collaboratorSchema = z.object({
  email: z.string().email("Invalid email address"),
  permission: z.enum(["viewer", "editor", "admin"]).default("viewer"),
  resource_type: z.enum(["simulation", "digital_twin", "organization"]),
  resource_id: z.string().uuid(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type DigitalTwinInput = z.infer<typeof digitalTwinSchema>;
export type SimulationInput = z.infer<typeof simulationSchema>;
export type CollaboratorInput = z.infer<typeof collaboratorSchema>;
