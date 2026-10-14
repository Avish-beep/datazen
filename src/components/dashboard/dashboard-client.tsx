"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, ShieldAlert, Sparkles, Smartphone, BarChart3, Database } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { TwoFactorSetup } from "@/components/auth/two-factor-setup";

interface DashboardClientProps {
  userEmail: string;
  userId: string;
}

export function DashboardClient({ userEmail, userId }: DashboardClientProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to log out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size={32} />

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-neutral-200 dark:border-neutral-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isLoggingOut ? "Signing out..." : "Log out"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-10 w-full flex-1 space-y-8">
        {/* User Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <User className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">Active Account</h1>
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/60 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 font-mono">
                {userEmail}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShow2FASetup(!show2FASetup)}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{show2FASetup ? "Hide 2FA Setup" : "Configure 2FA (TOTP)"}</span>
          </button>
        </div>

        {/* 2FA Setup Component Panel */}
        {show2FASetup && (
          <div className="pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <TwoFactorSetup onSuccess={() => setShow2FASetup(false)} />
          </div>
        )}

        {/* Quick Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">API Sync Active</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Your Android client can sync daily totals directly to <code className="font-mono text-teal-600 dark:text-teal-400">/api/v1/usage/sync</code>.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Device Management</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Register mobile handsets with custom quotas and track per-device consumption rates.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Depletion Predictions</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Live algorithmic forecasting warns you hours before your daily or monthly limit expires.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6 text-center text-xs text-neutral-400">
        DataZen v1.0 • Connected to Supabase & Vercel
      </footer>
    </div>
  );
}
