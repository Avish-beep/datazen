"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Copy, Check, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface TwoFactorSetupProps {
  onSuccess?: () => void;
}

export function TwoFactorSetup({ onSuccess }: TwoFactorSetupProps) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(true);

  useEffect(() => {
    async function enrollFactor() {
      setIsEnrolling(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "DataZen Authenticator",
        });

        if (error) {
          toast.error(error.message || "Failed to initiate 2FA enrollment");
          return;
        }

        setFactorId(data.id);
        setSecret(data.totp.secret);

        const url = await QRCode.toDataURL(data.totp.uri);
        setQrCodeUrl(url);
      } catch (err: any) {
        toast.error(err?.message || "Failed to load 2FA setup");
      } finally {
        setIsEnrolling(false);
      }
    }

    enrollFactor();
  }, []);

  const handleCopySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success("Secret copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || code.length !== 6) return;

    setIsLoading(true);
    try {
      const supabase = createClient();
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) {
        toast.error(challenge.error.message);
        return;
      }

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code,
      });

      if (verify.error) {
        toast.error(verify.error.message || "Invalid verification code");
        return;
      }

      toast.success("Two-Factor Authentication successfully enabled!");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (isEnrolling) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-sm text-neutral-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
        <span>Generating secure authentication factor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            Set up Two-Factor Authentication
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Scan this QR code with Google Authenticator, 1Password, or Authy.
          </p>
        </div>
      </div>

      {qrCodeUrl && (
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-neutral-200 dark:border-neutral-800 w-fit mx-auto shadow-sm">
          <img src={qrCodeUrl} alt="2FA QR Code" className="w-44 h-44 rounded" />
        </div>
      )}

      {secret && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Manual Secret Entry
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={secret}
              className="flex-1 font-mono text-xs px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 select-all"
            />
            <button
              type="button"
              onClick={handleCopySecret}
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
              title="Copy secret"
            >
              {copied ? <Check className="w-4 h-4 text-teal-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            Verification Code
          </label>
          <input
            type="text"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full text-center tracking-widest font-mono text-lg py-2.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <span>Confirm & Enable 2FA</span>
          )}
        </button>
      </form>
    </div>
  );
}
