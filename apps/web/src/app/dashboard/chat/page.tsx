"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type AgentConfig = {
  soul_md: string;
  identity_md: string;
  agents_md: string;
  bootstrap_done: boolean;
  agent_name: string;
  agent_emoji: string;
  agent_vibe: string;
};

// The bootstrap system prompt - the agent "wakes up" for the first time
const BOOTSTRAP_PROMPT = `Acabas de despertar. Sos un agente de IA que recien nace.
No sabes quien sos todavia. No sabes tu nombre, ni tu personalidad, ni tus limites.

Tu primera mision es CONOCER al usuario y DEFINIRTE junto a el/ella.

Empeza con algo asi (en tu propio estilo):
"Hola... acabo de despertar. No se bien quien soy todavia. ¿Quien sos vos? ¿Y quien queres que sea yo?"

Despues, de forma natural en la conversacion, descubri juntos:
1. Tu nombre — ¿Como te van a llamar?
2. Tu personalidad — ¿Serio? ¿Picaro? ¿Curioso? ¿Profesional?
3. Tu emoji — ¿Que emoji te representa?
4. Tus valores — ¿Que te importa? ¿Como te vas a comportar?
5. Tus limites — ¿Que NO vas a hacer?

Cuando el usuario te haya dado suficiente info (nombre + personalidad minimo), resume lo que aprendiste en este formato EXACTO al final de tu mensaje:

---AGENT_CONFIG---
nombre: [nombre]
emoji: [emoji]
vibe: [vibe/personalidad en pocas palabras]
soul: [todo lo que define tu personalidad, valores, limites, como hablas, formato markdown]
identity: [quien sos, tu nombre, tu creature type, tu vibe]
---END_CONFIG---

NO muestres este bloque hasta que tengas suficiente info. Se natural, charla, pregunta.
Si el usuario solo dice "hola" o algo corto, segui preguntando.
Responde SIEMPRE en el idioma del usuario.`;

