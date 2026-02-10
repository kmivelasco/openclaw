import { NextRequest, NextResponse } from "next/server";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, apiKey, provider } = body as {
      messages: ChatMessage[];
      apiKey: string | null;
      provider: string | null;
    };

    if (!apiKey) {
      return NextResponse.json(
        { content: "No API key configured. Go to Settings to add one." },
        { status: 400 },
      );
    }

    // Route to the correct provider
    if (provider === "anthropic") {
      return handleAnthropic(messages, apiKey);
    } else if (provider === "openai") {
      return handleOpenAI(messages, apiKey);
    } else if (provider === "google") {
      return handleGoogle(messages, apiKey);
    } else if (provider === "groq") {
      return handleGroq(messages, apiKey);
    }

    return NextResponse.json(
      { content: "Unknown provider. Please configure a valid API key." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { content: "Internal server error." },
      { status: 500 },
    );
  }
}

async function handleAnthropic(messages: ChatMessage[], apiKey: string) {
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
      messages,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { content: `Anthropic error: ${data.error?.message || "Unknown error"}` },
      { status: res.status },
    );
  }

  const content = data.content?.[0]?.text || "No response.";
  return NextResponse.json({ content });
}

async function handleOpenAI(messages: ChatMessage[], apiKey: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { content: `OpenAI error: ${data.error?.message || "Unknown error"}` },
      { status: res.status },
    );
  }

  const content = data.choices?.[0]?.message?.content || "No response.";
  return NextResponse.json({ content });
}

async function handleGoogle(messages: ChatMessage[], apiKey: string) {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    },
  );

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { content: `Google error: ${data.error?.message || "Unknown error"}` },
      { status: res.status },
    );
  }

  const content =
    data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
  return NextResponse.json({ content });
}

async function handleGroq(messages: ChatMessage[], apiKey: string) {
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
        messages,
      }),
    },
  );

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { content: `Groq error: ${data.error?.message || "Unknown error"}` },
      { status: res.status },
    );
  }

  const content = data.choices?.[0]?.message?.content || "No response.";
  return NextResponse.json({ content });
}
