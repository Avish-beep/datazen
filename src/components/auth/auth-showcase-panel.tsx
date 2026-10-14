"use client";

import React from "react";
import { Sparkles, ArrowUpRight, ShieldCheck, Zap } from "lucide-react";

export function AuthShowcasePanel() {
  return (
    <div className="relative w-full h-full min-h-[620px] rounded-[2rem] overflow-hidden p-8 lg:p-12 flex flex-col justify-between bg-gradient-to-br from-teal-950 via-slate-900 to-teal-900 text-white shadow-2xl border border-teal-800/30">
      {/* Background ambient glow & soft dynamic wave shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <svg
          className="absolute inset-0 w-full h-full opacity-10"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 800 800"
          fill="none"
        >
          <path
            d="M-100 300 C 150 150, 350 450, 600 300 C 750 200, 850 350, 1000 250"
            stroke="url(#teal-grad)"
            strokeWidth="3"
          />
          <path
            d="M-100 450 C 150 300, 350 600, 600 450 C 750 350, 850 500, 1000 400"
            stroke="url(#teal-grad)"
            strokeWidth="2"
          />
          <defs>
            <linearGradient id="teal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14B8A6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Top Header Section with Beta Pill */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-teal-200 tracking-wide transition-all shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-teal-300" />
          <span>Free during beta</span>
        </div>

        <div className="text-xs text-neutral-400 font-mono tracking-wider">
          v1.0 • PHASE 1
        </div>
      </div>

      {/* Middle Interactive Dashboard Preview Card */}
      <div className="relative z-10 my-auto py-8">
        <div className="relative mx-auto max-w-sm rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/15 p-6 shadow-2xl hover:border-teal-400/40 transition-all duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-400">Daily Quota Plan</p>
                <p className="text-sm font-semibold text-white">1,500 MB / day</p>
              </div>
            </div>
            <span className="inline-flex items-center text-xs font-medium text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
              Active
            </span>
          </div>

          {/* Usage ring & stats */}
          <div className="pt-6 pb-2 flex items-center justify-between gap-6">
            <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-neutral-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-teal-400 transition-all duration-1000 ease-out"
                  strokeDasharray="68, 100"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-base font-bold text-white tracking-tight">68%</span>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Used</span>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs text-neutral-400">Remaining Today</p>
                <p className="text-xl font-bold text-teal-300">480 MB</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-300">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                <span>Zero waste predicted</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
            <span>Forecasted depletion</span>
            <span className="font-mono text-neutral-200">23:45 tonight</span>
          </div>
        </div>
      </div>

      {/* Bottom Bold Mission Statement */}
      <div className="relative z-10 space-y-2">
        <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
          Use every MB you pay for.
        </h2>
        <p className="text-sm lg:text-base text-neutral-300 font-normal leading-relaxed max-w-md">
          Prevent unused daily allowances from expiring unnoticed with automated usage sync and depletion forecasting.
        </p>
      </div>
    </div>
  );
}
