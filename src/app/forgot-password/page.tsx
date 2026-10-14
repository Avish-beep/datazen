"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { ForgotPasswordSchema, type ForgotPasswordInput } from "@/validators/auth.schema";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "https://datazen-nine.vercel.app";
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message || "Failed to send reset email");
        return;
      }

      setIsSubmitted(true);
      toast.success("Password reset instructions sent!");
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to sign in</span>
        </Link>

        {isSubmitted ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <MailCheck className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Check your inbox
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                We sent a password reset link to <strong className="text-neutral-900 dark:text-white">{getValues("email")}</strong>. Click the link to choose a new password.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
              >
                Didn't receive the email? Try again
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                Forgot password?
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No worries! Enter your account's email address and we'll send you recovery instructions.
              </p>
            </div>

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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-teal-700/20 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending instructions...</span>
                  </>
                ) : (
                  <span>Send reset instructions</span>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
