'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Search,
  Filter,
  Eye,
  Check,
  X,
  CreditCard,
  FileCheck2,
  Clock,
  MapPin,
  Users,
  Download,
  Building,
  Coins,
  ShieldCheck,
  Globe,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Phone,
  ZoomIn,
  Printer,
  ExternalLink,
} from 'lucide-react';
import AdminHeader from '@/components/layout/AdminHeader';
import ModalPortal from '@/components/common/ModalPortal';
import { supabase } from '@/lib/supabase/client';
import { Booking } from '@/types/database';

export default function BookingsManagementPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hotels, setHotels] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [zoomReceipt, setZoomReceipt] = useState<string | null>(null);

  // Filters & Search
  const [selectedHotelFilter, setSelectedHotelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Hotels
      const { data: hData } = await supabase.from('hotels').select('id, name').order('name');
      if (hData) setHotels(hData);

      // 2. Fetch Bookings with Relations
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          hotel:hotels(*),
          room:rooms(*),
          customer:customers(*),
          payments(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
      }

      const mapped = ((data as any[]) || []).map((b) => ({
        ...b,
        total_amount_toman: b.total_amount || b.total_amount_toman || b.total_amount_currency || 0,
        receipt_url: b.receipt_url || b.payments?.[0]?.receipt_url || null,
        bank_tracking_number: b.bank_tracking_number || b.payments?.[0]?.tracking_number || null,
      }));

      setBookings(mapped);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (
    bookingId: string,
    newStatus: 'confirmed' | 'rejected' | 'completed' | 'cancelled'
  ) => {
    try {
      // 1. Update bookings table (with fallback if schema cache hasn't loaded payment_status)
      let { error } = await supabase
        .from('bookings')
        .update({
          status: newStatus,
          payment_status: newStatus === 'confirmed' ? 'verified' : newStatus === 'rejected' ? 'failed' : 'verified',
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
          status: newStatus === 'confirmed' ? 'verified' : newStatus === 'rejected' ? 'failed' : 'verified',
          verified_at: newStatus === 'confirmed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('booking_id', bookingId);

      await loadData();
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      alert('خطا در به‌روزرسانی: ' + err.message);
    }
  };

  // Filtered List
  const filteredBookings = bookings.filter((b) => {
    if (selectedHotelFilter !== 'all' && b.hotel_id !== selectedHotelFilter) return false;
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (typeFilter !== 'all' && b.booking_type !== typeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const codeMatch = b.booking_code?.toLowerCase().includes(q);
      const nameMatch = b.customer?.full_name?.toLowerCase().includes(q);
      const phoneMatch = b.customer?.phone?.includes(q);
      const idMatch = b.national_id?.includes(q);
      if (!codeMatch && !nameMatch && !phoneMatch && !idMatch) return false;
    }

    return true;
  });

  // Financial aggregates calculation
  const totalVolumeToman = filteredBookings.reduce((sum, b) => sum + (b.total_amount_toman || 0), 0);
  const confirmedVolumeToman = filteredBookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.total_amount_toman || 0), 0);
  const pendingVolumeToman = filteredBookings
    .filter((b) => b.status === 'pending')
    .reduce((sum, b) => sum + (b.total_amount_toman || 0), 0);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="دفتر کل رزرواسیون‌ها و مدیریت تراکنش‌های هتل‌ها"
        subtitle="حسابداری شفاف، مدیریت فیش‌های واریزی در کلودفلر، و رهگیری سفارش‌های روزانه و ساعتی"
        onRefresh={loadData}
        isLoading={isLoading}
      />

      {/* ====================================================================
          1. FINANCIAL RECONCILIATION & AGGREGATE KPI CARDS
          (شفافیت کامل مالی: جمع کل مبالغ، مبالغ تایید شده، و مبالغ معلق)
         ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings & Value */}
        <div className="glass-panel-dark rounded-3xl p-5 border border-white/10 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold">
            <span>مجموع کل سفارش‌ها</span>
            <CalendarCheck2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {filteredBookings.length}{' '}
            <span className="text-xs font-medium text-neutral-400">سفارش</span>
          </div>
          <div className="text-xs font-bold text-amber-300 font-mono pt-1 border-t border-white/5 flex items-baseline justify-between">
            <span>گردش کل:</span>
            <span>{totalVolumeToman.toLocaleString('fa-IR')} تومان</span>
          </div>
        </div>

        {/* Confirmed Revenue */}
        <div className="glass-panel-dark rounded-3xl p-5 border border-emerald-500/20 bg-emerald-500/[0.02] space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-emerald-300 text-xs font-bold">
            <span>درآمد تایید شده (قطعی)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {confirmedVolumeToman.toLocaleString('fa-IR')}{' '}
            <span className="text-xs font-bold text-emerald-300">تومان</span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono pt-1 border-t border-white/5 flex justify-between" dir="ltr">
            <span>معادل ریال:</span>
            <span>{(confirmedVolumeToman * 10).toLocaleString('fa-IR')} IRR</span>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="glass-panel-dark rounded-3xl p-5 border border-amber-400/25 bg-amber-400/[0.02] space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-amber-300 text-xs font-bold">
            <span>در انتظار بررسی فیش</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {pendingVolumeToman.toLocaleString('fa-IR')}{' '}
            <span className="text-xs font-bold text-amber-400">تومان</span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono pt-1 border-t border-white/5 flex justify-between" dir="ltr">
            <span>تعداد معلق:</span>
            <span>{filteredBookings.filter((b) => b.status === 'pending').length} فیش بانکی</span>
          </div>
        </div>

        {/* Hourly vs Daily Ratio */}
        <div className="glass-panel-dark rounded-3xl p-5 border border-cyan-400/20 bg-cyan-400/[0.02] space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-cyan-300 text-xs font-bold">
            <span>نوع اقامت مسافران</span>
            <Building className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center justify-between pt-1 text-xs font-bold">
            <span className="text-white">
              روزانه: {filteredBookings.filter((b) => b.booking_type === 'daily').length}
            </span>
            <span className="text-cyan-300">
              ساعتی: {filteredBookings.filter((b) => b.booking_type === 'hourly').length}
            </span>
          </div>
          <div className="text-[10px] text-neutral-400 pt-1 border-t border-white/5">
            پوشش تمامی هتل‌های تهران‌روم
          </div>
        </div>
      </div>

      {/* ====================================================================
          2. FILTER & SEARCH TOOLBAR
         ==================================================================== */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجو با کد، نام، تلفن یا کد ملی..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input pr-10 pl-4 py-2.5 rounded-2xl text-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Hotel Filter */}
          <select
            value={selectedHotelFilter}
            onChange={(e) => setSelectedHotelFilter(e.target.value)}
            className="glass-input px-3.5 py-2.5 rounded-2xl text-xs font-bold"
          >
            <option value="all">همه هتل‌ها ({hotels.length} هتل)</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              همه وضعیت‌ها
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'pending'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'text-amber-300 hover:text-white'
              }`}
            >
              در انتظار تایید
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('confirmed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'confirmed'
                  ? 'bg-emerald-500 text-white font-black'
                  : 'text-emerald-400 hover:text-white'
              }`}
            >
              تایید شده
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                typeFilter === 'all'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              همه اقامت‌ها
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('daily')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                typeFilter === 'daily'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              روزانه
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('hourly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                typeFilter === 'hourly'
                  ? 'bg-cyan-500 text-slate-950 font-black'
                  : 'text-cyan-300 hover:text-white'
              }`}
            >
              ساعتی
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          3. COMPREHENSIVE BOOKINGS TABLE
         ==================================================================== */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-white/[0.04] text-neutral-400 font-bold border-b border-white/10">
              <tr>
                <th className="py-4 pr-6 pl-3">کد رزرو</th>
                <th className="py-4 px-3">نام مسافر و هویت</th>
                <th className="py-4 px-3">هتل و اتاق</th>
                <th className="py-4 px-3">تاریخ و مدت اقامت</th>
                <th className="py-4 px-3">مبلغ کل سفارش</th>
                <th className="py-4 px-3">وضعیت رزرو</th>
                <th className="py-4 px-3">فیش واریزی</th>
                <th className="py-4 pl-6 text-center">اقدامات سریع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-neutral-400">
                    در حال بارگذاری اطلاعات رزروها...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-neutral-400">
                    هیچ رزروی با فیلترهای انتخابی یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const isForeigner = b.nationality_type === 'foreigner';

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 pr-6 pl-3 font-mono font-bold text-amber-300">
                        <span className="block">{b.booking_code}</span>
                        <span className="text-[10px] text-neutral-500 block">
                          {b.created_at ? new Date(b.created_at).toLocaleDateString('fa-IR') : '---'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white">
                          {b.customer?.full_name || 'مسافر مهمان'}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono" dir="ltr">
                          {b.customer?.phone || '---'}
                        </div>
                        {isForeigner ? (
                          <span className="text-[10px] text-cyan-300 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20 inline-flex items-center gap-1 mt-0.5">
                            <Globe className="w-2.5 h-2.5" />
                            <span>اتباع خارجی ({b.nationality_country || 'خارجی'}): {b.national_id || '---'}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 inline-flex items-center gap-1 mt-0.5 font-mono">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>کد ملی: {b.national_id || 'ثبت نشده'}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-amber-400 flex items-center gap-1">
                          <Building className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{b.hotel?.name || 'هتل تابان'}</span>
                        </div>
                        <div className="text-neutral-300 text-[11px] font-semibold">
                          {b.room?.name || 'اتاق استاندارد'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-neutral-300">
                        <div className="space-y-0.5">
                          <span className="block font-medium">ورود: {b.check_in_date}</span>
                          <span className="text-[11px] text-neutral-400 block">
                            {b.booking_type === 'daily'
                              ? `خروج: ${b.check_out_date}`
                              : `ساعتی: از ${b.check_in_time || '14:00'} (${b.duration_hours || 3} ساعت)`}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-white">
                        <div className="text-sm font-black text-amber-400">
                          {b.total_amount_toman?.toLocaleString('fa-IR')} تومان
                        </div>
                        <div className="text-[10px] text-neutral-400" dir="ltr">
                          {(b.total_amount_toman * 10).toLocaleString('fa-IR')} IRR
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : b.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                            : b.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-white/10 text-neutral-300 border-white/10'
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

                      <td className="py-3.5 px-3">
                        {b.receipt_url ? (
                          <button
                            type="button"
                            onClick={() => setZoomReceipt(b.receipt_url!)}
                            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 text-[11px] bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-400/20"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>مشاهده فیش</span>
                          </button>
                        ) : (
                          <span className="text-neutral-500 text-[11px]">بدون فیش</span>
                        )}
                      </td>

                      <td className="py-3.5 pl-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(b)}
                            className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-bold"
                          >
                            جزئیات
                          </button>

                          <a
                            href={`http://localhost:3000/voucher/${b.booking_code}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center gap-1 transition-colors"
                            title="مشاهده و چاپ واچر رسمی"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>واچر</span>
                          </a>

                          {b.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 shadow-sm flex items-center gap-1"
                                title="تایید قطعی و صدور واچر"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>تایید</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(b.id, 'rejected')}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-bold"
                                title="رد فیش"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====================================================================
          4. FULL DETAILS MODAL
         ==================================================================== */}
      {selectedBooking && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-2xl glass-panel-dark rounded-3xl border border-amber-400/30 p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs text-neutral-400 block">جزئیات کامل رزرواسیون</span>
                <span className="text-lg font-black text-white font-mono">{selectedBooking.booking_code}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="p-2 text-neutral-400 hover:text-white rounded-xl bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] space-y-1">
                <span className="text-neutral-400 block font-medium">نام مسافر:</span>
                <span className="text-white font-bold block text-sm">{selectedBooking.customer?.full_name}</span>
                <span className="text-neutral-400 font-mono block" dir="ltr">{selectedBooking.customer?.phone}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] space-y-1">
                <span className="text-neutral-400 block font-medium">هویت و ملیت:</span>
                <span className="text-amber-300 font-bold block">
                  {selectedBooking.nationality_type === 'foreigner'
                    ? `اتباع خارجی (${selectedBooking.nationality_country}) — پاسپورت: ${selectedBooking.national_id}`
                    : `کد ملی ایرانی: ${selectedBooking.national_id || 'ثبت نشده'}`}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] space-y-1">
                <span className="text-neutral-400 block font-medium">هتل و اقامتگاه:</span>
                <span className="text-amber-400 font-black block text-sm">{selectedBooking.hotel?.name}</span>
                <span className="text-neutral-300 font-bold block">{selectedBooking.room?.name}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] space-y-1">
                <span className="text-neutral-400 block font-medium">مبلغ کل سفارش:</span>
                <span className="text-white font-black font-mono block text-base text-amber-400">
                  {selectedBooking.total_amount_toman?.toLocaleString('fa-IR')} تومان
                </span>
                <span className="text-neutral-400 font-mono text-[11px] block" dir="ltr">
                  {(selectedBooking.total_amount_toman * 10).toLocaleString('fa-IR')} IRR
                </span>
              </div>
            </div>

            {/* Cancellation Request Information */}
            {selectedBooking.status === 'cancellation_requested' && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>درخواست لغو رزرو و بازپرداخت ۵۰٪ ثبت شده است:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white/[0.03]">
                    <span className="text-neutral-400 block">مبلغ استردادی (۵۰٪):</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      {Number(selectedBooking.refund_amount || (Number(selectedBooking.total_amount_toman) * 0.5)).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03]">
                    <span className="text-neutral-400 block">شماره کارت / شبا:</span>
                    <span className="font-mono text-amber-300 font-bold" dir="ltr">
                      {(selectedBooking as any).refund_card_number || 'ثبت نشده'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03]">
                    <span className="text-neutral-400 block">صاحب حساب:</span>
                    <span className="text-white font-bold">
                      {(selectedBooking as any).refund_account_holder || 'ثبت نشده'}
                    </span>
                  </div>
                </div>
                {(selectedBooking as any).cancellation_reason && (
                  <p className="text-[11px] text-neutral-300">
                    <b>علت انصراف:</b> {(selectedBooking as any).cancellation_reason}
                  </p>
                )}
              </div>
            )}

            {/* Receipt Preview if available */}
            {selectedBooking.receipt_url && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-amber-400 block">تصویر فیش واریزی مسافر (کلودفلر):</span>
                <div
                  onClick={() => setZoomReceipt(selectedBooking.receipt_url!)}
                  className="rounded-2xl overflow-hidden border border-white/10 max-h-72 bg-black flex items-center justify-center cursor-pointer relative group"
                >
                  <img
                    src={selectedBooking.receipt_url}
                    alt="فیش بانکی"
                    className="max-h-72 object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-2 transition-opacity">
                    <ZoomIn className="w-5 h-5 text-amber-400" />
                    <span>کلیک برای بزرگ‌نمایی کامل</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-white/10">
              <a
                href={`http://localhost:3000/voucher/${selectedBooking.booking_code}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:bg-amber-300 transition-all ml-auto"
              >
                <Printer className="w-4 h-4" />
                <span>مشاهده و چاپ واچر رسمی</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {selectedBooking.status === 'cancellation_requested' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'cancelled')}
                  className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-md shadow-rose-500/20"
                >
                  تأیید استرداد وجه و لغو قطعی
                </button>
              )}

              {selectedBooking.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'confirmed')}
                    className="gold-glow-btn px-6 py-2.5 rounded-xl text-xs font-black"
                  >
                    تایید قطعی و صدور واچر
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'rejected')}
                    className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-5 py-2.5 rounded-xl text-xs font-bold"
                  >
                    رد فیش و ابطال رزرو
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-neutral-300 text-xs font-bold"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ====================================================================
          5. ZOOM RECEIPT MODAL
         ==================================================================== */}
      {zoomReceipt && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setZoomReceipt(null)}
          >
            <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
              <button
                type="button"
                onClick={() => setZoomReceipt(null)}
                className="absolute -top-12 left-0 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={zoomReceipt}
                alt="بزرگ‌نمایی فیش"
                className="max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20"
              />
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
