import { NextRequest, NextResponse } from "next/server";

// Register/unregister the Telegram webhook URL
export async function POST(req: NextRequest) {
  try {
    const { botToken, action } = await req.json();

    if (!botToken) {
      return NextResponse.json(
        { error: "Bot token is required" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json(
        { error: "App URL not configured" },
        { status: 500 }
      );
    }

    if (action === "disconnect") {
      // Remove webhook
      const res = await fetch(
        `https://api.telegram.org/bot${botToken}/deleteWebhook`
      );
      const data = await res.json();
      return NextResponse.json({ ok: data.ok });
    }

    // Set webhook - the token is passed as query param so we can identify the bot owner
    const webhookUrl = `${appUrl}/api/telegram/webhook?token=${encodeURIComponent(botToken)}`;

    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ["message"],
          drop_pending_updates: true,
        }),
      }
    );

    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json(
        { error: data.description || "Failed to set webhook" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      webhookUrl,
      description: data.description,
    });
  } catch (error) {
    console.error("Telegram setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
