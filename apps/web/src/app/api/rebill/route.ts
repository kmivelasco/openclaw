import { NextRequest, NextResponse } from "next/server";

const REBILL_BASE_URL = "https://api.rebill.com/v3";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3333";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payerEmail, externalReference, userName } = body as {
      payerEmail: string;
      externalReference: string;
      userName?: string;
    };

    if (!process.env.REBILL_API_KEY) {
      return NextResponse.json(
        { error: "Rebill no esta configurado" },
        { status: 500 },
      );
    }

    if (!payerEmail) {
      return NextResponse.json(
        { error: "Email requerido" },
        { status: 400 },
      );
    }

    const planId = process.env.REBILL_PLAN_ID;
    if (!planId) {
      return NextResponse.json(
        { error: "Rebill Plan ID no configurado" },
        { status: 500 },
      );
    }

    console.log("[Rebill] Creating payment link:", {
      payerEmail,
      planId,
      userId: externalReference,
    });

    // Create Payment Link via Rebill API
    const res = await fetch(`${REBILL_BASE_URL}/payment-links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.REBILL_API_KEY,
      },
      body: JSON.stringify({
        title: [
          { language: "es", text: "OpenClaw Pro" },
          { language: "en", text: "OpenClaw Pro" },
        ],
        description: [
          { language: "es", text: "Suscripcion mensual a OpenClaw Pro" },
          { language: "en", text: "Monthly subscription to OpenClaw Pro" },
        ],
        type: "plan",
        plan: {
          id: planId,
        },
        paymentMethods: [
          {
            methods: ["card", "bank_transfer"],
            currency: "USD",
          },
        ],
        redirectUrls: {
          approved: `${APP_URL}/dashboard/plan?status=approved`,
          pending: `${APP_URL}/dashboard/plan?status=pending`,
          rejected: `${APP_URL}/dashboard/plan?status=rejected`,
        },
        prefilledFields: {
          customer: {
            email: payerEmail,
            fullName: userName || "",
            language: "es",
          },
        },
        isSingleUse: true,
        metadata: {
          supabase_user_id: externalReference,
        },
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("[Rebill] API error:", res.status, errorBody);
      return NextResponse.json(
        { error: "Error al crear link de pago" },
        { status: 500 },
      );
    }

    const paymentLink = await res.json();

    console.log("[Rebill] Payment link created:", {
      id: paymentLink.id,
      url: paymentLink.url ? "present" : "missing",
    });

    return NextResponse.json({ url: paymentLink.url });
  } catch (error) {
    console.error("[Rebill] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
