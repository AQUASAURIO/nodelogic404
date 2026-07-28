import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) break;

        const sub: Stripe.Subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        const priceId = sub.items.data[0]?.price.id ?? null;
        const item = sub.items.data[0];
        const periodStart = item ? new Date(item.current_period_start * 1000).toISOString() : new Date().toISOString();
        const periodEnd = item ? new Date(item.current_period_end * 1000).toISOString() : new Date().toISOString();

        await supabase
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              stripe_price_id: priceId,
              status: "active",
              current_period_start: periodStart,
              current_period_end: periodEnd,
              cancel_at: sub.cancel_at
                ? new Date(sub.cancel_at * 1000).toISOString()
                : null,
            },
            { onConflict: "user_id" }
          );

        await supabase
          .from("usage_metrics")
          .insert({
            user_id: userId,
            event_type: "subscription_created",
            event_data: {
              stripe_subscription_id: subscriptionId,
              stripe_price_id: priceId,
            },
          });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          const { data: existing } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscription.id)
            .single();

          if (!existing) break;
        }

        const priceId = subscription.items.data[0]?.price.id ?? null;
        const item = subscription.items.data[0];
        const periodStart = item ? new Date(item.current_period_start * 1000).toISOString() : new Date().toISOString();
        const periodEnd = item ? new Date(item.current_period_end * 1000).toISOString() : new Date().toISOString();
        const statusMap: Record<string, string> = {
          active: "active",
          canceled: "canceled",
          past_due: "past_due",
          trialing: "trialing",
          unpaid: "past_due",
          paused: "paused",
        };
        const mappedStatus = statusMap[subscription.status] ?? "active";

        await supabase
          .from("subscriptions")
          .update({
            stripe_price_id: priceId,
            status: mappedStatus,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            cancel_at: subscription.cancel_at
              ? new Date(subscription.cancel_at * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        await supabase
          .from("usage_metrics")
          .insert({
            user_id: userId ?? "",
            event_type: "subscription_updated",
            event_data: {
              stripe_subscription_id: subscription.id,
              status: mappedStatus,
            },
          });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        let resolvedUserId = userId;
        if (!resolvedUserId) {
          const { data: existing } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscription.id)
            .single();
          resolvedUserId = existing?.user_id;
        }

        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            stripe_subscription_id: null,
            stripe_price_id: null,
            cancel_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (resolvedUserId) {
          await supabase
            .from("usage_metrics")
            .insert({
              user_id: resolvedUserId,
              event_type: "subscription_deleted",
              event_data: { stripe_subscription_id: subscription.id },
            });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.parent?.subscription_details?.subscription as string | undefined;
        if (!subscriptionId) break;

        const resolvedUserId = invoice.metadata?.user_id ?? (await (async () => {
          const { data: existing } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscriptionId)
            .single();
          return existing?.user_id;
        })());

        if (resolvedUserId) {
          await supabase
            .from("usage_metrics")
            .insert({
              user_id: resolvedUserId,
              event_type: "invoice_paid",
              event_data: {
                invoice_id: invoice.id,
                amount_paid: invoice.amount_paid,
                subscription_id: subscriptionId,
              },
            });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.parent?.subscription_details?.subscription as string | undefined;

        if (subscriptionId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);
        }

        const resolvedUserId = invoice.metadata?.user_id ?? (await (async () => {
          if (!subscriptionId) return null;
          const { data: existing } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscriptionId)
            .single();
          return existing?.user_id;
        })());

        if (resolvedUserId) {
          await supabase
            .from("usage_metrics")
            .insert({
              user_id: resolvedUserId,
              event_type: "invoice_payment_failed",
              event_data: {
                invoice_id: invoice.id,
                attempt_count: invoice.attempt_count,
                subscription_id: subscriptionId,
              },
            });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error processing webhook event ${event.type}: ${message}`);
    return NextResponse.json(
      { error: "Webhook handler error" },
      { status: 500 }
    );
  }
}
