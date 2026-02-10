"use client";

import { useState, useRef, useEffect } from "react";
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

export default function ChatPage() {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadApiKey();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadApiKey() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {return;}

    const { data } = await supabase
      .from("api_keys")
      .select("provider, api_key")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (data) {
      setApiKey(data.api_key);
      setProvider(data.provider);
    }
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
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content || "Lo siento, hubo un error al procesar tu mensaje.",
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
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[var(--accent-glow)] p-2">
            <Bot className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h1 className="font-semibold">Chat con tu agente</h1>
            <p className="text-xs text-[var(--text-muted)]">
              {provider
                ? `Usando ${provider}`
                : "Configura una API key primero"}
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
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-4 inline-flex rounded-2xl bg-[var(--accent-glow)] p-4">
                <Sparkles className="h-8 w-8 text-[var(--accent-primary)]" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">
                Hola! Soy tu agente OpenClaw
              </h2>
              <p className="mx-auto max-w-md text-sm text-[var(--text-secondary)]">
                {apiKey
                  ? "Escribi un mensaje para empezar a conversar. Puedo ayudarte con cualquier tarea."
                  : "Para empezar, configura tu API key en la seccion de Configuracion."}
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
                message.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {message.role === "assistant" && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-glow)]">
                  <Bot className="h-4 w-4 text-[var(--accent-primary)]" />
                </div>
              )}
              <div
                className={cn(
                  "chat-bubble rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-[var(--accent-primary)] text-white"
                    : "border border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-primary)]",
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
                <Bot className="h-4 w-4 text-[var(--accent-primary)]" />
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
                ? "Escribe tu mensaje..."
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
