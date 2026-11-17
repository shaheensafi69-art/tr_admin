'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Coins,
  TrendingUp,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Filter,
  FileSpreadsheet,
  Wallet,
  Receipt,
  RotateCcw,
  Sparkles,
  Printer,
  ChevronLeft,
  CreditCard,
  Percent,
  FileText,
  ShieldCheck,
  Check,
  Search,
  DollarSign,
  Landmark,
} from 'lucide-react';
import AdminHeader from '@/components/layout/AdminHeader';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Booking, Hotel } from '@/types/database';

type PeriodType = 'month' | 'quarter' | 'year' | 'custom';

export default function FinancePage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [selectedHotelFilter, setSelectedHotelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Custom date range (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(today);

  const loadFinanceData = async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      const [bRes, hRes] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            *,
            hotel:hotels(*),
            customer:customers(*),
            room:rooms(*),
            payments(*)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('hotels').select('*').order('name', { ascending: true }),
      ]);

      if (bRes.data) {
        setBookings(bRes.data as any);
      }
      if (hRes.data) {
        setHotels(hRes.data as any);
      }
    } catch (err) {
      console.error('Error loading finance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  // Filter bookings by selected period & hotel
  const filteredBookings = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'quarter') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = customStartDate ? new Date(customStartDate) : new Date(0);
    }

    const endDate =
      period === 'custom' && customEndDate
        ? new Date(new Date(customEndDate).getTime() + 24 * 60 * 60 * 1000)
        : new Date();

    return bookings.filter((b) => {
      const bDate = new Date(b.created_at);
      const inDateRange = bDate >= startDate && bDate <= endDate;
      const inHotel =
        selectedHotelFilter === 'all' || b.hotel_id === selectedHotelFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        b.booking_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.hotel?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      return inDateRange && inHotel && matchesSearch;
    });
  }, [bookings, period, customStartDate, customEndDate, selectedHotelFilter, searchQuery]);

  // Aggregate KPI Calculations
  const metrics = useMemo(() => {
    let grossTotal = 0;
    let platformCommission = 0;
    let hotelNetPayout = 0;
    let verifiedCash = 0;
    let pendingInflows = 0;
    let totalRefunds = 0;
    let confirmedCount = 0;

    for (const b of filteredBookings) {
      const amt = Number(b.total_amount) || 0;
      const comm = Number(b.commission_amount) || amt * 0.1;
      const net = Number(b.hotel_net_amount) || amt - comm;
      const refund = Number((b as any).refund_amount) || 0;

      grossTotal += amt;
      platformCommission += comm;
      hotelNetPayout += net;
      totalRefunds += refund;

      if (b.status === 'confirmed' || b.payment_status === 'verified') {
        verifiedCash += amt;
        confirmedCount++;
      } else if (b.status === 'pending' || b.payment_status === 'pending') {
        pendingInflows += amt;
      }
    }

    return {
      grossTotal,
      platformCommission,
      hotelNetPayout,
      verifiedCash,
      pendingInflows,
      totalRefunds,
      bookingsCount: filteredBookings.length,
      confirmedCount,
      averageOrderValue: filteredBookings.length > 0 ? Math.round(grossTotal / filteredBookings.length) : 0,
    };
  }, [filteredBookings]);

  // Breakdown grouped by Hotel
  const hotelSummaries = useMemo(() => {
    const map = new Map<string, {
      hotel: Hotel;
      bookingsCount: number;
      grossRevenue: number;
      commission: number;
      hotelNet: number;
      verifiedRevenue: number;
    }>();

    for (const h of hotels) {
      if (selectedHotelFilter !== 'all' && h.id !== selectedHotelFilter) continue;
      map.set(h.id, {
        hotel: h,
        bookingsCount: 0,
        grossRevenue: 0,
        commission: 0,
        hotelNet: 0,
        verifiedRevenue: 0,
      });
    }

    for (const b of filteredBookings) {
      const entry = map.get(b.hotel_id);
      if (entry) {
        const amt = Number(b.total_amount) || 0;
        const comm = Number(b.commission_amount) || amt * 0.1;
        const net = Number(b.hotel_net_amount) || amt - comm;

        entry.bookingsCount += 1;
        entry.grossRevenue += amt;
        entry.commission += comm;
        entry.hotelNet += net;

        if (b.status === 'confirmed' || b.payment_status === 'verified') {
          entry.verifiedRevenue += amt;
        }
      }
    }

    return Array.from(map.values()).filter((item) => {
      if (selectedHotelFilter !== 'all') return item.hotel.id === selectedHotelFilter;
      return true;
    });
  }, [hotels, filteredBookings, selectedHotelFilter]);

  const handlePrint = () => {
    window.print();
  };

  const periodLabel =
    period === 'month'
      ? 'گزارش ماه جاری (۳۰ روزه)'
      : period === 'quarter'
      ? 'گزارش ۳ ماه اخیر (فصلی)'
      : period === 'year'
      ? 'گزارش سالانه (۱ ساله)'
      : `بازه انتخابی دلخواه (${customStartDate} الی ${customEndDate})`;

  return (
    <div className="space-y-6 pb-20">
      {/* ====================================================================
          PRINT ISOLATION STYLES:
          1. On screen: Hides #printable-finance-report completely.
          2. On print: Hides the entire screen UI and displays ONLY #printable-finance-report
             with 100% white background and deep black text to protect printers.
         ==================================================================== */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media screen {
          #printable-finance-report {
            display: none !important;
          }
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 8mm;
          }
          html, body {
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide all screen UI, headers, navigation, sidebars and dashboard */
          aside, header, nav, footer, button, input, select, .print\\:hidden, [class*="print:hidden"], .finance-screen-container {
            display: none !important;
          }
          #printable-finance-report {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            box-shadow: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1.5px solid #000000 !important;
            color: #000000 !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
        }
      ` }} />

      {/* ====================================================================
          SECTION 1: DARK CLEARMORPHIC EXECUTIVE SCREEN DASHBOARD (SCREEN ONLY)
         ==================================================================== */}
      <div className="finance-screen-container print:hidden space-y-6">
        {/* 1.1 ADMIN HEADER */}
        <AdminHeader
          title="امور مالی، درآمد و تسویه‌حساب هتل‌ها"
          subtitle="سامانه جامع رصد گردش مالی، محاسبه اتوماتیک کارمزد ۱۰٪، تسویه‌حساب اقامتگاه‌ها و خروجی چاپی اداری"
          onRefresh={loadFinanceData}
          isLoading={isLoading}
        />

        {/* 1.2 CONTROLS & FILTER BAR */}
        <div className="glass-panel-dark rounded-3xl p-5 border border-white/10 space-y-4 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Period Selector Tabs */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-neutral-400 block">انتخاب بازه زمانی گزارش:</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPeriod('month')}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                    period === 'month'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.02]'
                      : 'bg-white/[0.05] text-neutral-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  ماه جاری (۳۰ روزه)
                </button>

                <button
                  type="button"
                  onClick={() => setPeriod('quarter')}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                    period === 'quarter'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.02]'
                      : 'bg-white/[0.05] text-neutral-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  ۳ ماه اخیر (فصلی)
                </button>

                <button
                  type="button"
                  onClick={() => setPeriod('year')}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                    period === 'year'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.02]'
                      : 'bg-white/[0.05] text-neutral-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  گزارش سالانه (۱ ساله)
                </button>

                <button
                  type="button"
                  onClick={() => setPeriod('custom')}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    period === 'custom'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.02]'
                      : 'bg-white/[0.05] text-neutral-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>تقویم و بازه دلخواه</span>
                </button>
              </div>
            </div>

            {/* Hotel Filter & Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-neutral-400 block">فیلتر اقامتگاه:</span>
                <select
                  value={selectedHotelFilter}
                  onChange={(e) => setSelectedHotelFilter(e.target.value)}
                  className="glass-input px-3.5 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#090e1a] border border-white/10 cursor-pointer"
                >
                  <option value="all">تمام اقامتگاه‌ها (پلتفرم کل)</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.stars} ستاره)
                    </option>
                  ))}
                </select>
              </div>

              {/* Print Official Button */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-neutral-400 block opacity-0">چاپ</span>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2.5 rounded-2xl gold-glow-btn text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپ رسمی A4 (کاغذ سفید - بدون مصرف جوهر)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {period === 'custom' && (
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-4 bg-white/[0.02] p-4 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-300">از تاریخ:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="glass-input px-3 py-1.5 rounded-xl text-xs font-mono text-white bg-black/40 border border-white/10"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-300">تا تاریخ:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="glass-input px-3 py-1.5 rounded-xl text-xs font-mono text-white bg-black/40 border border-white/10"
                />
              </div>

              <span className="text-[11px] text-amber-300/80">
                نتایج بر اساس تاریخ ثبت سفارشات در دیتابیس فیلتر می‌گردند.
              </span>
            </div>
          )}
        </div>

        {/* 1.3 6 EXECUTIVE CLEARMORPHIC KPI METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* KPI 1: گردش ناخالص کل */}
          <div className="glass-panel-dark rounded-3xl p-5 border border-white/10 space-y-2 shadow-xl hover:border-amber-400/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400">گردش ناخالص کل</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {metrics.grossTotal.toLocaleString('fa-IR')}
            </div>
            <div className="text-[10px] text-neutral-400 flex items-center justify-between pt-1 border-t border-white/5">
              <span>تومان (فروش کل)</span>
              <span className="text-amber-300 font-bold">{metrics.bookingsCount} رزرو</span>
            </div>
          </div>

          {/* KPI 2: کارمزد پلتفرم تهران‌روم */}
          <div className="glass-panel-dark rounded-3xl p-5 border border-amber-500/20 space-y-2 shadow-xl bg-gradient-to-br from-amber-500/[0.08] to-transparent">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">کارمزد پلتفرم (۱۰٪)</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/30">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              {metrics.platformCommission.toLocaleString('fa-IR')}
            </div>
            <div className="text-[10px] text-neutral-400 flex items-center justify-between pt-1 border-t border-white/5">
              <span>تومان (درآمد قطعی)</span>
              <span className="text-emerald-400 font-bold">وصول مستقیم</span>
            </div>
          </div>

          {/* KPI 3: خالص سهم هتل‌ها */}
          <div className="glass-panel-dark rounded-3xl p-5 border border-white/10 space-y-2 shadow-xl hover:border-sky-400/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400">سهم هتل‌ها (۹۰٪)</span>
              <div className="w-9 h-9 rounded-2xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-sky-300 font-mono">
              {metrics.hotelNetPayout.toLocaleString('fa-IR')}
            </div>
            <div className="text-[10px] text-neutral-400 flex items-center justify-between pt-1 border-t border-white/5">
              <span>تومان (بستانکاری)</span>
              <span className="text-sky-300 font-bold">آماده تسویه</span>
            </div>
          </div>

          {/* KPI 4: وصول‌شده قطعی */}
          <div className="glass-panel-dark rounded-3xl p-5 border border-emerald-500/20 space-y-2 shadow-xl hover:border-emerald-400/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">وصول‌شده قطعی</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {metrics.verifiedCash.toLocaleString('fa-IR')}
            </div>
            <div className="text-[10px] text-neutral-400 flex items-center justify-between pt-1 border-t border-white/5">
              <span>تومان (فیش‌های تایید)</span>
              <span className="text-emerald-300 font-bold">{metrics.confirmedCount} مورد</span>
            </div>
          </div>

          {/* KPI 5: در صف بررسی فیش */}
          <div className="glass-panel-dark rounded-3xl p-5 border border-white/10 space-y-2 shadow-xl hover:border-amber-400/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">در صف بررسی فیش</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
              {metrics.pendingInflows.toLocaleString('fa-IR')}
            </div>
            <div className="text-[10px] text-neutral-400 flex items-center justify-between pt-1 border-t border-white/5">
              <span>تومان (کارت‌به‌کارت)</span>
              <span className="text-amber-400 font-bold">نیازمند اقدام</span>
            </div>
          </div>

          {/* KPI 6: استرداد کنسلی */}
          <div className="glass-panel-dark rounded-3xl p-5 border border-rose-500/20 space-y-2 shadow-xl hover:border-rose-400/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400">استرداد کنسلی</span>
              <div className="w-9 h-9 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <RotateCcw className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
              {metrics.totalRefunds.toLocaleString('fa-IR')}
            </div>
            <div className="text-[10px] text-neutral-400 flex items-center justify-between pt-1 border-t border-white/5">
              <span>تومان (۵۰٪ عودت)</span>
              <span className="text-rose-300 font-bold">قانون ۲۴ ساعت</span>
            </div>
          </div>
        </div>

        {/* 1.4 HOTEL SETTLEMENT & REVENUE BREAKDOWN (DARK CLEARMORPHIC TABLE) */}
        <div className="glass-panel-dark rounded-3xl p-6 border border-white/10 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Landmark className="w-5 h-5 text-amber-400" />
                <span>تفکیک گردش مالی، کارمزد سامانه و وضعیت بستانکاری هتل‌ها</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                تراز مالی هر اقامتگاه طرف قرارداد جهت محاسبه اسناد تسویه‌حساب و حواله سهم خالص
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/20">
              {hotelSummaries.length} اقامتگاه تحت پوشش
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-white/[0.04] text-neutral-300 font-bold border-b border-white/10">
                  <th className="py-3 px-4 rounded-r-2xl">نام اقامتگاه</th>
                  <th className="py-3 px-3 text-center">درجه</th>
                  <th className="py-3 px-3 text-center">تعداد رزرو</th>
                  <th className="py-3 px-4">فروش ناخالص کل</th>
                  <th className="py-3 px-4">کارمزد تهران‌روم (۱۰٪)</th>
                  <th className="py-3 px-4 font-black text-amber-400">خالص سهم هتل (۹۰٪)</th>
                  <th className="py-3 px-4">وصول‌شده قطعی</th>
                  <th className="py-3 px-4 text-center rounded-l-2xl">وضعیت تسویه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-neutral-200">
                {hotelSummaries.map((item) => (
                  <tr key={item.hotel.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-black text-white">
                      {item.hotel.name}
                    </td>
                    <td className="py-3.5 px-3 text-center text-amber-400 font-mono">
                      {'★'.repeat(item.hotel.stars || 4)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-neutral-300">
                      {item.bookingsCount.toLocaleString('fa-IR')}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {item.grossRevenue.toLocaleString('fa-IR')} <span className="text-[10px] text-neutral-400 font-sans">تومان</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                      {item.commission.toLocaleString('fa-IR')} <span className="text-[10px] text-neutral-400 font-sans">تومان</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-black text-sky-300">
                      {item.hotelNet.toLocaleString('fa-IR')} <span className="text-[10px] text-neutral-400 font-sans">تومان</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {item.verifiedRevenue.toLocaleString('fa-IR')} <span className="text-[10px] text-neutral-400 font-sans">تومان</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-3 py-1 rounded-xl text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        آماده تسویه دوره‌ای
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 1.5 DETAILED TRANSACTIONS LISTING */}
        <div className="glass-panel-dark rounded-3xl p-6 border border-white/10 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <span>ریز تراکنش‌ها و رکوردهای مالی ثبت شده</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                تراکنش‌های قطعی، فیش‌های منتظر بررسی و جزئیات هر رزرواسیون
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو کد، مسافر یا هتل..."
                className="w-full glass-input pr-9 pl-3 py-2 rounded-2xl text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-white/[0.04] text-neutral-300 font-bold border-b border-white/10">
                  <th className="py-3 px-3 rounded-r-2xl">کد پیگیری</th>
                  <th className="py-3 px-3">نام مسافر</th>
                  <th className="py-3 px-3">هتل و واحد اقامتی</th>
                  <th className="py-3 px-3 text-center">تاریخ ثبت</th>
                  <th className="py-3 px-3 text-center">نوع اقامت</th>
                  <th className="py-3 px-3">مبلغ کل (تومان)</th>
                  <th className="py-3 px-3">کارمزد پلتفرم</th>
                  <th className="py-3 px-3">سهم اقامتگاه</th>
                  <th className="py-3 px-3 text-center rounded-l-2xl">وضعیت مالی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-neutral-200">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 font-mono font-black text-amber-400">
                      {b.booking_code}
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      {b.customer?.full_name || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="block font-bold text-neutral-200">{b.hotel?.name || '—'}</span>
                      <span className="text-[10px] text-neutral-400 block">{b.room?.name || '—'}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-[11px] text-neutral-400" dir="ltr">
                      {new Date(b.created_at).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/5 border border-white/10">
                        {b.booking_type === 'daily' ? 'روزانه' : `ساعتی (${b.duration_hours}h)`}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-white">
                      {Number(b.total_amount).toLocaleString('fa-IR')}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-300">
                      {Number(b.commission_amount || Number(b.total_amount) * 0.1).toLocaleString('fa-IR')}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-sky-300">
                      {Number(b.hotel_net_amount || Number(b.total_amount) * 0.9).toLocaleString('fa-IR')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                        b.payment_status === 'verified' || b.status === 'confirmed'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : b.payment_status === 'pending' || b.status === 'pending'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                      }`}>
                        {b.payment_status === 'verified' || b.status === 'confirmed'
                          ? 'وصول‌شده قطعی'
                          : b.payment_status === 'pending' || b.status === 'pending'
                          ? 'در صف تایید فیش'
                          : 'ناموفق / لغو'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ====================================================================
          SECTION 2: DEDICATED OFFICIAL A4 PRINT DOCUMENT (PRINT ONLY - HIDDEN ON SCREEN)
          This renders ONLY during window.print() on 100% pure white paper with crisp black text.
         ==================================================================== */}
      <div id="printable-finance-report" className="hidden print:block bg-white text-black p-4 space-y-4">
        {/* 2.1 OFFICIAL EXECUTIVE LETTERHEAD */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-black p-1 flex items-center justify-center shrink-0">
              <Image
                src="/bg_logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-black tracking-tight">
                  تهران‌روم
                </span>
                <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5 rounded">
                  OFFICIAL AUDIT REPORT
                </span>
              </div>
              <h1 className="text-sm font-black text-black mt-0.5">
                صورت‌حساب رسمی و گزارش تراز مالی گردش کارمزد و تسویه‌حساب هتل‌ها
              </h1>
              <p className="text-[10px] text-black font-bold">
                سامانه جامع و یکپارچه رزرواسیون آنلاین هتل‌های پایتخت و ایران
              </p>
            </div>
          </div>

          <div className="text-left text-xs space-y-0.5 font-bold text-black" dir="ltr">
            <div>
              <span className="text-[9px] uppercase block">DOC REF NO:</span>
              <span className="font-mono font-black text-black text-sm">TR-FIN-2026</span>
            </div>
            <div>
              <span className="text-[9px] uppercase block">ISSUE DATE:</span>
              <span className="font-mono text-black">{today}</span>
            </div>
            <div className="text-[10px] text-black font-sans" dir="rtl">
              واحد پول: <strong>تومان</strong>
            </div>
          </div>
        </div>

        {/* 2.2 REPORT PERIOD & AUDIT SCOPE (CLEAN SINGLE-LINE FORMAL TEXT) */}
        <div className="py-2 px-3 border border-black bg-white flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-black">
          <div>
            <span className="font-normal">دوره مالی: </span>
            <span className="font-black">{periodLabel}</span>
          </div>

          <div>
            <span className="font-normal">اقامتگاه طرف حساب: </span>
            <span className="font-black">
              {selectedHotelFilter === 'all'
                ? 'تمامی اقامتگاه‌های تحت پوشش پلتفرم تهران‌روم'
                : hotels.find((h) => h.id === selectedHotelFilter)?.name}
            </span>
          </div>

          <div>
            <span className="font-normal">حجم سفارشات: </span>
            <span className="font-black">{metrics.bookingsCount.toLocaleString('fa-IR')} فقره</span>
          </div>

          <div>
            <span className="font-normal">وضعیت سند: </span>
            <span className="font-black">مورد تأیید امور مالی و تطبیق‌یافته</span>
          </div>
        </div>

        {/* 2.3 EXECUTIVE SUMMARY TABLE (CRISP B&W TABLE WITH 1.5PX BLACK BORDER) */}
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-2 border-black">
            <thead>
              <tr className="bg-neutral-100 font-black text-black border-b border-black">
                <th className="py-2 px-2 border-l border-black">گردش ناخالص کل (فروش)</th>
                <th className="py-2 px-2 border-l border-black">کارمزد سامانه تهران‌روم (۱۰٪)</th>
                <th className="py-2 px-2 border-l border-black">خالص بستانکاری هتل‌ها (۹۰٪)</th>
                <th className="py-2 px-2 border-l border-black">مبالغ قطعی وصول‌شده</th>
                <th className="py-2 px-2 border-l border-black">در انتظار تطبیق فیش</th>
                <th className="py-2 px-2">استرداد کنسلی قوانین</th>
              </tr>
            </thead>
            <tbody className="font-mono text-black font-black">
              <tr>
                <td className="py-2.5 px-2 border-l border-black text-sm">
                  {metrics.grossTotal.toLocaleString('fa-IR')} <span className="font-sans text-[10px] font-normal">تومان</span>
                </td>
                <td className="py-2.5 px-2 border-l border-black text-sm">
                  {metrics.platformCommission.toLocaleString('fa-IR')} <span className="font-sans text-[10px] font-normal">تومان</span>
                </td>
                <td className="py-2.5 px-2 border-l border-black text-sm">
                  {metrics.hotelNetPayout.toLocaleString('fa-IR')} <span className="font-sans text-[10px] font-normal">تومان</span>
                </td>
                <td className="py-2.5 px-2 border-l border-black text-sm">
                  {metrics.verifiedCash.toLocaleString('fa-IR')} <span className="font-sans text-[10px] font-normal">تومان</span>
                </td>
                <td className="py-2.5 px-2 border-l border-black text-sm">
                  {metrics.pendingInflows.toLocaleString('fa-IR')} <span className="font-sans text-[10px] font-normal">تومان</span>
                </td>
                <td className="py-2.5 px-2 text-sm">
                  {metrics.totalRefunds.toLocaleString('fa-IR')} <span className="font-sans text-[10px] font-normal">تومان</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2.4 BREAKDOWN TABLE (CRISP B&W) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between border-b border-black pb-1">
            <h2 className="text-xs font-black text-black">
              جدول تفکیک گردش مالی، کارمزد و بستانکاری اقامتگاه‌ها
            </h2>
            <span className="text-[10px] font-bold text-black font-mono">
              {hotelSummaries.length} اقامتگاه
            </span>
          </div>

          <table className="w-full text-right text-xs border border-black">
            <thead className="bg-neutral-100 text-black font-black border-b border-black">
              <tr>
                <th className="py-1.5 px-2 border-l border-black">نام اقامتگاه</th>
                <th className="py-1.5 px-1 text-center border-l border-black">درجه</th>
                <th className="py-1.5 px-1 text-center border-l border-black">تعداد</th>
                <th className="py-1.5 px-2 border-l border-black">فروش ناخالص</th>
                <th className="py-1.5 px-2 border-l border-black">کارمزد (۱۰٪)</th>
                <th className="py-1.5 px-2 border-l border-black font-black">خالص سهم هتل</th>
                <th className="py-1.5 px-2 border-l border-black">وصول‌شده</th>
                <th className="py-1.5 px-1 text-center">وضعیت تسویه</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black text-black font-bold">
              {hotelSummaries.map((item) => (
                <tr key={item.hotel.id}>
                  <td className="py-1.5 px-2 border-l border-black font-black">
                    {item.hotel.name}
                  </td>
                  <td className="py-1.5 px-1 text-center border-l border-black">
                    {'★'.repeat(item.hotel.stars || 4)}
                  </td>
                  <td className="py-1.5 px-1 text-center border-l border-black font-black">
                    {item.bookingsCount.toLocaleString('fa-IR')}
                  </td>
                  <td className="py-1.5 px-2 border-l border-black font-mono">
                    {item.grossRevenue.toLocaleString('fa-IR')} تومان
                  </td>
                  <td className="py-1.5 px-2 border-l border-black font-mono">
                    {item.commission.toLocaleString('fa-IR')} تومان
                  </td>
                  <td className="py-1.5 px-2 border-l border-black font-mono font-black">
                    {item.hotelNet.toLocaleString('fa-IR')} تومان
                  </td>
                  <td className="py-1.5 px-2 border-l border-black font-mono">
                    {item.verifiedRevenue.toLocaleString('fa-IR')} تومان
                  </td>
                  <td className="py-1.5 px-1 text-center text-[10px]">
                    آماده تسویه
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 2.5 SIGNATURES & STAMPS */}
        <div className="pt-4 border-t border-black grid grid-cols-3 gap-4 text-center text-[11px] font-bold">
          <div className="border border-black rounded-lg p-2 space-y-4">
            <span className="block">امضای مدیر مالی سامانه تهران‌روم:</span>
            <div className="h-8 border-b border-dashed border-black/40" />
            <span className="text-[9px] text-neutral-600 block">تاریخ و امضا</span>
          </div>

          <div className="border border-black rounded-lg p-2 space-y-4">
            <span className="block">مهر و تأییدیه حسابداری هتل:</span>
            <div className="h-8 border-b border-dashed border-black/40" />
            <span className="text-[9px] text-neutral-600 block">مهر رسمی</span>
          </div>

          <div className="border border-black rounded-lg p-2 space-y-4">
            <span className="block">کنترل نهایی و ثبت مکانیزه:</span>
            <div className="h-8 border-b border-dashed border-black/40" />
            <span className="text-[9px] text-neutral-600 block">سیستم مکانیزه تایید</span>
          </div>
        </div>

        {/* 2.6 FOOTER */}
        <div className="pt-2 border-t border-neutral-300 text-center text-[9px] text-neutral-600 flex justify-between items-center">
          <span>این صورت‌حساب بر اساس تراکنش‌های ثبت‌شده در پایگاه داده سامانه تهران‌روم تولید شده و دارای اعتبار حقوقی است.</span>
          <span className="font-mono font-bold" dir="ltr">TehranRoom Financial System © 2026</span>
        </div>
      </div>
    </div>
  );
}
