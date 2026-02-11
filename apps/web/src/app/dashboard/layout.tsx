"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  MessageSquare,
  Settings,
  Send,
  LogOut,
  Menu,
  X,
  Crown,
  Brain,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Bot },
  { href: "/dashboard/agent", label: "Mi Agente", icon: Brain },
  { href: "/dashboard/chat", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/telegram", label: "Telegram", icon: Send },
  { href: "/dashboard/settings", label: "API Keys", icon: Settings },
  { href: "/dashboard/plan", label: "Mi Plan", icon: Crown },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(
    null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
      } else {
        setUser({
          email: user.email,
          name: user.user_metadata?.full_name,
        });
      }
    });
  }, [router, supabase.auth]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (!user) {return null;}

  return (
    <div className="flex min-h-screen">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] p-2 md:hidden"
      >
        {sidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--border-primary)] bg-[var(--bg-secondary)] transition-transform md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 border-b border-[var(--border-primary)] px-6 py-5">
          <Bot className="h-6 w-6 text-[var(--accent-primary)]" />
          <span className="text-lg font-bold">
            Open<span className="gradient-text">Claw</span>
          </span>
        </div>

        <nav className="flex-1 px-3 py-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "mb-1 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-[var(--accent-glow)] text-[var(--accent-primary)] font-medium"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border-primary)] px-3 py-4">
          <div className="mb-3 px-4">
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
              {user.name || "Usuario"}
            </p>
            <p className="truncate text-xs text-[var(--text-muted)]">
              {user.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card)] hover:text-[var(--error)]"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
