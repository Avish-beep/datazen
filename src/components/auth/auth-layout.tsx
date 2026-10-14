import React from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AuthShowcasePanel } from "./auth-showcase-panel";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen w-full flex flex-col justify-between bg-white dark:bg-neutral-950 transition-colors">
      {/* Top Mobile/Desktop bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/login" className="flex items-center gap-2 group">
          <Logo size={34} />
        </Link>
        <ThemeToggle />
      </header>

      {/* Main split-screen container */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Form Column */}
        <div className="w-full max-w-md mx-auto lg:col-span-6 xl:col-span-5 py-4">
          {children}
        </div>

        {/* Right Showcase Column (Hidden on mobile) */}
        <div className="hidden lg:block lg:col-span-6 xl:col-span-7 h-full max-h-[820px] p-2">
          <AuthShowcasePanel />
        </div>
      </div>

      {/* Universal Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-900">
        <p>© {new Date().getFullYear()} DataZen Systems. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
            Terms of Service
          </Link>
          <Link href="/api/v1/health" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
            System Status
          </Link>
        </div>
      </footer>
    </main>
  );
}
