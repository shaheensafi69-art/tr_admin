'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck2,
  Hotel,
  BedDouble,
  Home,
  CalendarDays,
  Users,
  MessageSquare,
  Settings,
  ExternalLink,
  ShieldCheck,
  Menu,
  X,
  CreditCard,
  Coins,
  Sparkles,
  LogOut,
} from 'lucide-react';

const menuItems = [
  { href: '/', label: 'داشبورد مدیریت', icon: LayoutDashboard },
  { href: '/bookings', label: 'مدیریت رزرواسیون‌ها', icon: CalendarCheck2, badge: 'زنده' },
  { href: '/finance', label: 'امور مالی و حسابداری', icon: Coins, badge: 'جدید' },
  { href: '/hotels', label: 'اطلاعات هتل‌ها', icon: Hotel },
  { href: '/rooms', label: 'اتاق‌ها و قیمت‌گذاری', icon: BedDouble },
  { href: '/villas', label: 'ویلا و آپارتمان‌ها', icon: Home, badge: 'جدید' },
  { href: '/availability', label: 'تقویم موجودی و مسدودی', icon: CalendarDays },
  { href: '/customers', label: 'مشتریان و مسافران', icon: Users },
  { href: '/reviews', label: 'نظرات مسافران', icon: MessageSquare },
  { href: '/settings', label: 'تنظیمات و حساب بانکی', icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // If on login page, render clean full screen without shell
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen relative flex flex-col lg:flex-row bg-[#030712] text-slate-100 antialiased selection:bg-amber-400 selection:text-black">
      {/* ====================================================================
          AMBIENT CLEARMORPHISM LIGHTING MESH (Fixed in background)
         ==================================================================== */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden print:hidden">
        {/* Amber / Gold subtle aura (Top Right) */}
        <div className="absolute -top-32 right-10 w-[34rem] h-[34rem] bg-amber-500/[0.09] rounded-full blur-[140px]" />
        {/* Cyan / Sky subtle aura (Center Left) */}
        <div className="absolute top-1/4 -left-20 w-[32rem] h-[32rem] bg-sky-500/[0.06] rounded-full blur-[160px]" />
        {/* Emerald subtle aura (Bottom Center) */}
        <div className="absolute -bottom-28 right-1/4 w-[38rem] h-[38rem] bg-emerald-500/[0.05] rounded-full blur-[180px]" />
        {/* Indigo / Purple subtle aura (Center Right) */}
        <div className="absolute top-2/3 right-1/3 w-[26rem] h-[26rem] bg-indigo-500/[0.05] rounded-full blur-[150px]" />
        {/* Micro-dot clearmorphic grid texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:28px_28px] opacity-75" />
      </div>

      {/* ====================================================================
          1. MOBILE TOP NAVBAR (Visible only on lg:hidden)
         ==================================================================== */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#030712]/75 backdrop-blur-2xl border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-lg shadow-black/50 print:hidden">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-amber-400 active:scale-95 transition-all border border-white/10 shadow-sm"
            aria-label="باز کردن منو"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-xl bg-black/60 border border-amber-400/40 p-1 flex items-center justify-center shadow-md shadow-amber-500/20">
              <Image src="/bg_logo.png" alt="Logo" width={28} height={28} className="object-contain" />
            </div>
            <div className="text-sm font-black text-white flex items-center gap-1">
              تهران<span className="text-amber-400">روم</span>
              <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded shadow-sm">
                ادمین
              </span>
            </div>
          </div>
        </div>

        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-bold text-neutral-200 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 transition-all shadow-sm"
        >
          <span>سایت اصلی</span>
          <ExternalLink className="w-3 h-3 text-amber-400" />
        </a>
      </header>

      {/* ====================================================================
          2. MOBILE SLIDE-OVER DRAWER (Visible on open)
         ==================================================================== */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop with frosted blur */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Menu (Clearmorphic frosted panel) */}
          <div className="relative w-72 max-w-[85vw] bg-[#030712]/90 backdrop-blur-3xl border-l border-white/15 flex flex-col justify-between p-5 min-h-screen z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),-15px_0_50px_rgba(0,0,0,0.9)] overflow-y-auto">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-9 h-9 rounded-2xl bg-black/60 border border-amber-400/40 p-1 flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <Image src="/bg_logo.png" alt="Logo" width={30} height={30} className="object-contain" />
                  </div>
                  <div>
                    <div className="text-base font-black text-white">
                      تهران<span className="text-amber-400">روم</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 block font-medium">پنل مدیریت هتل</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1.5">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow-[0_4px_20px_rgba(234,179,8,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] scale-[1.02]'
                          : 'text-neutral-300 hover:text-white hover:bg-white/[0.06] hover:border hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                            isActive
                              ? 'bg-black/20 text-slate-950'
                              : 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج از پنل مدیریت</span>
              </button>
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl clearmorph-card text-xs font-bold text-neutral-300 hover:text-white flex items-center justify-center gap-1.5"
              >
                <span>مشاهده سایت اصلی</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              </a>
              <div className="text-center text-[10px] text-neutral-500">
                سامانه هوشمند رزرواسیون تهران‌روم
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          3. DESKTOP PERMANENT FIXED SIDEBAR (IMMOBILE WITH SCROLLING)
             - fixed top-0 right-0 h-screen: DOES NOT SCROLL WITH PAGE!
             - Pure Clearmorphism: Frosted acrylic, inner highlight, high blur
         ==================================================================== */}
      <aside className="hidden lg:flex fixed top-0 right-0 w-72 h-screen z-30 flex-col justify-between p-5 overflow-y-auto bg-[#030712]/75 backdrop-blur-3xl border-l border-white/12 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),-12px_0_40px_rgba(0,0,0,0.7)] print:hidden">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="relative w-11 h-11 rounded-2xl bg-black/60 border border-amber-400/40 p-1 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Image src="/bg_logo.png" alt="TehranRoom Logo" width={38} height={38} className="object-contain" />
            </div>
            <div>
              <div className="text-lg font-black text-white flex items-center gap-1">
                تهران<span className="text-amber-400">روم</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-md mr-1 shadow-sm">
                  ادمین
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 block font-medium">
                سامانه هوشمند رزرواسیون هتل‌ها
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow-[0_4px_20px_rgba(234,179,8,0.35),inset_0_1px_1px_rgba(255,255,255,0.5)] scale-[1.02]'
                      : 'text-neutral-300 hover:text-white hover:bg-white/[0.05] hover:border hover:border-white/10 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        isActive
                          ? 'bg-black/20 text-slate-950'
                          : 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-white/10 space-y-2.5">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/25 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج از حساب مدیریت</span>
          </button>

          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 rounded-xl clearmorph-card text-xs font-bold text-neutral-200 hover:text-white flex items-center justify-center gap-2 transition-all hover:border-amber-400/40"
          >
            <span>مشاهده وب‌سایت اصلی</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </a>

          {/* Connection Status Box */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-[10px] space-y-0.5">
              <span className="font-bold text-neutral-200 block">سیستم رزرواسیون فعال</span>
              <span className="text-neutral-400 block font-mono">ربات و پنل آنلاین تهران‌روم</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ====================================================================
          4. MAIN CONTENT AREA
             - lg:mr-72 ensures content starts exactly after the 72 (18rem) fixed sidebar!
             - Independent smooth scroll, never scrolls the sidebar!
             - NO relative z-10 so that child modals (fixed inset-0 z-[100]) are never trapped under the sidebar!
         ==================================================================== */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen lg:mr-72 print:mr-0 print:p-0">
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
