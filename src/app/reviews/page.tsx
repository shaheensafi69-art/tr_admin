'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Review {
  id: string;
  hotel_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  is_verified_stay: boolean;
  is_published: boolean;
  created_at: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'pending'>('all');

  // Add Review Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newAuthor, setNewAuthor] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (data) {
      setReviews(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    const supabase = getSupabaseClient();
    await supabase.from('reviews').update({ is_published: !currentStatus }).eq('id', id);
    fetchReviews();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این نظر اطمینان دارید؟')) return;
    const supabase = getSupabaseClient();
    await supabase.from('reviews').delete().eq('id', id);
    fetchReviews();
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newComment.trim()) return;
    setSubmitting(true);

    const supabase = getSupabaseClient();
    const { error } = await supabase.from('reviews').insert({
      hotel_id: 'e0000000-0000-0000-0000-000000000001',
      customer_name: newAuthor.trim(),
      rating: newRating,
      comment: newComment.trim(),
      is_verified_stay: true,
      is_published: true,
    });

    setSubmitting(false);
    if (!error) {
      setIsAddOpen(false);
      setNewAuthor('');
      setNewComment('');
      fetchReviews();
    } else {
      alert(`خطا در ثبت نظر: ${error.message}`);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filter === 'published') return r.is_published;
    if (filter === 'pending') return !r.is_published;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-amber-400" />
            <span>مدیریت و تایید نظرات مسافران</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-medium">
            بررسی، تایید انتشار در وب‌سایت، حذف یا ثبت نظرات تاییدشده مهمانان هتل تابان
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchReviews}
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
            <span>ثبت نظر جدید</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'all' ? 'bg-amber-400 text-slate-950 font-black' : 'glass-panel text-neutral-300'
          }`}
        >
          همه نظرات ({reviews.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('published')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'published' ? 'bg-emerald-500 text-white font-black' : 'glass-panel text-neutral-300'
          }`}
        >
          منتشر شده در سایت ({reviews.filter((r) => r.is_published).length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 font-black' : 'glass-panel text-neutral-300'
          }`}
        >
          در انتظار تایید ({reviews.filter((r) => !r.is_published).length})
        </button>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="glass-panel p-16 text-center text-xs text-neutral-400">
          در حال بارگذاری نظرات مسافران...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="glass-panel p-16 text-center text-xs text-neutral-400 space-y-2">
          <MessageSquare className="w-8 h-8 text-neutral-500 mx-auto" />
          <p>هیچ نظری در این بخش وجود ندارد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="glass-panel-dark rounded-3xl p-5 border border-white/10 space-y-4 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 font-black flex items-center justify-center text-xs border border-amber-400/30">
                      {review.customer_name?.charAt(0) || 'م'}
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs block">{review.customer_name}</span>
                      <span className="text-[10px] text-neutral-400">
                        {review.created_at ? new Date(review.created_at).toLocaleDateString('fa-IR') : '---'}
                      </span>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'opacity-25'}`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-neutral-200 leading-relaxed text-justify bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                  «{review.comment}»
                </p>

                <div className="flex items-center gap-2">
                  {review.is_verified_stay && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" />
                      <span>اقامت تایید شده در هتل</span>
                    </span>
                  )}

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      review.is_published
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                    }`}
                  >
                    {review.is_published ? 'منتشر شده' : 'پیش‌نویس / مخفی'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePublish(review.id, review.is_published)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    review.is_published
                      ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                  }`}
                >
                  {review.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{review.is_published ? 'لغو انتشار' : 'تایید و انتشار'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(review.id)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="حذف نظر"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Review Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel-dark rounded-3xl border border-amber-400/30 p-6 space-y-5">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              <span>ثبت نظر جدید مسافر</span>
            </h2>

            <form onSubmit={handleAddReview} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">نام مسافر:</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs"
                  placeholder="مثال: دکتر علیرضا سلیمانی"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">امتیاز داده شده (۱ تا ۵):</label>
                <select
                  value={newRating}
                  onChange={(e) => setNewRating(parseInt(e.target.value) || 5)}
                  className="w-full glass-input px-3.5 py-2.5 rounded-2xl text-xs"
                >
                  <option value={5}>۵ ستاره (عالی)</option>
                  <option value={4}>۴ ستاره (بسیار خوب)</option>
                  <option value={3}>۳ ستاره (متوسط)</option>
                  <option value={2}>۲ ستاره (ضعیف)</option>
                  <option value={1}>۱ ستاره (خیلی ضعیف)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">متن نظر و تجربه اقامت:</label>
                <textarea
                  rows={4}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full glass-input p-3 rounded-2xl text-xs leading-relaxed"
                  placeholder="تجربه مسافر درباره نظافت، برخورد پرسنل، کیفیت صبحانه..."
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl glass-panel text-xs text-neutral-400"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="gold-glow-btn px-6 py-2.5 rounded-xl text-xs font-black"
                >
                  {submitting ? 'در حال ثبت...' : 'ثبت نظر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

