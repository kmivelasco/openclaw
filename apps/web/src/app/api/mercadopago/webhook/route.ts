import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Mercado Pago webhook handler for subscription status changes.
 * Configure this URL in your MP dashboard: /api/mercadopago/webhook
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // MP sends notifications with type and data
    if (body.type === "subscription_preapproval") {
      const subscriptionId = body.data?.id;
      if (!subscriptionId) {
        return NextResponse.json({ ok: true });
      }

      // Fetch subscription details from MP
      const res = await fetch(
        `https://api.mercadopago.com/preapproval/${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          },
        },
      );

      if (!res.ok) {
        console.error("Failed to fetch MP subscription:", res.status);
        return NextResponse.json({ ok: true });
      }

      const subscription = await res.json();
      const externalRef = subscription.external_reference;

      if (!externalRef) {
        return NextResponse.json({ ok: true });
      }

      // Map MP status to our status
      let plan: "starter" | "pro" = "starter";
      let status: "active" | "canceled" | "past_due" = "active";

      if (
        subscription.status === "authorized" ||
        subscription.status === "active"
      ) {
        plan = "pro";
        status = "active";
      } else if (subscription.status === "cancelled") {
        plan = "starter";
        status = "canceled";
      } else if (subscription.status === "paused") {
        plan = "pro";
        status = "past_due";
      }

      // Update user subscription in Supabase
      await supabaseAdmin
        .from("subscriptions")
        .update({
          plan,
          status,
          mp_subscription_id: subscriptionId,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", externalRef);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
