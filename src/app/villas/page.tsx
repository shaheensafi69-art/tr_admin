'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Home,
  Plus,
  Trash2,
  Edit3,
  UploadCloud,
  MapPin,
  Phone,
  Users,
  BedDouble,
  Bath,
  Waves,
  Sparkles,
  Check,
  ExternalLink,
  Search,
  Filter,
  ShieldCheck,
  Flame,
  X,
  Building,
  Car,
  Wifi,
  Eye,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import AdminHeader from '@/components/layout/AdminHeader';
import ModalPortal from '@/components/common/ModalPortal';
import { Province, City } from '@/types/database';

export interface VillaApartment {
  id: string;
  property_type: 'villa' | 'apartment';
  name: string;
  slug: string;
  province_id?: string;
  city_id?: string;
  location_area: string;
  address: string;
  bedrooms_count: number;
  bathrooms_count: number;
  standard_capacity: number;
  max_capacity: number;
  size_sqm: number;
  daily_price: number;
  weekend_price: number;
  has_pool: boolean;
  has_jacuzzi: boolean;
  has_billiards: boolean;
  has_bbq: boolean;
  has_parking: boolean;
  has_wifi: boolean;
  cover_image: string;
  images: string[];
  description: string;
  rules: string[];
  google_maps_url: string;
  phone: string;
  rating: number;
  review_count: number;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
}

