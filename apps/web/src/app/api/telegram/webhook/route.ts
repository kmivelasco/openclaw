import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Lazy Supabase admin client (bypasses RLS)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }
  return createClient(url, key);
}

type ChatMessage = { role: "user" | "assistant"; content: string };

// Telegram sends updates here when someone messages the bot
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // Only handle text messages
    const message = update?.message;
    if (!message?.text || message.from?.is_bot) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const userText = message.text;
    const botToken = req.nextUrl.searchParams.get("token");

    if (!botToken) {
      return NextResponse.json({ ok: true }); // Silently ignore
    }

    const supabase = getSupabaseAdmin();

    // Find the user who owns this bot token
    const { data: telegramConfig } = await supabase
      .from("telegram_config")
      .select("user_id, bot_token")
      .eq("bot_token", botToken)
      .single();

    if (!telegramConfig) {
      await sendTelegramMessage(
        botToken,
        chatId,
        "Este bot no esta configurado correctamente."
      );
      return NextResponse.json({ ok: true });
    }

    const userId = telegramConfig.user_id;

    // Load agent config for system prompt
    const { data: agentCfg } = await supabase
      .from("agent_config")
      .select("soul_md, identity_md, agents_md, agent_name, agent_emoji, agent_vibe, bootstrap_done")
      .eq("user_id", userId)
      .single();

    // Get the user's API keys (try in priority order)
    const { data: apiKeys } = await supabase
      .from("api_keys")
      .select("provider, api_key")
      .eq("user_id", userId);

    if (!apiKeys || apiKeys.length === 0) {
      await sendTelegramMessage(
        botToken,
        chatId,
        "No hay API keys configuradas. Configura una en el dashboard de OpenClaw."
      );
      return NextResponse.json({ ok: true });
    }

    // Priority: anthropic > openai > google > groq
    const priorityOrder = ["anthropic", "openai", "google", "groq"];
    let selectedKey: { provider: string; api_key: string } | null = null;
    for (const p of priorityOrder) {
      const found = apiKeys.find((k) => k.provider === p);
      if (found) {
        selectedKey = found;
        break;
      }
    }

    if (!selectedKey) {
      await sendTelegramMessage(
        botToken,
        chatId,
        "No se encontro una API key valida."
      );
      return NextResponse.json({ ok: true });
    }

    // Send typing action
    await fetch(
      `https://api.telegram.org/bot${botToken}/sendChatAction`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, action: "typing" }),
      }
    );

    // Load recent chat history for context (last 10 messages)
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    const messages: ChatMessage[] = [
      ...(history || []).toReversed().map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: userText },
    ];

    // Build system prompt from agent config
    const systemPrompt = buildSystemPrompt(agentCfg);

    // Get AI response
    const aiResponse = await getAIResponse(
      selectedKey.provider,
      selectedKey.api_key,
      messages,
      systemPrompt
    );

    // Save messages to history
    await supabase.from("chat_messages").insert([
      {
        user_id: userId,
        role: "user",
        content: userText,
        provider: "telegram",
      },
      {
        user_id: userId,
        role: "assistant",
        content: aiResponse,
        provider: selectedKey.provider,
      },
    ]);

    // Send response to Telegram
    await sendTelegramMessage(botToken, chatId, aiResponse);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string
) {
  // Telegram has a 4096 char limit per message
  const chunks = splitMessage(text, 4000);
  for (const chunk of chunks) {
    await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunk,
          parse_mode: "Markdown",
        }),
      }
    );
  }
}

function splitMessage(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) {return [text];}
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    // Try to split at a newline
    let splitAt = remaining.lastIndexOf("\n", maxLen);
    if (splitAt < maxLen / 2) {splitAt = maxLen;}
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }
  return chunks;
}

type AgentCfg = {
  soul_md?: string;
  identity_md?: string;
  agents_md?: string;
  agent_name?: string;
  agent_emoji?: string;
  agent_vibe?: string;
  bootstrap_done?: boolean;
} | null;

function buildSystemPrompt(cfg: AgentCfg): string {
  if (!cfg?.bootstrap_done) {
    return "Sos un asistente inteligente de OpenClaw. Responde de forma clara y util. Responde en el idioma del usuario.";
  }

  const parts: string[] = [];
  if (cfg.agent_name) {parts.push(`Tu nombre es ${cfg.agent_name}.`);}
  if (cfg.agent_emoji) {parts.push(`Tu emoji es ${cfg.agent_emoji}.`);}
  if (cfg.agent_vibe) {parts.push(`Tu vibe/personalidad: ${cfg.agent_vibe}.`);}
  if (cfg.soul_md) {parts.push(`\n## SOUL.md\n${cfg.soul_md}`);}
  if (cfg.identity_md) {parts.push(`\n## IDENTITY.md\n${cfg.identity_md}`);}
  if (cfg.agents_md) {parts.push(`\n## AGENTS.md\n${cfg.agents_md}`);}
  parts.push("\nResponde en el idioma del usuario. Este mensaje llega desde Telegram.");

  return parts.join("\n");
}

async function getAIResponse(
  provider: string,
  apiKey: string,
  messages: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  try {
    if (provider === "anthropic") {
      return await callAnthropic(apiKey, messages, systemPrompt);
    } else if (provider === "openai") {
      return await callOpenAI(apiKey, messages, systemPrompt);
    } else if (provider === "google") {
      return await callGoogle(apiKey, messages, systemPrompt);
    } else if (provider === "groq") {
      return await callGroq(apiKey, messages, systemPrompt);
    }
    return "Provider no soportado.";
  } catch (error) {
    console.error(`AI ${provider} error:`, error);
    return "Hubo un error procesando tu mensaje. Intenta de nuevo.";
  }
}

async function callAnthropic(
  apiKey: string,
  messages: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await res.json();
  if (!res.ok) {throw new Error(data.error?.message || "Anthropic error");}
  return data.content?.[0]?.text || "Sin respuesta.";
}

async function callOpenAI(
  apiKey: string,
  messages: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });
  const data = await res.json();
  if (!res.ok) {throw new Error(data.error?.message || "OpenAI error");}
  return data.choices?.[0]?.message?.content || "Sin respuesta.";
}

async function callGoogle(
  apiKey: string,
  messages: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Entendido." }] },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  ];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    }
  );
  const data = await res.json();
  if (!res.ok) {throw new Error(data.error?.message || "Google error");}
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta.";
}

async function callGroq(
  apiKey: string,
  messages: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  const res = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) {throw new Error(data.error?.message || "Groq error");}
  return data.choices?.[0]?.message?.content || "Sin respuesta.";
}
