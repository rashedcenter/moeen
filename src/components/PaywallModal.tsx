import React, { useState } from 'react';
import { KeyRound, Lock, MessageCircle, X, Loader2, Copy, Check, Wallet, Smartphone } from 'lucide-react';
import { UserProfile } from '../types';
import { Entitlement, redeemCode } from '../lib/firebase';
import { PAYMENT } from '../data/paymentConfig';

interface PaywallModalProps {
  paywall: Entitlement | null;
  user: UserProfile | null;
  onClose: () => void;
  onRedeemed: (ent: Entitlement) => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ paywall, user, onClose, onRedeemed }) => {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!paywall || !user) return null;

  const waText = encodeURIComponent(
    `مرحبًا، أرغب في تفعيل حسابي لتحميل ${PAYMENT.packageSize} تقرير.\nالبريد المسجل: ${user.email}\n(أرفقت صورة التحويل)`
  );

  const copyWallet = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT.wallet.number);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleRedeem = async () => {
    setError('');
    if (!code.trim()) {
      setError('اكتب الكود أولًا.');
      return;
    }
    setBusy(true);
    try {
      const ent = await redeemCode(user.id, code);
      setCode('');
      onRedeemed(ent);
    } catch (e) {
      const m = e instanceof Error ? e.message : '';
      if (m === 'INVALID') setError('الكود غير صحيح. تأكد من كتابته كما وصلك.');
      else if (m === 'USED') setError('هذا الكود مستخدم من قبل.');
      else setError('تعذر التفعيل الآن. تحقق من الاتصال وحاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 no-print">
      <div
        className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 text-right"
        dir="rtl"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-[#003C69] text-white p-5 flex items-start justify-between border-b-4 border-[#B1A06D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#B1A06D]" />
            </div>
            <div>
              <h3 className="font-bold text-base">انتهى رصيد التقارير</h3>
              <p className="text-xs text-slate-200 mt-0.5">
                استخدمت {paywall.used} من {paywall.limit} تقارير
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-[#1F1F1F]">
          <p className="text-sm leading-relaxed">
            لتفعيل حسابك وتحميل ما يصل إلى <strong>{PAYMENT.packageSize} تقرير</strong> بسعر{' '}
            <strong className="text-[#003C69]">{PAYMENT.priceText}</strong>، ادفع بإحدى الطرق التالية ثم أرسل لنا
            صورة التحويل على واتساب، وسيصلك كود التفعيل. كل كود يضيف {PAYMENT.packageSize} تقرير إلى رصيدك.
          </p>

          {/* طرق الدفع */}
          <div className="space-y-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Wallet className="w-4 h-4 text-[#B1A06D] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-500">{PAYMENT.wallet.name}</p>
                  <p dir="ltr" className="font-mono text-sm font-bold text-right">{PAYMENT.wallet.number}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={copyWallet}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-[#003C69] flex items-center gap-1.5 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#00B050]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ' : 'نسخ الرقم'}</span>
              </button>
            </div>

            <a
              href={PAYMENT.instapayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 p-3 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#B1A06D] shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-500">إنستاباي (InstaPay)</p>
                  <p className="text-sm font-bold text-[#003C69]">الدفع عبر رابط إنستاباي</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#003C69]">فتح الرابط</span>
            </a>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              من خارج مصر؟ تواصل معنا عبر واتساب لنرتب لك طريقة دفع مناسبة في بلدك.
            </p>
          </div>

          {/* واتساب */}
          <a
            href={`https://wa.me/${PAYMENT.whatsappIntl}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 bg-[#00B050] hover:bg-[#009b46] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>
              تواصل عبر واتساب <span dir="ltr" className="font-mono">{PAYMENT.whatsappDisplay}</span>
            </span>
          </a>

          {/* إدخال الكود */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <label htmlFor="redeem-code" className="text-xs font-bold text-[#003C69] flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-[#B1A06D]" />
              <span>لديك كود تفعيل؟ اكتبه هنا</span>
            </label>
            <div className="flex gap-2">
              <input
                id="redeem-code"
                type="text"
                dir="ltr"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="MOEEN-XXXXXXXXXXXX"
                autoComplete="off"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono outline-none focus:border-[#003C69]"
              />
              <button
                type="button"
                onClick={handleRedeem}
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-[#003C69] hover:bg-[#002f54] text-white text-sm font-bold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>تفعيل</span>
              </button>
            </div>
            {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
