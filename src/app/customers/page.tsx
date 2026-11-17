'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  Globe,
  MessageCircle,
  ExternalLink,
  RefreshCw,
  UserCheck,
  X,
  CreditCard,
  Building,
  BedDouble,
  Clock,
  Coins,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import AdminHeader from '@/components/layout/AdminHeader';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Customer } from '@/types/database';
import { formatToJalaliString, toPersianDigits } from '@/lib/date-utils';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [nationalityFilter, setNationalityFilter] = useState<'all' | 'iranian' | 'foreigner'>('all');

  // Full Profile Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerBookings, setCustomerBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setCustomers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCustomerModal = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLoadingBookings(true);
    setCustomerBookings([]);

    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('bookings')
      .select('*, hotel:hotels(name, stars), room:rooms(name), payments(*)')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    if (data) {
      setCustomerBookings(data);
    }
    setLoadingBookings(false);
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.full_name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      (c.national_id && c.national_id.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q));

    const isIranian = !c.nationality_type || c.nationality_type === 'iranian';
    const matchesNationality =
      nationalityFilter === 'all' ||
      (nationalityFilter === 'iranian' && isIranian) ||
      (nationalityFilter === 'foreigner' && !isIranian);

    return matchesSearch && matchesNationality;
  });

  // Calculate statistics
  const iranianCount = customers.filter((c) => !c.nationality_type || c.nationality_type === 'iranian').length;
  const foreignerCount = customers.filter((c) => c.nationality_type === 'foreigner').length;
  const repeatCount = customers.filter((c) => c.is_repeat_customer).length;

  const totalLifetimeSpend = customerBookings.reduce(
    (sum, b) => sum + (Number(b.total_amount) || Number(b.total_amount_currency) || 0),
    0
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. UNIFIED ADMIN HEADER */}
      <AdminHeader
        title="بانک اطلاعات مسافران و پرونده جامع مشتریان"
        subtitle="مدیریت پرونده‌های هویتی، گذرنامه‌ها، تماس مستقیم، بررسی سوابق رزرواسیون و تفکیک ملیت‌ها"
        onRefresh={fetchCustomers}
        isLoading={loading}
      />

      {/* 2. SUMMARY KPI METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-bold">
            <span>کل مشتریان ثبت‌شده</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {toPersianDigits(customers.length)} <span className="text-xs font-sans text-neutral-400">نفر</span>
          </div>
          <span className="text-[11px] text-neutral-400 block">دیتابیس متمرکز تهران‌روم</span>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-5 rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.02] space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
            <span>مسافران ایرانی</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {toPersianDigits(iranianCount)} <span className="text-xs font-sans text-emerald-300">نفر</span>
          </div>
          <span className="text-[11px] text-neutral-400 block">ثبت با کد ملی هوشمند</span>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-5 rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.02] space-y-2">
          <div className="flex items-center justify-between text-xs text-cyan-300 font-bold">
            <span>مسافران اتباع خارجی</span>
            <Globe className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono">
            {toPersianDigits(foreignerCount)} <span className="text-xs font-sans text-cyan-200">نفر</span>
          </div>
          <span className="text-[11px] text-neutral-400 block">پاسپورت بین‌المللی</span>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel p-5 rounded-3xl border border-amber-400/25 bg-amber-400/[0.02] space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
            <span>مشتریان وفادار (VIP)</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
            {toPersianDigits(repeatCount || 1)} <span className="text-xs font-sans text-amber-200">نفر</span>
          </div>
          <span className="text-[11px] text-neutral-400 block">دارای سوابق متعدد</span>
        </div>
      </div>

      {/* 3. FILTERS & SEARCH TOOLBAR */}
      <div className="glass-panel-dark rounded-3xl p-4 sm:p-5 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو با نام مسافر، شماره تماس یا کد ملی/پاسپورت..."
            className="w-full glass-input pr-10 pl-4 py-2.5 rounded-2xl text-xs font-bold"
          />
        </div>

        {/* Nationality Filter Tabs */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setNationalityFilter('all')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              nationalityFilter === 'all'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20'
                : 'bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            همه مسافران ({toPersianDigits(customers.length)})
          </button>

          <button
            type="button"
            onClick={() => setNationalityFilter('iranian')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              nationalityFilter === 'iranian'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            ایرانی ({toPersianDigits(iranianCount)})
          </button>

          <button
            type="button"
            onClick={() => setNationalityFilter('foreigner')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              nationalityFilter === 'foreigner'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                : 'bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            اتباع خارجی ({toPersianDigits(foreignerCount)})
          </button>
        </div>
      </div>

      {/* 4. CUSTOMERS DATA TABLE */}
      <div className="glass-panel-dark rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
        {loading ? (
          <div className="p-16 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>در حال فراخوانی اطلاعات مسافران از دیتابیس...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-16 text-center text-xs text-neutral-400 space-y-2">
            <Users className="w-10 h-10 text-neutral-600 mx-auto" />
            <p className="font-bold text-white">هیچ مسافری با این مشخصات یافت نشد.</p>
            <p className="text-[11px] text-neutral-500">عبارت جستجو یا فیلتر ملیت را بررسی فرمایید.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-white/[0.04] border-b border-white/10 text-neutral-400 font-bold">
                <tr>
                  <th className="p-4">نام و نام خانوادگی</th>
                  <th className="p-4">ملیت و مدرک هویتی</th>
                  <th className="p-4">شماره تماس مستقیم</th>
                  <th className="p-4">ایمیل مسافر</th>
                  <th className="p-4 text-center">تعداد اقامت</th>
                  <th className="p-4">تاریخ اولین ثبت</th>
                  <th className="p-4 text-center">پرونده و اقدامات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCustomers.map((c) => {
                  const isForeigner = c.nationality_type === 'foreigner';
                  const cleanPhone = c.phone ? c.phone.replace(/[^0-9+]/g, '') : '';

                  return (
                    <tr
                      key={c.id}
                      onClick={() => openCustomerModal(c)}
                      className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <td className="p-4 font-black text-white flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-amber-400/20 text-amber-300 font-black flex items-center justify-center shrink-0 border border-amber-400/40 shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
                          {c.full_name?.charAt(0) || 'م'}
                        </div>
                        <div>
                          <span className="block font-black text-white text-xs sm:text-sm">{c.full_name}</span>
                          {c.is_repeat_customer && (
                            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              <span>مشتری وفادار (VIP)</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        {isForeigner ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <Globe className="w-3 h-3" />
                              <span>اتباع ({c.nationality_country || 'خارجی'})</span>
                            </span>
                            <div className="text-[11px] font-mono text-neutral-300 pt-0.5" dir="ltr">
                              پاسپورت: {c.national_id || '---'}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <ShieldCheck className="w-3 h-3" />
                              <span>ایرانی</span>
                            </span>
                            <div className="text-[11px] font-mono text-neutral-300 pt-0.5" dir="ltr">
                              کد ملی: {c.national_id || '---'}
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="p-4 font-mono font-bold text-amber-300" dir="ltr">
                        {c.phone}
                      </td>

                      <td className="p-4 text-neutral-400 font-mono text-[11px]" dir="ltr">
                        {c.email || '---'}
                      </td>

                      <td className="p-4 text-center">
                        <span className="inline-block bg-white/[0.06] px-3 py-1 rounded-xl font-black text-white font-mono border border-white/10">
                          {toPersianDigits(c.total_bookings || 1)}
                        </span>
                      </td>

                      <td className="p-4 text-neutral-400 text-[11px]">
                        {c.created_at ? formatToJalaliString(c.created_at.toString()) : '---'}
                      </td>

                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openCustomerModal(c)}
                            className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-[11px] shadow-sm hover:bg-amber-300 transition-all"
                          >
                            مشاهده پرونده
                          </button>

                          {cleanPhone && (
                            <a
                              href={`tel:${cleanPhone}`}
                              className="p-1.5 rounded-xl bg-white/[0.06] text-amber-300 hover:bg-white/10 transition-colors border border-white/10"
                              title="تماس تلفنی"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                              title="ارسال پیام در واتساپ"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====================================================================
          5. COMPLETE CUSTOMER PROFILE POPUP MODAL (FIXED & FULLY RESPONSIVE)
         ==================================================================== */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto">
          <div className="w-full max-w-4xl glass-panel-dark rounded-3xl border border-amber-400/40 p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto shadow-[0_25px_60px_rgba(0,0,0,0.95),inset_0_1.5px_1px_rgba(255,255,255,0.25)] relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xl font-black flex items-center justify-center shadow-lg shadow-amber-500/20">
                  {selectedCustomer.full_name?.charAt(0) || 'م'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-white">
                      {selectedCustomer.full_name}
                    </h2>
                    {selectedCustomer.is_repeat_customer && (
                      <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full shadow-sm">
                        VIP / مشتری وفادار
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-400 font-medium">
                    پرونده جامع هویتی، سوابق رزرواسیون و گزارش مالی مسافر
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white transition-colors border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                <span className="text-neutral-400 block text-[11px]">ملیت و مدرک هویتی:</span>
                <span className="font-bold text-white block">
                  {selectedCustomer.nationality_type === 'foreigner'
                    ? `اتباع (${selectedCustomer.nationality_country || 'خارجی'})`
                    : 'جمهوری اسلامی ایران'}
                </span>
                <span className="font-mono text-amber-300 font-bold block" dir="ltr">
                  {selectedCustomer.nationality_type === 'foreigner'
                    ? `گذرنامه: ${selectedCustomer.national_id || 'ثبت نشده'}`
                    : `کد ملی: ${selectedCustomer.national_id || 'ثبت نشده'}`}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                <span className="text-neutral-400 block text-[11px]">شماره تماس مسافر:</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-white font-bold text-sm block" dir="ltr">
                    {selectedCustomer.phone}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedCustomer.phone || '');
                      setCopiedPhone(true);
                      setTimeout(() => setCopiedPhone(false), 2000);
                    }}
                    className="text-[10px] bg-white/[0.08] hover:bg-white/15 px-2 py-0.5 rounded text-neutral-300 font-bold"
                  >
                    {copiedPhone ? 'کپی شد' : 'کپی'}
                  </button>
                </div>
                <div className="flex items-center gap-2 pt-1 text-[11px]">
                  <a
                    href={`tel:${selectedCustomer.phone.replace(/[^0-9+]/g, '')}`}
                    className="text-amber-300 hover:underline flex items-center gap-1 font-bold"
                  >
                    <Phone className="w-3 h-3" />
                    <span>تماس مستقیم</span>
                  </a>
                  <span>•</span>
                  <a
                    href={`https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>واتساپ</span>
                  </a>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                <span className="text-neutral-400 block text-[11px]">آدرس ایمیل مسافر:</span>
                <span className="font-mono text-neutral-300 block truncate" dir="ltr">
                  {selectedCustomer.email || 'ثبت نشده'}
                </span>
                <span className="text-[10px] text-neutral-400 block">
                  عضویت: {selectedCustomer.created_at ? formatToJalaliString(selectedCustomer.created_at.toString()) : 'ثبت اولیه'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-400/[0.08] border border-amber-400/30 space-y-1">
                <span className="text-amber-400 block text-[11px] font-bold">مجموع مبالغ رزروها:</span>
                <span className="font-mono text-amber-300 font-black text-base block">
                  {totalLifetimeSpend.toLocaleString('fa-IR')} تومان
                </span>
                <span className="text-[10px] text-neutral-300 block">
                  {toPersianDigits(customerBookings.length)} فقره سفارش اقامت
                </span>
              </div>
            </div>

            {/* Bookings History Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>سابقه کامل رزروها و اقامت‌های مسافر ({toPersianDigits(customerBookings.length)})</span>
                </h3>
                {loadingBookings && (
                  <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                    <span>در حال فراخوانی سوابق...</span>
                  </span>
                )}
              </div>

              {customerBookings.length === 0 && !loadingBookings ? (
                <div className="p-8 text-center bg-white/[0.02] border border-white/10 rounded-2xl text-xs text-neutral-400">
                  هیچ رزروی برای این مسافر ثبت نشده است.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-white/[0.04] border-b border-white/10 text-neutral-400 font-bold">
                      <tr>
                        <th className="p-3">کد رهگیری</th>
                        <th className="p-3">هتل و اقامتگاه</th>
                        <th className="p-3">واحد رزرو شده</th>
                        <th className="p-3">بازه اقامت (شمسی)</th>
                        <th className="p-3">نوع اقامت</th>
                        <th className="p-3">مبلغ کل فاکتور</th>
                        <th className="p-3 text-center">وضعیت</th>
                        <th className="p-3 text-center">واچر رسمی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {customerBookings.map((b) => {
                        const isConfirmed = b.status === 'confirmed' || b.payment_status === 'verified';
                        const isCancelled = b.status === 'cancelled' || b.status === 'cancellation_requested';

                        return (
                          <tr key={b.id} className="hover:bg-white/[0.03]">
                            <td className="p-3 font-mono font-black text-amber-300" dir="ltr">
                              {b.booking_code}
                            </td>

                            <td className="p-3 font-bold text-white">
                              {b.hotel?.name || 'هتل تهران‌روم'}
                            </td>

                            <td className="p-3 text-neutral-200">
                              {b.room?.name || 'اتاق استاندارد'}
                            </td>

                            <td className="p-3 text-neutral-300 text-[11px]">
                              {formatToJalaliString(b.check_in_date)} تا {formatToJalaliString(b.check_out_date)}
                            </td>

                            <td className="p-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${
                                b.booking_type === 'daily'
                                  ? 'bg-amber-400/10 text-amber-300'
                                  : 'bg-cyan-400/10 text-cyan-300'
                              }`}>
                                {b.booking_type === 'daily' ? 'روزانه' : `ساعتی (${b.duration_hours || 3}h)`}
                              </span>
                            </td>

                            <td className="p-3 font-mono font-bold text-white">
                              {Number(b.total_amount).toLocaleString('fa-IR')} تومان
                            </td>

                            <td className="p-3 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                  isConfirmed
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : isCancelled
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                {isConfirmed
                                  ? 'تایید شده'
                                  : isCancelled
                                  ? 'لغو شده'
                                  : 'در انتظار'}
                              </span>
                            </td>

                            <td className="p-3 text-center">
                              <a
                                href={`http://localhost:3000/voucher/${b.booking_code}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/25 px-2.5 py-1 rounded-xl transition-all"
                              >
                                <FileCheck2 className="w-3.5 h-3.5" />
                                <span>واچر</span>
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-xs text-neutral-400">
                سیستم رزرواسیون یکپارچه تهران‌روم
              </span>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-6 py-2.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-bold transition-all border border-white/10"
              >
                بستن پرونده
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
