"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Crown,
  CheckCircle2,
  Sparkles,
  Loader2,
  Zap,
  ArrowRight,
  Shield,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

type Subscription = {
  plan: "starter" | "pro";
  status: "active" | "canceled" | "past_due";
};

export default function PlanPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [managingPortal, setManagingPortal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  useEffect(() => {
    if (searchParams.get("session_id")) {
      setSuccessMessage(true);
      loadSubscription();
      setTimeout(() => setSuccessMessage(false), 5000);
    }
  }, [searchParams]);

  async function loadSubscription() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {return;}

    const { data } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setSubscription(data as Subscription);
    }
    setLoading(false);
  }

  async function handleSubscribe() {
    setSubscribing(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {return;}

    try {
      const res = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payerEmail: user.email,
          externalReference: user.id,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Error al crear suscripcion");
        setSubscribing(false);
      }
    } catch {
      alert("Error de conexion");
      setSubscribing(false);
    }
  }

  async function handleManageSubscription() {
    setManagingPortal(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {return;}

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Error al abrir el portal");
        setManagingPortal(false);
      }
    } catch {
      alert("Error de conexion");
      setManagingPortal(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  const isPro = subscription?.plan === "pro" && subscription?.status === "active";

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tu Plan</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Gestiona tu suscripcion y accede a todas las funcionalidades.
        </p>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[var(--success)]/30 bg-[var(--success)]/10 p-4">
          <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
          <p className="text-sm font-medium text-[var(--success)]">
            Suscripcion activada correctamente. Tu prueba gratis de 7 dias comenzo.
          </p>
        </div>
      )}

      {/* Current plan banner */}
      <div
        className={`mb-8 flex items-center gap-4 rounded-2xl border p-6 ${
          isPro
            ? "border-[var(--accent-primary)]/30 bg-[var(--accent-glow)]"
            : "border-[var(--border-primary)] bg-[var(--bg-card)]"
        }`}
      >
        <div
          className={`rounded-xl p-3 ${isPro ? "bg-[var(--accent-primary)]/20" : "bg-[var(--bg-primary)]"}`}
        >
          {isPro ? (
            <Crown className="h-6 w-6 text-[var(--accent-primary)]" />
          ) : (
            <Zap className="h-6 w-6 text-[var(--text-muted)]" />
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            Plan {isPro ? "Pro" : "Starter"}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {isPro
              ? "Acceso completo a todas las funcionalidades"
              : "Plan gratuito con funcionalidades basicas"}
          </p>
        </div>
        {isPro && (
          <div className="ml-auto flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
            <span className="text-sm font-medium text-[var(--success)]">
              Activo
            </span>
          </div>
        )}
      </div>

      {/* Plans */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Starter / Trial */}
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-8">
          <div className="mb-4">
            <h3 className="text-xl font-bold">Starter</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Ideal para probar la plataforma
            </p>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-bold gradient-text">Gratis</span>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              7 dias de prueba con funciones Pro incluidas
            </p>
          </div>
          <ul className="mb-8 space-y-3">
            {[
              "1 agente activo",
              "1 canal (Telegram o WhatsApp)",
              "100 mensajes/dia",
              "Chat web incluido",
              "7 dias de prueba Pro gratis",
            ].map((f) => (
              <li
                key={f}
                className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
              >
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
                {f}
              </li>
            ))}
          </ul>
          {!isPro && (
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] py-3 text-sm font-semibold text-[var(--text-primary)] transition-all hover:border-[var(--border-accent)] hover:bg-[var(--bg-card-hover)] disabled:opacity-50"
            >
              {subscribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Empezar prueba gratis
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Pro */}
        <div className="relative rounded-2xl border border-[var(--border-accent)] bg-[var(--bg-card)] p-8 glow-border">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent-primary)] px-4 py-1 text-xs font-medium text-white">
            Recomendado
          </div>
          <div className="mb-4">
            <h3 className="text-xl font-bold">Pro</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Para negocios en crecimiento
            </p>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-bold gradient-text">$20 USD</span>
            <span className="text-[var(--text-muted)]">/mes</span>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Despues de 7 dias de prueba gratis
            </p>
          </div>
          <ul className="mb-8 space-y-3">
            {[
              "Agentes ilimitados",
              "Canales ilimitados",
              "Mensajes ilimitados",
              "Cron jobs y webhooks",
              "Memory & RAG",
              "Browser automation",
              "Custom skills",
              "Soporte prioritario",
            ].map((f) => (
              <li
                key={f}
                className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
              >
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
                {f}
              </li>
            ))}
          </ul>
          {isPro ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-center gap-2 rounded-xl bg-[var(--success)]/10 py-3 text-sm font-semibold text-[var(--success)]">
                <CheckCircle2 className="h-4 w-4" />
                Plan activo
              </div>
              <button
                onClick={handleManageSubscription}
                disabled={managingPortal}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] py-3 text-sm font-medium text-[var(--text-secondary)] transition-all hover:border-[var(--border-accent)] hover:bg-[var(--bg-card-hover)] disabled:opacity-50"
              >
                {managingPortal ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Settings className="h-4 w-4" />
                    Gestionar suscripcion
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--accent-secondary)] disabled:opacity-50"
            >
              {subscribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Empezar prueba gratis
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Security note */}
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-primary)]" />
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Pago seguro con Stripe
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Tus datos de pago son procesados directamente por Stripe. Nunca
            almacenamos tu informacion financiera. Podes cancelar en cualquier
            momento.
          </p>
        </div>
      </div>
    </div>
  );
}
