'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Building,
  Home,
  Trash2,
  Edit2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowUpDown,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { City, Province } from '@/types/database';
import ModalPortal from '@/components/common/ModalPortal';

export default function CitiesManagementPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState('all');

  // Add / Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [formProvinceId, setFormProvinceId] = useState('');
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Delete State
  const [deletingCityId, setDeletingCityId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();

    try {
      // 1. Fetch all provinces
      const { data: provData } = await supabase
        .from('provinces')
        .select('*')
        .order('name', { ascending: true });

      if (provData) {
        setProvinces(provData);
      }

      // 2. Fetch all cities with province details
      const { data: cityData, error: cityErr } = await supabase
        .from('cities')
        .select(`
          *,
          province:provinces(*)
        `)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      // 3. Fetch counts of hotels and villas per city
      const [hotelsRes, villasRes] = await Promise.all([
        supabase.from('hotels').select('city_id'),
        supabase.from('villas_apartments').select('city_id'),
      ]);

      const hotelCounts: Record<string, number> = {};
      (hotelsRes.data || []).forEach((h: any) => {
        if (h.city_id) hotelCounts[h.city_id] = (hotelCounts[h.city_id] || 0) + 1;
      });

      const villaCounts: Record<string, number> = {};
      (villasRes.data || []).forEach((v: any) => {
        if (v.city_id) villaCounts[v.city_id] = (villaCounts[v.city_id] || 0) + 1;
      });

      if (!cityErr && cityData) {
        const enrichedCities: City[] = cityData.map((c: any) => ({
          ...c,
          hotels_count: hotelCounts[c.id] || 0,
          villas_count: villaCounts[c.id] || 0,
        }));
        setCities(enrichedCities);
      }
    } catch (err) {
      console.error('Error fetching cities/provinces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingCity(null);
    // Default to first province or Tehran
    const tehranProv = provinces.find((p) => p.name.includes('تهران')) || provinces[0];
    setFormProvinceId(tehranProv ? tehranProv.id : '');
    setFormName('');
    setFormSlug('');
    setFormIsActive(true);
    setFormDisplayOrder(cities.length + 1);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (city: City) => {
    setEditingCity(city);
    setFormProvinceId(city.province_id);
    setFormName(city.name);
    setFormSlug(city.slug);
    setFormIsActive(city.is_active);
    setFormDisplayOrder(city.display_order || 1);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Helper to generate slug from Persian name
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingCity) {
      // Auto suggest slug if empty or user hasn't edited slug manually
      const translitMap: Record<string, string> = {
        تهران: 'tehran',
        کیش: 'kish',
        مشهد: 'mashhad',
        اصفهان: 'isfahan',
        شیراز: 'shiraz',
        تبریز: 'tabriz',
        قشم: 'qeshm',
        یزد: 'yazd',
        لواسان: 'lavasan',
        کردان: 'kordan',
        نوشهر: 'nowshahr',
        چالوس: 'chalous',
        رامسر: 'ramsar',
        متل_قو: 'motel-ghoo',
        رشت: 'rasht',
        اهواز: 'ahvaz',
        بندرعباس: 'bandar-abbas',
        همدان: 'hamedan',
        کرمانشاه: 'kermanshah',
      };
      const trimmed = val.trim();
      if (translitMap[trimmed]) {
        setFormSlug(translitMap[trimmed]);
      } else if (!formSlug) {
        // generic slug generator
        setFormSlug(
          trimmed
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-آ-ی]/g, '')
        );
      }
    }
  };

  const handleSaveCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProvinceId) {
      setErrorMsg('لطفاً استان مربوطه را انتخاب کنید.');
      return;
    }
    if (!formName.trim()) {
      setErrorMsg('لطفاً نام شهر را وارد کنید.');
      return;
    }
    const cleanSlug = formSlug.trim() || formName.trim().toLowerCase().replace(/\s+/g, '-');

    setSaving(true);
    setErrorMsg('');
    const supabase = getSupabaseClient();

    try {
      if (editingCity) {
        // Update existing city
        const { error } = await supabase
          .from('cities')
          .update({
            province_id: formProvinceId,
            name: formName.trim(),
            slug: cleanSlug,
            is_active: formIsActive,
            display_order: Number(formDisplayOrder) || 1,
          })
          .eq('id', editingCity.id);

        if (error) throw error;
      } else {
        // Insert new city
        const { error } = await supabase.from('cities').insert([
          {
            province_id: formProvinceId,
            name: formName.trim(),
            slug: cleanSlug,
            is_active: formIsActive,
            display_order: Number(formDisplayOrder) || 1,
          },
        ]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ذخیره شهر در دیتابیس');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (city: City) => {
    const supabase = getSupabaseClient();
    const newStatus = !city.is_active;

    // Optimistic update
    setCities((prev) =>
      prev.map((c) => (c.id === city.id ? { ...c, is_active: newStatus } : c))
    );

    const { error } = await supabase
      .from('cities')
      .update({ is_active: newStatus })
      .eq('id', city.id);

    if (error) {
      // Revert if error
      setCities((prev) =>
        prev.map((c) => (c.id === city.id ? { ...c, is_active: !newStatus } : c))
      );
      alert('خطا در تغییر وضعیت شهر: ' + error.message);
    }
  };

  const handleDeleteCity = async (city: City) => {
    const totalLinked = (city.hotels_count || 0) + (city.villas_count || 0);
    if (totalLinked > 0) {
      alert(
        `امکان حذف شهر «${city.name}» وجود ندارد چون هم‌اکنون ${totalLinked} اقامتگاه (هتل یا ویلا) به این شهر متصل هستند. لطفاً ابتدا شهر اقامتگاه‌ها را تغییر دهید.`
      );
      return;
    }

    if (!confirm(`آیا از حذف شهر «${city.name}» اطمینان کامل دارید؟`)) {
      return;
    }

    setDeletingCityId(city.id);
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('cities').delete().eq('id', city.id);

    if (error) {
      alert('خطا در حذف شهر: ' + error.message);
    } else {
      setCities((prev) => prev.filter((c) => c.id !== city.id));
    }
    setDeletingCityId(null);
  };

  // Filtered Cities
  const filteredCities = useMemo(() => {
    return cities.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.province?.name && c.province.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesProvince =
        selectedProvinceFilter === 'all' || c.province_id === selectedProvinceFilter;

      return matchesSearch && matchesProvince;
    });
  }, [cities, searchQuery, selectedProvinceFilter]);

  // Statistics
  const activeCitiesCount = cities.filter((c) => c.is_active).length;
  const uniqueProvincesWithCities = new Set(cities.map((c) => c.province_id)).size;
  const totalLinkedProperties = cities.reduce(
    (acc, c) => acc + (c.hotels_count || 0) + (c.villas_count || 0),
    0
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-400/10">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                مدیریت شهرها، استان‌ها و مقاصد
                <span className="text-[11px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-400/30">
                  سراسر کشور
                </span>
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                تنظیم شهرهای فعال جهت دسته‌بندی هتل‌ها، ویلاها، آپارتمان‌ها و فیلتر جستجوی هوشمند در سایت
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="p-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white border border-white/10 transition-all flex items-center gap-2 text-xs font-bold"
            title="بروزرسانی داده‌ها"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">بروزرسانی</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-amber-400/25 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>افزودن شهر جدید</span>
          </button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{activeCitiesCount} <span className="text-xs text-neutral-400 font-normal">از {cities.length} شهر</span></div>
            <div className="text-xs text-neutral-400 font-bold">شهرهای فعال در پلتفرم</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{uniqueProvincesWithCities} <span className="text-xs text-neutral-400 font-normal">استان</span></div>
            <div className="text-xs text-neutral-400 font-bold">استان‌های دارای اقامتگاه فعال</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{totalLinkedProperties} <span className="text-xs text-neutral-400 font-normal">واحد</span></div>
            <div className="text-xs text-neutral-400 font-bold">کل اقامتگاه‌های منتسب به شهرها</div>
          </div>
        </div>
      </div>

      {/* 3. FILTERS BAR */}
      <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام شهر یا اسلاگ..."
            className="w-full glass-input pr-10 pl-4 py-2.5 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Province Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
          <span className="text-xs text-neutral-400 font-bold whitespace-nowrap">فیلتر استان:</span>
          <select
            value={selectedProvinceFilter}
            onChange={(e) => setSelectedProvinceFilter(e.target.value)}
            className="glass-input px-3 py-2 rounded-xl text-xs text-white bg-[#0b1120] border border-white/10 cursor-pointer"
          >
            <option value="all">همه استان‌ها ({provinces.length} استان)</option>
            {provinces.map((prov) => (
              <option key={prov.id} value={prov.id}>
                {prov.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. CITIES LIST / TABLE */}
      <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-bold text-neutral-400">
                <th className="py-4 px-5">ترتیب</th>
                <th className="py-4 px-5">نام شهر</th>
                <th className="py-4 px-5">اسلاگ (انگلیسی / URL)</th>
                <th className="py-4 px-5">استان مربوطه</th>
                <th className="py-4 px-5">اقامتگاه‌های متصل</th>
                <th className="py-4 px-5">وضعیت نمایش</th>
                <th className="py-4 px-5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    <div className="flex items-center justify-center gap-2 text-amber-400">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>در حال دریافت لیست شهرها...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    <MapPin className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                    <span>هیچ شهری مطابق با جستجوی شما یافت نشد.</span>
                  </td>
                </tr>
              ) : (
                filteredCities.map((city) => (
                  <tr key={city.id} className="hover:bg-white/[0.03] transition-colors">
                    {/* Order */}
                    <td className="py-4 px-5 text-neutral-400 font-mono text-[11px]">
                      {city.display_order ?? '-'}
                    </td>

                    {/* Name */}
                    <td className="py-4 px-5">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>{city.name}</span>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="py-4 px-5">
                      <span className="font-mono text-[11px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                        {city.slug}
                      </span>
                    </td>

                    {/* Province */}
                    <td className="py-4 px-5">
                      <div className="text-neutral-300 font-medium flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{city.province?.name || 'نامشخص'}</span>
                      </div>
                    </td>

                    {/* Linked Properties */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-[10px] font-bold text-neutral-300 flex items-center gap-1" title="تعداد هتل‌ها">
                          <Building className="w-3 h-3 text-amber-400" />
                          <span>{city.hotels_count || 0} هتل</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-[10px] font-bold text-neutral-300 flex items-center gap-1" title="تعداد ویلاها و آپارتمان‌ها">
                          <Home className="w-3 h-3 text-sky-400" />
                          <span>{city.villas_count || 0} ویلا</span>
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(city)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black border transition-all flex items-center gap-1.5 ${
                          city.is_active
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                        }`}
                      >
                        {city.is_active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>فعال در سایت</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>غیرفعال</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(city)}
                          className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-amber-400 transition-all border border-white/10"
                          title="ویرایش شهر"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCity(city)}
                          disabled={deletingCityId === city.id}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all border border-rose-500/20"
                          title="حذف شهر"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. ADD / EDIT CITY MODAL */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="glass-card w-full max-w-lg rounded-3xl p-6 sm:p-7 border border-white/15 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-white">
                    {editingCity ? `ویرایش شهر: ${editingCity.name}` : 'افزودن شهر جدید به سامانه'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveCity} className="space-y-4">
                {/* Province Selector */}
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    استان مربوطه: <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={formProvinceId}
                    onChange={(e) => setFormProvinceId(e.target.value)}
                    required
                    className="w-full glass-input px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0b1120] border border-white/15 focus:outline-none focus:border-amber-400"
                  >
                    <option value="" disabled>-- انتخاب استان از ۳۱ استان کشور --</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City Name (Persian) */}
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    نام شهر (فارسی): <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="مثال: کیش، مشهد، اصفهان، لواسان"
                    required
                    className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Slug (English / URL identifier) */}
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    اسلاگ و شناسه لاتین (جهت URL و فیلتر): <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="مثال: kish, mashhad, lavasan"
                    required
                    dir="ltr"
                    className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-mono text-amber-300 placeholder-neutral-500 focus:outline-none focus:border-amber-400 text-left"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    در لینک فیلتر سایت استفاده می‌شود: /hotels?city={formSlug || 'slug'}
                  </span>
                </div>

                {/* Display Order & Active status */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      ترتیب نمایش:
                    </label>
                    <input
                      type="number"
                      value={formDisplayOrder}
                      onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                      min={1}
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      وضعیت فعالیت:
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormIsActive(!formIsActive)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        formIsActive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {formIsActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      <span>{formIsActive ? 'فعال در سایت' : 'غیرفعال'}</span>
                    </button>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-neutral-300 text-xs font-bold transition-all"
                  >
                    انصراف
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-400/25 disabled:opacity-50"
                  >
                    {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>{editingCity ? 'بروزرسانی تغییرات شهر' : 'ثبت شهر جدید'}</span>
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
