'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarCheck2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coins,
  TrendingUp,
  BedDouble,
  Users,
  Eye,
  Check,
  X,
  FileCheck2,
  ArrowUpRight,
  RefreshCw,
  CreditCard,
  Phone,
  Mail,
  Copy,
  MapPin,
  Building,
  ShieldCheck,
} from 'lucide-react';
import AdminHeader from '@/components/layout/AdminHeader';
import { supabase } from '@/lib/supabase/client';
import { Booking } from '@/types/database';

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCustomerBooking, setSelectedCustomerBooking] = useState<Booking | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    revenueToman: 0,
    roomsCount: 5,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          hotel:hotels(*),
          room:rooms(*),
          customer:customers(*),
          payments(*)
        `)
        .order('created_at', { ascending: false });

      const allBookings = ((bookingsData as any[]) || []).map((b) => ({
        ...b,
        total_amount_toman: b.total_amount || b.total_amount_toman || b.total_amount_currency || 0,
        receipt_url: b.receipt_url || b.payments?.[0]?.receipt_url || null,
        bank_tracking_number: b.bank_tracking_number || b.payments?.[0]?.tracking_number || null,
      }));
      setBookings(allBookings);

      const pendingCount = allBookings.filter((b) => b.status === 'pending').length;
      const confirmedCount = allBookings.filter((b) => b.status === 'confirmed').length;
      const totalRev = allBookings
        .filter((b) => b.status === 'confirmed' || b.payment_status === 'verified')
        .reduce((sum, b) => sum + (b.total_amount_toman || 0), 0);

      const { count: roomsTotal } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true });

      setStats({
        total: allBookings.length,
        pending: pendingCount,
        confirmed: confirmedCount,
        revenueToman: totalRev,
        roomsCount: roomsTotal || 5,
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (bookingId: string, newStatus: 'confirmed' | 'rejected') => {
    const confirmMsg = newStatus === 'confirmed'
      ? 'آیا از تایید قطعی این رزرو و فیش واریزی اطمینان دارید؟'
      : 'آیا از رد کردن این رزرو اطمینان دارید؟';

    if (!confirm(confirmMsg)) return;

    try {
      // 1. Update bookings table (with fallback if schema cache hasn't loaded payment_status)
      let { error } = await supabase
        .from('bookings')
        .update({
          status: newStatus,
          payment_status: newStatus === 'confirmed' ? 'verified' : 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error && error.message?.includes('payment_status')) {
        const fallbackRes = await supabase
          .from('bookings')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', bookingId);
        error = fallbackRes.error;
      }

      if (error) throw error;

      // 2. Also sync payments table
      await supabase
        .from('payments')
        .update({
          status: newStatus === 'confirmed' ? 'verified' : 'failed',
          verified_at: newStatus === 'confirmed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('booking_id', bookingId);

      await loadData();
    } catch (err: any) {
      alert('خطا در به‌روزرسانی وضعیت: ' + err.message);
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === 'pending');

  return (
    <div className="space-y-8">
      <AdminHeader
        title="داشبورد جامع مدیریت رزرواسیون هتل‌های تهران‌روم"
        subtitle="مرکز کنترل زنده اقامتگاه‌ها، تایید فیش‌های واریزی مسافران و گزارش‌های مالی"
        onRefresh={loadData}
        isLoading={isLoading}
      />

      {/* 1. KEY PERFORMANCE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>کل رزرواسیون‌ها</span>
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {stats.total.toLocaleString('fa-IR')}
          </div>
          <span className="text-[11px] text-neutral-400 block">ثبت شده در سامانه تهران‌روم</span>
        </div>

        {/* Metric 2: Pending Alert */}
        <div className="glass-panel-dark p-5 rounded-3xl border border-amber-400/40 space-y-2 shadow-lg shadow-amber-500/10">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
            <span>نیازمند بررسی و تایید فیش</span>
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center animate-pulse">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-300">
            {stats.pending.toLocaleString('fa-IR')}
          </div>
          <span className="text-[11px] text-amber-200/80 block">وضعیت Pending (کارت‌به‌کارت)</span>
        </div>

        {/* Metric 3: Confirmed */}
        <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>رزروهای تایید و قطعی‌شده</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {stats.confirmed.toLocaleString('fa-IR')}
          </div>
          <span className="text-[11px] text-neutral-400 block">واچر صادر شده و آماده پذیرش</span>
        </div>

        {/* Metric 4: Revenue */}
        <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>کل درآمد وصول‌شده</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {stats.revenueToman.toLocaleString('fa-IR')} <span className="text-xs text-amber-400">تومان</span>
          </div>
          <span className="text-[11px] text-neutral-400 block font-mono" dir="ltr">
            {(stats.revenueToman * 10).toLocaleString('fa-IR')} IRR
          </span>
        </div>
      </div>

      {/* 2. PENDING PAYMENTS ACTION BOARD (مهم‌ترین بخش: بررسی فوری فیش‌های واریزی) */}
      <div className="glass-panel-dark rounded-3xl p-6 border border-amber-400/30 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                فیش‌های بانکی در انتظار بررسی و تایید
              </h2>
              <p className="text-xs text-neutral-400">
                فیش‌های کارت‌به‌کارت مسافران را بررسی کرده و با یک کلیک تایید یا رد نمایید.
              </p>
            </div>
          </div>

          <span className="text-xs font-black text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
            {pendingBookings.length.toLocaleString('fa-IR')} مورد اقدام فوری
          </span>
        </div>

        {pendingBookings.length === 0 ? (
          <div className="p-8 text-center bg-white/[0.02] rounded-2xl border border-white/5 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <span className="text-xs font-bold text-neutral-300 block">
              تمامی فیش‌های واریزی بررسی و تایید شده‌اند.
            </span>
            <span className="text-[11px] text-neutral-500 block">
              هیچ رزرو بلاتکلیفی در صف انتظار وجود ندارد.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingBookings.map((b) => (
              <div
                key={b.id}
                className="clearmorph-card p-4 sm:p-5 rounded-2xl border border-white/12 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-amber-400 text-sm tracking-wider">
                      {b.booking_code}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerBooking(b)}
                      className="text-xs font-bold text-white hover:text-amber-400 flex items-center gap-1.5 underline decoration-amber-400/40 underline-offset-4 transition-colors"
                      title="کلیک جهت مشاهده پرونده و مشخصات کامل مسافر"
                    >
                      <span>— {b.customer?.full_name || 'مسافر'}</span>
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                    <span className="text-[10px] bg-white/[0.06] text-neutral-300 px-2 py-0.5 rounded-md font-mono" dir="ltr">
                      {b.customer?.phone}
                    </span>
                    {b.nationality_type === 'foreigner' ? (
                      <span className="text-[10px] bg-sky-500/10 text-sky-300 px-2 py-0.5 rounded-md border border-sky-500/20">
                        اتباع خارجی ({b.nationality_country}) — پاسپورت: {b.national_id}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/20">
                        کد ملی: {b.national_id}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-300">
                    <span>
                      اتاق: <strong className="text-white">{b.room?.name || 'اتاق دوتخته'}</strong>
                    </span>
                    <span>
                      نوع اقامت: <strong className="text-amber-300">{b.booking_type === 'daily' ? 'روزانه' : `ساعتی (${b.duration_hours} ساعت)`}</strong>
                    </span>
                    <span>
                      مبلغ: <strong className="text-white font-mono">{b.total_amount_toman?.toLocaleString('fa-IR')} تومان</strong>
                    </span>
                    {b.bank_tracking_number && (
                      <span>
                        شناسه پیگیری بانکی: <strong className="text-amber-400 font-mono" dir="ltr">{b.bank_tracking_number}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {b.receipt_url ? (
                    <a
                      href={b.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-bold text-neutral-200 border border-white/15 flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>مشاهده تصویر رسید</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-neutral-400 bg-white/[0.04] px-3 py-2 rounded-xl border border-white/5">
                      بدون فایل پیوست
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>تایید قطعی و صدور واچر</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(b.id, 'rejected')}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 flex items-center gap-1 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>رد</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. RECENT ALL BOOKINGS TABLE */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-white">
            فهرست کلیه رزرواسیون‌ها
          </h2>
          <Link
            href="/bookings"
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>مشاهده و فیلتر پیشرفته</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400">
                <th className="pb-3 pr-2">کد پیگیری</th>
                <th className="pb-3">نام مسافر</th>
                <th className="pb-3">ملیت / شناسنامه</th>
                <th className="pb-3">اتاق انتخابی</th>
                <th className="pb-3">نوع اقامت</th>
                <th className="pb-3">مبلغ پرداختی</th>
                <th className="pb-3">وضعیت رزرو</th>
                <th className="pb-3 pl-2 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings.slice(0, 10).map((b) => (
                <tr key={b.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 pr-2 font-mono font-bold text-amber-400">
                    {b.booking_code}
                  </td>
                  <td className="py-3 font-bold text-white">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerBooking(b)}
                      className="text-white hover:text-amber-400 font-bold flex items-center gap-1.5 underline decoration-amber-400/40 underline-offset-4 transition-colors text-right"
                      title="مشاهده اطلاعات کامل و هویتی مسافر"
                    >
                      <span>{b.customer?.full_name || '—'}</span>
                      <Users className="w-3 h-3 text-amber-400/80" />
                    </button>
                  </td>
                  <td className="py-3 text-neutral-300">
                    {b.nationality_type === 'foreigner' ? (
                      <span className="text-[10px] text-sky-400 font-mono">
                        پاسپورت: {b.national_id}
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-300 font-mono">
                        {b.national_id || 'کد ملی ثبت نشده'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-neutral-200">
                    {b.room?.name || '—'}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      b.booking_type === 'daily'
                        ? 'bg-amber-400/10 text-amber-300'
                        : 'bg-cyan-400/10 text-cyan-300'
                    }`}>
                      {b.booking_type === 'daily' ? 'روزانه' : `ساعتی (${b.duration_hours}h)`}
                    </span>
                  </td>
                  <td className="py-3 font-mono font-bold text-white">
                    {b.total_amount_toman?.toLocaleString('fa-IR')} تومان
                  </td>
                  <td className="py-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : b.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : b.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-white/10 text-neutral-300'
                    }`}>
                      {b.status === 'confirmed'
                        ? 'تایید شده'
                        : b.status === 'pending'
                        ? 'در انتظار بررسی'
                        : b.status === 'rejected'
                        ? 'رد شده'
                        : b.status}
                    </span>
                  </td>
                  <td className="py-3 pl-2 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        href={`/bookings?id=${b.id}`}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white text-xs font-bold"
                      >
                        جزئیات
                      </Link>
                      <a
                        href={`http://localhost:3000/voucher/${b.booking_code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center gap-1"
                        title="مشاهده واچر رسمی"
                      >
                        <span>واچر</span>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. COMPREHENSIVE CUSTOMER PROFILE POPUP (User Request) */}
      {selectedCustomerBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="glass-panel-dark border border-amber-400/40 rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-6 shadow-[0_25px_60px_rgba(0,0,0,0.9),inset_0_1.5px_1px_rgba(255,255,255,0.25)] relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedCustomerBooking(null)}
              className="absolute top-5 left-5 p-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  پرونده هویتی و رزرواسیون مسافر
                </h3>
                <span className="text-xs text-neutral-400">
                  شناسه رزرو: <strong className="font-mono text-amber-400">{selectedCustomerBooking.booking_code}</strong>
                </span>
              </div>
            </div>

            {/* Customer Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
              <div className="space-y-1">
                <span className="text-[11px] text-neutral-400 block">نام و نام خانوادگی:</span>
                <span className="text-sm font-black text-white block">
                  {selectedCustomerBooking.customer?.full_name || 'ثبت نشده'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-neutral-400 block">شماره تماس مسافر:</span>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedCustomerBooking.customer?.phone}`}
                    className="text-sm font-mono font-bold text-amber-300 hover:underline flex items-center gap-1"
                    dir="ltr"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{selectedCustomerBooking.customer?.phone || '—'}</span>
                  </a>
                  {selectedCustomerBooking.customer?.phone && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedCustomerBooking.customer?.phone || '');
                        setCopiedPhone(true);
                        setTimeout(() => setCopiedPhone(false), 2000);
                      }}
                      className="text-[10px] bg-white/[0.05] hover:bg-white/10 px-2 py-0.5 rounded text-neutral-300"
                    >
                      {copiedPhone ? 'کپی شد' : 'کپی'}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-neutral-400 block">تابعیت و نوع مدارک:</span>
                {selectedCustomerBooking.nationality_type === 'foreigner' ? (
                  <span className="inline-flex items-center gap-1 text-xs text-sky-300 font-bold bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>اتباع خارجی ({selectedCustomerBooking.nationality_country}) — پاسپورت: {selectedCustomerBooking.national_id}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-300 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>کد ملی: {selectedCustomerBooking.national_id || 'ثبت نشده'}</span>
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-neutral-400 block">ایمیل مسافر:</span>
                <span className="text-xs text-neutral-300 font-mono">
                  {selectedCustomerBooking.customer?.email || 'بدون ایمیل ثبت شده'}
                </span>
              </div>
            </div>

            {/* Accommodation & Stay Info */}
            <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Building className="w-4 h-4" />
                <span>اطلاعات اقامتگاه و واحد رزرو شده:</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-400 block">نام هتل:</span>
                  <span className="font-bold text-white">{selectedCustomerBooking.hotel?.name || 'هتل تهران‌روم'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">واحد اقامتی:</span>
                  <span className="font-bold text-white">{selectedCustomerBooking.room?.name || 'اتاق'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">نوع اقامت:</span>
                  <span className="font-bold text-amber-300">
                    {selectedCustomerBooking.booking_type === 'daily'
                      ? 'روزانه (شبانه)'
                      : `ساعتی (${selectedCustomerBooking.duration_hours} ساعت)`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">تاریخ و ساعت ورود:</span>
                  <span className="font-bold text-white font-mono" dir="ltr">
                    {selectedCustomerBooking.check_in_date} ({selectedCustomerBooking.check_in_time || '14:00'})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">تاریخ خروج:</span>
                  <span className="font-bold text-white font-mono" dir="ltr">
                    {selectedCustomerBooking.check_out_date} (12:00)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">صبحانه بوفه:</span>
                  <span className="font-bold text-emerald-400">
                    {selectedCustomerBooking.breakfast_included ? 'شامل است (رایگان)' : 'بدون صبحانه'}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Details & Bank Receipt */}
            <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Coins className="w-4 h-4" />
                <span>امور مالی و فیش پرداختی:</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-400 block">مبلغ کل فاکتور:</span>
                  <span className="text-sm font-black text-white font-mono">
                    {Number(selectedCustomerBooking.total_amount).toLocaleString('fa-IR')} تومان
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">وضعیت پرداخت:</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedCustomerBooking.status === 'confirmed' || selectedCustomerBooking.payment_status === 'verified'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {selectedCustomerBooking.status === 'confirmed' || selectedCustomerBooking.payment_status === 'verified'
                      ? 'تایید شده و تسویه'
                      : 'در انتظار بررسی فیش'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">کد پیگیری بانکی:</span>
                  <span className="font-mono text-neutral-300">
                    {selectedCustomerBooking.bank_tracking_number || selectedCustomerBooking.payments?.[0]?.tracking_number || '—'}
                  </span>
                </div>
              </div>

              {selectedCustomerBooking.receipt_url && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[11px] text-neutral-400 block mb-2">تصویر فیش واریزی مسافر:</span>
                  <a
                    href={selectedCustomerBooking.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block relative rounded-xl overflow-hidden border border-white/10 hover:border-amber-400 transition-all"
                  >
                    <img
                      src={selectedCustomerBooking.receipt_url}
                      alt="فیش واریزی"
                      className="w-48 h-32 object-cover"
                    />
                    <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-xs font-bold text-white opacity-0 hover:opacity-100 transition-opacity">
                      بزرگنمایی فیش
                    </span>
                  </a>
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
              <a
                href={`http://localhost:3000/voucher/${selectedCustomerBooking.booking_code}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold hover:bg-amber-400/30 transition-all flex items-center gap-1.5"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>مشاهده واچر رسمی</span>
              </a>

              <div className="flex items-center gap-2">
                {selectedCustomerBooking.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateStatus(selectedCustomerBooking.id, 'rejected');
                        setSelectedCustomerBooking(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold"
                    >
                      رد رزرو
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateStatus(selectedCustomerBooking.id, 'confirmed');
                        setSelectedCustomerBooking(null);
                      }}
                      className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20"
                    >
                      تایید قطعی و صدور واچر
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedCustomerBooking(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/15 text-white text-xs font-bold"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

