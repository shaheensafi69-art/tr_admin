'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Hotel,
  Save,
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  UploadCloud,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Hotel as HotelType } from '@/types/database';

export default function HotelsPage() {
  const [hotels, setHotels] = useState<HotelType[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<HotelType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Rule / FAQ inputs
  const [newRule, setNewRule] = useState('');
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // Quick Add Hotel Modal State (4 Photos - User Request)
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addStars, setAddStars] = useState(5);
  const [addAddress, setAddAddress] = useState('');
  const [addPhone, setAddPhone] = useState('+98 21 ');
  const [addGoogleMapsUrl, setAddGoogleMapsUrl] = useState('');
  const [addCheckInTime, setAddCheckInTime] = useState('14:00');
  const [addCheckOutTime, setAddCheckOutTime] = useState('12:00');
  const [addRules, setAddRules] = useState<string[]>([
    'ساعت تحویل اتاق از ساعت ۱۴:۰۰ و ساعت تخلیه حداکثر تا ساعت ۱۲:۰۰ ظهر می‌باشد.',
    'اقامت کودکان تا ۵ سال تمام کاملاً رایگان، ۵ تا ۱۰ سال نیم‌بها، و از ۱۰ سال به بالا نفر کامل محاسبه می‌گردد.',
    'شرایط لغو و کنسلی: تا ۲۴ ساعت قبل از ساعت ورود با عودت ۵۰٪ مبلغ و کمتر از ۲۴ ساعت غیرقابل استرداد می‌باشد.',
    'همراه داشتن اصل مدارک شناسایی معتبر (شناسنامه / کارت ملی برای ایرانیان و پاسپورت برای اتباع خارجی) الزامی است.'
  ]);
  const [newAddRuleInput, setNewAddRuleInput] = useState('');
  const [addPhotos, setAddPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
  ]);
  const [addDescription, setAddDescription] = useState('');
  const [creatingHotel, setCreatingHotel] = useState(false);
  const [uploadingAddSlot, setUploadingAddSlot] = useState<number | null>(null);
  const [uploadingEditSlot, setUploadingEditSlot] = useState<number | null>(null);

  const fetchHotels = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('hotels').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      setHotels(data);
      if (data.length > 0) {
        setSelectedHotel(data[0]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel) return;
    setSaving(true);
    setSaveStatus(null);

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('hotels')
      .update({
        name: selectedHotel.name,
        slug: selectedHotel.slug,
        stars: selectedHotel.stars,
        address: selectedHotel.address,
        phone: selectedHotel.phone,
        email: selectedHotel.email,
        google_maps_url: selectedHotel.google_maps_url,
        latitude: selectedHotel.latitude,
        longitude: selectedHotel.longitude,
        check_in_time: selectedHotel.check_in_time,
        check_out_time: selectedHotel.check_out_time,
        hourly_start_time: selectedHotel.hourly_start_time,
        hourly_end_time: selectedHotel.hourly_end_time,
        min_hourly_duration: selectedHotel.min_hourly_duration,
        max_hourly_duration: selectedHotel.max_hourly_duration,
        short_description: selectedHotel.short_description,
        description: selectedHotel.description,
        cover_image: selectedHotel.cover_image,
        images: Array.isArray(selectedHotel.images) && selectedHotel.images.length > 0
          ? selectedHotel.images
          : selectedHotel.cover_image
          ? [selectedHotel.cover_image]
          : [],
        rules: selectedHotel.rules,
        faq: selectedHotel.faq,
        is_published: selectedHotel.is_published,
        is_featured: selectedHotel.is_featured,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedHotel.id);

    setSaving(false);
    if (error) {
      setSaveStatus({ type: 'error', message: `خطا در ذخیره تغییرات: ${error.message}` });
    } else {
      setSaveStatus({ type: 'success', message: 'اطلاعات هتل با موفقیت در دیتابیس بروزرسانی شد.' });
      setTimeout(() => setSaveStatus(null), 4000);
      fetchHotels();
    }
  };

  const handleAddRule = () => {
    if (!newRule.trim() || !selectedHotel) return;
    setSelectedHotel({
      ...selectedHotel,
      rules: [...(selectedHotel.rules || []), newRule.trim()],
    });
    setNewRule('');
  };

  const handleRemoveRule = (index: number) => {
    if (!selectedHotel) return;
    const updated = [...(selectedHotel.rules || [])];
    updated.splice(index, 1);
    setSelectedHotel({ ...selectedHotel, rules: updated });
  };

  const handleAddFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim() || !selectedHotel) return;
    setSelectedHotel({
      ...selectedHotel,
      faq: [...(selectedHotel.faq || []), { question: newFaqQ.trim(), answer: newFaqA.trim() }],
    });
    setNewFaqQ('');
    setNewFaqA('');
  };

  const handleRemoveFaq = (index: number) => {
    if (!selectedHotel) return;
    const updated = [...(selectedHotel.faq || [])];
    updated.splice(index, 1);
    setSelectedHotel({ ...selectedHotel, faq: updated });
  };

  // Upload handler for Edit Hotel Photo Slots (4 Slots)
  const handleEditPhotoUpload = async (slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedHotel) return;

    setUploadingEditSlot(slotIndex);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'hotels');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        const curImages = Array.isArray(selectedHotel.images) ? [...selectedHotel.images] : [];
        while (curImages.length < 4) curImages.push('');
        curImages[slotIndex] = data.url;

        setSelectedHotel({
          ...selectedHotel,
          cover_image: slotIndex === 0 ? data.url : selectedHotel.cover_image,
          images: curImages,
        });
      } else {
        alert(data.error || 'خطا در آپلود عکس به کلودفلر');
      }
    } catch {
      alert('خطا در ارتباط با سرور آپلود');
    } finally {
      setUploadingEditSlot(null);
    }
  };

  // Upload handler for Add Hotel Photo Slots (4 Slots)
  const handleAddPhotoUpload = async (slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAddSlot(slotIndex);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'hotels');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        const next = [...addPhotos];
        next[slotIndex] = data.url;
        setAddPhotos(next);
      } else {
        alert(data.error || 'خطا در آپلود عکس به کلودفلر');
      }
    } catch {
      alert('خطا در آپلود عکس');
    } finally {
      setUploadingAddSlot(null);
    }
  };

  const handleCreateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;

    setCreatingHotel(true);
    const supabase = getSupabaseClient();
    const cleanSlug = `hotel-${Date.now()}`;
    const cleanPhotos = addPhotos.map((p) => p.trim()).filter(Boolean);
    const primaryCover = cleanPhotos[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80';

    const { data: newHotel, error } = await supabase
      .from('hotels')
      .insert({
        name: addName.trim(),
        slug: cleanSlug,
        province_id: 'c0000000-0000-0000-0000-000000000001',
        city_id: 'd0000000-0000-0000-0000-000000000001',
        stars: addStars,
        address: addAddress.trim() || 'تهران',
        google_maps_url: addGoogleMapsUrl.trim() || `https://maps.google.com/?q=${encodeURIComponent(addName.trim())}`,
        phone: addPhone.trim() || '+98 21 9100 8899',
        cover_image: primaryCover,
        images: cleanPhotos.length > 0 ? cleanPhotos : [primaryCover],
        short_description: addDescription.trim() || 'هتل برگزیده و مجلل در تهران‌روم',
        description: addDescription.trim() || 'اقامتی خاطره‌انگیز و لوکس در محیطی آرامش‌بخش.',
        check_in_time: addCheckInTime.trim() || '14:00',
        check_out_time: addCheckOutTime.trim() || '12:00',
        hourly_start_time: '08:00',
        hourly_end_time: '22:00',
        min_hourly_duration: 3,
        max_hourly_duration: 12,
        rules: addRules.length > 0 ? addRules : ['ارائه مدارک شناسایی معتبر الزامی است'],
        faq: [{ question: 'آیا هتل پارکینگ دارد؟', answer: 'بله، پارکینگ اختصاصی موجود است.' }],
        is_published: true,
        is_featured: true,
      })
      .select()
      .single();

    setCreatingHotel(false);

    if (error) {
      alert(`خطا در ایجاد هتل: ${error.message}`);
    } else {
      setIsAddOpen(false);
      setAddName('');
      setAddAddress('');
      setAddPhotos(['', '', '', '']);
      setAddDescription('');
      fetchHotels();
      if (newHotel) {
        setSelectedHotel(newHotel);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Hotel className="w-7 h-7 text-amber-400" />
            <span>مدیریت اطلاعات و تنظیمات هتل‌ها</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-medium">
            ویرایش مشخصات عمومی، ستاره، لوکیشن، عکس‌ها، ساعات ورود و خروج، رزرو ساعتی، قوانین و سوالات متداول هتل
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchHotels}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl glass-panel text-xs font-bold text-neutral-300 hover:text-white flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="gold-glow-btn px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن هتل جدید</span>
          </button>
        </div>
      </div>

      {saveStatus && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold ${
            saveStatus.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {saveStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {loading ? (
        <div className="glass-panel p-16 text-center text-neutral-400 text-sm">
          در حال بارگذاری اطلاعات هتل‌ها...
        </div>
      ) : selectedHotel ? (
        <form onSubmit={handleSave} className="space-y-8">
          {/* Hotel Selector (if multiple) */}
          {hotels.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {hotels.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedHotel(h)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    selectedHotel.id === h.id
                      ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20'
                      : 'glass-panel text-neutral-300 hover:text-white'
                  }`}
                >
                  {h.name}
                </button>
              ))}
            </div>
          )}

          {/* 1. BASIC HOTEL IDENTITY */}
          <div className="glass-panel-dark rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>مشخصات اصلی هتل</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">نام هتل (فارسی):</label>
                <input
                  type="text"
                  value={selectedHotel.name}
                  onChange={(e) => setSelectedHotel({ ...selectedHotel, name: e.target.value })}
                  className="w-full glass-input px-4 py-2.5 rounded-2xl text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">شناسه آدرس اینترنتی (Slug):</label>
                <input
                  type="text"
                  value={selectedHotel.slug}
                  onChange={(e) => setSelectedHotel({ ...selectedHotel, slug: e.target.value })}
                  className="w-full glass-input px-4 py-2.5 rounded-2xl text-xs font-mono"
                  dir="ltr"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">درجه و تعداد ستاره (۱ تا ۵):</label>
                <select
                  value={selectedHotel.stars}
                  onChange={(e) => setSelectedHotel({ ...selectedHotel, stars: parseInt(e.target.value) || 4 })}
                  className="w-full glass-input px-4 py-2.5 rounded-2xl text-xs"
                >
                  <option value={1}>۱ ستاره</option>
                  <option value={2}>۲ ستاره</option>
                  <option value={3}>۳ ستاره</option>
                  <option value={4}>۴ ستاره لوکس</option>
                  <option value={5}>۵ ستاره تاپ</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">شماره تلفن هتل (با کد کشور):</label>
                <input
                  type="text"
                  value={selectedHotel.phone}
                  onChange={(e) => setSelectedHotel({ ...selectedHotel, phone: e.target.value })}
                  className="w-full glass-input px-4 py-2.5 rounded-2xl text-xs font-mono"
                  dir="ltr"
                  placeholder="+98 21 9100 8899"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">ایمیل پشتیبانی هتل:</label>
                <input
                  type="email"
                  value={selectedHotel.email || ''}
                  onChange={(e) => setSelectedHotel({ ...selectedHotel, email: e.target.value })}
                  className="w-full glass-input px-4 py-2.5 rounded-2xl text-xs font-mono"
                  dir="ltr"
                  placeholder="info@hotel-taban.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">لینک مسیریابی گوگل مپس (Google Maps):</label>
                <input
                  type="text"
                  value={selectedHotel.google_maps_url || ''}
                  onChange={(e) => setSelectedHotel({ ...selectedHotel, google_maps_url: e.target.value })}
                  className="w-full glass-input px-4 py-2.5 rounded-2xl text-xs font-mono"
                  dir="ltr"
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">نشانی دقیق هتل (آدرس پستی):</label>
                <input
                  type="text"
                  value={selectedHotel.address}
                  onChange={(e) => setSelectedHotel({ ...selectedHotel, address: e.target.value })}
                  className="w-full glass-input px-4 py-2.5 rounded-2xl text-xs"
                  required
                />
              </div>
            </div>
          </div>

          {/* 2. TIMINGS & HOURLY SETTINGS */}
          <div className="glass-panel-dark rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>تنظیمات ساعات تحویل، تخلیه و رزرو ساعتی</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">ساعت تحویل روزانه (Check-in):</label>
                <input
                  type="text"
                  value={selectedHotel.check_in_time}
                  onChange={(e) => setSelectedHotel({ ...selectedHotel, check_in_time: e.target.value })}
                  className="w-full glass-input px-4 py-2.5 rounded-2xl text-xs font-mono text-center"
                  placeholder="14:00"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">ساعت تخلیه روزانه (Check-out):</label>
                <input
                  type="text"
                  value={selectedHotel.check_out_time}
                  onChange={(e) => setSelectedHotel({ ...selectedHotel, check_out_time: e.target.value })}
                  className="w-full glass-input px-4 py-2.5 rounded-2xl text-xs font-mono text-center"
                  placeholder="12:00"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">شروع بازه رزرو ساعتی:</label>
                <input
                  type="text"
                  value={selectedHotel.hourly_start_time || '08:00'}
                  onChange={(e) => setSelectedHotel({ ...selectedHotel, hourly_start_time: e.target.value })}
                  className="w-full glass-input px-4 py-2.5 rounded-2xl text-xs font-mono text-center"
                  placeholder="08:00"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">پایان بازه رزرو ساعتی:</label>
                <input
                  type="text"
                  value={selectedHotel.hourly_end_time || '22:00'}
                  onChange={(e) => setSelectedHotel({ ...selectedHotel, hourly_end_time: e.target.value })}
                  className="w-full glass-input px-4 py-2.5 rounded-2xl text-xs font-mono text-center"
                  placeholder="22:00"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">حداقل ساعت رزرو ساعتی:</label>
                <input
                  type="number"
                  value={selectedHotel.min_hourly_duration || 3}
                  onChange={(e) => setSelectedHotel({ ...selectedHotel, min_hourly_duration: parseInt(e.target.value) || 3 })}
                  className="w-full glass-input px-4 py-2.5 rounded-2xl text-xs font-mono text-center"
                  min={1}
                  max={24}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">حداکثر ساعت رزرو ساعتی:</label>
                <input
                  type="number"
                  value={selectedHotel.max_hourly_duration || 12}
                  onChange={(e) => setSelectedHotel({ ...selectedHotel, max_hourly_duration: parseInt(e.target.value) || 12 })}
                  className="w-full glass-input px-4 py-2.5 rounded-2xl text-xs font-mono text-center"
                  min={1}
                  max={24}
                />
              </div>

              <div className="space-y-1.5 flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={selectedHotel.is_published}
                  onChange={(e) => setSelectedHotel({ ...selectedHotel, is_published: e.target.checked })}
                  className="w-5 h-5 accent-amber-400 rounded-lg cursor-pointer"
                />
                <label htmlFor="is_published" className="text-xs font-bold text-white cursor-pointer">
                  انتشار عمومی در سایت (نمایش به مسافران)
                </label>
              </div>

              <div className="space-y-1.5 flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={selectedHotel.is_featured}
                  onChange={(e) => setSelectedHotel({ ...selectedHotel, is_featured: e.target.checked })}
                  className="w-5 h-5 accent-amber-400 rounded-lg cursor-pointer"
                />
                <label htmlFor="is_featured" className="text-xs font-bold text-amber-300 cursor-pointer">
                  هتل ویژه برگزیده در صفحه اول
                </label>
              </div>
            </div>
          </div>

          {/* 3. 4 HOTEL PHOTOS (USER REQUEST) & DESCRIPTIONS */}
          <div className="glass-panel-dark rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-amber-400" />
                <span>گالری تصاویر هتل (۴ اسلات تصویر اصلی، لابی، رستوران و امکانات)</span>
              </h2>
              <span className="text-xs font-mono font-bold text-amber-400">۴ تصویر مجزا</span>
            </div>

            {/* 4 Photo Slots Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'عکس ۱: نمای بیرونی / کاور اصلی', desc: 'تصویر کارت و هدر هتل' },
                { label: 'عکس ۲: لابی و پذیرش', desc: 'لابی، ورودی و پذیرش' },
                { label: 'عکس ۳: رستوران و کافی‌شاپ', desc: 'بوفه صبحانه و غذاخوری' },
                { label: 'عکس ۴: امکانات و اسپا', desc: 'استخر، سالن همایش، بدنسازی' },
              ].map((slot, idx) => {
                const curImages = Array.isArray(selectedHotel.images) ? selectedHotel.images : [selectedHotel.cover_image];
                const slotPhoto = curImages[idx] || (idx === 0 ? selectedHotel.cover_image : '') || '';

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">{slot.label}</span>
                      <span className="text-[10px] text-neutral-400 block">{slot.desc}</span>
                    </div>

                    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-neutral-900 border border-white/10">
                      {slotPhoto ? (
                        <Image src={slotPhoto} alt={slot.label} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 text-xs gap-1">
                          <Hotel className="w-5 h-5 opacity-40" />
                          <span>تصویر خالی</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={slotPhoto}
                        onChange={(e) => {
                          const updated = [...curImages];
                          while (updated.length < 4) updated.push('');
                          updated[idx] = e.target.value;
                          setSelectedHotel({
                            ...selectedHotel,
                            cover_image: idx === 0 ? e.target.value : selectedHotel.cover_image,
                            images: updated,
                          });
                        }}
                        className="w-full glass-input px-3 py-1.5 rounded-xl text-xs font-mono"
                        dir="ltr"
                        placeholder="URL تصویر..."
                      />

                      <label className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl glass-panel text-xs font-bold text-amber-300 hover:text-white cursor-pointer transition-colors border border-amber-400/20">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>
                          {uploadingEditSlot === idx ? 'در حال آپلود...' : 'آپلود در R2'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleEditPhotoUpload(idx, e)}
                          className="hidden"
                          disabled={uploadingEditSlot !== null}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Text Descriptions */}
              <div className="lg:col-span-2 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">خلاصه معرفی (۱ تا ۲ جمله برای کارت‌ها):</label>
                  <textarea
                    rows={2}
                    value={selectedHotel.short_description || ''}
                    onChange={(e) => setSelectedHotel({ ...selectedHotel, short_description: e.target.value })}
                    className="w-full glass-input p-3 rounded-2xl text-xs leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">معرفی کامل هتل (درباره هتل در صفحه اختصاصی):</label>
                  <textarea
                    rows={6}
                    value={selectedHotel.description || ''}
                    onChange={(e) => setSelectedHotel({ ...selectedHotel, description: e.target.value })}
                    className="w-full glass-input p-3 rounded-2xl text-xs leading-relaxed"
                  />
                </div>
              </div>
          </div>

          {/* 4. HOTEL RULES */}
          <div className="glass-panel-dark rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-black text-white flex items-center justify-between border-b border-white/10 pb-3">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
                <span>قوانین و ضوابط اقامت در هتل</span>
              </span>
              <span className="text-xs text-neutral-400">
                {(selectedHotel.rules || []).length} قانون ثبت شده
              </span>
            </h2>

            <div className="space-y-3">
              {(selectedHotel.rules || []).map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-xs"
                >
                  <div className="flex items-center gap-2 text-neutral-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span>{rule}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(idx)}
                    className="text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  placeholder="افزودن قانون جدید اقامت (مثال: ارائه اصل کارت ملی یا پاسپورت الزامی است)..."
                  className="flex-1 glass-input px-4 py-2.5 rounded-2xl text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="px-5 py-2.5 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. HOTEL FAQS */}
          <div className="glass-panel-dark rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-black text-white flex items-center justify-between border-b border-white/10 pb-3">
              <span className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" />
                <span>پرسش‌های متداول مسافران (FAQ)</span>
              </span>
              <span className="text-xs text-neutral-400">
                {(selectedHotel.faq || []).length} پرسش ثبت شده
              </span>
            </h2>

            <div className="space-y-4">
              {(selectedHotel.faq || []).map((faqItem, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">پرسش: {faqItem.question}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(idx)}
                      className="text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-neutral-300 leading-relaxed">پاسخ: {faqItem.answer}</p>
                </div>
              ))}

              <div className="p-4 rounded-2xl border border-dashed border-white/20 space-y-3">
                <span className="text-xs font-bold text-neutral-300 block">افزودن پرسش و پاسخ جدید:</span>
                <input
                  type="text"
                  value={newFaqQ}
                  onChange={(e) => setNewFaqQ(e.target.value)}
                  placeholder="عنوان پرسش (مثال: آیا هتل تابان دارای پارکینگ است؟)"
                  className="w-full glass-input px-4 py-2.5 rounded-2xl text-xs"
                />
                <textarea
                  rows={2}
                  value={newFaqA}
                  onChange={(e) => setNewFaqA(e.target.value)}
                  placeholder="متن پاسخ دقیق..."
                  className="w-full glass-input p-3 rounded-2xl text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="px-5 py-2.5 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>ثبت پرسش در لیست</span>
                </button>
              </div>
            </div>
          </div>

          {/* STICKY BOTTOM SAVE ACTION BAR */}
          <div className="sticky bottom-6 z-30 glass-panel-dark p-4 rounded-2xl border border-amber-400/40 shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span>تغییرات ذخیره نشده آماده ارسال به دیتابیس هستند</span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="gold-glow-btn py-3 px-8 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-amber-500/30"
            >
              <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'در حال ذخیره‌سازی...' : 'ذخیره کلیه تغییرات هتل'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="glass-panel p-16 text-center text-neutral-400 text-sm">
          هیچ هتلی در دیتابیس یافت نشد.
        </div>
      )}
      {/* ====================================================================
          MODAL: QUICK ADD NEW HOTEL (خیلی آسان و سریع بدون دردسر)
         ==================================================================== */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl glass-panel-dark rounded-3xl border border-amber-400/30 p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Hotel className="w-6 h-6 text-amber-400" />
                  <span>افزودن هتل جدید به پلتفرم</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  ثبت فوق‌العاده سریع با ذخیره‌سازی خودکار در کلودفلر و دیتابیس
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-neutral-400 hover:text-white p-2 rounded-xl bg-white/5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHotel} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">نام هتل (فارسی):</label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="مثال: هتل اسپیناس پالاس تهران"
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">درجه و تعداد ستاره:</label>
                  <select
                    value={addStars}
                    onChange={(e) => setAddStars(parseInt(e.target.value) || 5)}
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs"
                  >
                    <option value={5}>۵ ستاره لوکس</option>
                    <option value={4}>۴ ستاره عالی</option>
                    <option value={3}>۳ ستاره استاندارد</option>
                    <option value={2}>۲ ستاره اقتصادی</option>
                    <option value={1}>۱ ستاره</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">شماره تلفن رزرو (با کد کشور):</label>
                  <input
                    type="text"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="+98 21 7567 5000"
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono"
                    dir="ltr"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">آدرس و موقعیت مکانی:</label>
                  <input
                    type="text"
                    value={addAddress}
                    onChange={(e) => setAddAddress(e.target.value)}
                    placeholder="مثال: تهران، سعادت‌آباد، میدان بهرود"
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs"
                    required
                  />
                </div>

                {/* Google Maps Location Link (User Request) */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>لینک موقعیت مکانی در گوگل مپ (Google Maps URL):</span>
                  </label>
                  <input
                    type="url"
                    value={addGoogleMapsUrl}
                    onChange={(e) => setAddGoogleMapsUrl(e.target.value)}
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono text-left"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-neutral-400 block">
                    لینک اشتراک‌گذاری لوکیشن از گوگل مپ جهت نمایش دکمه مسیریابی برای مسافران
                  </span>
                </div>

                {/* Check-in and Check-out Times */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">ساعت تحویل (Check-in):</label>
                  <input
                    type="text"
                    value={addCheckInTime}
                    onChange={(e) => setAddCheckInTime(e.target.value)}
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono text-center"
                    placeholder="14:00"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">ساعت تخلیه (Check-out):</label>
                  <input
                    type="text"
                    value={addCheckOutTime}
                    onChange={(e) => setAddCheckOutTime(e.target.value)}
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono text-center"
                    placeholder="12:00"
                  />
                </div>
              </div>

              {/* Hotel Rules Section (User Request) */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <span className="text-xs font-bold text-amber-300 block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>قوانین و ضوابط اقامتگاه (Rules & Policies):</span>
                </span>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {addRules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-neutral-300"
                    >
                      <span className="leading-relaxed text-[11px]">• {rule}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...addRules];
                          updated.splice(idx, 1);
                          setAddRules(updated);
                        }}
                        className="text-rose-400 hover:text-rose-300 p-1 shrink-0"
                        title="حذف این قانون"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                  <input
                    type="text"
                    value={newAddRuleInput}
                    onChange={(e) => setNewAddRuleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newAddRuleInput.trim()) {
                          setAddRules([...addRules, newAddRuleInput.trim()]);
                          setNewAddRuleInput('');
                        }
                      }
                    }}
                    placeholder="نوشتن قانون جدید (مثلاً: همراه داشتن کارت ملی الزامی است)..."
                    className="flex-1 glass-input px-3 py-2 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newAddRuleInput.trim()) {
                        setAddRules([...addRules, newAddRuleInput.trim()]);
                        setNewAddRuleInput('');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 transition-colors shrink-0"
                  >
                    + افزودن
                  </button>
                </div>
              </div>

              {/* Photo Upload to Cloudflare R2 (4 Distinct Photo Slots - User Request) */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 block">
                    گالری تصاویر هتل (۴ اسلات تصویر باکیفیت):
                  </span>
                  <span className="text-[11px] font-mono text-amber-400">۴ تصویر مجزا</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'عکس ۱: نمای بیرونی / کاور اصلی', desc: 'کاور اصلی هتل در سایت' },
                    { label: 'عکس ۲: لابی و پذیرش هتل', desc: 'فضای ورودی و تشریفات' },
                    { label: 'عکس ۳: رستوران و کافی‌شاپ', desc: 'بوفه صبحانه و غذاخوری' },
                    { label: 'عکس ۴: امکانات، استخر و سالن‌ها', desc: 'مجموعه ورزشی و سالن‌ها' },
                  ].map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2.5 flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">{slot.label}</span>
                        <span className="text-[10px] text-neutral-400 block">{slot.desc}</span>
                      </div>

                      {/* Thumbnail Preview */}
                      <div className="relative w-full h-28 rounded-xl overflow-hidden bg-neutral-900 border border-white/10">
                        {addPhotos[idx] ? (
                          <Image src={addPhotos[idx]} alt={`add-slot-${idx}`} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 text-xs gap-1">
                            <Hotel className="w-5 h-5 opacity-40" />
                            <span>تصویر انتخاب نشده</span>
                          </div>
                        )}
                      </div>

                      {/* URL input & Upload button */}
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={addPhotos[idx]}
                          onChange={(e) => {
                            const next = [...addPhotos];
                            next[idx] = e.target.value;
                            setAddPhotos(next);
                          }}
                          placeholder="URL مستقیم تصویر..."
                          className="w-full glass-input px-3 py-1.5 rounded-xl text-xs font-mono"
                          dir="ltr"
                        />

                        <label className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/15 text-neutral-200 text-xs font-bold cursor-pointer transition-colors">
                          <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {uploadingAddSlot === idx ? 'در حال آپلود...' : 'آپلود در کلودفلر R2'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleAddPhotoUpload(idx, e)}
                            className="hidden"
                            disabled={uploadingAddSlot !== null}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">توضیح کوتاه درباره هتل:</label>
                <textarea
                  rows={2}
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  placeholder="کاخ باشکوه در شمال پایتخت با ویو ۳۶۰ درجه و امکانات اقامتی VIP..."
                  className="w-full glass-input p-3 rounded-2xl text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-5 py-2.5 rounded-2xl glass-panel text-xs text-neutral-400 hover:text-white"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={creatingHotel || uploadingAddSlot !== null}
                  className="gold-glow-btn px-7 py-3 rounded-2xl text-xs font-black flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{creatingHotel ? 'در حال ایجاد هتل...' : 'ثبت و انتشار هتل جدید'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

