import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, X, Plus, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import { createActivationCode, listRecentCodes, ActivationCode } from '../lib/firebase';
import { PAYMENT } from '../data/paymentConfig';

interface AdminCodesPanelProps {
  onClose: () => void;
}

export const AdminCodesPanel: React.FC<AdminCodesPanelProps> = ({ onClose }) => {
  const [credits, setCredits] = useState<number>(PAYMENT.packageSize);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [newCode, setNewCode] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setCodes(await listRecentCodes());
    } catch (e) {
      console.warn('Could not list codes', e);
      setError('تعذر تحميل قائمة الأكواد. تأكد أن القواعد الجديدة نُشرت في Firebase.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleCreate = async () => {
    setError('');
    const n = Math.floor(Number(credits));
    if (!n || n < 1 || n > 10000) {
      setError('اكتب عددًا صحيحًا من التقارير بين 1 و 10000.');
      return;
    }
    setBusy(true);
    try {
      const code = await createActivationCode(n);
      setNewCode(code);
      reload();
    } catch (e) {
      console.warn('Could not create code', e);
      setError('تعذر إنشاء الكود. تأكد أن القواعد الجديدة نُشرت وأنك مسجل بحسابك الأساسي.');
    } finally {
      setBusy(false);
    }
  };

  const customerMessage = (code: string, n: number) =>
    `أهلًا بك 🌟\nكود تفعيل حسابك لتحميل ${n} تقرير:\n${code}\n\nافتح الموقع، وعند ظهور نافذة التفعيل اكتب الكود واضغط «تفعيل».\nشكرًا لثقتك بـ مُعِين البناء والتشطيب.`;

  return (
    <div className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 no-print">
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 text-right"
        dir="rtl"
      >
        <div className="bg-[#003C69] text-white p-5 flex items-center justify-between border-b-4 border-[#B1A06D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-[#B1A06D]" />
            </div>
            <div>
              <h3 className="font-bold text-base">إدارة أكواد التفعيل</h3>
              <p className="text-xs text-slate-200 mt-0.5">هذه الصفحة تظهر لك أنت فقط</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-[#1F1F1F]">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="credits-input" className="text-xs font-bold text-[#003C69] block mb-1">
                عدد التقارير في الكود
              </label>
              <input
                id="credits-input"
                type="number"
                min={1}
                max={10000}
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-[#003C69]"
              />
            </div>
            <button
              type="button"
              onClick={handleCreate}
              disabled={busy}
              className="px-4 py-2 rounded-xl bg-[#00B050] hover:bg-[#009b46] text-white text-sm font-bold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>إنشاء كود جديد</span>
            </button>
          </div>

          {error && <p className="text-xs font-bold text-rose-600">{error}</p>}

          {newCode && (
            <div className="rounded-xl border-2 border-[#00B050] bg-emerald-50 p-4 space-y-3">
              <p className="text-xs font-bold text-emerald-800">تم إنشاء الكود وحفظه:</p>
              <p dir="ltr" className="font-mono text-lg font-bold text-center text-[#003C69] select-all">{newCode}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copy('new-code', newCode)}
                  className="flex-1 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-[#003C69] flex items-center justify-center gap-1.5 hover:bg-slate-50 cursor-pointer"
                >
                  {copiedKey === 'new-code' ? <Check className="w-3.5 h-3.5 text-[#00B050]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>نسخ الكود</span>
                </button>
                <button
                  type="button"
                  onClick={() => copy('new-msg', customerMessage(newCode, Math.floor(Number(credits)) || PAYMENT.packageSize))}
                  className="flex-1 py-2 rounded-lg bg-[#003C69] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#002f54] cursor-pointer"
                >
                  {copiedKey === 'new-msg' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>نسخ رسالة العميل</span>
                </button>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#003C69]">آخر الأكواد</h4>
              <button type="button" onClick={reload} className="text-[11px] font-bold text-slate-500 hover:text-[#003C69] flex items-center gap-1 cursor-pointer">
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>تحديث</span>
              </button>
            </div>
            {codes.length === 0 ? (
              <p className="text-xs text-slate-500">لا توجد أكواد منشأة من هذه الصفحة بعد.</p>
            ) : (
              <ul className="space-y-1.5">
                {codes.map((c) => (
                  <li key={c.code} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
                    <div className="min-w-0">
                      <p dir="ltr" className="font-mono text-xs font-bold text-right truncate">{c.code}</p>
                      <p className="text-[11px] text-slate-500">{c.credits} تقرير</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.used ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {c.used ? 'مستخدم' : 'جاهز'}
                      </span>
                      {!c.used && (
                        <button
                          type="button"
                          onClick={() => copy(c.code, c.code)}
                          aria-label="نسخ الكود"
                          className="p-1.5 rounded-md hover:bg-slate-100 cursor-pointer"
                        >
                          {copiedKey === c.code ? <Check className="w-3.5 h-3.5 text-[#00B050]" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
