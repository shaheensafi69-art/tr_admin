'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  BedDouble,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Coins,
  Users,
  Maximize2,
  Eye,
  EyeOff,
  Save,
  X,
  UploadCloud,
  AlertCircle,
  RefreshCw,
  Building,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Room, RoomPricing, RoomType } from '@/types/database';
import ModalPortal from '@/components/common/ModalPortal';

interface RoomWithPrice extends Room {
  pricing?: RoomPricing;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomWithPrice[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [selectedHotelFilter, setSelectedHotelFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState<Partial<RoomWithPrice> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hotelId, setHotelId] = useState<string>('e0000000-0000-0000-0000-000000000001');

  // 3 Room Photos (User Request: ۲ تا ۳ عکس برای هر اتاق)
  const [roomPhotos, setRoomPhotos] = useState<string[]>(['', '', '']);
  const [uploadingRoomSlot, setUploadingRoomSlot] = useState<number | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();

    // 1. Fetch Hotels
    const { data: hotelsData } = await supabase.from('hotels').select('*').order('name');
    if (hotelsData) {
      setHotels(hotelsData);
      if (hotelsData.length > 0 && !hotelId) {
        setHotelId(hotelsData[0].id);
      }
    }

    // 2. Fetch rooms and their active pricing
    const { data: roomsData } = await supabase
      .from('rooms')
      .select('*, hotel:hotels(name)')
      .order('display_order', { ascending: true });

    if (roomsData) {
      const roomIds = roomsData.map((r) => r.id);
      const { data: pricingData } = await supabase
        .from('room_pricing')
        .select('*')
        .in('room_id', roomIds)
        .eq('is_active', true);

      const combined = roomsData.map((room) => {
        const pricing = pricingData?.find((p) => p.room_id === room.id);
        return { ...room, pricing };
      });

      setRooms(combined);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleOpenAddModal = () => {
    setRoomPhotos([
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80',
    ]);
    setEditingRoom({
      hotel_id: hotelId,
      name: '',
      room_number: '',
      room_type: 'double',
      bed_type: 'یک تخت دو نفره کینگ‌سایز',
      standard_capacity: 2,
      max_capacity: 3,
      size_sqm: 28,
      cover_image: '',
      description: '',
      status: 'available',
      breakfast_type: 'included',
      breakfast_price: 0,
      is_hourly_available: true,
      is_published: true,
      display_order: (rooms.length + 1) * 10,
      pricing: {
        id: '',
        room_id: '',
        currency: 'TOMAN',
        daily_price: 2000000,
        hourly_price: 450000,
        discount_percentage: 0,
        special_price: 2000000,
        is_active: true,
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (room: RoomWithPrice) => {
    const existing = Array.isArray(room.images) && room.images.length > 0 ? room.images : [room.cover_image];
    setRoomPhotos([
      existing[0] || room.cover_image || '',
      existing[1] || '',
      existing[2] || '',
    ]);
    setEditingRoom({
      ...room,
      pricing: room.pricing || {
        id: '',
        room_id: room.id,
        currency: 'TOMAN',
        daily_price: 2000000,
        hourly_price: 400000,
        discount_percentage: 0,
        special_price: 2000000,
        is_active: true,
      },
    });
    setIsModalOpen(true);
  };

  const handleRoomPhotoUpload = async (slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingRoomSlot(slotIndex);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'rooms');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        const next = [...roomPhotos];
        next[slotIndex] = data.url;
        setRoomPhotos(next);
        if (slotIndex === 0 && editingRoom) {
          setEditingRoom({ ...editingRoom, cover_image: data.url });
        }
      } else {
        alert(data.error || 'خطا در آپلود عکس به کلودفلر');
      }
    } catch {
      alert('خطا در برقراری ارتباط با سرور آپلود کلودفلر');
    } finally {
      setUploadingRoomSlot(null);
    }
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    setSaving(true);

    const supabase = getSupabaseClient();
    let savedRoomId = editingRoom.id;
    const cleanPhotos = roomPhotos.map((p) => p.trim()).filter(Boolean);
    const primaryCover = cleanPhotos[0] || editingRoom.cover_image || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80';

    if (!savedRoomId) {
      // Create new room
      const { data: newRoom, error: createError } = await supabase
        .from('rooms')
        .insert({
          hotel_id: editingRoom.hotel_id || hotelId,
          name: editingRoom.name,
          room_number: editingRoom.room_number || '101',
          room_type: editingRoom.room_type || 'double',
          bed_type: editingRoom.bed_type || 'تخت استاندارد',
          standard_capacity: editingRoom.standard_capacity || 2,
          max_capacity: editingRoom.max_capacity || 2,
          size_sqm: editingRoom.size_sqm || 25,
          cover_image: primaryCover,
          images: cleanPhotos.length > 0 ? cleanPhotos : [primaryCover],
          description: editingRoom.description || '',
          status: editingRoom.status || 'available',
          breakfast_type: editingRoom.breakfast_type || 'included',
          breakfast_price: 0,
          check_in_time: editingRoom.check_in_time || '14:00',
          check_out_time: editingRoom.check_out_time || '12:00',
          is_hourly_available: editingRoom.is_hourly_available ?? true,
          is_published: editingRoom.is_published ?? true,
          display_order: editingRoom.display_order || 10,
        })
        .select()
        .single();

      if (createError) {
        alert(`خطا در ایجاد اتاق: ${createError.message}`);
        setSaving(false);
        return;
      }
      savedRoomId = newRoom.id;
    } else {
      // Update existing room
      const { error: updateError } = await supabase
        .from('rooms')
        .update({
          hotel_id: editingRoom.hotel_id,
          name: editingRoom.name,
          room_number: editingRoom.room_number,
          room_type: editingRoom.room_type,
          bed_type: editingRoom.bed_type,
          standard_capacity: editingRoom.standard_capacity,
          max_capacity: editingRoom.max_capacity,
          size_sqm: editingRoom.size_sqm,
          cover_image: primaryCover,
          images: cleanPhotos.length > 0 ? cleanPhotos : [primaryCover],
          description: editingRoom.description,
          is_hourly_available: editingRoom.is_hourly_available,
          is_published: editingRoom.is_published,
          status: editingRoom.status,
          check_in_time: editingRoom.check_in_time || '14:00',
          check_out_time: editingRoom.check_out_time || '12:00',
          updated_at: new Date().toISOString(),
        })
        .eq('id', savedRoomId);

      if (updateError) {
        alert(`خطا در ویرایش اتاق: ${updateError.message}`);
        setSaving(false);
        return;
      }
    }

    // Save Pricing
    const dailyPrice = Number(editingRoom.pricing?.daily_price) || 2000000;
    const discount = Number(editingRoom.pricing?.discount_percentage) || 0;
    const specialPrice = discount > 0 ? Math.round(dailyPrice * (1 - discount / 100)) : dailyPrice;
    const hourlyPrice = Number(editingRoom.pricing?.hourly_price) || 400000;

    if (editingRoom.pricing?.id) {
      const { error: priceError } = await supabase
        .from('room_pricing')
        .update({
          daily_price: dailyPrice,
          hourly_price: hourlyPrice,
          discount_percentage: discount,
          special_price: specialPrice,
        })
        .eq('id', editingRoom.pricing.id);
      if (priceError) console.error('Price update error:', priceError);
    } else {
      const { error: priceError } = await supabase.from('room_pricing').insert({
        room_id: savedRoomId,
        daily_price: dailyPrice,
        hourly_price: hourlyPrice,
        discount_percentage: discount,
        special_price: specialPrice,
        currency: 'TOMAN',
        is_active: true,
      });
      if (priceError) console.error('Price insert error:', priceError);
    }

    setSaving(false);
    setIsModalOpen(false);
    setEditingRoom(null);
    setSaveToast({ type: 'success', message: 'مشخصات اتاق و قیمت‌گذاری با موفقیت در دیتابیس ذخیره شد.' });
    setTimeout(() => setSaveToast(null), 4000);
    fetchRooms();
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`آیا از حذف اتاق «${roomName}» مطمئن هستید؟ این عملیات قابل بازگشت نیست.`)) return;
    const supabase = getSupabaseClient();
    await supabase.from('room_pricing').delete().eq('room_id', roomId);
    const { error } = await supabase.from('rooms').delete().eq('id', roomId);
    if (error) {
      alert(`خطا در حذف اتاق: ${error.message}`);
    } else {
      setSaveToast({ type: 'success', message: `اتاق «${roomName}» با موفقیت حذف گردید.` });
      setTimeout(() => setSaveToast(null), 4000);
      fetchRooms();
    }
  };

  const handleTogglePublish = async (roomId: string, currentStatus: boolean) => {
    const supabase = getSupabaseClient();
    await supabase.from('rooms').update({ is_published: !currentStatus }).eq('id', roomId);
    fetchRooms();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingRoom) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'rooms');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setEditingRoom({ ...editingRoom, cover_image: data.url });
      } else {
        alert(data.error || 'خطا در آپلود عکس به کلودفلر');
      }
    } catch {
      alert('خطا در برقراری ارتباط با سرور آپلود کلودفلر');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <BedDouble className="w-7 h-7 text-amber-400" />
            <span>مدیریت اتاق‌ها و قیمت‌گذاری</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-medium">
            تعریف انواع اتاق، آپلود تصاویر اختصاصی، تنظیم نرخ روزانه، ساعتی و تخفیف‌های ویژه
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchRooms}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl glass-panel text-xs font-bold text-neutral-300 hover:text-white flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="gold-glow-btn px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن اتاق جدید</span>
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 border shadow-lg transition-all ${
          saveToast.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-black">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{saveToast.message}</span>
          </div>
          <button type="button" onClick={() => setSaveToast(null)} className="text-white/60 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hotel Filter Tabs */}
      {hotels.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setSelectedHotelFilter('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              selectedHotelFilter === 'all'
                ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20'
                : 'glass-panel text-neutral-300 hover:text-white'
            }`}
          >
            همه هتل‌ها ({rooms.length} اتاق)
          </button>
          {hotels.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setSelectedHotelFilter(h.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                selectedHotelFilter === h.id
                  ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20'
                  : 'glass-panel text-neutral-300 hover:text-white'
              }`}
            >
              {h.name}
            </button>
          ))}
        </div>
      )}

      {/* Rooms Grid */}
      {loading ? (
        <div className="glass-panel p-16 text-center text-neutral-400 text-sm">
          در حال بارگذاری لیست اتاق‌ها...
        </div>
      ) : rooms.filter((r) => selectedHotelFilter === 'all' || r.hotel_id === selectedHotelFilter).length === 0 ? (
        <div className="glass-panel p-16 text-center text-neutral-400 text-sm space-y-4">
          <p>هنوز اتاقی برای این هتل ثبت نشده است.</p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="gold-glow-btn px-6 py-2.5 rounded-2xl text-xs font-black"
          >
            افزودن اولین اتاق
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms
            .filter((r) => selectedHotelFilter === 'all' || r.hotel_id === selectedHotelFilter)
            .map((room) => {
            const dailyPrice = room.pricing?.special_price || room.pricing?.daily_price || 0;
            const hourlyPrice = room.pricing?.hourly_price || 0;
            const hasDiscount = (room.pricing?.discount_percentage || 0) > 0;

            return (
              <div
                key={room.id}
                className="glass-panel-dark rounded-3xl overflow-hidden flex flex-col border border-white/10 shadow-xl transition-all hover:border-amber-400/30"
              >
                {/* Photo & Badges */}
                <div className="relative w-full h-48 bg-neutral-900 overflow-hidden">
                  {room.cover_image ? (
                    <Image
                      src={room.cover_image}
                      alt={room.name}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">
                      بدون عکس
                    </div>
                  )}

                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md border ${
                        room.is_published
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {room.is_published ? 'منتشر شده' : 'پیش‌نویس (مخفی)'}
                    </span>

                    {hasDiscount && (
                      <span className="text-[10px] font-black bg-rose-500 text-white px-2.5 py-1 rounded-full">
                        {room.pricing?.discount_percentage}٪ تخفیف
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold text-white border border-white/10">
                    شماره اتاق: {room.room_number || '---'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 bg-amber-400/10 px-2.5 py-0.5 rounded-full w-fit border border-amber-400/20">
                      <Building className="w-3 h-3 text-amber-400" />
                      <span>{(room as any).hotel?.name || 'هتل تابان تهران'}</span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-black text-white">{room.name}</h3>
                      <div className="text-[11px] font-bold text-neutral-400 flex items-center gap-1 shrink-0">
                        <Maximize2 className="w-3 h-3 text-amber-400" />
                        <span>{room.size_sqm} متر</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px] text-neutral-300 font-medium">
                      <span className="bg-white/[0.04] px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                        <Users className="w-3 h-3 text-amber-400" />
                        ظرفیت: {room.standard_capacity} نفر
                      </span>
                      <span className="bg-white/[0.04] px-2 py-1 rounded-lg border border-white/10">
                        {room.bed_type}
                      </span>
                      {room.is_hourly_available && (
                        <span className="bg-cyan-500/10 text-cyan-300 px-2 py-1 rounded-lg border border-cyan-500/20">
                          رزرو ساعتی فعال
                        </span>
                      )}
                      <span className="bg-amber-400/10 text-amber-300 px-2 py-1 rounded-lg border border-amber-400/20">
                        ورود: {(room as any).check_in_time || '۱۴:۰۰'} | خروج: {(room as any).check_out_time || '۱۲:۰۰'}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {room.description || 'بدون توضیحات اضافی'}
                    </p>
                  </div>

                  {/* Pricing Overview */}
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400 font-medium flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        نرخ هر شب:
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-black text-amber-400">
                          {dailyPrice.toLocaleString('fa-IR')}
                        </span>{' '}
                        <span className="text-[10px] text-neutral-400 font-bold">تومان</span>
                      </div>
                    </div>

                    {room.is_hourly_available && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          نرخ هر ساعت:
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-black text-cyan-400">
                            {hourlyPrice.toLocaleString('fa-IR')}
                          </span>{' '}
                          <span className="text-[10px] text-neutral-400 font-bold">تومان</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(room.id, room.is_published)}
                        className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                          room.is_published
                            ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                        }`}
                        title={room.is_published ? 'غیرفعال‌سازی موقت' : 'فعال‌سازی در سایت'}
                      >
                        {room.is_published ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-rose-400" />}
                        <span className="hidden sm:inline">{room.is_published ? 'منتشر' : 'مخفی'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRoom(room.id, room.name)}
                        className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/25 transition-colors"
                        title="حذف اتاق"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(room)}
                      className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 hover:bg-amber-300 transition-colors shadow-sm"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>ویرایش و قیمت</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ====================================================================
          MODAL: ADD / EDIT ROOM & PRICING
         ==================================================================== */}
      {isModalOpen && editingRoom && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-3xl glass-panel-dark rounded-3xl border border-amber-400/30 p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-amber-400" />
                <span>{editingRoom.id ? 'ویرایش اتاق و قیمت‌گذاری' : 'افزودن اتاق جدید'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-xl bg-white/[0.05]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                  <label className="text-xs font-bold text-amber-300">انتخاب هتل مربوطه:</label>
                  <select
                    value={editingRoom.hotel_id || hotelId}
                    onChange={(e) => setEditingRoom({ ...editingRoom, hotel_id: e.target.value })}
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-bold"
                  >
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">نام اتاق (فارسی):</label>
                  <input
                    type="text"
                    value={editingRoom.name || ''}
                    onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs"
                    placeholder="مثال: اتاق دوتخته دبل دلوکس"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">شماره / کد اتاق:</label>
                  <input
                    type="text"
                    value={editingRoom.room_number || ''}
                    onChange={(e) => setEditingRoom({ ...editingRoom, room_number: e.target.value })}
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono text-center"
                    placeholder="مثال: 204"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">نوع اتاق:</label>
                  <select
                    value={editingRoom.room_type || 'double'}
                    onChange={(e) => setEditingRoom({ ...editingRoom, room_type: e.target.value as RoomType })}
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs"
                  >
                    <option value="single">یک‌تخته (Single)</option>
                    <option value="double">دوتخته دبل (Double)</option>
                    <option value="twin">دوتخته توئین (Twin)</option>
                    <option value="triple">سه‌تخته (Triple)</option>
                    <option value="suite">سوئیت لوکس (Suite)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">نوع تخت‌خواب:</label>
                  <input
                    type="text"
                    value={editingRoom.bed_type || ''}
                    onChange={(e) => setEditingRoom({ ...editingRoom, bed_type: e.target.value })}
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs"
                    placeholder="یک تخت دبل کینگ‌سایز"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">ظرفیت استاندارد (نفر):</label>
                  <input
                    type="number"
                    value={editingRoom.standard_capacity || 2}
                    onChange={(e) => setEditingRoom({ ...editingRoom, standard_capacity: parseInt(e.target.value) || 1 })}
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono text-center"
                    min={1}
                    max={10}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">حداکثر ظرفیت با سرویس اضافه:</label>
                  <input
                    type="number"
                    value={editingRoom.max_capacity || 2}
                    onChange={(e) => setEditingRoom({ ...editingRoom, max_capacity: parseInt(e.target.value) || 1 })}
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono text-center"
                    min={1}
                    max={10}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">متراژ اتاق (متر مربع):</label>
                  <input
                    type="number"
                    value={editingRoom.size_sqm || 25}
                    onChange={(e) => setEditingRoom({ ...editingRoom, size_sqm: parseInt(e.target.value) || 20 })}
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono text-center"
                    min={10}
                    max={200}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-300">ساعت تحویل اتاق (Check-in):</label>
                  <input
                    type="text"
                    value={editingRoom.check_in_time || '14:00'}
                    onChange={(e) => setEditingRoom({ ...editingRoom, check_in_time: e.target.value })}
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono text-center"
                    placeholder="14:00"
                  />
                  <span className="text-[10px] text-neutral-400 block">پیش‌فرض: ساعت ۱۴:۰۰</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-300">ساعت تخلیه اتاق (Check-out):</label>
                  <input
                    type="text"
                    value={editingRoom.check_out_time || '12:00'}
                    onChange={(e) => setEditingRoom({ ...editingRoom, check_out_time: e.target.value })}
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono text-center"
                    placeholder="12:00"
                  />
                  <span className="text-[10px] text-neutral-400 block">حداکثر تا ساعت ۱۲:۰۰ ظهر</span>
                </div>

                <div className="space-y-1.5 flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="modal_hourly"
                    checked={editingRoom.is_hourly_available ?? true}
                    onChange={(e) => setEditingRoom({ ...editingRoom, is_hourly_available: e.target.checked })}
                    className="w-5 h-5 accent-amber-400 rounded-lg cursor-pointer"
                  />
                  <label htmlFor="modal_hourly" className="text-xs font-bold text-cyan-300 cursor-pointer">
                    امکان رزرو ساعتی فعال باشد
                  </label>
                </div>

                <div className="space-y-1.5 flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="modal_published"
                    checked={editingRoom.is_published ?? true}
                    onChange={(e) => setEditingRoom({ ...editingRoom, is_published: e.target.checked })}
                    className="w-5 h-5 accent-amber-400 rounded-lg cursor-pointer"
                  />
                  <label htmlFor="modal_published" className="text-xs font-bold text-emerald-300 cursor-pointer">
                    نمایش عمومی در وب‌سایت
                  </label>
                </div>
              </div>

              {/* 3 Room Photos (User Request: ۲ تا ۳ عکس برای هر اتاق) */}
              <div className="space-y-4 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 block">
                    عکس‌های اتاق (۲ الی ۳ عکس باکیفیت از تخت، سرویس و زاویه دوم):
                  </label>
                  <span className="text-[11px] font-mono text-amber-400">۳ اسلات تصویر</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'عکس ۱: تخت و نمای اصلی (کاور)', desc: 'کاور اصلی اتاق' },
                    { label: 'عکس ۲: سرویس بهداشتی و حمام', desc: 'سرویس و امکانات بهداشتی' },
                    { label: 'عکس ۳: بالکن، ویو یا زاویه دوم', desc: 'پنجره، نشیمن یا چشم‌انداز' },
                  ].map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">{slot.label}</span>
                        <span className="text-[10px] text-neutral-400 block">{slot.desc}</span>
                      </div>

                      <div className="relative w-full h-24 rounded-xl overflow-hidden bg-neutral-900 border border-white/10">
                        {roomPhotos[idx] ? (
                          <Image src={roomPhotos[idx]} alt={`room-slot-${idx}`} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 text-xs gap-1">
                            <BedDouble className="w-5 h-5 opacity-40" />
                            <span className="text-[10px]">بدون عکس</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={roomPhotos[idx]}
                          onChange={(e) => {
                            const next = [...roomPhotos];
                            next[idx] = e.target.value;
                            setRoomPhotos(next);
                            if (idx === 0 && editingRoom) {
                              setEditingRoom({ ...editingRoom, cover_image: e.target.value });
                            }
                          }}
                          placeholder="URL تصویر..."
                          className="w-full glass-input px-2.5 py-1.5 rounded-xl text-xs font-mono"
                          dir="ltr"
                        />

                        <label className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl glass-panel text-[11px] font-bold text-amber-300 hover:text-white cursor-pointer transition-colors border border-amber-400/20">
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>
                            {uploadingRoomSlot === idx ? 'در حال آپلود...' : 'آپلود در R2'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleRoomPhotoUpload(idx, e)}
                            className="hidden"
                            disabled={uploadingRoomSlot !== null}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 pt-3 border-t border-white/10">
                <label className="text-xs font-bold text-neutral-300">توضیحات و امکانات اختصاصی اتاق:</label>
                <textarea
                  rows={3}
                  value={editingRoom.description || ''}
                  onChange={(e) => setEditingRoom({ ...editingRoom, description: e.target.value })}
                  className="w-full glass-input p-3 rounded-2xl text-xs leading-relaxed"
                  placeholder="نورپردازی آرامش‌بخش، تلویزیون ۵۰ اینچ، سیستم تهویه، بالکن با ویو شهری..."
                />
              </div>

              {/* Pricing Section */}
              <div className="p-4 rounded-2xl bg-amber-400/[0.04] border border-amber-400/30 space-y-4">
                <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>تنظیم نرخ و تعرفه اقامت (به تومان)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">نرخ پایه هر شب (تومان):</label>
                    <input
                      type="number"
                      value={editingRoom.pricing?.daily_price || 2000000}
                      onChange={(e) =>
                        setEditingRoom({
                          ...editingRoom,
                          pricing: {
                            ...editingRoom.pricing!,
                            daily_price: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono text-center font-bold"
                      step={50000}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">درصد تخفیف ویژه (٪):</label>
                    <input
                      type="number"
                      value={editingRoom.pricing?.discount_percentage || 0}
                      onChange={(e) =>
                        setEditingRoom({
                          ...editingRoom,
                          pricing: {
                            ...editingRoom.pricing!,
                            discount_percentage: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono text-center"
                      min={0}
                      max={90}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-cyan-300">نرخ هر ساعت اقامت (تومان):</label>
                    <input
                      type="number"
                      value={editingRoom.pricing?.hourly_price || 400000}
                      onChange={(e) =>
                        setEditingRoom({
                          ...editingRoom,
                          pricing: {
                            ...editingRoom.pricing!,
                            hourly_price: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono text-center font-bold"
                      step={20000}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl glass-panel text-xs font-bold text-neutral-400 hover:text-white"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="gold-glow-btn px-7 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/25"
                >
                  <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                  <span>{saving ? 'در حال ذخیره‌سازی...' : 'ذخیره مشخصات اتاق'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}

