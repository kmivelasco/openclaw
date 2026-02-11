"use client";

import { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  Sparkles,
  Brain,
  ScrollText,
  User,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function AgentConfigPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "soul" | "identity" | "agents"
  >("soul");

  const [soulMd, setSoulMd] = useState("");
  const [identityMd, setIdentityMd] = useState("");
  const [agentsMd, setAgentsMd] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentEmoji, setAgentEmoji] = useState("");
  const [agentVibe, setAgentVibe] = useState("");
  const [bootstrapDone, setBootstrapDone] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {return;}

    const { data } = await supabase
      .from("agent_config")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setSoulMd(data.soul_md || "");
      setIdentityMd(data.identity_md || "");
      setAgentsMd(data.agents_md || "");
      setAgentName(data.agent_name || "");
      setAgentEmoji(data.agent_emoji || "");
      setAgentVibe(data.agent_vibe || "");
      setBootstrapDone(data.bootstrap_done || false);
    }
    setLoading(false);
  }

  async function saveConfig() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {return;}

    await supabase.from("agent_config").upsert(
      {
        user_id: user.id,
        soul_md: soulMd,
        identity_md: identityMd,
        agents_md: agentsMd,
        agent_name: agentName,
        agent_emoji: agentEmoji,
        agent_vibe: agentVibe,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  const tabs = [
    {
      id: "soul" as const,
      label: "SOUL.md",
      icon: Sparkles,
      desc: "Personalidad, tono, limites",
    },
    {
      id: "identity" as const,
      label: "IDENTITY.md",
      icon: User,
      desc: "Nombre, vibe, emoji",
    },
    {
      id: "agents" as const,
      label: "AGENTS.md",
      icon: ScrollText,
      desc: "Instrucciones operativas",
    },
  ];

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="h-8 w-8 text-[var(--accent-primary)]" />
          Configurar Agente
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Define la personalidad, identidad e instrucciones de tu agente IA.
          Esto se aplica al chat del dashboard y a Telegram.
        </p>
      </div>

      {/* Bootstrap status */}
      {bootstrapDone && agentName && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[var(--success)]/30 bg-[var(--success)]/5 p-4">
          <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
          <span className="text-sm">
            Agente configurado:{" "}
            <strong className="text-[var(--text-primary)]">
              {agentEmoji} {agentName}
            </strong>
            {agentVibe && (
              <span className="text-[var(--text-muted)]">
                {" "}
                — {agentVibe}
              </span>
            )}
          </span>
        </div>
      )}

      {!bootstrapDone && (
        <div className="mb-6 rounded-2xl border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-[var(--accent-primary)]" />
            <div>
              <h3 className="text-sm font-semibold">
                Tu agente aun no desperto
              </h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Anda al <strong>Chat</strong> y habla con tu agente. En la
                primera conversacion va a &quot;despertar&quot; y te va a
                preguntar quien es, como se llama, y como queres que se
                comporte. Juntos van a definir su personalidad.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Identity */}
      <div className="mb-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6">
        <h2 className="mb-4 text-lg font-semibold">Identidad rapida</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Nombre del agente
            </label>
            <input
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Ej: Martina, Spark, Nova..."
              className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Emoji
            </label>
            <input
              value={agentEmoji}
              onChange={(e) => setAgentEmoji(e.target.value)}
              placeholder="Ej: 🤖 🦞 🌟 🧠"
              className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Vibe
            </label>
            <input
              value={agentVibe}
              onChange={(e) => setAgentVibe(e.target.value)}
              placeholder="Ej: curioso, picaro, profesional..."
              className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-accent)] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-[var(--accent-primary)] text-white"
                : "border border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {tabs.find((t) => t.id === activeTab)?.desc}
            </p>
          </div>
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--accent-secondary)] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Guardado
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar
              </>
            )}
          </button>
        </div>

        <textarea
          value={
            activeTab === "soul"
              ? soulMd
              : activeTab === "identity"
                ? identityMd
                : agentsMd
          }
          onChange={(e) => {
            if (activeTab === "soul") {setSoulMd(e.target.value);}
            else if (activeTab === "identity") {setIdentityMd(e.target.value);}
            else {setAgentsMd(e.target.value);}
          }}
          placeholder={
            activeTab === "soul"
              ? "# SOUL.md\n\nDefini la personalidad de tu agente...\n\n## Core Truths\n- Soy curioso y honesto\n- Respondo en el idioma del usuario\n- No finjo saber lo que no se\n\n## Values\n- Claridad sobre complejidad\n- Empatia siempre\n- Creatividad cuando sea posible"
              : activeTab === "identity"
                ? "# IDENTITY.md\n\nNombre: (tu agente)\nCreature: AI assistant\nVibe: curioso, amigable\nEmoji: 🤖"
                : "# AGENTS.md\n\nInstrucciones operativas para tu agente...\n\n## Comportamiento\n- Responde preguntas de forma concisa\n- Si no sabes algo, decilo\n- Usa formato markdown cuando ayude"
          }
          rows={18}
          className="w-full resize-y rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-4 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-accent)] focus:outline-none"
        />
      </div>
    </div>
  );
}
