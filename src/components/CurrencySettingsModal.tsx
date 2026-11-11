import React, { useState, useEffect } from 'react';
import { CurrencyCode } from '../types';
import {
  CURRENCIES,
  DEFAULT_RATES,
  loadExchangeRates,
  saveExchangeRates,
  loadExchangeRateMetadata,
  fetchLiveExchangeRates,
  loadCurrencyPricingMode,
  saveCurrencyPricingMode,
  CurrencyPricingMode,
  ExchangeRateMetadata,
  formatNumber,
} from '../data/currencies';
import {
  Coins,
  X,
  Check,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  ArrowRightLeft,
  Building,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface CurrencySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCurrency: CurrencyCode;
  onCurrencyChange?: (c: CurrencyCode) => void;
  onRatesUpdated: () => void;
}

export const CurrencySettingsModal: React.FC<CurrencySettingsModalProps> = ({
  isOpen,
  onClose,
  activeCurrency,
  onCurrencyChange,
  onRatesUpdated,
}) => {
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(() => loadExchangeRates());
  const [pricingMode, setPricingMode] = useState<CurrencyPricingMode>(() => loadCurrencyPricingMode());
  const [metadata, setMetadata] = useState<ExchangeRateMetadata>(() => loadExchangeRateMetadata());
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [fetchSuccessMsg, setFetchSuccessMsg] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Quick interactive test converter
  const [testAmountEgp, setTestAmountEgp] = useState<number>(10000);

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setRates(loadExchangeRates());
      setPricingMode(loadCurrencyPricingMode());
      setMetadata(loadExchangeRateMetadata());
      setFetchSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRateChange = (code: CurrencyCode, valStr: string) => {
    const val = parseFloat(valStr);
    setRates((prev) => ({
      ...prev,
      [code]: isNaN(val) || val <= 0 ? 1 : val,
    }));
  };

  const handleFetchLiveRates = async () => {
    setIsFetchingLive(true);
    setFetchSuccessMsg(null);
    try {
      const result = await fetchLiveExchangeRates();
      setRates(result.rates);
      setMetadata(result.metadata);
      setFetchSuccessMsg('تم جلب وتحديث أسعار الصرف اليومية الحية بنجاح!');
      setTimeout(() => setFetchSuccessMsg(null), 3500);
    } catch {
      setFetchSuccessMsg('تعذر الاتصال بالسوق الحي، تم الإبقاء على الأسعار المحفوظة.');
      setTimeout(() => setFetchSuccessMsg(null), 3000);
    } finally {
      setIsFetchingLive(false);
    }
  };

  const handleSave = () => {
    saveExchangeRates(rates, {
      source: 'user_custom',
      sourceLabel: 'أسعار محددة ومحدثة من المستخدم',
    });
    saveCurrencyPricingMode(pricingMode);
    onRatesUpdated();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleResetToDefaults = () => {
    setRates({ ...DEFAULT_RATES });
    setPricingMode('direct');
    saveExchangeRates(DEFAULT_RATES, {
      source: 'default',
      sourceLabel: 'الأسعار القياسية المرجعية',
    });
    saveCurrencyPricingMode('direct');
    setMetadata(loadExchangeRateMetadata());
    onRatesUpdated();
  };

  const activeRate = activeCurrency === 'EGP' ? 1 : (rates[activeCurrency] || 1);
  const convertedTestAmount = activeCurrency === 'EGP'
    ? testAmountEgp
    : Math.round((testAmountEgp / activeRate) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all text-right font-sans my-4"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-[#003C69] text-white p-4 sm:p-5 flex items-center justify-between border-b-4 border-[#B1A06D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <Coins className="w-5 h-5 text-[#B1A06D]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>إدارة العملات ومنع أخطاء سعر الصرف اليومي</span>
              </h2>
              <span className="text-[11px] sm:text-xs text-slate-300 block">
                تحكم حر في طريقة الحساب وتعديل أسعار الصرف اليومية لمنع أي خطأ حسابي
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Engineering Core Warning - The exact problem solved */}
          <div className="p-4 bg-amber-50/90 border-r-4 border-amber-500 rounded-xl text-amber-950 text-xs leading-relaxed space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>لماذا لا نربط العملات بمعادلة ثابتة تلقائياً؟</span>
            </div>
            <p className="text-slate-700">
              <strong>سعر الصرف في البنوك والأسواق يتغير يومياً،</strong> وقيمة كل عملة مقارنة بالجنيه المصري تختلف يوماً بعد يوم. والأهم من ذلك: <strong>أسعار مواد البناء والمصنعيات في الخليج والدول الأخرى لا تخضع لقسمة حسابية مع مصر،</strong> لأن تكلفة الأسمنت أو السيراميك أو أجر العامل في السعودية أو الإمارات لها سوقها الخاص المستقل.
            </p>
            <p className="text-emerald-900 font-semibold pt-1 border-t border-amber-200/60">
              ✓ <strong>الحل المتبع هنا:</strong> نتيح لك خيارين واضحين: إما <strong>التسعير المستقل المباشر</strong> بعملة بلدك دون أي معادلة، أو <strong>التحويل بسعر الصرف اليومي الحي</strong> الذي يمكنك تحديثه أو تعديله بنفسك في أي وقت.
            </p>
          </div>

          {/* Pricing Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-[#003C69]" />
              <span>اختر طريقة التعامل مع العملات في حساباتك:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Direct Independent Pricing (Recommended) */}
              <button
                type="button"
                onClick={() => setPricingMode('direct')}
                className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer relative ${
                  pricingMode === 'direct'
                    ? 'border-[#003C69] bg-sky-50/90 text-[#003C69] ring-2 ring-[#003C69]/25 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#003C69]" />
                    <span className="font-bold text-xs sm:text-sm">تسعير حر ومستقل لبلدك</span>
                  </div>
                  {pricingMode === 'direct' ? (
                    <span className="bg-[#003C69] text-white p-0.5 rounded-full">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : null}
                </div>
                <div className="text-[10px] font-bold inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 mb-1.5">
                  ★ الموصى به للمشروعات خارج مصر
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  تكون العملة وحدة قياس مستقلة تماماً (ريال، درهم، دولار، إلخ) دون تطبيق أي معادلة تحويل مع مصر، وتُدخل أنت أسعار خامات ومصنعية سوقك المحلي مباشرة لمنع أي خطأ في الحساب.
                </p>
              </button>

              {/* Option 2: Daily Live Exchange Rate Conversion */}
              <button
                type="button"
                onClick={() => setPricingMode('converted')}
                className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer relative ${
                  pricingMode === 'converted'
                    ? 'border-[#003C69] bg-sky-50/90 text-[#003C69] ring-2 ring-[#003C69]/25 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-[#003C69]" />
                    <span className="font-bold text-xs sm:text-sm">تحويل بسعر الصرف اليومي</span>
                  </div>
                  {pricingMode === 'converted' ? (
                    <span className="bg-[#003C69] text-white p-0.5 rounded-full">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : null}
                </div>
                <div className="text-[10px] font-bold inline-block px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 mb-1.5">
                  لتقدير المقايسات المصرية بالعملات الأخرى
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  تحويل بنود وتكاليف المقايسة المصرية إلى عملتك وفق سعر الصرف الحقيقي لليوم. السعر مرن وقابل للتحديث والتعديل لتجنب أخطاء تذبذب الأسواق.
                </p>
              </button>
            </div>
          </div>

          {/* Live Fetch Button & Exchange Rates Panel */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  أسعار الصرف اليومية (كم يعادل 1 من كل عملة بالجنيه المصري):
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>آخر تحديث: {metadata.lastUpdated} ({metadata.sourceLabel})</span>
                </span>
              </div>

              {/* Live Fetch Button */}
              <button
                type="button"
                onClick={handleFetchLiveRates}
                disabled={isFetchingLive}
                className="px-3 py-1.5 bg-[#003C69] hover:bg-[#002b4d] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-60 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingLive ? 'animate-spin' : ''}`} />
                <span>{isFetchingLive ? 'جاري التحديث من السوق...' : '🔄 تحديث أسعار اليوم لحظياً'}</span>
              </button>
            </div>

            {fetchSuccessMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{fetchSuccessMsg}</span>
              </div>
            )}

            {/* Rates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* SAR */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🇸🇦</span>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">ريال سعودي (SAR)</span>
                    <span className="text-[10px] text-slate-500">1 ريال = كم جنيه؟</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={rates.SAR}
                    onChange={(e) => handleRateChange('SAR', e.target.value)}
                    className="w-20 px-2 py-1 text-xs font-mono font-bold text-center border border-slate-300 rounded-md focus:border-[#003C69] focus:outline-none bg-slate-50 focus:bg-white"
                  />
                  <span className="text-[11px] font-bold text-slate-600">ج.م</span>
                </div>
              </div>

              {/* AED */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🇦🇪</span>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">درهم إماراتي (AED)</span>
                    <span className="text-[10px] text-slate-500">1 درهم = كم جنيه؟</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={rates.AED}
                    onChange={(e) => handleRateChange('AED', e.target.value)}
                    className="w-20 px-2 py-1 text-xs font-mono font-bold text-center border border-slate-300 rounded-md focus:border-[#003C69] focus:outline-none bg-slate-50 focus:bg-white"
                  />
                  <span className="text-[11px] font-bold text-slate-600">ج.م</span>
                </div>
              </div>

              {/* KWD */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🇰🇼</span>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">دينار كويتي (KWD)</span>
                    <span className="text-[10px] text-slate-500">1 دينار = كم جنيه؟</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={rates.KWD}
                    onChange={(e) => handleRateChange('KWD', e.target.value)}
                    className="w-20 px-2 py-1 text-xs font-mono font-bold text-center border border-slate-300 rounded-md focus:border-[#003C69] focus:outline-none bg-slate-50 focus:bg-white"
                  />
                  <span className="text-[11px] font-bold text-slate-600">ج.م</span>
                </div>
              </div>

              {/* USD */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🇺🇸</span>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">دولار أمريكي (USD)</span>
                    <span className="text-[10px] text-slate-500">1 دولار = كم جنيه؟</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={rates.USD}
                    onChange={(e) => handleRateChange('USD', e.target.value)}
                    className="w-20 px-2 py-1 text-xs font-mono font-bold text-center border border-slate-300 rounded-md focus:border-[#003C69] focus:outline-none bg-slate-50 focus:bg-white"
                  />
                  <span className="text-[11px] font-bold text-slate-600">ج.م</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic text-center pt-1">
              يمكنك كتابة سعر الصرف الذي تراه في بنكك أو صرافك مباشرة في أي حقل أعلاه.
            </p>
          </div>

          {/* Interactive Live Converter Simulator */}
          <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-200 text-xs space-y-2">
            <span className="font-bold text-[#003C69] block">
              حاسبة التحويل السريعة للتأكد من قيمة الصرف اليوم:
            </span>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <input
                  type="number"
                  step="1000"
                  value={testAmountEgp}
                  onChange={(e) => setTestAmountEgp(Math.max(0, Number(e.target.value) || 0))}
                  className="w-28 px-2 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg text-center bg-white"
                />
                <span className="font-bold text-slate-700">جنيه مصري</span>
              </div>
              <span className="text-slate-400 font-bold">يعادل اليوم:</span>
              <div className="bg-white px-3 py-1.5 rounded-lg border border-sky-300 font-mono font-bold text-[#003C69] text-xs">
                {formatNumber(convertedTestAmount, 2)} {CURRENCIES[activeCurrency].symbol}
                <span className="text-[10px] text-slate-500 font-normal mr-1.5">
                  ({CURRENCIES[activeCurrency].name})
                </span>
              </div>
            </div>
          </div>

          {/* Quick Active Currency Switcher */}
          {onCurrencyChange && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-700">
                العملة المعروضة حالياً في البرنامج:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(['EGP', 'SAR', 'AED', 'KWD', 'USD'] as CurrencyCode[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onCurrencyChange(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      activeCurrency === c
                        ? 'bg-[#003C69] text-white shadow-xs ring-2 ring-[#003C69]/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{CURRENCIES[c].symbol}</span>
                    <span className="hidden sm:inline font-normal text-[11px]">
                      ({c})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline flex items-center gap-1 cursor-pointer order-2 sm:order-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الأسعار الافتراضية والتسعير المستقل</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none px-5 py-2 bg-[#00B050] hover:bg-[#009b46] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{savedSuccess ? 'تم الحفظ بنجاح!' : 'حفظ وتطبيق على الحسابات'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
