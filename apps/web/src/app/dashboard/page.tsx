"use client";

import Link from "next/link";
import {
  MessageSquare,
  Settings,
  Send,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function QuickAction({
  icon: Icon,
  title,
  description,
  href,
  status,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  status?: "ready" | "pending";
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 transition-all hover:border-[var(--border-accent)] hover:bg-[var(--bg-card-hover)]"
    >
      <div className="rounded-xl bg-[var(--accent-glow)] p-3">
        <Icon className="h-6 w-6 text-[var(--accent-primary)]" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
          {status === "ready" && (
            <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
          )}
          {status === "pending" && (
            <AlertCircle className="h-4 w-4 text-[var(--warning)]" />
          )}
        </div>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
      <ArrowRight className="h-5 w-5 text-[var(--text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent-primary)]" />
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Configura tus agentes y canales para empezar.
        </p>
      </div>

      {/* Status */}
      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
        <Activity className="h-5 w-5 text-[var(--accent-primary)]" />
        <span className="text-sm text-[var(--text-secondary)]">
          Gateway: <span className="font-medium text-[var(--success)]">Online</span> | Puerto 18789
        </span>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text-secondary)]">
          Pasos para empezar
        </h2>
        <QuickAction
          icon={Settings}
          title="1. Configura tu API Key"
          description="Agrega tu clave de Claude, OpenAI, Gemini u otro proveedor de IA para activar tus agentes."
          href="/dashboard/settings"
          status="pending"
        />
        <QuickAction
          icon={Send}
          title="2. Conecta Telegram"
          description="Vincula tu bot de Telegram para que tus agentes puedan recibir y responder mensajes."
          href="/dashboard/telegram"
          status="pending"
        />
        <QuickAction
          icon={MessageSquare}
          title="3. Chatea con tu agente"
          description="Prueba tu agente directamente desde el chat web integrado."
          href="/dashboard/chat"
        />
      </div>
    </div>
  );
}
