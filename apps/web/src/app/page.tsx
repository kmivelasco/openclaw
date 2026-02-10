import Link from "next/link";
import {
  Bot,
  Zap,
  MessageSquare,
  Shield,
  ArrowRight,
  Sparkles,
  Globe,
  Clock,
} from "lucide-react";

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 transition-all hover:border-[var(--border-accent)] hover:bg-[var(--bg-card-hover)]">
      <div className="mb-4 inline-flex rounded-xl bg-[var(--accent-glow)] p-3">
        <Icon className="h-6 w-6 text-[var(--accent-primary)]" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  description,
  features,
  highlighted,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-8 ${
        highlighted
          ? "glow-border border-[var(--border-accent)] bg-[var(--bg-card-hover)]"
          : "border-[var(--border-primary)] bg-[var(--bg-card)]"
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent-primary)] px-4 py-1 text-xs font-medium text-white">
          Popular
        </div>
      )}
      <h3 className="mb-1 text-xl font-bold text-[var(--text-primary)]">
        {name}
      </h3>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">{description}</p>
      <div className="mb-6">
        <span className="text-4xl font-bold gradient-text">{price}</span>
        {price !== "Gratis" && (
          <span className="text-[var(--text-muted)]">/mes</span>
        )}
      </div>
      <ul className="mb-8 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/auth/signup"
        className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
          highlighted
            ? "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)]"
            : "border border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--border-accent)] hover:bg-[var(--bg-card-hover)]"
        }`}
      >
        Comenzar ahora
      </Link>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Bot className="h-7 w-7 text-[var(--accent-primary)]" />
            <span className="text-xl font-bold">
              Open<span className="gradient-text">Claw</span>
            </span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Precios
            </a>
            <Link
              href="/auth/login"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Iniciar sesion
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-[var(--accent-primary)] px-5 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--accent-secondary)]"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--accent-glow),transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)]">
            <Sparkles className="h-4 w-4 text-[var(--accent-primary)]" />
            Powered by Spark101
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight md:text-7xl">
            Despliega tu sistema de{" "}
            <span className="gradient-text">agentes IA</span> que trabajan{" "}
            <span className="gradient-text">24/7</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-[var(--text-secondary)] md:text-xl">
            Conecta tu API de Claude, OpenAI o cualquier modelo. Integra
            Telegram, WhatsApp y mas. Todo desde una interfaz conversacional
            simple.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/auth/signup"
              className="group flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-[var(--accent-secondary)] hover:shadow-lg hover:shadow-[var(--accent-glow)]"
            >
              Empezar en 1 click
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="#features"
              className="rounded-xl border border-[var(--border-primary)] px-8 py-4 text-lg font-semibold text-[var(--text-primary)] transition-all hover:border-[var(--border-accent)] hover:bg-[var(--bg-card)]"
            >
              Ver features
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Todo lo que necesitas para tu <span className="gradient-text">negocio AI</span>
            </h2>
            <p className="mx-auto max-w-2xl text-[var(--text-secondary)]">
              OpenClaw te da el poder de un equipo de agentes IA trabajando para
              vos las 24 horas, los 7 dias de la semana.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Zap}
              title="1-Click Deploy"
              description="Configura tu API key, conecta tus canales y tus agentes estan listos. Sin codigo, sin complicaciones."
            />
            <FeatureCard
              icon={MessageSquare}
              title="Multi-Canal"
              description="Telegram, WhatsApp, Discord, Slack y mas. Tus agentes responden donde esten tus clientes."
            />
            <FeatureCard
              icon={Bot}
              title="Agentes Inteligentes"
              description="Usa Claude, GPT-4, Gemini o cualquier modelo. Routing inteligente por canal, usuario o contexto."
            />
            <FeatureCard
              icon={Shield}
              title="Seguro por Defecto"
              description="Tus API keys se almacenan encriptadas. Autenticacion con pairing codes. Control total de acceso."
            />
            <FeatureCard
              icon={Globe}
              title="Sin Limites"
              description="Conecta tantos canales y agentes como necesites. Escala con tu negocio sin cambiar de plataforma."
            />
            <FeatureCard
              icon={Clock}
              title="24/7 Autonomo"
              description="Tus agentes trabajan mientras duermes. Cron jobs, webhooks, auto-respuestas y mas."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Planes <span className="gradient-text">simples</span>
            </h2>
            <p className="text-[var(--text-secondary)]">
              Empieza gratis. Escala cuando lo necesites.
            </p>
          </div>
          <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
            <PricingCard
              name="Freemium"
              price="Gratis"
              description="7 dias de prueba con todo incluido"
              features={[
                "7 dias gratis con funciones Pro",
                "1 agente activo",
                "1 canal (Telegram o WhatsApp)",
                "100 mensajes/dia",
                "Trae tu propia API key",
                "Chat web incluido",
              ]}
            />
            <PricingCard
              name="Pro"
              price="$15.000"
              description="Para negocios en crecimiento"
              features={[
                "Agentes ilimitados",
                "Canales ilimitados",
                "Mensajes ilimitados",
                "Cron jobs y webhooks",
                "Memory & RAG",
                "Browser automation",
                "Custom skills",
                "Soporte prioritario",
              ]}
              highlighted
            />
          </div>
          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            Precios en pesos argentinos (ARS). Pago seguro con Mercado Pago.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-3xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Listo para <span className="gradient-text">automatizar</span>?
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-[var(--text-secondary)]">
            Registrate, configura tu API key y conecta tu primer canal en menos
            de 5 minutos.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-[var(--accent-secondary)]"
          >
            Crear cuenta gratis
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-primary)] px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-[var(--accent-primary)]" />
            <span className="font-semibold">
              Open<span className="gradient-text">Claw</span>
            </span>
            <span className="text-sm text-[var(--text-muted)]">
              powered by Spark101
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            2026 Spark101. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
