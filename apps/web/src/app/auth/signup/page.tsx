"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="mb-4 inline-flex rounded-2xl bg-[var(--accent-glow)] p-4">
            <Mail className="h-8 w-8 text-[var(--accent-primary)]" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Revisa tu email</h1>
          <p className="mb-6 text-[var(--text-secondary)]">
            Te enviamos un link de confirmacion a <strong>{email}</strong>.
            Hace click para activar tu cuenta.
          </p>
          <Link
            href="/auth/login"
            className="text-sm font-medium text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]"
          >
            Ir al login
          </Link>
        </div>
      </div>
    );
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
          <h1 className="mt-4 text-2xl font-bold">Crea tu cuenta</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Empieza a desplegar tus agentes IA en minutos
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-[var(--error)] bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm text-[var(--text-secondary)]">
              Nombre
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--border-accent)] focus:outline-none"
                placeholder="Tu nombre"
                required
              />
            </div>
          </div>

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
                placeholder="Minimo 6 caracteres"
                minLength={6}
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
                Crear cuenta
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Ya tenes cuenta?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]"
          >
            Inicia sesion
          </Link>
        </p>
      </div>
    </div>
  );
}
