"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LoginSchema, type LoginInput } from "@/validators/auth.schema";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/auth-layout";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      keepSignedIn: true,
    },
  });

  const onSubmit = async (values: LoginInput) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast.error(error.message || "Failed to sign in. Check your credentials.");
        return;
      }

      // Check MFA requirement
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.nextLevel === "aal2" && aalData.currentLevel !== "aal2") {
        toast.info("Two-Factor Authentication required.");
        router.push("/two-factor");
        return;
      }

      toast.success("Welcome back to DataZen!");
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Welcome back
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Sign in to track your usage, cut waste, and protect your daily data quota.
        </p>
      </div>

      {/* OAuth Buttons */}
      <div className="space-y-3">
        <div className="relative group">
          <button
            type="button"
            disabled
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-400 dark:text-neutral-500 cursor-not-allowed font-medium text-sm transition-all"
          >
            <svg className="w-4 h-4 opacity-70" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all text-[11px] font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 py-1 px-2.5 rounded shadow-lg pointer-events-none">
            Coming soon
          </span>
        </div>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
          <span className="bg-white dark:bg-neutral-950 px-3 text-xs uppercase tracking-wider text-neutral-400 font-medium">
            or sign in with email
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            Email address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            {...register("email")}
            disabled={isLoading}
            className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
              errors.email
                ? "border-red-500 focus:ring-red-500"
                : "border-neutral-200 dark:border-neutral-800"
            }`}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
              disabled={isLoading}
              className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                errors.password
                  ? "border-red-500 focus:ring-red-500"
                  : "border-neutral-200 dark:border-neutral-800"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="keepSignedIn"
            {...register("keepSignedIn")}
            className="w-4 h-4 rounded text-teal-600 border-neutral-300 dark:border-neutral-700 focus:ring-teal-500 cursor-pointer"
          />
          <label
            htmlFor="keepSignedIn"
            className="text-xs text-neutral-600 dark:text-neutral-400 select-none cursor-pointer"
          >
            Keep me signed in on this device
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-teal-700/20 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign in</span>
          )}
        </button>
      </form>

      {/* Footer switcher */}
      <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
        New to DataZen?{" "}
        <Link
          href="/signup"
          className="font-semibold text-teal-600 dark:text-teal-400 hover:underline"
        >
          Create a free account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <React.Suspense fallback={<div className="py-12 text-center text-sm text-neutral-400">Loading sign in...</div>}>
        <LoginForm />
      </React.Suspense>
    </AuthLayout>
  );
}
