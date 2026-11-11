import React, { useCallback, useEffect, useState } from 'react';
import { Star, MessageSquare, Trash2, LogIn } from 'lucide-react';
import { UserProfile } from '../types';
import {
  Review,
  MAX_REVIEW_CHARS,
  fetchReviews,
  fetchReviewStats,
  fetchMyReview,
  saveReview,
  deleteReview,
} from '../lib/reviews';
import { ADMIN_UID } from '../data/paymentConfig';

interface Props {
  currentUser: UserProfile | null;
  onOpenAccount: () => void;
}

const PAGE = 10;

function Stars({ value, size = 18 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} من 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={i <= Math.round(value) ? 'text-[#B1A06D]' : 'text-slate-300'}
          fill={i <= Math.round(value) ? '#B1A06D' : 'none'}
        />
      ))}
    </span>
  );
}

export const ReviewsSection: React.FC<Props> = ({ currentUser, onOpenAccount }) => {
  const [items, setItems] = useState<Review[]>([]);
  const [stats, setStats] = useState<{ avg: number; count: number } | null>(null);
  const [size, setSize] = useState(PAGE);
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async (n: number) => {
    setLoading(true);
    try {
      const list = await fetchReviews(n);
      setItems(list);
      try {
        setStats(await fetchReviewStats());
      } catch {
        // لو لم يتوفر العدّ من الخادم نحسب من القائمة المعروضة
        const c = list.length;
        setStats({ avg: c ? list.reduce((a, r) => a + r.rating, 0) / c : 0, count: c });
      }
    } catch (e) {
      console.warn('reviews load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(size);
  }, [size, load]);

  useEffect(() => {
    let alive = true;
    if (!currentUser) {
      setMine(null);
      setRating(0);
      setText('');
      return;
    }
    fetchMyReview(currentUser.id)
      .then((r) => {
        if (!alive) return;
        setMine(r);
        setRating(r?.rating || 0);
        setText(r?.text || '');
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [currentUser]);

  const submit = async () => {
    if (!currentUser) return;
    if (rating < 1) {
      setMsg('اختر عدد النجوم أولًا.');
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await saveReview(currentUser.id, currentUser.name, rating, text, mine);
      setMine(await fetchMyReview(currentUser.id));
      setMsg(mine ? 'تم تحديث تقييمك.' : 'شكرًا لك! تم نشر تقييمك.');
      await load(size);
    } catch (e) {
      console.warn(e);
      setMsg('تعذر حفظ التقييم. حاول مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (uid: string) => {
    if (!window.confirm('حذف هذا التقييم؟')) return;
    try {
      await deleteReview(uid);
      if (currentUser && uid === currentUser.id) {
        setMine(null);
        setRating(0);
        setText('');
      }
      await load(size);
    } catch {
      setMsg('تعذر الحذف.');
    }
  };

  const isAdmin = currentUser?.id === ADMIN_UID;
  const total = stats?.count || 0;
  const shown = hover || rating;

  return (
    <section aria-label="تقييمات المستخدمين" className="no-print max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-10" dir="rtl">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#003C69] text-white flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[#B1A06D]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#003C69]">آراء وتقييمات المستخدمين</h2>
              <p className="text-xs text-slate-500">شاركنا تجربتك مع الحاسبة لتساعد غيرك وتساعدنا على التطوير</p>
            </div>
          </div>
          {total > 0 && stats && (
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-[#003C69]">
                {stats.avg.toLocaleString('ar-EG', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}
              </span>
              <div>
                <Stars value={stats.avg} />
                <span className="text-[11px] text-slate-500 block">
                  من {total.toLocaleString('ar-EG')} تقييم
                </span>
              </div>
            </div>
          )}
        </div>

        {/* نموذج الكتابة */}
        {currentUser ? (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <div className="text-sm font-bold text-slate-800">
              {mine ? 'تقييمك الحالي (يمكنك تعديله)' : `كيف تقيّم الحاسبة يا ${currentUser.name}؟`}
            </div>
            <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHover(i)}
                  onClick={() => setRating(i)}
                  aria-label={`${i} نجوم`}
                  className="p-0.5 cursor-pointer"
                >
                  <Star
                    width={30}
                    height={30}
                    className={i <= shown ? 'text-[#B1A06D]' : 'text-slate-300'}
                    fill={i <= shown ? '#B1A06D' : 'none'}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_REVIEW_CHARS))}
              rows={3}
              placeholder="اكتب رأيك أو اقتراحك (اختياري)"
              className="w-full border border-slate-300 rounded-xl p-3 text-sm bg-white focus:border-[#003C69] focus:outline-none"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">
                {text.length} / {MAX_REVIEW_CHARS}
              </span>
              <div className="flex items-center gap-3">
                {msg && <span className="text-xs font-bold text-[#003C69]">{msg}</span>}
                {mine && (
                  <button
                    type="button"
                    onClick={() => remove(currentUser.id)}
                    className="text-xs text-slate-500 hover:text-rose-600 font-bold cursor-pointer"
                  >
                    حذف تقييمي
                  </button>
                )}
                <button
                  type="button"
                  onClick={submit}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#00B050] hover:bg-[#009b46] text-white text-sm font-bold disabled:opacity-60 cursor-pointer"
                >
                  {saving ? 'جارٍ الحفظ...' : mine ? 'تحديث التقييم' : 'نشر التقييم'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 border border-dashed border-slate-300 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-sm text-slate-700 font-medium">سجّل دخولك لتكتب تقييمك وتعليقك.</span>
            <button
              type="button"
              onClick={onOpenAccount}
              className="px-4 py-2 rounded-xl bg-[#003C69] hover:bg-[#002f54] text-white text-sm font-bold flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </button>
          </div>
        )}

        {/* القائمة */}
        <div className="space-y-3">
          {items.length === 0 && !loading && (
            <p className="text-center text-sm text-slate-400 py-4">كن أول من يكتب تقييمًا.</p>
          )}
          {items.map((r) => (
            <article key={r.uid} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-slate-800">{r.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Stars value={r.rating} size={14} />
                    <span className="text-[11px] text-slate-400">
                      {new Date(r.updatedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => remove(r.uid)}
                    title="حذف (للإدارة)"
                    className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {r.text && <p className="text-sm text-slate-700 leading-relaxed mt-2 whitespace-pre-line break-words">{r.text}</p>}
            </article>
          ))}
          {items.length >= size && total > items.length && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setSize((s) => s + PAGE)}
                disabled={loading}
                className="px-5 py-2 rounded-xl border border-slate-300 text-[#003C69] text-sm font-bold hover:bg-slate-50 cursor-pointer"
              >
                {loading ? 'جارٍ التحميل...' : 'عرض المزيد'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
