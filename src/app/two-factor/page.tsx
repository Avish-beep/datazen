"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function TwoFactorPage() {
  const router = useRouter();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Find enrolled verified factor on load
  useEffect(() => {
    async function loadFactors() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;

        const totp = data?.totp?.find((f) => f.status === "verified");
        if (totp) {
          setFactorId(totp.id);
        } else {
          // If no verified factor, fallback or redirect
          toast.error("No verified Two-Factor factor found");
        }
      } catch (err: any) {
        toast.error(err?.message || "Error reading 2FA settings");
      }
    }

    loadFactors();
  }, []);

  // Focus first input automatically
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    const next = [...digits];
    next[index] = clean[clean.length - 1]; // take last char
    setDigits(next);

    // Auto-advance
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else {
      // If last box entered, trigger auto-submit if full
      const fullCode = next.join("");
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);

    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();

    if (pasted.length === 6) {
      verifyCode(pasted);
    }
  };

  const verifyCode = async (codeString: string) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      let fId = factorId;

      if (!fId) {
        const { data } = await supabase.auth.mfa.listFactors();
        const totp = data?.totp?.find((f) => f.status === "verified");
        if (totp) {
          fId = totp.id;
        }
      }

      if (!fId) {
        toast.error("Could not locate verified 2FA factor. Please sign in again.");
        return;
      }

      const challenge = await supabase.auth.mfa.challenge({ factorId: fId });
      if (challenge.error) {
        toast.error(challenge.error.message);
        return;
      }

      const verify = await supabase.auth.mfa.verify({
        factorId: fId,
        challengeId: challenge.data.id,
        code: codeString,
      });

      if (verify.error) {
        toast.error(verify.error.message || "Invalid 6-digit code. Please try again.");
        // clear inputs
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      toast.success("Identity verified successfully!");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length === 6) {
      verifyCode(code);
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

        <div className="space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Two-Factor Auth
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Enter the 6-digit code from your authenticator app to verify your identity.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* 6 separate boxes */}
          <div className="flex items-center justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl font-bold rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || digits.join("").length !== 6}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-teal-700/20 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying code...</span>
              </>
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
          Lost access to your authenticator? Contact support for identity recovery.
        </p>
      </div>
    </AuthLayout>
  );
}
