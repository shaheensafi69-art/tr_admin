'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  ClipboardPaste,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [accessKey, setAccessKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setAccessKey(text.trim());
        setError('');
      }
    } catch {
      // Clipboard permission denied or unavailable
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = accessKey.trim();
    if (!clean) {
      setError('لطفاً کلید امنیتی اختصاصی خود را وارد نمایید.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey: clean }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'کلید امنیتی وارد شده نامعتبر است.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 700);
    } catch (err: any) {
      setError('خطا در برقراری ارتباط با سرور احراز هویت.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Dynamic Ambient Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 -right-20 w-[35rem] h-[35rem] bg-amber-500/[0.08] rounded-full blur-[140px]" />
        <div className="absolute -bottom-20 -left-20 w-[35rem] h-[35rem] bg-indigo-500/[0.06] rounded-full blur-[160px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-emerald-500/[0.03] rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:28px_28px] opacity-80" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Glow Card */}
        <div className="glass-panel-dark rounded-3xl border border-amber-400/30 p-7 sm:p-9 shadow-[0_25px_60px_rgba(0,0,0,0.95),inset_0_1.5px_1px_rgba(255,255,255,0.25)] space-y-7 relative">
          {/* Logo & Header */}
          <div className="text-center space-y-3">
            <div className="relative inline-block">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-black/70 border border-amber-400/50 p-2.5 flex items-center justify-center shadow-xl shadow-amber-500/20 group">
                <Image
                  src="/bg_logo.png"
                  alt="TehranRoom Admin"
                  width={48}
                  height={48}
                  className="object-contain drop-shadow"
                  priority
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
                <KeyRound className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center justify-center gap-1.5">
                ورود به پنل مدیریت <span className="text-amber-400">تهران‌روم</span>
              </h1>
              <p className="text-xs text-neutral-400 mt-1 font-medium">
                سامانه ورود یکپارچه با کلید دسترسی فوق‌امنیتی (Master Key)
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2 text-right">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="master-key" className="font-bold text-neutral-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>کلید اختصاصی مدیریت:</span>
                </label>
                <button
                  type="button"
                  onClick={handlePaste}
                  className="text-[11px] text-amber-400/90 hover:text-amber-300 font-bold flex items-center gap-1 bg-amber-400/10 hover:bg-amber-400/20 px-2 py-0.5 rounded-lg transition-all"
                  tabIndex={-1}
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>الصاق کلید (Paste)</span>
                </button>
              </div>

              <div className="relative">
                <input
                  id="master-key"
                  type={showKey ? 'text' : 'password'}
                  value={accessKey}
                  onChange={(e) => {
                    setAccessKey(e.target.value);
                    if (error) setError('');
                  }}
                  autoFocus
                  placeholder="کلید امنیتی را وارد نمایید (TR-MASTER-...)"
                  className="w-full glass-input pr-4 pl-12 py-3 rounded-2xl text-xs sm:text-sm font-mono tracking-wider font-bold text-white placeholder:text-neutral-500 placeholder:font-sans placeholder:tracking-normal focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20 transition-all text-left"
                  dir="ltr"
                  disabled={loading || success}
                />

                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1 rounded-lg transition-colors"
                  tabIndex={-1}
                  aria-label={showKey ? 'مخفی‌سازی کلید' : 'نمایش کلید'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error / Success Alerts */}
            {error && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>کلید امنیتی تایید شد؛ در حال انتقال به داشبورد مدیریت...</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${
                success
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-slate-950 hover:brightness-110 shadow-amber-500/25'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>در حال اعتبارسنجی امنیتی کلید...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>دسترسی مجاز — ورود به پنل</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>ورود امن به پنل مدیریت</span>
                  <ArrowLeft className="w-4 h-4 mr-1" />
                </>
              )}
            </button>
          </form>

          {/* Security Badge */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400">
            <span className="flex items-center gap-1.5 text-neutral-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>پروتکل امنیتی HMAC-SHA256</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-500">v3.2 Secure Engine</span>
          </div>
        </div>

        {/* Outer Help note */}
        <p className="text-center text-[11px] text-neutral-500 mt-4">
          کلید دسترسی صرفاً در اختیار مدیریت ارشد هتل قرار دارد.
        </p>
      </div>
    </div>
  );
}
