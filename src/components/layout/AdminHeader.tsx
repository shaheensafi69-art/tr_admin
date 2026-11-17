'use client';

import React from 'react';
import { RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function AdminHeader({
  title,
  subtitle,
  onRefresh,
  isLoading = false,
}: AdminHeaderProps) {
  return (
    <header className="glass-panel rounded-3xl p-5 sm:p-6 mb-6 sm:mb-8 border border-white/12 shadow-[0_15px_35px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.12] text-neutral-200 hover:text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border border-white/12 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>به‌روزرسانی اطلاعات</span>
          </button>
        )}

        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-[inset_0_1px_1px_rgba(16,185,129,0.2)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>اتصال زنده به Supabase</span>
        </div>
      </div>
    </header>
  );
}