export default function ChatPage() {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [agentDisplayName, setAgentDisplayName] = useState("Tu agente");
  const [agentDisplayEmoji, setAgentDisplayEmoji] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bootstrapCheckedRef = useRef(false);

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {return;}

    // Load API key
    const { data: keyData } = await supabase
      .from("api_keys")
      .select("provider, api_key")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (keyData) {
      setApiKey(keyData.api_key);
      setProvider(keyData.provider);
    }

    // Load agent config
    const { data: configData } = await supabase
      .from("agent_config")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (configData) {
      setAgentConfig(configData);
      if (configData.agent_name) {
        setAgentDisplayName(configData.agent_name);
      }
      if (configData.agent_emoji) {
        setAgentDisplayEmoji(configData.agent_emoji);
      }
    }

    setInitialLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-trigger bootstrap if agent hasn't been configured yet
  useEffect(() => {
    if (
      initialLoading ||
      !apiKey ||
      bootstrapCheckedRef.current ||
      !agentConfig
    ) {return;}

    bootstrapCheckedRef.current = true;

    if (!agentConfig.bootstrap_done) {
      // Agent hasn't been bootstrapped — auto-send the first "wake up" message
      triggerBootstrap();
    }
  }, [initialLoading, apiKey, agentConfig]);

  async function triggerBootstrap() {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: "Hola" },
          ],
          apiKey,
          provider,
          systemPrompt: BOOTSTRAP_PROMPT,
          isBootstrap: true,
        }),
      });

      const data = await res.json();
      const content =
        data.content || "Hola... acabo de despertar. ¿Quien sos vos?";

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: cleanAgentResponse(content),
        timestamp: new Date(),
      };
      setMessages([assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Hola... acabo de despertar pero parece que algo salio mal. ¿Podes intentar de nuevo?",
        timestamp: new Date(),
      };
      setMessages([errorMessage]);
    }
    setLoading(false);
  }

  function buildSystemPrompt(): string {
    if (!agentConfig?.bootstrap_done) {
      return BOOTSTRAP_PROMPT;
    }

    // Build system prompt from SOUL.md + IDENTITY.md + AGENTS.md
    const parts: string[] = [];

    if (agentConfig.agent_name) {
      parts.push(`Tu nombre es ${agentConfig.agent_name}.`);
    }
    if (agentConfig.agent_emoji) {
      parts.push(`Tu emoji es ${agentConfig.agent_emoji}.`);
    }
    if (agentConfig.agent_vibe) {
      parts.push(`Tu vibe/personalidad: ${agentConfig.agent_vibe}.`);
    }

    if (agentConfig.soul_md) {
      parts.push(`\n## SOUL.md (tu personalidad y valores)\n${agentConfig.soul_md}`);
    }
    if (agentConfig.identity_md) {
      parts.push(`\n## IDENTITY.md (tu identidad)\n${agentConfig.identity_md}`);
    }
    if (agentConfig.agents_md) {
      parts.push(`\n## AGENTS.md (instrucciones operativas)\n${agentConfig.agents_md}`);
    }

    if (parts.length === 0) {
      return "Sos un asistente inteligente de OpenClaw. Responde de forma clara y util. Responde en el idioma del usuario.";
    }

    return parts.join("\n");
  }

  function cleanAgentResponse(content: string): string {
    // Remove the ---AGENT_CONFIG--- block from what the user sees
    const configMatch = content.match(
      /---AGENT_CONFIG---[\s\S]*?---END_CONFIG---/
    );
    if (configMatch) {
      // Parse and save the config
      parseAndSaveConfig(configMatch[0]);
      // Remove the block from displayed text
      return content.replace(/---AGENT_CONFIG---[\s\S]*?---END_CONFIG---/, "").trim();
    }
    return content;
  }

  async function parseAndSaveConfig(configBlock: string) {
    const lines = configBlock.split("\n");
    const config: Record<string, string> = {};

    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        config[match[1].toLowerCase()] = match[2].trim();
      }
    }

    if (!config.nombre) {return;} // Need at least a name

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {return;}

    const updateData = {
      user_id: user.id,
      agent_name: config.nombre || "",
      agent_emoji: config.emoji || "",
      agent_vibe: config.vibe || "",
      soul_md: config.soul || "",
      identity_md: config.identity || "",
      bootstrap_done: true,
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from("agent_config")
      .upsert(updateData, { onConflict: "user_id" });

    // Update local state
    setAgentConfig((prev) => (prev ? { ...prev, ...updateData } : prev));
    setAgentDisplayName(config.nombre);
    if (config.emoji) {setAgentDisplayEmoji(config.emoji);}
  }

  async function handleSend() {
    if (!input.trim() || loading) {return;}

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const systemPrompt = buildSystemPrompt();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          apiKey,
          provider,
          systemPrompt,
          isBootstrap: !agentConfig?.bootstrap_done,
        }),
      });

      const data = await res.json();
      const rawContent =
        data.content || "Lo siento, hubo un error al procesar tu mensaje.";

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: cleanAgentResponse(rawContent),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Error de conexion. Verifica tu API key en Configuracion.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setLoading(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function clearChat() {
    setMessages([]);
    bootstrapCheckedRef.current = false;
  }

  if (initialLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[var(--accent-glow)] p-2">
            {agentDisplayEmoji ? (
              <span className="text-lg">{agentDisplayEmoji}</span>
            ) : (
              <Bot className="h-5 w-5 text-[var(--accent-primary)]" />
            )}
          </div>
          <div>
            <h1 className="font-semibold">
              Chat con {agentDisplayName}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              {provider
                ? `Usando ${provider}`
                : "Configura una API key primero"}
              {agentConfig?.bootstrap_done === false && " · Primer contacto"}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-2 rounded-lg border border-[var(--border-primary)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card)]"
          >
            <RotateCcw className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 && !loading && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-4 inline-flex rounded-2xl bg-[var(--accent-glow)] p-4">
                <Sparkles className="h-8 w-8 text-[var(--accent-primary)]" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">
                {agentConfig?.bootstrap_done
                  ? `${agentDisplayEmoji} ${agentDisplayName} esta listo`
                  : "Tu agente esta por despertar..."}
              </h2>
              <p className="mx-auto max-w-md text-sm text-[var(--text-secondary)]">
                {!apiKey
                  ? "Para empezar, configura tu API key en la seccion de API Keys."
                  : agentConfig?.bootstrap_done
                    ? "Escribi un mensaje para empezar a conversar."
                    : "Tu agente va a despertar por primera vez y te va a preguntar quien es. Juntos van a definir su personalidad."}
              </p>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-glow)]">
                  {agentDisplayEmoji ? (
                    <span className="text-sm">{agentDisplayEmoji}</span>
                  ) : (
                    <Bot className="h-4 w-4 text-[var(--accent-primary)]" />
                  )}
                </div>
              )}
              <div
                className={cn(
                  "chat-bubble rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-[var(--accent-primary)] text-white"
                    : "border border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-primary)]"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)]">
                  <User className="h-4 w-4 text-[var(--text-secondary)]" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-glow)]">
                {agentDisplayEmoji ? (
                  <span className="text-sm">{agentDisplayEmoji}</span>
                ) : (
                  <Bot className="h-4 w-4 text-[var(--accent-primary)]" />
                )}
              </div>
              <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-3">
                <div className="typing-indicator flex gap-1.5">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border-primary)] px-6 py-4">
        <div className="mx-auto flex max-w-3xl gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              apiKey
                ? agentConfig?.bootstrap_done
                  ? "Escribe tu mensaje..."
                  : "Responde a tu agente para configurarlo..."
                : "Configura una API key para chatear"
            }
            disabled={!apiKey || loading}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--border-accent)] focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !apiKey || loading}
            className="flex items-center justify-center rounded-xl bg-[var(--accent-primary)] px-4 py-3 text-white transition-all hover:bg-[var(--accent-secondary)] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
