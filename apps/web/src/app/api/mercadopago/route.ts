import { NextRequest, NextResponse } from "next/server";

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3333";

/**
 * Creates a Mercado Pago subscription (preapproval) for a user.
 * Flow: no associated plan — MP returns an init_point URL for checkout.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, payerEmail, externalReference } = body as {
      plan: "trial" | "pro";
      payerEmail: string;
      externalReference: string;
    };

    if (!MP_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Mercado Pago no esta configurado" },
        { status: 500 },
      );
    }

    if (!payerEmail) {
      return NextResponse.json(
        { error: "Email requerido" },
        { status: 400 },
      );
    }

    // Build subscription body based on plan
    const subscriptionBody: Record<string, unknown> = {
      reason:
        plan === "pro"
          ? "OpenClaw Pro - Agentes IA ilimitados"
          : "OpenClaw - Prueba gratuita 7 dias",
      external_reference: externalReference,
      payer_email: payerEmail,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: plan === "pro" ? 15000 : 0,
        currency_id: "ARS",
        ...(plan === "trial"
          ? {
              free_trial: {
                frequency: 7,
                frequency_type: "days",
              },
              transaction_amount: 15000,
            }
          : {}),
      },
      back_url: `${APP_URL}/dashboard/plan`,
    };

    const res = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(subscriptionBody),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("MP error:", data);
      return NextResponse.json(
        { error: data.message || "Error al crear suscripcion" },
        { status: res.status },
      );
    }

    return NextResponse.json({
      id: data.id,
      init_point: data.init_point,
      status: data.status,
    });
  } catch (error) {
    console.error("MP API error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
