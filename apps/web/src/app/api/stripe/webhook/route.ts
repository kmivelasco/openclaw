import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {return null;}
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("[Stripe Webhook] Invalid signature:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    console.error("[Stripe Webhook] Missing Supabase service role key");
    return NextResponse.json({ received: true });
  }

  console.log("[Stripe Webhook] Event:", { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        if (!userId || !session.subscription) {break;}

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );

        const periodEnd = subscription.items.data[0]?.current_period_end;

        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({
            plan: "pro",
            status: "active",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            trial_ends_at: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
            current_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (error) {
          console.error("[Stripe Webhook] DB update error:", error);
        } else {
          console.log("[Stripe Webhook] User upgraded to pro:", userId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId =
          subscription.metadata.supabase_user_id;
        if (!userId) {break;}

        let plan: "starter" | "pro" = "pro";
        let status: "active" | "canceled" | "past_due" = "active";

        if (
          subscription.status === "active" ||
          subscription.status === "trialing"
        ) {
          plan = "pro";
          status = "active";
        } else if (subscription.status === "past_due") {
          plan = "pro";
          status = "past_due";
        } else if (
          subscription.status === "canceled" ||
          subscription.status === "unpaid"
        ) {
          plan = "starter";
          status = "canceled";
        }

        const periodEnd = subscription.items.data[0]?.current_period_end;

        await supabaseAdmin
          .from("subscriptions")
          .update({
            plan,
            status,
            current_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        console.log("[Stripe Webhook] Subscription updated:", {
          userId,
          plan,
          status,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId =
          subscription.metadata.supabase_user_id;
        if (!userId) {break;}

        await supabaseAdmin
          .from("subscriptions")
          .update({
            plan: "starter",
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        console.log("[Stripe Webhook] Subscription deleted:", userId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by stripe_customer_id
        const { data } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (data) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", data.user_id);

          console.log("[Stripe Webhook] Payment failed for:", data.user_id);
        }
        break;
      }
    }
  } catch (error) {
    console.error("[Stripe Webhook] Processing error:", error);
  }

  return NextResponse.json({ received: true });
}
