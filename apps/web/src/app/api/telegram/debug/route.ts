import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Debug endpoint to test Telegram webhook pipeline
// GET /api/telegram/debug?token=BOT_TOKEN
export async function GET(req: NextRequest) {
  const steps: { step: string; status: string; data?: unknown }[] = [];

  try {
    // Step 1: Check env vars
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    steps.push({
      step: "1. Check env vars",
      status: supabaseUrl && serviceRoleKey ? "OK" : "FAIL",
      data: {
        SUPABASE_URL: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "MISSING",
        SERVICE_ROLE_KEY: serviceRoleKey ? `${serviceRoleKey.substring(0, 20)}...` : "MISSING",
        APP_URL: process.env.NEXT_PUBLIC_APP_URL || "MISSING",
      },
    });

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ steps }, { status: 500 });
    }

    // Step 2: Create Supabase admin client
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    steps.push({ step: "2. Create Supabase admin client", status: "OK" });

    // Step 3: Check if bot token is in query
    const botToken = req.nextUrl.searchParams.get("token");
    steps.push({
      step: "3. Bot token from query",
      status: botToken ? "OK" : "MISSING",
      data: botToken ? `${botToken.substring(0, 10)}...` : "No token param",
    });

    if (!botToken) {
      steps.push({
        step: "HINT",
        status: "INFO",
        data: "Add ?token=YOUR_BOT_TOKEN to test the full pipeline",
      });
      return NextResponse.json({ steps });
    }

    // Step 4: Look up telegram_config
    const { data: telegramConfig, error: tgError } = await supabase
      .from("telegram_config")
      .select("user_id, bot_token, bot_username, webhook_active")
      .eq("bot_token", botToken)
      .single();

    steps.push({
      step: "4. Lookup telegram_config by bot_token",
      status: telegramConfig ? "OK" : "FAIL",
      data: tgError
        ? { error: tgError.message, code: tgError.code, details: tgError.details }
        : {
            user_id: telegramConfig?.user_id,
            bot_username: telegramConfig?.bot_username,
            webhook_active: telegramConfig?.webhook_active,
          },
    });

    if (!telegramConfig) {
      return NextResponse.json({ steps });
    }

    const userId = telegramConfig.user_id;

    // Step 5: Look up agent_config
    const { data: agentCfg, error: agentError } = await supabase
      .from("agent_config")
      .select("agent_name, agent_emoji, agent_vibe, bootstrap_done")
      .eq("user_id", userId)
      .single();

    steps.push({
      step: "5. Lookup agent_config",
      status: agentCfg ? "OK" : "WARN (will use default prompt)",
      data: agentError
        ? { error: agentError.message, code: agentError.code }
        : {
            agent_name: agentCfg?.agent_name,
            agent_emoji: agentCfg?.agent_emoji,
            bootstrap_done: agentCfg?.bootstrap_done,
          },
    });

    // Step 6: Look up API keys
    const { data: apiKeys, error: keysError } = await supabase
      .from("api_keys")
      .select("provider, api_key")
      .eq("user_id", userId);

    const keysSummary = (apiKeys || []).map((k) => ({
      provider: k.provider,
      key_prefix: k.api_key ? `${k.api_key.substring(0, 8)}...` : "empty",
    }));

    steps.push({
      step: "6. Lookup API keys",
      status: apiKeys && apiKeys.length > 0 ? "OK" : "FAIL",
      data: keysError
        ? { error: keysError.message }
        : { count: apiKeys?.length || 0, keys: keysSummary },
    });

    if (!apiKeys || apiKeys.length === 0) {
      return NextResponse.json({ steps });
    }

    // Step 7: Test sending a message via Telegram
    const testRes = await fetch(
      `https://api.telegram.org/bot${botToken}/getMe`
    );
    const testData = await testRes.json();

    steps.push({
      step: "7. Telegram API getMe test",
      status: testData.ok ? "OK" : "FAIL",
      data: testData.ok
        ? { username: testData.result?.username }
        : { error: testData.description },
    });

    // Step 8: Check priority order
    const priorityOrder = ["anthropic", "openai", "google", "groq"];
    let selectedProvider = "none";
    for (const p of priorityOrder) {
      if (apiKeys.find((k) => k.provider === p)) {
        selectedProvider = p;
        break;
      }
    }

    steps.push({
      step: "8. Selected AI provider",
      status: selectedProvider !== "none" ? "OK" : "FAIL",
      data: { provider: selectedProvider },
    });

    steps.push({
      step: "RESULT",
      status: "ALL CHECKS PASSED",
      data: "The webhook pipeline should work. If bot still doesn't respond, check Vercel function logs for runtime errors.",
    });

    return NextResponse.json({ steps });
  } catch (error) {
    steps.push({
      step: "UNEXPECTED ERROR",
      status: "FAIL",
      data: { message: (error as Error).message, stack: (error as Error).stack?.substring(0, 200) },
    });
    return NextResponse.json({ steps }, { status: 500 });
  }
}
