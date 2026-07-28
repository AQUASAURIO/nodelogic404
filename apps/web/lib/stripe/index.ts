import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return _stripe;
}

export const STRIPE_PLANS = {
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
  },
  team: {
    monthly: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_TEAM_YEARLY_PRICE_ID!,
  },
} as const;

export const PLAN_LIMITS = {
  free: {
    simulations: 3,
    digitalTwins: 1,
    collaborators: 1,
    exports: 1,
  },
  pro: {
    simulations: -1,
    digitalTwins: 10,
    collaborators: 5,
    exports: -1,
  },
  team: {
    simulations: -1,
    digitalTwins: -1,
    collaborators: -1,
    exports: -1,
  },
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;
