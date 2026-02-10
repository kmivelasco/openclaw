"use client";

import { useState, useEffect } from "react";
import {
  Key,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

type Provider = {
  id: string;
  name: string;
  placeholder: string;
  prefix: string;
  docsUrl: string;
};

const PROVIDERS: Provider[] = [
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    placeholder: "sk-ant-api03-...",
    prefix: "sk-ant-",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "openai",
    name: "OpenAI (GPT)",
    placeholder: "sk-proj-...",
    prefix: "sk-",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "google",
    name: "Google (Gemini)",
    placeholder: "AIzaSy...",
    prefix: "AIza",
    docsUrl: "https://aistudio.google.com/apikey",
  },
  {
    id: "groq",
    name: "Groq",
    placeholder: "gsk_...",
    prefix: "gsk_",
    docsUrl: "https://console.groq.com/keys",
  },
];

function ApiKeyRow({
  provider,
  savedKey,
  onSave,
  onDelete,
}: {
  provider: Provider;
  savedKey: string | null;
  onSave: (key: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [key, setKey] = useState("");
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!key.trim()) {return;}
    setSaving(true);
    await onSave(key.trim());
    setSaving(false);
    setSaved(true);
    setKey("");
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[var(--accent-glow)] p-2">
            <Key className="h-4 w-4 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">
              {provider.name}
            </h3>
            <a
              href={provider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--accent-primary)] hover:underline"
            >
              Obtener API key
            </a>
          </div>
        </div>
        {savedKey ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
            <span className="text-xs text-[var(--success)]">Configurada</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[var(--warning)]" />
            <span className="text-xs text-[var(--warning)]">Sin configurar</span>
          </div>
        )}
      </div>

      {savedKey && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-[var(--bg-primary)] px-3 py-2">
          <code className="flex-1 text-sm text-[var(--text-muted)]">
            {savedKey.slice(0, 12)}...{savedKey.slice(-4)}
          </code>
          <button
            onClick={onDelete}
            className="rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--error)]/10 hover:text-[var(--error)]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={visible ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={savedKey ? "Reemplazar key..." : provider.placeholder}
            className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] py-2.5 pl-4 pr-10 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--border-accent)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          >
            {visible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={!key.trim() || saving}
          className="flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--accent-secondary)] disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const supabase = createClient();
  const [keys, setKeys] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {return;}

    const { data } = await supabase
      .from("api_keys")
      .select("provider, api_key")
      .eq("user_id", user.id);

    const keyMap: Record<string, string | null> = {};
    data?.forEach((row: { provider: string; api_key: string }) => {
      keyMap[row.provider] = row.api_key;
    });
    setKeys(keyMap);
    setLoading(false);
  }

  async function saveKey(provider: string, apiKey: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {return;}

    await supabase
      .from("api_keys")
      .upsert(
        { user_id: user.id, provider, api_key: apiKey },
        { onConflict: "user_id,provider" },
      );

    setKeys((prev) => ({ ...prev, [provider]: apiKey }));
  }

  async function deleteKey(provider: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {return;}

    await supabase
      .from("api_keys")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", provider);

    setKeys((prev) => ({ ...prev, [provider]: null }));
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">API Keys</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Configura las claves de los proveedores de IA que quieras usar. Tus
          keys se almacenan de forma segura y nunca se comparten.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" />
        </div>
      ) : (
        <div className="space-y-4">
          {PROVIDERS.map((provider) => (
            <ApiKeyRow
              key={provider.id}
              provider={provider}
              savedKey={keys[provider.id] ?? null}
              onSave={(key) => saveKey(provider.id, key)}
              onDelete={() => deleteKey(provider.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
