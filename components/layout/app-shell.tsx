"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { BarChart3, Inbox, LayoutDashboard, LogOut, Moon, Plus, Sun } from "lucide-react";
import { useEffect, useTransition } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loader";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data } = useSession();
  const pathname = usePathname();
  const [isSigningOut, startSignOut] = useTransition();

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    const shouldUseDark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;

    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    window.localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/tickets" className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-900 text-xs text-white dark:bg-white dark:text-slate-950">IT</span>
            Insurance Tracker
          </Link>
          <nav className="flex items-center gap-1">
            <LinkButton href="/tickets" variant={pathname === "/tickets" ? "secondary" : "ghost"} size="sm">
              <LayoutDashboard className="h-4 w-4" />
              Board
            </LinkButton>
            <LinkButton href="/my-tickets" variant={pathname === "/my-tickets" ? "secondary" : "ghost"} size="sm">
              <Inbox className="h-4 w-4" />
              My
            </LinkButton>
            <LinkButton href="/analytics" variant={pathname === "/analytics" ? "secondary" : "ghost"} size="sm">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </LinkButton>
            <LinkButton href="/tickets/new" variant={pathname === "/tickets/new" ? "primary" : "secondary"} size="sm">
              <Plus className="h-4 w-4" />
              New
            </LinkButton>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              <Sun className="hidden h-4 w-4 dark:block" />
              <Moon className="h-4 w-4 dark:hidden" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={isSigningOut}
              onClick={() => startSignOut(() => void signOut({ callbackUrl: "/login" }))}
              aria-label="Sign out"
            >
              {isSigningOut ? <Spinner /> : <LogOut className="h-4 w-4" />}
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      <div className="fixed bottom-3 right-3 hidden rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:block">
        {data?.user?.name ?? data?.user?.email}
      </div>
    </div>
  );
}
