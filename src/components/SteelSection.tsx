import React, { useState, useMemo } from 'react';
import { useSEO } from '../hooks/useSEO';
import { CurrencyCode, StructuralSystem } from '../types';
import {
  calculateSteelEstimation,
  STRUCTURAL_SYSTEMS,
  STEEL_INSPECTION_TIPS,
  REBAR_SPECIFICATIONS,
} from '../data/steelEstimator';
import {
  formatCurrency,
  formatNumber,
  CURRENCIES,
  getActiveRate,
  loadCurrencyPricingMode,
  BENCHMARK_STEEL_PRICE_PER_TON,
} from '../data/currencies';
import {
  Compass,
  Layers,
  Scale,
  ShieldCheck,
  Info,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Table as TableIcon,
  CheckCircle,
  Sliders,
} from 'lucide-react';

interface SteelSectionProps {
  currency: CurrencyCode;
  onUpdateSteelSummary?: (totalTons: number, totalCost: number) => void;
}

export const SteelSection: React.FC<SteelSectionProps> = ({
  currency,
  onUpdateSteelSummary,
}) => {
  const [calcMode, setCalcMode] = useState<'area' | 'volume'>('area');

  // Area Mode State
  const [slabArea, setSlabArea] = useState<number>(140);
  const [floorsCount, setFloorsCount] = useState<number>(1);
  const [system, setSystem] = useState<StructuralSystem>('flat_slab');
  const [includeSubstructure, setIncludeSubstructure] = useState<boolean>(true);

  // Direct Volume Mode State
  const [concreteVol, setConcreteVol] = useState<number>(35);
  const [elementCategory, setElementCategory] = useState<'solid_slab' | 'flat_slab' | 'columns' | 'footings' | 'raft'>('flat_slab');

  // Steel Price per Ton benchmark based on selected currency and mode
  const pricingMode = loadCurrencyPricingMode();
  const activeRate = getActiveRate(currency);
  const defaultPricePerTon = useMemo(() => {
    if (pricingMode === 'direct') {
      return BENCHMARK_STEEL_PRICE_PER_TON[currency] || 41000;
    }
    return Math.round(41000 / (activeRate || 1));
  }, [currency, pricingMode, activeRate]);

  const [steelPricePerTon, setSteelPricePerTon] = useState<number>(defaultPricePerTon);

  // Sync default price when currency changes if user hasn't explicitly customized
  React.useEffect(() => {
    setSteelPricePerTon(defaultPricePerTon);
  }, [defaultPricePerTon]);

  // Calculate results for Area Mode
  const areaResults = useMemo(() => {
    return calculateSteelEstimation(slabArea, floorsCount, system, includeSubstructure);
  }, [slabArea, floorsCount, system, includeSubstructure]);

  // Calculate results for Volume Mode
  const volumeResults = useMemo(() => {
    let ratePerM3 = 135;
    if (elementCategory === 'solid_slab') ratePerM3 = 90;
    else if (elementCategory === 'flat_slab') ratePerM3 = 135;
    else if (elementCategory === 'columns') ratePerM3 = 175;
    else if (elementCategory === 'footings') ratePerM3 = 115;
    else if (elementCategory === 'raft') ratePerM3 = 145;

    const totalKg = concreteVol * ratePerM3;
    const totalTons = Math.round((totalKg / 1000) * 100) / 100;
    const tieWireKg = Math.round(totalTons * 22);

    const diameters = REBAR_SPECIFICATIONS.map((spec) => {
      const shareKg = totalKg * spec.defaultShare;
      const shareTons = Math.round((shareKg / 1000) * 100) / 100;
      const barWeight = spec.meterWeight * 12;
      const approxBars = Math.round(shareKg / barWeight);

      return {
        diameter: spec.diameter,
        usage: spec.usage,
        percentage: Math.round(spec.defaultShare * 100),
        weightTons: shareTons,
        weightKg: Math.round(shareKg),
        meterWeight: spec.meterWeight,
        approxBarsCount: approxBars,
      };
    });

    return {
      totalKg: Math.round(totalKg),
      totalTons,
      ratePerM3,
      concreteVol,
      tieWireKg,
      diameters,
    };
  }, [concreteVol, elementCategory]);

  const activeTons = calcMode === 'area' ? areaResults.totalSteelTons : volumeResults.totalTons;
  const activeCost = Math.round(activeTons * steelPricePerTon);

  // Sync summary with parent
  React.useEffect(() => {
    if (onUpdateSteelSummary) {
      onUpdateSteelSummary(activeTons, activeCost);
    }
  }, [activeTons, activeCost, onUpdateSteelSummary]);

  useSEO({
    title: 'حاسبة حصر حديد التسليح - معين',
    description: 'احسب أوزان وأقطار حديد التسليح المطلوبة للمشروع بالكامل بالطن والكيلوجرام بدقة.',
    keywords: 'حصر الحديد, حديد التسليح, أوزان الحديد, حساب أقطار الحديد, معين'
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <section className="bg-gradient-to-l from-[#003C69] via-[#002f54] to-[#002340] text-white p-6 sm:p-8 rounded-2xl shadow-lg border-b-4 border-[#B1A06D]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[#B1A06D] text-xs font-bold mb-3 border border-white/10">
            <Compass className="w-3.5 h-3.5" />
            <span>حساب تقريبي استرشادي لحديـد التسليح</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-white">
            حاسبة متوسط كميات حديد التسليح وتوزيع الأقطار
          </h1>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
            قدّر كميات حديد التسليح للمبنى أو السقف (سوليد سلاب، فلات سلاب، هوردي) استرشادياً، مع تفصيل عدد الأسياخ والأقطار الشائعة (8، 10، 12، 16 مم) ومعادلات التحقق لمنع التلاعب في الأوزان.
          </p>
        </div>

        {/* Calculation Mode Toggle */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-white/15">
          <button
            type="button"
            onClick={() => setCalcMode('area')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              calcMode === 'area'
                ? 'bg-white text-[#003C69] shadow-md scale-[1.02]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>الحساب بمساحة السقف والنظام الإنشائي (الشائع)</span>
          </button>

          <button
            type="button"
            onClick={() => setCalcMode('volume')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              calcMode === 'volume'
                ? 'bg-white text-[#003C69] shadow-md scale-[1.02]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>الحساب المباشر بحجم الخرسانة (م³)</span>
          </button>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Controls Column (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-[#003C69] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#B1A06D]" />
              <span>معايير ومدخلات الحساب</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              النتائج مبنية على معدلات الكود الإنشائي المعتمدة للمباني السكنية
            </p>
          </div>

          {calcMode === 'area' ? (
            <>
              {/* Slab Area */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="steel-slab-area-input" className="text-sm font-bold text-slate-700">مساحة مسطح السقف:</label>
                  <span className="text-sm font-bold text-[#003C69] bg-slate-100 px-2.5 py-0.5 rounded-md font-mono tabular-nums">
                    {slabArea} م²
                  </span>
                </div>
                <input
                  id="steel-slab-area-input"
                  type="range"
                  min="30"
                  max="600"
                  step="5"
                  value={slabArea}
                  onChange={(e) => setSlabArea(Number(e.target.value))}
                  className="w-full accent-[#003C69] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                  <span>30 م²</span>
                  <span>140 م² (متوسط)</span>
                  <span>600 م² (عمارة/فيلا)</span>
                </div>
              </div>

              {/* Number of Floors */}
              <div>
                <label htmlFor="steel-floors-count-select" className="block text-xs font-semibold text-slate-600 mb-1">عدد الأدوار / الأسقف</label>
                <select
                  id="steel-floors-count-select"
                  value={floorsCount}
                  onChange={(e) => setFloorsCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-bold text-slate-800"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>
                      {n === 1 ? 'سقف واحد (دور واحد فقط)' : `${n} أدوار وأسقف متكررة`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Structural System */}
              <div>
                <label htmlFor="structural-system-select" className="block text-sm font-bold text-slate-700 mb-1.5">
                  نوع النظام الإنشائي للسقف:
                </label>
                <select
                  id="structural-system-select"
                  value={system}
                  onChange={(e) => setSystem(e.target.value as StructuralSystem)}
                  className="w-full bg-slate-50 border-2 border-[#003C69]/30 rounded-xl p-2.5 text-sm font-bold text-[#003C69]"
                >
                  {Object.entries(STRUCTURAL_SYSTEMS).map(([k, sys]) => (
                    <option key={k} value={k}>
                      {sys.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {STRUCTURAL_SYSTEMS[system].suitability}
                </p>
              </div>

              {/* Checkbox for Substructure */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSubstructure}
                    onChange={(e) => setIncludeSubstructure(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-[#003C69] rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      تضمين حديد القواعد والأساسات والأعمدة
                    </span>
                    <span className="text-[11px] text-slate-500 leading-normal block">
                      لحساب إجمالي حديد المبنى كاملاً وليس السقف بمفرده
                    </span>
                  </div>
                </label>
              </div>
            </>
          ) : (
            <>
              {/* Direct Volume Inputs */}
              <div>
                <label htmlFor="concrete-volume-input" className="block text-xs font-bold text-slate-700 mb-1">
                  حجم الخرسانة المسلحة (م³):
                </label>
                <input
                  id="concrete-volume-input"
                  type="number"
                  min="1"
                  max="1000"
                  value={concreteVol}
                  onChange={(e) => setConcreteVol(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label htmlFor="element-category-select" className="block text-xs font-bold text-slate-700 mb-1">نوع العنصر الخرساني:</label>
                <select
                  id="element-category-select"
                  value={elementCategory}
                  onChange={(e) => setElementCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-bold text-[#003C69]"
                >
                  <option value="solid_slab">بلاطة سوليد سلاب عادية (80 - 100 كجم/م³)</option>
                  <option value="flat_slab">بلاطة فلات سلاب لاكمرية (120 - 145 كجم/م³)</option>
                  <option value="columns">أعمدة وحوائط خرسانية (160 - 190 كجم/م³)</option>
                  <option value="footings">قواعد مسلحة وسملات (100 - 130 كجم/م³)</option>
                  <option value="raft">لبشة خرسانية مسلحة (130 - 160 كجم/م³)</option>
                </select>
              </div>
            </>
          )}

          {/* Steel Price per ton */}
          <div className="pt-3 border-t border-slate-100">
            <label htmlFor="steel-price-input" className="block text-xs font-bold text-slate-700 mb-1">
              سعر طن الحديد الاسترشادي في السوق:
            </label>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
              <input
                id="steel-price-input"
                type="number"
                value={steelPricePerTon}
                onChange={(e) => setSteelPricePerTon(Math.max(0, Number(e.target.value)))}
                className="w-full bg-transparent p-2 text-sm font-mono font-bold text-slate-800 outline-none text-right"
              />
              <span className="px-2.5 text-xs text-slate-500 font-bold bg-slate-100 border-r border-slate-200">
                {CURRENCIES[currency]?.symbol} / طن
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              يمكنك تعديل السعر وفق أحدث نشرة أسعار لمصانع الحديد في بلدك
            </span>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              الحساب استرشادي تقريبي لأغراض تقدير الميزانية وشراء الخامات؛ الكميات الدقيقة يحددها المخطط الإنشائي وجداول تفريد حديد التسليح (Bar Bending Schedule).
            </span>
          </div>

        </div>

        {/* Results Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Key Metric Tiles Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-[#00B050]">
              <span className="text-xs text-slate-500 block mb-1">إجمالي كمية الحديد</span>
              <span className="text-2xl sm:text-3xl font-black text-[#003C69] font-mono tabular-nums block">
                {formatNumber(activeTons, 2)}
              </span>
              <span className="text-xs font-bold text-emerald-700">
                طـن ({formatNumber(calcMode === 'area' ? areaResults.totalSteelKg : volumeResults.totalKg, 0)} كجم)
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-sky-600">
              <span className="text-xs text-slate-500 block mb-1">التكلفة التقديرية للشراء</span>
              <span className="text-lg sm:text-xl font-bold text-slate-800 font-mono tabular-nums block">
                {formatCurrency(activeCost, currency)}
              </span>
              <span className="text-[11px] text-slate-500">
                بسعر {formatCurrency(steelPricePerTon, currency)} / طن
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-[#B1A06D]">
              <span className="text-xs text-slate-500 block mb-1">
                {calcMode === 'area' ? 'معدل التسليح للمسطح' : 'معدل التسليح للخرسانة'}
              </span>
              <span className="text-lg sm:text-xl font-bold text-[#003C69] font-mono tabular-nums block">
                {calcMode === 'area' ? `${areaResults.steelPerM2} كجم/م²` : `${volumeResults.ratePerM3} كجم/م³`}
              </span>
              <span className="text-[11px] text-slate-500">معدل قياسي معتمد</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-amber-500">
              <span className="text-xs text-slate-500 block mb-1">سلك رباط محروق</span>
              <span className="text-lg sm:text-xl font-bold text-slate-800 font-mono tabular-nums block">
                {calcMode === 'area' ? areaResults.tieWireKg : volumeResults.tieWireKg} كجم
              </span>
              <span className="text-[11px] text-slate-500">22 كجم لكل طن حديد</span>
            </div>
          </div>

          {/* Breakdown by Element (if Area mode) */}
          {calcMode === 'area' && includeSubstructure && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#003C69]" />
                <span>توزيع كميات الحديد بين عناصر المبنى:</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">حديد الأسقف والكمرات</span>
                  <span className="text-sm font-bold text-[#003C69] font-mono block">
                    {formatNumber(areaResults.slabSteelKg / 1000, 2)} طن ({formatNumber(areaResults.slabSteelKg, 0)} كجم)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {Math.round((areaResults.slabSteelKg / areaResults.totalSteelKg) * 100)}% من إجمالي الحديد
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">حديد الأعمدة وحوائط القص</span>
                  <span className="text-sm font-bold text-[#003C69] font-mono block">
                    {formatNumber(areaResults.columnsSteelKg / 1000, 2)} طن ({formatNumber(areaResults.columnsSteelKg, 0)} كجم)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {Math.round((areaResults.columnsSteelKg / areaResults.totalSteelKg) * 100)}% من إجمالي الحديد
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">حديد القواعد والسملات</span>
                  <span className="text-sm font-bold text-[#003C69] font-mono block">
                    {formatNumber(areaResults.footingsSteelKg / 1000, 2)} طن ({formatNumber(areaResults.footingsSteelKg, 0)} كجم)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {Math.round((areaResults.footingsSteelKg / areaResults.totalSteelKg) * 100)}% من إجمالي الحديد
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rebar Diameter Breakdown Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-[#003C69] flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-[#B1A06D]" />
                  <span>توزيع الأقطار وعدد الأسياخ (طول 12م القياسي):</span>
                </h3>
                <span className="text-xs text-slate-500">
                  توزيع استرشادي لطلب الشحنات من المصنع أو تاجر الحديد
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-white">
                    <th className="py-2.5 px-3 font-bold">القطر (مم)</th>
                    <th className="py-2.5 px-3 font-bold">الاستخدام الشائع</th>
                    <th className="py-2.5 px-3 font-bold">النسبة %</th>
                    <th className="py-2.5 px-3 font-bold">وزن المتر (كجم/م)</th>
                    <th className="py-2.5 px-3 font-bold">الكمية (طن)</th>
                    <th className="py-2.5 px-3 font-bold">عدد الأسياخ (12م)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(calcMode === 'area' ? areaResults.diameters : volumeResults.diameters).map((d) => (
                    <tr key={d.diameter} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#003C69]">
                        فاي {d.diameter} مم
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{d.usage}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{d.percentage}%</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{d.meterWeight.toFixed(3)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {formatNumber(d.weightTons, 2)} طن
                      </td>
                      <td className="py-2.5 px-3 font-mono font-black text-emerald-700">
                        {d.approxBarsCount} سيخ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Engineering Verification & Tips Cards */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-[#003C69] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#00B050]" />
              <span>دليل استلام ومراجعة الحديد في الموقع (لحماية المشتري):</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {STEEL_INSPECTION_TIPS.map((tip, idx) => (
                <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{tip.title}</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {tip.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
