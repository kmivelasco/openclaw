"use client";

import { useState, useEffect } from "react";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function TelegramPage() {
  const supabase = createClient();
  const [botToken, setBotToken] = useState("");
  const [_savedToken, setSavedToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [botInfo, setBotInfo] = useState<{
    username?: string;
    first_name?: string;
  } | null>(null);

  useEffect(() => {
    loadToken();
  }, []);

  async function loadToken() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {return;}

    const { data } = await supabase
      .from("telegram_config")
      .select("bot_token, bot_username, status")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setSavedToken(data.bot_token);
      setStatus(data.status || "disconnected");
      if (data.bot_username) {
        setBotInfo({ username: data.bot_username });
      }
    }
    setLoading(false);
  }

  async function validateAndSaveToken() {
    if (!botToken.trim()) {return;}
    setSaving(true);
    setStatus("connecting");

    try {
      // Validate token with Telegram API
      const res = await fetch(
        `https://api.telegram.org/bot${botToken.trim()}/getMe`,
      );
      const data = await res.json();

      if (!data.ok) {
        setStatus("error");
        setSaving(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {return;}

      await supabase.from("telegram_config").upsert(
        {
          user_id: user.id,
          bot_token: botToken.trim(),
          bot_username: data.result.username,
          bot_name: data.result.first_name,
          status: "connected",
        },
        { onConflict: "user_id" },
      );

      setSavedToken(botToken.trim());
      setBotInfo({
        username: data.result.username,
        first_name: data.result.first_name,
      });
      setStatus("connected");
      setBotToken("");
    } catch {
      setStatus("error");
    }
    setSaving(false);
  }

  async function disconnect() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {return;}

    await supabase.from("telegram_config").delete().eq("user_id", user.id);

    setSavedToken(null);
    setBotInfo(null);
    setStatus("disconnected");
  }

  function copyBotLink() {
    if (botInfo?.username) {
      navigator.clipboard.writeText(`https://t.me/${botInfo.username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Telegram</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Conecta un bot de Telegram para que tus agentes puedan recibir y
          responder mensajes automaticamente.
        </p>
      </div>

      {/* Status Banner */}
      <div
        className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 ${
          status === "connected"
            ? "border-[var(--success)]/30 bg-[var(--success)]/5"
            : status === "error"
              ? "border-[var(--error)]/30 bg-[var(--error)]/5"
              : "border-[var(--border-primary)] bg-[var(--bg-card)]"
        }`}
      >
        {status === "connected" ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
            <span className="text-sm">
              Bot conectado:{" "}
              <strong className="text-[var(--text-primary)]">
                @{botInfo?.username}
              </strong>
            </span>
          </>
        ) : status === "error" ? (
          <>
            <AlertCircle className="h-5 w-5 text-[var(--error)]" />
            <span className="text-sm text-[var(--error)]">
              Token invalido. Verifica que el token sea correcto.
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="h-5 w-5 text-[var(--warning)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              Sin bot conectado
            </span>
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="mb-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6">
        <h2 className="mb-4 text-lg font-semibold">Como crear un bot</h2>
        <ol className="space-y-3 text-sm text-[var(--text-secondary)]">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-glow)] text-xs font-bold text-[var(--accent-primary)]">
              1
            </span>
            <span>
              Abri Telegram y busca{" "}
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--accent-primary)] hover:underline"
              >
                @BotFather
                <ExternalLink className="ml-1 inline h-3 w-3" />
              </a>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-glow)] text-xs font-bold text-[var(--accent-primary)]">
              2
            </span>
            <span>
              Envia el comando <code className="rounded bg-[var(--bg-primary)] px-1.5 py-0.5">/newbot</code> y segui las instrucciones
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-glow)] text-xs font-bold text-[var(--accent-primary)]">
              3
            </span>
            <span>
              Copia el token HTTP API que te da BotFather y pegalo abajo
            </span>
          </li>
        </ol>
      </div>

      {/* Token Input */}
      <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6">
        <h2 className="mb-4 text-lg font-semibold">Bot Token</h2>
        <div className="flex gap-2">
          <input
            type="password"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
            className="flex-1 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] py-3 px-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--border-accent)] focus:outline-none"
          />
          <button
            onClick={validateAndSaveToken}
            disabled={!botToken.trim() || saving}
            className="flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-3 text-sm font-medium text-white transition-all hover:bg-[var(--accent-secondary)] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                Conectar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Connected Bot Info */}
      {status === "connected" && botInfo && (
        <div className="mt-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6">
          <h2 className="mb-4 text-lg font-semibold">Bot conectado</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                {botInfo.first_name} —{" "}
                <span className="font-medium text-[var(--accent-primary)]">
                  @{botInfo.username}
                </span>
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Los mensajes enviados a este bot seran procesados por tu agente
                IA
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyBotLink}
                className="flex items-center gap-2 rounded-lg border border-[var(--border-primary)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-hover)]"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-[var(--success)]" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                Copiar link
              </button>
              <button
                onClick={disconnect}
                className="rounded-lg border border-[var(--error)]/30 px-3 py-2 text-sm text-[var(--error)] transition-colors hover:bg-[var(--error)]/10"
              >
                Desconectar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
