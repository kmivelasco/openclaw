import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {return null;}
  return createClient(url, key);
}

interface RebillWebhookPayload {
  event?: string;
  data: {
    id?: string;
    paymentId?: string;
    status?: string;
    amount?: number;
    currency?: string;
    nextChargeDate?: string;
    subscriptionId?: string;
    metadata?: Record<string, string>;
  };
  customer?: {
    id?: string;
    email?: string;
  };
  webhook?: {
    event: string;
  };
  metadata?: Record<string, string>;
}

export async function POST(req: NextRequest) {
  const body: RebillWebhookPayload = await req.json();
  const eventType = body.webhook?.event || body.event;

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    console.error("[Rebill Webhook] Missing Supabase service role key");
    return NextResponse.json({ received: true });
  }

  console.log("[Rebill Webhook] Event:", { type: eventType });

  try {
    switch (eventType) {
      case "subscription.created": {
        const subscription = body.data;
        const userId = subscription.metadata?.supabase_user_id
          || body.metadata?.supabase_user_id;

        if (!userId) {
          console.warn("[Rebill Webhook] subscription.created without user ID in metadata");
          break;
        }

        const nextChargeDate = subscription.nextChargeDate
          ? new Date(subscription.nextChargeDate).toISOString()
          : null;

        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({
            plan: "pro",
            status: "active",
            rebill_customer_id: body.customer?.id || null,
            rebill_subscription_id: subscription.id || null,
            current_period_end: nextChargeDate,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (error) {
          console.error("[Rebill Webhook] DB update error:", error);
        } else {
          console.log("[Rebill Webhook] User upgraded to pro:", userId);
        }
        break;
      }

      case "subscription.updated": {
        const subscription = body.data;
        const subscriptionId = subscription.id;
        if (!subscriptionId) {break;}

        // Find user by rebill_subscription_id
        const { data: sub } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("rebill_subscription_id", subscriptionId)
          .single();

        if (!sub) {
          console.warn("[Rebill Webhook] subscription.updated for unknown subscription:", subscriptionId);
          break;
        }

        // Map Rebill statuses to our plan/status
        let plan: "starter" | "pro" = "pro";
        let status: "active" | "canceled" | "past_due" = "active";
        const subStatus = subscription.status?.toLowerCase();

        if (subStatus === "active") {
          plan = "pro";
          status = "active";
        } else if (subStatus === "cancelled" || subStatus === "canceled" || subStatus === "paused" || subStatus === "finished") {
          plan = "starter";
          status = "canceled";
        } else if (subStatus === "defaulted" || subStatus === "retrying") {
          plan = "pro";
          status = "past_due";
        }

        const nextChargeDate = subscription.nextChargeDate
          ? new Date(subscription.nextChargeDate).toISOString()
          : null;

        await supabaseAdmin
          .from("subscriptions")
          .update({
            plan,
            status,
            current_period_end: nextChargeDate,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", sub.user_id);

        console.log("[Rebill Webhook] Subscription updated:", {
          userId: sub.user_id,
          plan,
          status: subStatus,
        });
        break;
      }

      case "payment.created":
      case "payment.updated": {
        const payment = body.data;
        const paymentStatus = payment.status?.toLowerCase();

        console.log("[Rebill Webhook] Payment event:", {
          paymentId: payment.id || payment.paymentId,
          status: paymentStatus,
          amount: payment.amount,
        });

        // If payment failed, find the org and mark as past_due
        if (paymentStatus === "rejected" || paymentStatus === "failed") {
          const subscriptionId = payment.subscriptionId;
          if (subscriptionId) {
            const { data: sub } = await supabaseAdmin
              .from("subscriptions")
              .select("user_id")
              .eq("rebill_subscription_id", subscriptionId)
              .single();

            if (sub) {
              await supabaseAdmin
                .from("subscriptions")
                .update({
                  status: "past_due",
                  updated_at: new Date().toISOString(),
                })
                .eq("user_id", sub.user_id);

              console.log("[Rebill Webhook] Payment failed for:", sub.user_id);
            }
          }
        }

        // If payment approved after pending, reactivate
        if (paymentStatus === "approved" && payment.subscriptionId) {
          const { data: sub } = await supabaseAdmin
            .from("subscriptions")
            .select("user_id, plan")
            .eq("rebill_subscription_id", payment.subscriptionId)
            .single();

          if (sub && sub.plan !== "pro") {
            await supabaseAdmin
              .from("subscriptions")
              .update({
                plan: "pro",
                status: "active",
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", sub.user_id);

            console.log("[Rebill Webhook] Payment approved, user reactivated:", sub.user_id);
          }
        }
        break;
      }

      default:
        console.log("[Rebill Webhook] Unhandled event type:", eventType);
    }
  } catch (error) {
    console.error("[Rebill Webhook] Processing error:", error);
  }

  return NextResponse.json({ received: true });
}
