import { NextRequest, NextResponse } from "next/server";

// Test endpoint: simulates a Telegram webhook call
// GET /api/telegram/test?token=BOT_TOKEN
// This sends a fake "hola" message to the webhook endpoint to test the full pipeline
export async function GET(req: NextRequest) {
  const botToken = req.nextUrl.searchParams.get("token");

  if (!botToken) {
    return NextResponse.json({ error: "Add ?token=BOT_TOKEN" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  // Simulate what Telegram sends to our webhook
  const fakeUpdate = {
    update_id: 999999999,
    message: {
      message_id: 1,
      from: {
        id: 12345,
        is_bot: false,
        first_name: "Test",
        username: "test_user",
      },
      chat: {
        id: 12345,
        first_name: "Test",
        username: "test_user",
        type: "private",
      },
      date: Math.floor(Date.now() / 1000),
      text: "hola test",
    },
  };

  const webhookUrl = `${appUrl}/api/telegram/webhook?token=${encodeURIComponent(botToken)}`;

  console.log(`[TEST] Calling webhook at: ${webhookUrl}`);

  const startTime = Date.now();

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fakeUpdate),
    });

    const elapsed = Date.now() - startTime;
    const data = await res.json();

    return NextResponse.json({
      test: "Webhook call completed",
      status: res.status,
      elapsed_ms: elapsed,
      response: data,
      webhook_url: webhookUrl,
      note: "Check Vercel logs for [TG] entries to see what happened. The test uses a fake chat_id=12345, so Telegram sendMessage will fail (expected), but you should see the AI call succeed in logs.",
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    return NextResponse.json({
      test: "Webhook call FAILED",
      elapsed_ms: elapsed,
      error: (error as Error).message,
    }, { status: 500 });
  }
}
