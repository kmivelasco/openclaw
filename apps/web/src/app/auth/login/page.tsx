"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2">
            <Bot className="h-8 w-8 text-[var(--accent-primary)]" />
            <span className="text-2xl font-bold">
              Open<span className="gradient-text">Claw</span>
            </span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Bienvenido de vuelta</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Ingresa a tu cuenta para acceder a tus agentes
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-[var(--error)] bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm text-[var(--text-secondary)]">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--border-accent)] focus:outline-none"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-[var(--text-secondary)]">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--border-accent)] focus:outline-none"
                placeholder="Tu password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--accent-secondary)] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Iniciar sesion
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          No tenes cuenta?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]"
          >
            Registrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
