'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
  CreditCard,
  Coins,
  LogOut,
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();

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

  return (
    <aside className="fixed top-0 right-0 w-72 h-screen z-30 flex flex-col justify-between p-5 overflow-y-auto bg-[#030712]/75 backdrop-blur-3xl border-l border-white/12 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),-12px_0_40px_rgba(0,0,0,0.7)]">
      {/* Brand Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="relative w-11 h-11 rounded-2xl bg-black/60 border border-amber-400/40 p-1 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Image
              src="/bg_logo.png"
              alt="TehranRoom Logo"
              width={38}
              height={38}
              className="object-contain"
            />
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

        {/* Navigation Menu */}
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
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    isActive ? 'bg-black/20 text-slate-950' : 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & External Link */}
      <div className="pt-4 border-t border-white/10 space-y-2.5">
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          className="w-full py-2.5 rounded-xl clearmorph-card text-xs font-bold text-neutral-200 hover:text-white flex items-center justify-center gap-2 transition-all hover:border-amber-400/40"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>مشاهده سایت عمومی</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">tehranroom.com</span>
        </a>

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
  );
}
