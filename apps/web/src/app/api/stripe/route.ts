import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3333";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payerEmail, externalReference } = body as {
      payerEmail: string;
      externalReference: string;
    };

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe no esta configurado" },
        { status: 500 },
      );
    }

    if (!payerEmail) {
      return NextResponse.json(
        { error: "Email requerido" },
        { status: 400 },
      );
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe Price ID no configurado" },
        { status: 500 },
      );
    }

    // Look up or create Stripe customer
    const existingCustomers = await stripe.customers.list({
      email: payerEmail,
      limit: 1,
    });

    let customerId: string;
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const newCustomer = await stripe.customers.create({
        email: payerEmail,
        metadata: { supabase_user_id: externalReference },
      });
      customerId = newCustomer.id;
    }

    console.log("[Stripe] Creating checkout session:", {
      customerId,
      payerEmail,
      priceId,
    });

    // Create Checkout Session with 7-day trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: { supabase_user_id: externalReference },
      },
      client_reference_id: externalReference,
      success_url: `${APP_URL}/dashboard/plan?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/dashboard/plan`,
    });

    console.log("[Stripe] Session created:", {
      id: session.id,
      url: session.url ? "present" : "missing",
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Stripe] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
