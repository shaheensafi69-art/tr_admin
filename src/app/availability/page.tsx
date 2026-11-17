'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Lock,
  Unlock,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BedDouble,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Room } from '@/types/database';

interface RoomBlock {
  id: string;
  room_id: string;
  block_type: string;
  start_time: string;
  end_time: string;
  reason?: string;
  created_at: string;
  room?: Room;
}

export default function AvailabilityPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [blocks, setBlocks] = useState<RoomBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // New Block Form
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [blockType, setBlockType] = useState('maintenance');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();

    // 1. Fetch Rooms
    const { data: roomsData } = await supabase.from('rooms').select('*').order('display_order', { ascending: true });
    if (roomsData) {
      setRooms(roomsData);
      if (roomsData.length > 0 && !selectedRoomId) {
        setSelectedRoomId(roomsData[0].id);
      }
    }

    // 2. Fetch Room Blocks
    const { data: blocksData } = await supabase
      .from('room_blocks')
      .select('*, room:rooms(*)')
      .order('start_time', { ascending: true });

    if (blocksData) {
      setBlocks(blocksData as any);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // Default dates: today and tomorrow
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(tomorrow);
  }, []);

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId || !startDate || !endDate) return;
    setSubmitting(true);

    const supabase = getSupabaseClient();
    const { error } = await supabase.from('room_blocks').insert({
      room_id: selectedRoomId,
      block_type: blockType,
      start_time: `${startDate}T14:00:00Z`,
      end_time: `${endDate}T12:00:00Z`,
      reason: reason.trim() || 'مسدودی دستی توسط مدیریت هتل',
    });

    setSubmitting(false);
    if (error) {
      alert(`خطا در ایجاد مسدودی: ${error.message}`);
    } else {
      setReason('');
      fetchData();
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!confirm('آیا از بازگشایی و رفع مسدودی این اتاق در تاریخ‌های مشخص شده اطمینان دارید؟')) return;
    const supabase = getSupabaseClient();
    await supabase.from('room_blocks').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <CalendarDays className="w-7 h-7 text-amber-400" />
            <span>تقویم موجودی و مسدودی اتاق‌ها</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-medium">
            مدیریت تقویم خالی/پر بودن اتاق‌ها، مسدودسازی دستی جهت تعمیرات، نظافت یا رزروهای آفلاین حضوری
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2.5 rounded-2xl glass-panel text-xs font-bold text-neutral-300 hover:text-white flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>بروزرسانی</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form to Block Room Dates */}
        <div className="lg:col-span-5 glass-panel-dark rounded-3xl p-6 border border-white/10 space-y-6">
          <h2 className="text-base font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <Lock className="w-5 h-5 text-amber-400" />
            <span>مسدودسازی دستی تاریخ‌های اتاق</span>
          </h2>

          <form onSubmit={handleCreateBlock} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">انتخاب اتاق:</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs"
                required
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} (شماره {room.room_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">دلیل مسدودسازی:</label>
              <select
                value={blockType}
                onChange={(e) => setBlockType(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs"
              >
                <option value="maintenance">تعمیرات و بازسازی</option>
                <option value="cleaning">نظافت اساسی و ضدعفونی</option>
                <option value="manual_block">رزرو حضوری / آفلاین (پذیرش هتل)</option>
                <option value="vip_block">رزرو سازمانی و تشریفات VIP</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">از تاریخ:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono text-center"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">تا تاریخ:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono text-center"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">توضیحات تکمیلی (اختیاری):</label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full glass-input p-3 rounded-2xl text-xs leading-relaxed"
                placeholder="علت مسدودی را بنویسید..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full gold-glow-btn py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'در حال ثبت مسدودی...' : 'اعمال مسدودی در تقویم'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Active Blocks List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel-dark rounded-3xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>لیست تاریخ‌های مسدود شده فعال ({blocks.length})</span>
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                در حال بارگذاری مسدودی‌ها...
              </div>
            ) : blocks.length === 0 ? (
              <div className="p-12 text-center text-xs text-neutral-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
                <p>در حال حاضر هیچ تاریخ مسدودی دستی در سیستم ثبت نشده است.</p>
                <p className="text-[11px] text-neutral-500">تمامی اتاق‌ها طبق روال عادی برای رزرو در دسترس مسافران هستند.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {blocks.map((block) => {
                  const sDate = block.start_time ? block.start_time.split('T')[0] : '---';
                  const eDate = block.end_time ? block.end_time.split('T')[0] : '---';

                  const typeLabels: Record<string, string> = {
                    maintenance: 'تعمیرات و بازسازی',
                    cleaning: 'نظافت اساسی',
                    manual_block: 'رزرو حضوری آفلاین',
                    vip_block: 'رزرو تشریفات VIP',
                  };

                  return (
                    <div
                      key={block.id}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 font-black text-white">
                          <BedDouble className="w-4 h-4 text-amber-400" />
                          <span>{block.room?.name || 'اتاق'} (شماره {block.room?.room_number || '---'})</span>
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                            {typeLabels[block.block_type] || block.block_type}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-mono" dir="ltr">
                          <span>{sDate}</span>
                          <span>تا</span>
                          <span>{eDate}</span>
                        </div>

                        {block.reason && (
                          <p className="text-[11px] text-neutral-300">علت: {block.reason}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(block.id)}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors self-end sm:self-center"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>رفع مسدودی</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