export default function VillasPage() {
  const [properties, setProperties] = useState<VillaApartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'villa' | 'apartment'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  // Form Fields
  const [propertyType, setPropertyType] = useState<'villa' | 'apartment'>('villa');
  const [name, setName] = useState('');
  const [locationArea, setLocationArea] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('+98 21 9100 8899');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [bedroomsCount, setBedroomsCount] = useState(3);
  const [bathroomsCount, setBathroomsCount] = useState(2);
  const [standardCapacity, setStandardCapacity] = useState(4);
  const [maxCapacity, setMaxCapacity] = useState(8);
  const [sizeSqm, setSizeSqm] = useState(250);
  const [dailyPrice, setDailyPrice] = useState(8500000);
  const [weekendPrice, setWeekendPrice] = useState(10500000);
  const [description, setDescription] = useState('');
  
  // Amenities
  const [hasPool, setHasPool] = useState(true);
  const [hasJacuzzi, setHasJacuzzi] = useState(true);
  const [hasBilliards, setHasBilliards] = useState(false);
  const [hasBbq, setHasBbq] = useState(true);
  const [hasParking, setHasParking] = useState(true);
  const [hasWifi, setHasWifi] = useState(true);

  // 4 Photos (User Request)
  const [photos, setPhotos] = useState<string[]>([
    '',
    '',
    '',
    '',
  ]);

  // Province and City states
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [provinceId, setProvinceId] = useState('');
  const [cityId, setCityId] = useState('');

  // Quick City Modal State
  const [quickCityOpen, setQuickCityOpen] = useState(false);
  const [quickCityProvinceId, setQuickCityProvinceId] = useState('');
  const [quickCityName, setQuickCityName] = useState('');
  const [quickCitySlug, setQuickCitySlug] = useState('');
  const [quickCitySaving, setQuickCitySaving] = useState(false);

  // Rules list
  const [rules, setRules] = useState<string[]>([
    'تحویل واحد از ساعت ۱۴:۰۰ و تخلیه حداکثر تا ساعت ۱۲:۰۰ ظهر می‌باشد.',
    'اقامت کودکان تا ۵ سال رایگان، ۵ تا ۱۰ سال نیم‌بها، و از ۱۰ سال به بالا کامل محاسبه می‌شود.',
    'شرایط لغو و کنسلی: تا ۲۴ ساعت قبل با استرداد ۵۰٪ مبلغ و کمتر از ۲۴ ساعت غیرقابل استرداد است.',
    'ارائه کارت ملی هوشمند یا شناسنامه معتبر الزامی است.'
  ]);
  const [newRuleInput, setNewRuleInput] = useState('');

  const loadProvincesAndCities = async () => {
    const supabase = getSupabaseClient();
    const [pRes, cRes] = await Promise.all([
      supabase.from('provinces').select('*').order('name', { ascending: true }),
      supabase.from('cities').select('*').order('display_order', { ascending: true }).order('name', { ascending: true }),
    ]);
    if (pRes.data) {
      setProvinces(pRes.data);
      const tehranProv = pRes.data.find((p) => p.name.includes('تهران')) || pRes.data[0];
      if (tehranProv && !provinceId) {
        setProvinceId(tehranProv.id);
      }
    }
    if (cRes.data) {
      setCities(cRes.data);
      if (cRes.data.length > 0 && !cityId) {
        setCityId(cRes.data[0].id);
      }
    }
  };

  const loadProperties = async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('villas_apartments')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProperties(data as VillaApartment[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadProperties();
    loadProvincesAndCities();
  }, []);

  const openNewModal = () => {
    setEditingId(null);
    setPropertyType('villa');
    setName('');
    const tehranProv = provinces.find((p) => p.name.includes('تهران')) || provinces[0];
    if (tehranProv) setProvinceId(tehranProv.id);
    if (cities.length > 0) setCityId(cities[0].id);
    setLocationArea('لواسان، تهران');
    setAddress('');
    setPhone('+98 21 9100 8899');
    setGoogleMapsUrl('');
    setBedroomsCount(3);
    setBathroomsCount(2);
    setStandardCapacity(4);
    setMaxCapacity(8);
    setSizeSqm(250);
    setDailyPrice(8500000);
    setWeekendPrice(10500000);
    setDescription('');
    setHasPool(true);
    setHasJacuzzi(true);
    setHasBilliards(false);
    setHasBbq(true);
    setHasParking(true);
    setHasWifi(true);
    setPhotos([
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    ]);
    setRules([
      'تحویل واحد از ساعت ۱۴:۰۰ و تخلیه حداکثر تا ساعت ۱۲:۰۰ ظهر می‌باشد.',
      'اقامت کودکان تا ۵ سال رایگان، ۵ تا ۱۰ سال نیم‌بها، و از ۱۰ سال به بالا کامل محاسبه می‌شود.',
      'شرایط لغو و کنسلی: تا ۲۴ ساعت قبل با استرداد ۵۰٪ مبلغ و کمتر از ۲۴ ساعت غیرقابل استرداد است.',
      'ارائه کارت ملی هوشمند یا شناسنامه معتبر الزامی است.'
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (item: VillaApartment) => {
    setEditingId(item.id);
    setPropertyType(item.property_type);
    setName(item.name);
    setProvinceId(item.province_id || '');
    setCityId(item.city_id || '');
    setLocationArea(item.location_area || '');
    setAddress(item.address || '');
    setPhone(item.phone || '+98 21 9100 8899');
    setGoogleMapsUrl(item.google_maps_url || '');
    setBedroomsCount(item.bedrooms_count || 1);
    setBathroomsCount(item.bathrooms_count || 1);
    setStandardCapacity(item.standard_capacity || 2);
    setMaxCapacity(item.max_capacity || 4);
    setSizeSqm(item.size_sqm || 100);
    setDailyPrice(item.daily_price || 5000000);
    setWeekendPrice(item.weekend_price || 6000000);
    setDescription(item.description || '');
    setHasPool(Boolean(item.has_pool));
    setHasJacuzzi(Boolean(item.has_jacuzzi));
    setHasBilliards(Boolean(item.has_billiards));
    setHasBbq(Boolean(item.has_bbq));
    setHasParking(Boolean(item.has_parking));
    setHasWifi(Boolean(item.has_wifi));

    // Fill 4 photo slots
    const existing = Array.isArray(item.images) && item.images.length > 0 ? item.images : [item.cover_image];
    const filled: string[] = [
      existing[0] || item.cover_image || '',
      existing[1] || '',
      existing[2] || '',
      existing[3] || '',
    ];
    setPhotos(filled);

    setRules(Array.isArray(item.rules) && item.rules.length > 0 ? item.rules : [
      'تحویل واحد ساعت ۱۴:۰۰ و تخلیه ساعت ۱۲:۰۰ ظهر است.',
      'کنسلی تا ۲۴ ساعت قبل با استرداد ۵۰٪ انجام می‌گیرد.'
    ]);
    setIsModalOpen(true);
  };

  const handlePhotoUpload = async (slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSlot(slotIndex);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'villas');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        const next = [...photos];
        next[slotIndex] = data.url;
        setPhotos(next);
      } else {
        alert(data.error || 'خطا در آپلود عکس به کلودفلر');
      }
    } catch {
      alert('خطا در ارتباط با سرور آپلود');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const supabase = getSupabaseClient();
    const cleanPhotos = photos.map((p) => p.trim()).filter(Boolean);
    const primaryCover = cleanPhotos[0] || 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80';

    const payload = {
      property_type: propertyType,
      name: name.trim(),
      slug: editingId ? undefined : `${propertyType}-${Date.now()}`,
      province_id: provinceId || null,
      city_id: cityId || null,
      location_area: locationArea.trim(),
      address: address.trim(),
      phone: phone.trim(),
      google_maps_url: googleMapsUrl.trim(),
      bedrooms_count: Number(bedroomsCount),
      bathrooms_count: Number(bathroomsCount),
      standard_capacity: Number(standardCapacity),
      max_capacity: Number(maxCapacity),
      size_sqm: Number(sizeSqm),
      daily_price: Number(dailyPrice),
      weekend_price: Number(weekendPrice),
      has_pool: hasPool,
      has_jacuzzi: hasJacuzzi,
      has_billiards: hasBilliards,
      has_bbq: hasBbq,
      has_parking: hasParking,
      has_wifi: hasWifi,
      cover_image: primaryCover,
      images: cleanPhotos.length > 0 ? cleanPhotos : [primaryCover],
      description: description.trim(),
      rules: rules.filter((r) => r.trim() !== ''),
      is_published: true,
      is_featured: true,
    };

    if (editingId) {
      const { error } = await supabase
        .from('villas_apartments')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        alert(`خطا در ویرایش: ${error.message}`);
      } else {
        setIsModalOpen(false);
        loadProperties();
      }
    } else {
      const { error } = await supabase
        .from('villas_apartments')
        .insert({
          ...payload,
          rating: 5.0,
          review_count: 1,
        });

      if (error) {
        alert(`خطا در ایجاد اقامتگاه جدید: ${error.message}`);
      } else {
        setIsModalOpen(false);
        loadProperties();
      }
    }
    setSaving(false);
  };

  const handleCreateQuickCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCityProvinceId || !quickCityName.trim()) {
      alert('لطفاً استان و نام شهر را مشخص کنید.');
      return;
    }
    setQuickCitySaving(true);
    const supabase = getSupabaseClient();
    const cleanSlug = quickCitySlug.trim() || quickCityName.trim().toLowerCase().replace(/\s+/g, '-');
    const { data, error } = await supabase
      .from('cities')
      .insert({
        province_id: quickCityProvinceId,
        name: quickCityName.trim(),
        slug: cleanSlug,
        is_active: true,
        display_order: cities.length + 1,
      })
      .select()
      .single();

    setQuickCitySaving(false);
    if (error) {
      alert('خطا در ثبت شهر: ' + error.message);
    } else if (data) {
      setCities((prev) => [...prev, data]);
      setProvinceId(data.province_id);
      setCityId(data.id);
      setQuickCityOpen(false);
      setQuickCityName('');
      setQuickCitySlug('');
    }
  };

  const handleDelete = async (id: string, propName: string) => {
    if (!confirm(`آیا از حذف "${propName}" اطمینان دارید؟`)) return;
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('villas_apartments').delete().eq('id', id);
    if (!error) {
      loadProperties();
    } else {
      alert(`خطا در حذف: ${error.message}`);
    }
  };

  const filtered = properties.filter((p) => {
    if (typeFilter !== 'all' && p.property_type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchArea = p.location_area?.toLowerCase().includes(q);
      return matchName || matchArea;
    }
    return true;
  });

  const totalVillas = properties.filter((p) => p.property_type === 'villa').length;
  const totalApartments = properties.filter((p) => p.property_type === 'apartment').length;

  return (
    <div className="space-y-6 pb-20">
      {/* 1. ADMIN HEADER */}
      <AdminHeader
        title="مدیریت ویلاها و آپارتمان‌های مبله"
        subtitle="مدیریت ویلاهای استخردار لوکس، پنت‌هاوس‌ها و آپارتمان‌های اختصاصی با ۴ اسلات عکس و امکانات ویژه"
        onRefresh={loadProperties}
        isLoading={isLoading}
      />

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-3xl space-y-2 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400">کل اقامتگاه‌های اختصاصی</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {properties.length.toLocaleString('fa-IR')} <span className="text-xs font-sans font-normal text-neutral-400">واحد فعال</span>
          </div>
          <span className="text-[11px] text-neutral-400 block">پوشش لواسان، کردان، زعفرانیه و فرشته</span>
        </div>

        <div className="glass-panel p-5 rounded-3xl space-y-2 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400">ویلاهای استخردار و باغ‌ها</span>
            <div className="w-10 h-10 rounded-2xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
              <Waves className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-400 font-mono">
            {totalVillas.toLocaleString('fa-IR')} <span className="text-xs font-sans font-normal text-neutral-400">ویلا</span>
          </div>
          <span className="text-[11px] text-neutral-400 block">استخر چهارفصل، جکوزی، محوطه و باغ</span>
        </div>

        <div className="glass-panel p-5 rounded-3xl space-y-2 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">آپارتمان‌های مبله و پنت‌هاوس</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {totalApartments.toLocaleString('fa-IR')} <span className="text-xs font-sans font-normal text-neutral-400">آپارتمان VIP</span>
          </div>
          <span className="text-[11px] text-neutral-400 block">فول فرنیش، دید شهری، برج‌های شمال تهران</span>
        </div>

        <div className="glass-panel p-5 rounded-3xl space-y-2 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300">رزرواسیون مستقیم</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            ۱۰۰٪ <span className="text-xs font-sans font-normal text-neutral-400">تضمین کیفیت</span>
          </div>
          <span className="text-[11px] text-neutral-400 block">پشتیبانی ۲۴ ساعته تهران‌روم</span>
        </div>
      </div>

      {/* 3. TOOLBAR: FILTERS, SEARCH & ADD BUTTON */}
      <div className="glass-panel p-4 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              typeFilter === 'all'
                ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-white/[0.05] text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
          >
            همه اقامتگاه‌ها ({properties.length})
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter('villa')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              typeFilter === 'villa'
                ? 'bg-sky-400 text-slate-950 font-black shadow-lg shadow-sky-500/20'
                : 'bg-white/[0.05] text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>ویلاهای استخردار ({totalVillas})</span>
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter('apartment')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              typeFilter === 'apartment'
                ? 'bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'bg-white/[0.05] text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>آپارتمان‌های مبله ({totalApartments})</span>
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو بر اساس نام یا منطقه..."
              className="w-full glass-input pr-9 pl-3 py-2 rounded-2xl text-xs"
            />
          </div>

          <button
            type="button"
            onClick={openNewModal}
            className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن ویلا یا آپارتمان</span>
          </button>
        </div>
      </div>

      {/* 4. PROPERTIES GRID */}
      {isLoading ? (
        <div className="p-16 text-center text-neutral-400 text-sm">
          در حال بارگذاری لیست اقامتگاه‌ها...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl text-center text-neutral-400 space-y-3 border border-white/10">
          <Home className="w-12 h-12 text-neutral-500 mx-auto" />
          <p className="text-sm font-bold text-neutral-300">هیچ اقامتگاهی با این مشخصات یافت نشد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="glass-panel-dark rounded-3xl overflow-hidden border border-white/10 flex flex-col shadow-xl hover:border-amber-400/30 transition-all group"
            >
              {/* Photo Area (4-photo preview) */}
              <div className="relative w-full h-56 bg-neutral-900 overflow-hidden">
                <Image
                  src={item.cover_image || (item.images && item.images[0]) || '/bg_logo.png'}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Property Type Badge */}
                <div className="absolute top-3.5 right-3.5">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black backdrop-blur-md border shadow-lg ${
                      item.property_type === 'villa'
                        ? 'bg-sky-500/80 text-white border-sky-400/40'
                        : 'bg-emerald-500/80 text-white border-emerald-400/40'
                    }`}
                  >
                    {item.property_type === 'villa' ? '🏡 ویلای استخردار' : '🏢 آپارتمان مبله VIP'}
                  </span>
                </div>

                {/* Rating & Photos Count */}
                <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-black/60 backdrop-blur-md text-amber-300 border border-amber-400/30">
                    ★ {item.rating || 5.0}
                  </span>
                  <span className="px-2 py-1 rounded-xl text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
                    {Array.isArray(item.images) ? item.images.length : 1} عکس
                  </span>
                </div>

                {/* Small Thumbnails Overlay */}
                {Array.isArray(item.images) && item.images.length > 1 && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 p-1 bg-black/60 backdrop-blur-md rounded-xl border border-white/10">
                    {item.images.slice(0, 4).map((img, idx) => (
                      <div key={idx} className="relative w-10 h-7 rounded-lg overflow-hidden border border-white/20">
                        <Image src={img} alt={`thumb-${idx}`} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-black text-white hover:text-amber-400 transition-colors">
                      {item.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="line-clamp-1">{item.location_area} — {item.address}</span>
                  </div>

                  <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed pt-1">
                    {item.description}
                  </p>
                </div>

                {/* Specs Bar */}
                <div className="grid grid-cols-4 gap-2 py-2.5 px-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">اتاق خواب:</span>
                    <span className="font-mono font-black text-amber-400">{item.bedrooms_count} خواب</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">سرویس حمام:</span>
                    <span className="font-mono font-black text-amber-400">{item.bathrooms_count} مستر</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">ظرفیت مسافر:</span>
                    <span className="font-mono font-black text-amber-400">تا {item.max_capacity} نفر</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">متراژ زیربنا:</span>
                    <span className="font-mono font-black text-amber-400">{item.size_sqm} متر</span>
                  </div>
                </div>

                {/* Amenities Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.has_pool && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                      استخر آبگرم
                    </span>
                  )}
                  {item.has_jacuzzi && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      جکوزی
                    </span>
                  )}
                  {item.has_billiards && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      میز بیلیارد
                    </span>
                  )}
                  {item.has_bbq && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      باربیکیو
                    </span>
                  )}
                  {item.has_parking && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/5 text-neutral-300 border border-white/10">
                      پارکینگ اختصاصی
                    </span>
                  )}
                  {item.has_wifi && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/5 text-neutral-300 border border-white/10">
                      وای‌فای رایگان
                    </span>
                  )}
                </div>

                {/* Price & Actions Footer */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">نرخ هر شب اقامت:</span>
                    <span className="text-base font-black text-amber-400 font-mono">
                      {Number(item.daily_price).toLocaleString('fa-IR')}{' '}
                      <span className="text-xs font-sans text-neutral-300 font-normal">تومان</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.google_maps_url && (
                      <a
                        href={item.google_maps_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
                        title="مشاهده روی نقشه گوگل"
                      >
                        <MapPin className="w-4 h-4" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>ویرایش</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      title="حذف اقامتگاه"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====================================================================
          5. MODAL: ADD / EDIT VILLA OR APARTMENT (4 PHOTO SLOTS - USER REQUEST)
         ==================================================================== */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <div className="glass-panel-dark border border-white/15 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">
                    {editingId ? 'ویرایش مشخصات اقامتگاه اختصاصی' : 'افزودن ویلا یا آپارتمان مبله جدید'}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    ۴ اسلات تصویر، نرخ روزانه و آخر هفته، امکانات رفاهی و قوانین اقامت
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="space-y-6">
              {/* Type Selector (Villa vs Apartment) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-amber-300 block">نوع اقامتگاه:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPropertyType('villa')}
                    className={`py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 border transition-all ${
                      propertyType === 'villa'
                        ? 'bg-sky-400 text-slate-950 border-sky-300 shadow-lg shadow-sky-500/20'
                        : 'bg-white/[0.04] text-neutral-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <Waves className="w-4 h-4" />
                    <span>ویلای استخردار / باغ شخصی</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPropertyType('apartment')}
                    className={`py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 border transition-all ${
                      propertyType === 'apartment'
                        ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-lg shadow-emerald-500/20'
                        : 'bg-white/[0.04] text-neutral-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>آپارتمان مبله / پنت‌هاوس لوکس</span>
                  </button>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-neutral-300">عنوان کامل اقامتگاه:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: ویلای دوبلکس استخردار لواسان (چشم‌انداز سد لتیان)"
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs"
                    required
                  />
                </div>

                {/* Province Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">استان اقامتگاه:</label>
                  <select
                    value={provinceId}
                    onChange={(e) => {
                      const pId = e.target.value;
                      setProvinceId(pId);
                      const firstCity = cities.find((c) => c.province_id === pId);
                      if (firstCity) setCityId(firstCity.id);
                    }}
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs bg-[#0b1120]"
                  >
                    <option value="">-- انتخاب استان --</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City Selector + Quick Add */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-300">شهر اقامتگاه:</label>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCityProvinceId(provinceId || provinces[0]?.id || '');
                        setQuickCityName('');
                        setQuickCitySlug('');
                        setQuickCityOpen(true);
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ شهر جدید</span>
                    </button>
                  </div>
                  <select
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs bg-[#0b1120]"
                  >
                    <option value="">-- انتخاب شهر --</option>
                    {cities
                      .filter((c) => !provinceId || c.province_id === provinceId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">منطقه / شهرک:</label>
                  <input
                    type="text"
                    value={locationArea}
                    onChange={(e) => setLocationArea(e.target.value)}
                    placeholder="مثال: لواسان کوچک، کردان، زعفرانیه"
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300">تلفن پشتیبانی و هماهنگی:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+98 21 9100 8899"
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono"
                    dir="ltr"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-neutral-300">آدرس دقیق:</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="تهران، خیابان..."
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>لینک لوکیشن گوگل مپ (Google Maps URL):</span>
                  </label>
                  <input
                    type="url"
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Specs & Pricing */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                <span className="text-xs font-bold text-amber-300 block">مشخصات فضا، ظرفیت و قیمت‌گذاری:</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-neutral-400 block">تعداد خواب:</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={bedroomsCount}
                      onChange={(e) => setBedroomsCount(Number(e.target.value))}
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono text-center"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-neutral-400 block">سرویس حمام:</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={bathroomsCount}
                      onChange={(e) => setBathroomsCount(Number(e.target.value))}
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono text-center"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-neutral-400 block">ظرفیت استاندارد:</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={standardCapacity}
                      onChange={(e) => setStandardCapacity(Number(e.target.value))}
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono text-center"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-neutral-400 block">حداکثر ظرفیت:</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(Number(e.target.value))}
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono text-center"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-neutral-400 block">متراژ (متر):</label>
                    <input
                      type="number"
                      min={30}
                      max={5000}
                      value={sizeSqm}
                      onChange={(e) => setSizeSqm(Number(e.target.value))}
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">قیمت هر شب (روزهای عادی):</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={dailyPrice}
                        onChange={(e) => setDailyPrice(Number(e.target.value))}
                        className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono font-black"
                        step={100000}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">تومان</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-300">قیمت هر شب (آخر هفته و تعطیلات):</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={weekendPrice}
                        onChange={(e) => setWeekendPrice(Number(e.target.value))}
                        className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono font-black text-amber-400"
                        step={100000}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">تومان</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities Checkboxes */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <span className="text-xs font-bold text-amber-300 block">امکانات و تجهیزات اقامتگاه:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={hasPool}
                      onChange={(e) => setHasPool(e.target.checked)}
                      className="rounded accent-amber-400"
                    />
                    <span className="text-xs font-bold text-neutral-200">استخر آبگرم</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={hasJacuzzi}
                      onChange={(e) => setHasJacuzzi(e.target.checked)}
                      className="rounded accent-amber-400"
                    />
                    <span className="text-xs font-bold text-neutral-200">جکوزی ماساژور</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={hasBilliards}
                      onChange={(e) => setHasBilliards(e.target.checked)}
                      className="rounded accent-amber-400"
                    />
                    <span className="text-xs font-bold text-neutral-200">میز بیلیارد اسنوکر</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={hasBbq}
                      onChange={(e) => setHasBbq(e.target.checked)}
                      className="rounded accent-amber-400"
                    />
                    <span className="text-xs font-bold text-neutral-200">باربیکیو و منقل</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={hasParking}
                      onChange={(e) => setHasParking(e.target.checked)}
                      className="rounded accent-amber-400"
                    />
                    <span className="text-xs font-bold text-neutral-200">پارکینگ اختصاصی</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={hasWifi}
                      onChange={(e) => setHasWifi(e.target.checked)}
                      className="rounded accent-amber-400"
                    />
                    <span className="text-xs font-bold text-neutral-200">اینترنت پرسرعت وای‌فای</span>
                  </label>
                </div>
              </div>

              {/* 4 Photos Slot Section (User Explicit Request) */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 block">
                    عکس‌های اقامتگاه (۴ عکس شاخص و باکیفیت):
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">۴ اسلات تصویر</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'عکس ۱ (کاور اصلی / نمای کلی)', desc: 'تصویر اصلی کارت و کاور' },
                    { label: 'عکس ۲ (استخر یا سالن پذیرایی)', desc: 'استخر، نشیمن یا تراس' },
                    { label: 'عکس ۳ (اتاق خواب اصلی)', desc: 'تخت و اتاق خواب مستر' },
                    { label: 'عکس ۴ (محوطه، آشپزخانه یا ویو)', desc: 'دید و زاویه تکمیلی' },
                  ].map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-200">{slot.label}</span>
                        <span className="text-[10px] text-neutral-500">{slot.desc}</span>
                      </div>

                      {/* Thumbnail Preview */}
                      <div className="relative w-full h-28 rounded-xl overflow-hidden bg-neutral-900 border border-white/10">
                        {photos[idx] ? (
                          <Image src={photos[idx]} alt={`slot-${idx}`} fill className="object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-neutral-500 text-xs gap-1">
                            <Home className="w-5 h-5 opacity-40" />
                            <span>تصویر انتخاب نشده</span>
                          </div>
                        )}
                      </div>

                      {/* URL input & Upload button */}
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={photos[idx]}
                          onChange={(e) => {
                            const next = [...photos];
                            next[idx] = e.target.value;
                            setPhotos(next);
                          }}
                          placeholder="URL مستقیم تصویر..."
                          className="w-full glass-input px-3 py-1.5 rounded-xl text-xs font-mono"
                          dir="ltr"
                        />

                        <label className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/15 text-neutral-200 text-xs font-bold cursor-pointer transition-colors">
                          <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {uploadingSlot === idx ? 'در حال آپلود...' : 'آپلود عکس در کلودفلر R2'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(idx, e)}
                            className="hidden"
                            disabled={uploadingSlot !== null}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">توضیحات و امکانات رفاهی:</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیحات کامل درباره متراژ، ویو، سیستم صوتی، آرامش محیط و..."
                  className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed"
                />
              </div>

              {/* Rules List */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <span className="text-xs font-bold text-amber-300 block">قوانین و ضوابط اقامت:</span>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-neutral-300"
                    >
                      <span className="leading-relaxed text-[11px]">• {rule}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...rules];
                          updated.splice(idx, 1);
                          setRules(updated);
                        }}
                        className="text-rose-400 hover:text-rose-300 p-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                  <input
                    type="text"
                    value={newRuleInput}
                    onChange={(e) => setNewRuleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newRuleInput.trim()) {
                          setRules([...rules, newRuleInput.trim()]);
                          setNewRuleInput('');
                        }
                      }
                    }}
                    placeholder="نوشتن قانون جدید اقامت..."
                    className="flex-1 glass-input px-3 py-2 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newRuleInput.trim()) {
                        setRules([...rules, newRuleInput.trim()]);
                        setNewRuleInput('');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 shrink-0"
                  >
                    + افزودن
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-white/[0.08] hover:bg-white/15 text-neutral-300 text-xs font-bold transition-colors"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? 'در حال ذخیره‌سازی...' : editingId ? 'ثبت تغییرات اقامتگاه' : 'ایجاد اقامتگاه جدید'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* QUICK INLINE CITY ADD MODAL */}
      {quickCityOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="glass-card w-full max-w-md rounded-3xl p-6 border border-white/15 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-white">افزودن سریع شهر جدید</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickCityOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateQuickCity} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">استان:</label>
                  <select
                    value={quickCityProvinceId}
                    onChange={(e) => setQuickCityProvinceId(e.target.value)}
                    required
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs bg-[#0b1120]"
                  >
                    <option value="" disabled>-- انتخاب استان --</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">نام شهر (فارسی):</label>
                  <input
                    type="text"
                    value={quickCityName}
                    onChange={(e) => {
                      setQuickCityName(e.target.value);
                      if (!quickCitySlug) {
                        setQuickCitySlug(e.target.value.trim().toLowerCase().replace(/\s+/g, '-'));
                      }
                    }}
                    placeholder="مثال: کیش، مشهد، کردان، لواسان"
                    required
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">اسلاگ لاتین (جهت URL):</label>
                  <input
                    type="text"
                    value={quickCitySlug}
                    onChange={(e) => setQuickCitySlug(e.target.value)}
                    placeholder="مثال: kish, mashhad, kordan"
                    required
                    dir="ltr"
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono text-amber-300 text-left"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10 mt-4">
                  <button
                    type="button"
                    onClick={() => setQuickCityOpen(false)}
                    className="px-3 py-2 rounded-xl bg-white/5 text-neutral-300 text-xs font-bold"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={quickCitySaving}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-400/20"
                  >
                    {quickCitySaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>ثبت شهر</span>
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
