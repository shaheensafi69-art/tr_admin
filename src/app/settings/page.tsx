'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  CreditCard,
  Send,
  Coins,
  ShieldCheck,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  RefreshCw,
  BellRing,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface BankAccount {
  id: string;
  bank_name: string;
  card_number: string;
  account_number?: string;
  iban?: string;
  account_holder: string;
  currency: string;
  is_active: boolean;
}

interface CurrencyRate {
  code: string;
  name_fa: string;
  symbol: string;
  rate_to_toman: number;
}

interface SiteSettings {
  id: string;
  brand_name: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  email: string;
  address: string;
}

export default function SettingsPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Telegram Test State
  const [botToken, setBotToken] = useState('9295079074:AAHbyliQZWVEcTUKDsM4dwpd5EhAmmBkJtA');
  const [chatId, setChatId] = useState('5195615040');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Rubika State (User Request)
  const [rubikaToken, setRubikaToken] = useState('CJFFJC0OAUVJPINPXESUNWLFWAIYFYONBAHGOLEPFXICQBQAKWXYIZEQHTURIELM');
  const [rubikaChatId, setRubikaChatId] = useState('b0DtjUc0BS1m03e2739480186618e1d4');
  const [rubikaSending, setRubikaSending] = useState(false);
  const [rubikaTestResult, setRubikaTestResult] = useState<string | null>(null);

  // New Bank Account Modal / State
  const [newBankName, setNewBankName] = useState('بانک سامان');
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newHolder, setNewHolder] = useState('پلتفرم رزرو آنلاین تهران‌روم');
  const [newIban, setNewIban] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();

    // 1. Bank Accounts
    const { data: bData } = await supabase.from('bank_accounts').select('*').order('created_at', { ascending: true });
    if (bData) setBankAccounts(bData);

    // 2. Currencies (Sync live from Google / global market)
    try {
      const res = await fetch('/api/currency/live');
      const curData = await res.json();
      if (curData.success && curData.rates) {
        const list = Object.values(curData.rates) as CurrencyRate[];
        setCurrencies(list);
      } else {
        const { data: cData } = await supabase.from('currencies').select('*').order('rate_to_toman', { ascending: false });
        if (cData) setCurrencies(cData);
      }
    } catch {
      const { data: cData } = await supabase.from('currencies').select('*').order('rate_to_toman', { ascending: false });
      if (cData) setCurrencies(cData);
    }

    // 3. Site Settings
    const { data: sData } = await supabase.from('site_settings').select('*').limit(1).single();
    if (sData) setSiteSettings(sData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleBankActive = async (id: string, current: boolean) => {
    const supabase = getSupabaseClient();
    await supabase.from('bank_accounts').update({ is_active: !current }).eq('id', id);
    fetchData();
  };

  const handleAddBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardNumber.trim()) return;
    const supabase = getSupabaseClient();

    await supabase.from('bank_accounts').insert({
      bank_name: newBankName,
      card_number: newCardNumber.trim(),
      account_holder: newHolder.trim(),
      iban: newIban.trim(),
      currency: 'TOMAN',
      is_active: true,
    });

    setNewCardNumber('');
    setNewIban('');
    fetchData();
  };

  const handleDeleteBank = async (id: string) => {
    if (!confirm('آیا از حذف این شماره کارت اطمینان دارید؟')) return;
    const supabase = getSupabaseClient();
    await supabase.from('bank_accounts').delete().eq('id', id);
    fetchData();
  };

  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteSettings) return;
    setSavingSettings(true);
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('site_settings')
      .update({
        phone: siteSettings.phone,
        whatsapp: siteSettings.whatsapp,
        telegram: siteSettings.telegram,
        email: siteSettings.email,
        address: siteSettings.address,
        updated_at: new Date().toISOString(),
      })
      .eq('id', siteSettings.id);

    setSavingSettings(false);
    if (!error) {
      setSaveStatus('تنظیمات سامانه با موفقیت ذخیره شد.');
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      alert(`خطا در ذخیره تنظیمات: ${error.message}`);
    }
  };

  const handleTestTelegramNotification = async () => {
    setTestSending(true);
    setTestResult(null);

    try {
      const message = `🔔 *تست سیستم اطلاع‌رسانی تهران‌روم*\n\nربات تلگرام با موفقیت متصل شد!\nزمان ارسال: ${new Date().toLocaleTimeString('fa-IR')}`;
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setTestResult('پیام تستی با موفقیت به تلگرام ادمین ارسال شد!');
      } else {
        setTestResult(`خطای تلگرام: ${data.description || 'نامشخص'}`);
      }
    } catch (err: any) {
      setTestResult(`خطای شبکه: ${err.message}`);
    } finally {
      setTestSending(false);
    }
  };

  const handleTestRubikaNotification = async () => {
    setRubikaSending(true);
    setRubikaTestResult(null);

    try {
      const message = `🔔 تست ربات روبیکا تهران‌روم\n\nپیام‌رسان روبیکا با موفقیت به سامانه متصل شد!\nزمان ارسال: ${new Date().toLocaleTimeString('fa-IR')}`;
      const url = `https://botapi.rubika.ir/v3/${rubikaToken}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: rubikaChatId,
          text: message,
        }),
      });

      const data = await res.json();
      if (data.status === 'OK') {
        setRubikaTestResult('پیام تستی با موفقیت به ربات روبیکای مدیر ارسال شد!');
      } else {
        setRubikaTestResult(`خطای روبیکا: ${data.message || data.status || 'نامشخص'}`);
      }
    } catch (err: any) {
      setRubikaTestResult(`خطای شبکه: ${err.message}`);
    } finally {
      setRubikaSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-amber-400" />
            <span>تنظیمات مالی، بانکی و سامانه‌ای</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-medium">
            مدیریت شماره کارت‌های واریز مسافران، هشدار ربات تلگرام، نرخ برابری ارزها و اطلاعات تماس
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

      {saveStatus && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveStatus}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* 1. BANK ACCOUNTS & CARD MANAGEMENT */}
        <div className="glass-panel-dark rounded-3xl p-6 border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <span>شماره کارت‌های واریز مسافران (کارت‌به‌کارت)</span>
            </h2>
            <span className="text-[11px] text-neutral-400">نمایش در فرم پرداخت</span>
          </div>

          {/* Existing Accounts List */}
          <div className="space-y-3">
            {bankAccounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{acc.bank_name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        acc.is_active
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {acc.is_active ? 'فعال در درگاه' : 'غیرفعال'}
                    </span>
                  </div>

                  <div className="font-mono text-base font-black text-amber-300 tracking-wider" dir="ltr">
                    {acc.card_number}
                  </div>

                  <div className="text-[11px] text-neutral-400">به نام: {acc.account_holder}</div>
                  {acc.iban && <div className="text-[10px] font-mono text-neutral-500" dir="ltr">{acc.iban}</div>}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleBankActive(acc.id, acc.is_active)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                      acc.is_active
                        ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    }`}
                  >
                    {acc.is_active ? 'غیرفعال' : 'فعال‌سازی'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteBank(acc.id)}
                    className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Bank Account Form */}
          <form onSubmit={handleAddBankAccount} className="p-4 rounded-2xl border border-dashed border-white/20 space-y-3">
            <span className="text-xs font-bold text-neutral-300 block">افزودن شماره کارت جدید:</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400">نام بانک:</label>
                <input
                  type="text"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                  placeholder="بانک سامان"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400">شماره کارت (۱۶ رقمی):</label>
                <input
                  type="text"
                  value={newCardNumber}
                  onChange={(e) => setNewCardNumber(e.target.value)}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono text-center font-bold"
                  placeholder="6219-8610-..."
                  dir="ltr"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400">نام صاحب حساب:</label>
                <input
                  type="text"
                  value={newHolder}
                  onChange={(e) => setNewHolder(e.target.value)}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                  placeholder="پلتفرم تهران‌روم"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400">شماره شبا (اختیاری):</label>
                <input
                  type="text"
                  value={newIban}
                  onChange={(e) => setNewIban(e.target.value)}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                  placeholder="IR..."
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن کارت به درگاه</span>
            </button>
          </form>
        </div>

        {/* 2. TELEGRAM BOT NOTIFICATIONS */}
        <div className="glass-panel-dark rounded-3xl p-6 border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-400" />
              <span>تنظیمات ربات تلگرام و هشدار رسید مسافر</span>
            </h2>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
              تایید فوری ۲۴/۷
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">توکن بات تلگرام (Bot Token):</label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">چت آیدی مدیر (Admin Chat ID):</label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono"
                dir="ltr"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-neutral-300 leading-relaxed">
              با ثبت رزرو جدید یا آپلود رسید توسط مسافر در تهران‌روم، بلافاصله عکس رسید واریزی همراه با مشخصات مسافر، اتاق و مبلغ به این چت آیدی ارسال می‌شود.
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold ${
                  testResult.includes('موفقیت')
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {testResult}
              </div>
            )}

            <button
              type="button"
              onClick={handleTestTelegramNotification}
              disabled={testSending}
              className="w-full py-3 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <BellRing className={`w-4 h-4 ${testSending ? 'animate-bounce' : ''}`} />
              <span>{testSending ? 'در حال ارسال تست...' : 'ارسال پیام تستی به تلگرام مدیر'}</span>
            </button>
          </div>
        </div>

        {/* 2.5 RUBIKA BOT NOTIFICATIONS */}
        <div className="glass-panel-dark rounded-3xl p-6 border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-xs font-black">
                R
              </div>
              <span>تنظیمات ربات روبیکا (Rubika Bot) و اطلاع‌رسانی سفارشات</span>
            </h2>
            <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span>ارسال موازی با تلگرام</span>
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">توکن احراز هویت ربات روبیکا (Bot Token):</label>
              <input
                type="text"
                value={rubikaToken}
                onChange={(e) => setRubikaToken(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono"
                dir="ltr"
                placeholder="CJFFJC0OAUV..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">شناسه چت مدیر در روبیکا (Admin Chat ID):</label>
              <input
                type="text"
                value={rubikaChatId}
                onChange={(e) => setRubikaChatId(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono"
                dir="ltr"
                placeholder="b0DtjUc0..."
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-neutral-300 leading-relaxed">
              با ثبت رزرو جدید، آپلود فیش، درخواست لغو یا تغییر وضعیت در تهران‌روم، بلافاصله کلیه مشخصات به صورت خودکار به روبیکای مدیریت نیز ارسال می‌گردد.
            </div>

            {rubikaTestResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold ${
                  rubikaTestResult.includes('موفقیت')
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {rubikaTestResult}
              </div>
            )}

            <button
              type="button"
              onClick={handleTestRubikaNotification}
              disabled={rubikaSending}
              className="w-full py-3 rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <BellRing className={`w-4 h-4 ${rubikaSending ? 'animate-bounce' : ''}`} />
              <span>{rubikaSending ? 'در حال ارسال تست...' : 'ارسال پیام تستی به روبیکای مدیر'}</span>
            </button>
          </div>
        </div>

        {/* 3. MULTI-CURRENCY EXCHANGE RATES (READ-ONLY LIVE FROM GOOGLE / GLOBAL MARKET) */}
        <div className="glass-panel-dark rounded-3xl p-6 border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <span>نرخ زنده ارزها (استعلام زنده از گوگل)</span>
            </h2>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>غیرقابل تغییر دستی (امن)</span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              ارزش برابری ارزها (دلار آمریکا، یورو، افغانی و ریال) بر اساس قیمت لحظه‌ای روز از <strong>گوگل فایننس و مارکت جهانی</strong> دریافت می‌شود و برای شفافیت و امنیت مالی هتل، توسط هیچ کاربری در ادمین قابل دستکاری نیست.
            </p>
          </div>

          <div className="space-y-3">
            {currencies.map((curr) => {
              if (curr.code === 'TOMAN') return null;
              const rate = curr.rate_to_toman;
              const rialRate = rate * 10;

              return (
                <div
                  key={curr.code}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-sm">
                        {curr.name_fa}
                      </span>
                      <span className="bg-white/10 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded-md font-bold" dir="ltr">
                        1 {curr.code} ({curr.symbol})
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-mono" dir="ltr">
                      معادل ریال: {rialRate.toLocaleString('fa-IR')} IRR
                    </span>
                  </div>

                  <div className="text-left bg-black/40 px-3.5 py-2 rounded-xl border border-white/10">
                    <span className="text-base font-black text-amber-400 font-mono" dir="ltr">
                      {rate.toLocaleString('fa-IR')}
                    </span>
                    <span className="text-[11px] text-neutral-300 mr-1.5 font-bold">تومان</span>
                  </div>
                </div>
              );
            })}

            {/* Rial reference box */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-black text-white text-sm">ریال ایران (IRR)</span>
                <span className="text-[11px] text-neutral-400 block font-mono" dir="ltr">
                  هر ۱ تومان = ۱۰ ریال
                </span>
              </div>
              <div className="text-left bg-black/40 px-3.5 py-2 rounded-xl border border-white/10">
                <span className="text-xs font-mono font-bold text-neutral-300" dir="ltr">
                  ضریب تبدیل رسمی: ×۱۰
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. PLATFORM CONTACT INFO */}
        {siteSettings && (
          <form onSubmit={handleSaveSiteSettings} className="glass-panel-dark rounded-3xl p-6 border border-white/10 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>اطلاعات تماس پلتفرم</span>
              </h2>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-300">تلفن پشتیبانی (با کد کشور انگلیسی):</label>
                <input
                  type="text"
                  value={siteSettings.phone}
                  onChange={(e) => setSiteSettings({ ...siteSettings, phone: e.target.value })}
                  className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono"
                  dir="ltr"
                  placeholder="+98 21 9100 8899"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-300">شماره واتساپ پشتیبان:</label>
                <input
                  type="text"
                  value={siteSettings.whatsapp}
                  onChange={(e) => setSiteSettings({ ...siteSettings, whatsapp: e.target.value })}
                  className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono"
                  dir="ltr"
                  placeholder="+989123456789"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-300">ایمیل پشتیبانی:</label>
                <input
                  type="email"
                  value={siteSettings.email}
                  onChange={(e) => setSiteSettings({ ...siteSettings, email: e.target.value })}
                  className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs font-mono"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full gold-glow-btn py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Save className={`w-4 h-4 ${savingSettings ? 'animate-spin' : ''}`} />
              <span>{savingSettings ? 'در حال ذخیره‌سازی...' : 'ذخیره اطلاعات تماس'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

