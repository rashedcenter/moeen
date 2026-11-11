import React, { useState, useMemo } from 'react';
// 🟢 السطر الصحيح الموصى به:
import { useSEO } from '../hooks/useSEO';
import { ConcreteElement, ConcreteMixOptions, CurrencyCode } from '../types';
import {
  CONCRETE_TYPES,
  STANDARD_MIXES,
  calculateMaterialsBreakdown,
  parseSumExpression,
} from '../data/concreteEstimator';
import { formatNumber, formatCurrency, CURRENCIES } from '../data/currencies';
import {
  Building2,
  Plus,
  Trash2,
  Copy,
  Printer,
  Sliders,
  Info,
  ChevronDown,
  Layers,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';

interface ConcreteSectionProps {
  currency: CurrencyCode;
  onUpdateConcreteSummary?: (totalM3: number, totalCementBags: number) => void;
}

export const ConcreteSection: React.FC<ConcreteSectionProps> = ({
  currency,
  onUpdateConcreteSummary,
}) => {
  // Active element type
  const [selectedType, setSelectedType] = useState<'slab' | 'beam' | 'column' | 'footing' | 'wall'>('slab');
  const [slabMode, setSlabMode] = useState<'area' | 'dims'>('area');

  // Dimension values
  const [dimValues, setDimValues] = useState<{ [key: string]: string }>({
    d0: '20', // area or length
    d1: '12', // thickness or width
    d2: '60', // depth if applicable
  });
  const [count, setCount] = useState<number>(1);

  // Mix choice
  const [mixChoice, setMixChoice] = useState<string>('1,2,4');
  const [customMix, setCustomMix] = useState<{ c: number; s: number; g: number }>({ c: 1, s: 2, g: 4 });

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [advancedOpts, setAdvancedOpts] = useState<ConcreteMixOptions>({
    cement: 1,
    sand: 2,
    gravel: 4,
    wastePercent: 5,
    dryVolumeFactor: 1.54,
    cementDensity: 1440,
    bagWeight: 50,
    waterCementRatio: 0.5,
  });

  // Project BOQ List
  const [boqList, setBoqList] = useState<ConcreteElement[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  // Active Mix computed
  const activeMix: ConcreteMixOptions = useMemo(() => {
    let c = 1, s = 2, g = 4;
    if (mixChoice === 'custom') {
      c = customMix.c;
      s = customMix.s;
      g = customMix.g;
    } else {
      const parts = mixChoice.split(',').map(Number);
      c = parts[0] || 1;
      s = parts[1] || 2;
      g = parts[2] || 4;
    }

    useSEO({
      title: 'حاسبة كميات الخرسانة - معين',
      description: 'احسب كميات الأسمنت والرمل والزلط وخرسانة القواعد والأسقف بدقة عالية.',
      keywords: 'حساب الخرسانة, كمية الأسمنت, خرسانة القواعد, معين'
    });

    return {
      ...advancedOpts,
      cement: c,
      sand: s,
      gravel: g,
    };
  }, [mixChoice, customMix, advancedOpts]);

  // Compute Volume for Current Element
  const currentElement = useMemo(() => {
    const config = CONCRETE_TYPES[selectedType];
    const isArea = selectedType === 'slab' && slabMode === 'area';
    let vol = 0;
    let dimsText = '';

    if (isArea) {
      const area = parseSumExpression(dimValues.d0 || '20', 20);
      const thicknessCm = parseSumExpression(dimValues.d1 || '12', 12);
      const thicknessM = thicknessCm / 100;
      vol = area * thicknessM * count;
      dimsText = `مساحة ${formatNumber(area, 2)} م² × سُمك ${thicknessCm} سم`;
    } else if (selectedType === 'slab') {
      const len = parseSumExpression(dimValues.d0 || '5', 5);
      const width = parseSumExpression(dimValues.d1 || '4', 4);
      const thicknessCm = parseSumExpression(dimValues.d2 || '12', 12);
      vol = len * width * (thicknessCm / 100) * count;
      dimsText = `${len}م × ${width}م × ${thicknessCm}سم`;
    } else if (selectedType === 'beam') {
      const len = parseSumExpression(dimValues.d0 || '4', 4);
      const widthM = parseSumExpression(dimValues.d1 || '25', 25) / 100;
      const depthM = parseSumExpression(dimValues.d2 || '60', 60) / 100;
      vol = len * widthM * depthM * count;
      dimsText = `${len}م × ${dimValues.d1 || '25'}سم × ${dimValues.d2 || '60'}سم`;
    } else if (selectedType === 'column') {
      const widthM = parseSumExpression(dimValues.d0 || '25', 25) / 100;
      const depthM = parseSumExpression(dimValues.d1 || '60', 60) / 100;
      const heightM = parseSumExpression(dimValues.d2 || '3', 3);
      vol = widthM * depthM * heightM * count;
      dimsText = `${dimValues.d0 || '25'}سم × ${dimValues.d1 || '60'}سم × ${heightM}م`;
    } else if (selectedType === 'footing') {
      const len = parseSumExpression(dimValues.d0 || '1.5', 1.5);
      const width = parseSumExpression(dimValues.d1 || '1.5', 1.5);
      const thicknessM = parseSumExpression(dimValues.d2 || '50', 50) / 100;
      vol = len * width * thicknessM * count;
      dimsText = `${len}م × ${width}م × ${dimValues.d2 || '50'}سم`;
    } else {
      // wall
      const len = parseSumExpression(dimValues.d0 || '6', 6);
      const height = parseSumExpression(dimValues.d1 || '3', 3);
      const thicknessM = parseSumExpression(dimValues.d2 || '20', 20) / 100;
      vol = len * height * thicknessM * count;
      dimsText = `${len}م × ${height}م × ${dimValues.d2 || '20'}سم`;
    }

    const materials = calculateMaterialsBreakdown(vol, activeMix);

    return {
      name: config.name,
      dimsText,
      count,
      vol,
      materials,
    };
  }, [selectedType, slabMode, dimValues, count, activeMix]);

  // Total BOQ Materials
  const totalBoqVolume = boqList.reduce((acc, el) => acc + el.volume, 0);
  const totalBoqMaterials = useMemo(() => {
    return calculateMaterialsBreakdown(totalBoqVolume, activeMix);
  }, [totalBoqVolume, activeMix]);

  // Sync with summary
  React.useEffect(() => {
    if (onUpdateConcreteSummary) {
      onUpdateConcreteSummary(totalBoqVolume, totalBoqMaterials.cementBags);
    }
  }, [totalBoqVolume, totalBoqMaterials.cementBags, onUpdateConcreteSummary]);

  const handleAddToBoq = () => {
    if (currentElement.vol <= 0) return;
    const newEl: ConcreteElement = {
      id: Math.random().toString(36).substring(2, 9),
      name: currentElement.name,
      type: selectedType,
      dimsDesc: currentElement.dimsText,
      count,
      volume: currentElement.vol,
      wetVolume: currentElement.materials.wetVolume,
      cementBags: currentElement.materials.cementBags,
      cementKg: currentElement.materials.cementKg,
      sandM3: currentElement.materials.sandM3,
      gravelM3: currentElement.materials.gravelM3,
      waterLiters: currentElement.materials.waterLiters,
    };
    setBoqList((prev) => [...prev, newEl]);
  };

  const handleRemoveBoqItem = (id: string) => {
    setBoqList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCopyBoq = () => {
    if (!boqList.length) return;
    const lines = [
      'حصر الخرسانة والمواد الإنشائية',
      '--------------------------------',
    ];
    boqList.forEach((it, idx) => {
      lines.push(`${idx + 1}) ${it.name} — ${it.dimsDesc} × عدد ${it.count} = ${formatNumber(it.volume, 3)} م³`);
    });
    lines.push('');
    lines.push(`إجمالي حجم الخرسانة: ${formatNumber(totalBoqVolume, 3)} م³ (بعد الهالك: ${formatNumber(totalBoqMaterials.wetVolume, 3)} م³)`);
    lines.push(`الخلطة المستخدمة: ${activeMix.cement} : ${activeMix.sand} : ${activeMix.gravel}`);
    lines.push(`عدد أكياس الأسمنت: ${totalBoqMaterials.cementBags} كيس (${formatNumber(totalBoqMaterials.cementKg, 0)} كجم)`);
    lines.push(`الرمل المطلوب: ${formatNumber(totalBoqMaterials.sandM3, 2)} م³`);
    lines.push(`الزلط المطلوب: ${formatNumber(totalBoqMaterials.gravelM3, 2)} م³`);
    lines.push(`مياه الخلط: ${formatNumber(totalBoqMaterials.waterLiters, 0)} لتر`);

    if (navigator.clipboard) {
      navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Mix Ratios for Visual Bar
  const mixSum = activeMix.cement + activeMix.sand + activeMix.gravel;
  const cementPct = (activeMix.cement / mixSum) * 100;
  const sandPct = (activeMix.sand / mixSum) * 100;
  const gravelPct = (activeMix.gravel / mixSum) * 100;

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <section className="bg-gradient-to-l from-[#003C69] via-[#002f54] to-[#002340] text-white p-6 sm:p-8 rounded-2xl shadow-lg border-b-4 border-[#B1A06D]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[#B1A06D] text-xs font-bold mb-3 border border-white/10">
            <Building2 className="w-3.5 h-3.5" />
            <span>حاسبة الخرسانة والأسمنت وحصر المشاريع</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-white">
            حاسبة كمية الخرسانة: أسمنت ورمل وزلط ومياه
          </h1>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
            احسب حجم الخرسانة واحتياجك الدقيق من أكياس الأسمنت والرمل والزلط ومياه الخلط لأي عنصر (بلاطة، كمرة، عمود، قاعدة، حائط)، مع إمكانية جمع المساحات المركبة وإنشاء جدول حصر كامل للمشروع.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Form Controls (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-[#003C69] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#B1A06D]" />
              <span>بيانات العنصر الخرساني</span>
            </h2>
          </div>

          {/* Element Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">نوع العنصر الإنشائي:</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CONCRETE_TYPES).map(([k, cfg]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setSelectedType(k as any);
                    if (k === 'slab' && slabMode === 'area') {
                      setDimValues({ d0: '20', d1: '12' });
                    } else if (k === 'slab') {
                      setDimValues({ d0: '5', d1: '4', d2: '12' });
                    } else if (k === 'beam') {
                      setDimValues({ d0: '4', d1: '25', d2: '60' });
                    } else if (k === 'column') {
                      setDimValues({ d0: '25', d1: '60', d2: '3' });
                    } else if (k === 'footing') {
                      setDimValues({ d0: '1.5', d1: '1.5', d2: '50' });
                    } else {
                      setDimValues({ d0: '6', d1: '3', d2: '20' });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedType === k
                      ? 'bg-[#003C69] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cfg.name}
                </button>
              ))}
            </div>
          </div>

          {/* Slab Mode Switcher */}
          {selectedType === 'slab' && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">طريقة إدخال البلاطة:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSlabMode('area');
                    setDimValues({ d0: '20', d1: '12' });
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${
                    slabMode === 'area'
                      ? 'bg-[#003C69] text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  بالمساحة مباشرة (بلاطة غير منتظمة)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSlabMode('dims');
                    setDimValues({ d0: '5', d1: '4', d2: '12' });
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${
                    slabMode === 'dims'
                      ? 'bg-[#003C69] text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  بالأبعاد (طول × عرض)
                </button>
              </div>
            </div>
          )}

          {/* Dimension Fields */}
          <div className="space-y-3">
            {selectedType === 'slab' && slabMode === 'area' ? (
              <>
                <div>
                  <label htmlFor="concrete-slab-area-input" className="block text-xs font-semibold text-slate-600 mb-1">
                    المساحة الكلية بالمتر المربع (يمكن كتابة جمع مثل 12.5+8.3+20):
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 focus-within:border-[#00B050]">
                    <input
                      id="concrete-slab-area-input"
                      type="text"
                      value={dimValues.d0 || '20'}
                      onChange={(e) => setDimValues({ ...dimValues, d0: e.target.value })}
                      className="w-full p-2 text-sm font-mono text-right bg-transparent outline-none"
                    />
                    <span className="px-3 bg-slate-100 text-xs text-slate-500 font-bold border-r border-slate-200">
                      م²
                    </span>
                  </div>
                  {dimValues.d0 && dimValues.d0.includes('+') && (
                    <span className="text-[11px] text-[#003C69] font-bold mt-1 block">
                      المجموع المحسوب = {parseSumExpression(dimValues.d0, 0)} م²
                    </span>
                  )}
                </div>

                <div>
                  <label htmlFor="concrete-slab-thickness-input" className="block text-xs font-semibold text-slate-600 mb-1">سُمك البلاطة:</label>
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <input
                      id="concrete-slab-thickness-input"
                      type="number"
                      value={dimValues.d1 || '12'}
                      onChange={(e) => setDimValues({ ...dimValues, d1: e.target.value })}
                      className="w-full p-2 text-sm font-mono text-right bg-transparent outline-none"
                    />
                    <span className="px-3 bg-slate-100 text-xs text-slate-500 font-bold border-r border-slate-200">
                      سم
                    </span>
                  </div>
                </div>
              </>
            ) : selectedType === 'slab' ? (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="concrete-slab-len-input" className="block text-[11px] font-semibold text-slate-600 mb-1">الطول (م)</label>
                  <input
                    id="concrete-slab-len-input"
                    type="number"
                    value={dimValues.d0 || '5'}
                    onChange={(e) => setDimValues({ ...dimValues, d0: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="concrete-slab-width-input" className="block text-[11px] font-semibold text-slate-600 mb-1">العرض (م)</label>
                  <input
                    id="concrete-slab-width-input"
                    type="number"
                    value={dimValues.d1 || '4'}
                    onChange={(e) => setDimValues({ ...dimValues, d1: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="concrete-slab-depth-input" className="block text-[11px] font-semibold text-slate-600 mb-1">السُمك (سم)</label>
                  <input
                    id="concrete-slab-depth-input"
                    type="number"
                    value={dimValues.d2 || '12'}
                    onChange={(e) => setDimValues({ ...dimValues, d2: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="concrete-dim0-input" className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {CONCRETE_TYPES[selectedType].fields[0].name} ({CONCRETE_TYPES[selectedType].fields[0].unit})
                  </label>
                  <input
                    id="concrete-dim0-input"
                    type="number"
                    value={dimValues.d0 || ''}
                    onChange={(e) => setDimValues({ ...dimValues, d0: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="concrete-dim1-input" className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {CONCRETE_TYPES[selectedType].fields[1].name} ({CONCRETE_TYPES[selectedType].fields[1].unit})
                  </label>
                  <input
                    id="concrete-dim1-input"
                    type="number"
                    value={dimValues.d1 || ''}
                    onChange={(e) => setDimValues({ ...dimValues, d1: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="concrete-dim2-input" className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {CONCRETE_TYPES[selectedType].fields[2].name} ({CONCRETE_TYPES[selectedType].fields[2].unit})
                  </label>
                  <input
                    id="concrete-dim2-input"
                    type="number"
                    value={dimValues.d2 || ''}
                    onChange={(e) => setDimValues({ ...dimValues, d2: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* Count */}
            <div>
              <label htmlFor="concrete-count-input" className="block text-xs font-semibold text-slate-600 mb-1">العدد المتكرر:</label>
              <input
                id="concrete-count-input"
                type="number"
                min="1"
                value={count}
                onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono font-bold"
              />
            </div>
          </div>

          {/* Mix Selection */}
          <div className="pt-2 border-t border-slate-100">
            <label htmlFor="concrete-mix-select" className="block text-xs font-bold text-slate-700 mb-1">
              نسبة الخلطة (أسمنت : رمل : زلط) بالحجم:
            </label>
            <select
              id="concrete-mix-select"
              value={mixChoice}
              onChange={(e) => setMixChoice(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800"
            >
              {STANDARD_MIXES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            {mixChoice === 'custom' && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <label htmlFor="concrete-custom-cement" className="block text-[10px] text-slate-500">أسمنت</label>
                  <input
                    id="concrete-custom-cement"
                    type="number"
                    value={customMix.c}
                    onChange={(e) => setCustomMix({ ...customMix, c: Number(e.target.value) })}
                    className="w-full border rounded p-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="concrete-custom-sand" className="block text-[10px] text-slate-500">رمل</label>
                  <input
                    id="concrete-custom-sand"
                    type="number"
                    value={customMix.s}
                    onChange={(e) => setCustomMix({ ...customMix, s: Number(e.target.value) })}
                    className="w-full border rounded p-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="concrete-custom-gravel" className="block text-[10px] text-slate-500">زلط</label>
                  <input
                    id="concrete-custom-gravel"
                    type="number"
                    value={customMix.g}
                    onChange={(e) => setCustomMix({ ...customMix, g: Number(e.target.value) })}
                    className="w-full border rounded p-1 text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Advanced Collapsible */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-[#003C69] font-bold flex items-center justify-between w-full"
            >
              <span>الإعدادات الهندسية المتقدمة (معامل الحجم الجاف والهالك)</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-2.5 mt-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label htmlFor="adv-waste-percent" className="block text-[10px] text-slate-500">نسبة الهالك (%)</label>
                  <input
                    id="adv-waste-percent"
                    type="number"
                    value={advancedOpts.wastePercent}
                    onChange={(e) => setAdvancedOpts({ ...advancedOpts, wastePercent: Number(e.target.value) })}
                    className="w-full border rounded p-1 font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="adv-dry-factor" className="block text-[10px] text-slate-500">معامل الحجم الجاف</label>
                  <input
                    id="adv-dry-factor"
                    type="number"
                    step="0.01"
                    value={advancedOpts.dryVolumeFactor}
                    onChange={(e) => setAdvancedOpts({ ...advancedOpts, dryVolumeFactor: Number(e.target.value) })}
                    className="w-full border rounded p-1 font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="adv-cement-density" className="block text-[10px] text-slate-500">كثافة الأسمنت (كجم/م³)</label>
                  <input
                    id="adv-cement-density"
                    type="number"
                    value={advancedOpts.cementDensity}
                    onChange={(e) => setAdvancedOpts({ ...advancedOpts, cementDensity: Number(e.target.value) })}
                    className="w-full border rounded p-1 font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="adv-water-cement-ratio" className="block text-[10px] text-slate-500">نسبة ماء / أسمنت</label>
                  <input
                    id="adv-water-cement-ratio"
                    type="number"
                    step="0.05"
                    value={advancedOpts.waterCementRatio}
                    onChange={(e) => setAdvancedOpts({ ...advancedOpts, waterCementRatio: Number(e.target.value) })}
                    className="w-full border rounded p-1 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Add to BOQ Button */}
          <button
            type="button"
            onClick={handleAddToBoq}
            disabled={currentElement.vol <= 0}
            className="w-full bg-[#003C69] hover:bg-[#002f54] text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة هذا العنصر إلى جدول حصر المشروع</span>
          </button>
        </div>

        {/* Live Calculation Results (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Current Element Result Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-800">
                النتيجة للعنصر المحدد ({currentElement.name})
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {currentElement.dimsText} × {count}
              </span>
            </div>

            {/* Big Key Tile: Cement Bags */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 block">عدد أكياس الأسمنت المطلوبة</span>
                <span className="text-3xl font-black text-[#003C69] font-mono tabular-nums">
                  {currentElement.materials.cementBags} كيس
                </span>
                <span className="text-[11px] text-emerald-700 block">
                  ({formatNumber(currentElement.materials.exactBags, 2)} كيس بالحساب الدقيق - كيس 50 كجم)
                </span>
              </div>
              <div className="text-left font-mono">
                <span className="text-xs text-slate-500 block">حجم الخرسانة</span>
                <span className="text-2xl font-black text-slate-800">
                  {formatNumber(currentElement.vol, 3)} م³
                </span>
                <span className="text-[11px] text-slate-400">
                  ({formatNumber(currentElement.materials.wetVolume, 3)} م³ بعد الهالك)
                </span>
              </div>
            </div>

            {/* Materials Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">وزن الأسمنت</span>
                <span className="text-base font-bold text-slate-800 font-mono">
                  {formatNumber(currentElement.materials.cementKg, 0)} كجم
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">الرمل المطلوب</span>
                <span className="text-base font-bold text-[#B1A06D] font-mono">
                  {formatNumber(currentElement.materials.sandM3, 2)} م³
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">الزلط المطلوب</span>
                <span className="text-base font-bold text-[#00B050] font-mono">
                  {formatNumber(currentElement.materials.gravelM3, 2)} م³
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">مياه الخلط</span>
                <span className="text-base font-bold text-sky-600 font-mono">
                  {formatNumber(currentElement.materials.waterLiters, 0)} لتر
                </span>
              </div>
            </div>

            {/* Visual Mix Proportion Bar */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>توزيع نسب خلطة المواد في المتر المكعب:</span>
                <span>{currentElement.materials.cementPerM3} كجم أسمنت / م³</span>
              </div>
              <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-200">
                <div style={{ width: `${cementPct}%` }} className="bg-[#003C69]" title="أسمنت" />
                <div style={{ width: `${sandPct}%` }} className="bg-[#B1A06D]" title="رمل" />
                <div style={{ width: `${gravelPct}%` }} className="bg-[#00B050]" title="زلط" />
              </div>
              <div className="flex gap-4 text-[11px] text-slate-600 mt-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#003C69]"></span> أسمنت ({activeMix.cement})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B1A06D]"></span> رمل ({activeMix.sand})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00B050]"></span> زلط ({activeMix.gravel})
                </span>
              </div>
            </div>
          </div>

          {/* Project BOQ Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-[#003C69] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#B1A06D]" />
                  <span>جدول حصر خرسانة المشروع (BOQ)</span>
                </h3>
                <span className="text-xs text-slate-500">
                  {boqList.length} عناصر مضافة للحصر الإجمالي
                </span>
              </div>

              {boqList.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyBoq}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'تم النسخ!' : 'نسخ الحصر'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBoqList([])}
                    className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    مسح الكل
                  </button>
                </div>
              )}
            </div>

            {boqList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                لم تقم بإضافة أي عنصر خرساني للحصر بعد. أدخل أبعاد البلاطة أو الكمرة ثم اضغط «إضافة إلى الحصر».
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 bg-white">
                        <th className="py-2.5 px-3 font-bold">العنصر</th>
                        <th className="py-2.5 px-3 font-bold">الأبعاد</th>
                        <th className="py-2.5 px-3 font-bold">العدد</th>
                        <th className="py-2.5 px-3 font-bold">الحجم (م³)</th>
                        <th className="py-2.5 px-3 font-bold">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {boqList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-bold text-slate-800">{item.name}</td>
                          <td className="py-2.5 px-3 text-slate-600 font-mono">{item.dimsDesc}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">{item.count}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#003C69]">
                            {formatNumber(item.volume, 3)} م³
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => handleRemoveBoqItem(item.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="حذف هذا العنصر"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100/80 font-bold border-t border-slate-200">
                        <td colSpan={3} className="py-2.5 px-3 text-slate-800">
                          إجمالي حجم الخرسانة للمشروع
                        </td>
                        <td className="py-2.5 px-3 text-[#003C69] font-mono text-sm">
                          {formatNumber(totalBoqVolume, 3)} م³
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Total BOQ Materials Breakdown */}
                <div className="p-4 bg-emerald-50/50 border-t border-slate-200">
                  <span className="text-xs font-bold text-emerald-950 block mb-2">
                    إجمالي المواد المطلوبة لتنفيذ كامل الحصر:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">أكياس الأسمنت</span>
                      <span className="text-sm font-bold text-[#003C69] font-mono">
                        {totalBoqMaterials.cementBags} كيس
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">الرمل</span>
                      <span className="text-sm font-bold text-[#B1A06D] font-mono">
                        {formatNumber(totalBoqMaterials.sandM3, 2)} م³
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">الزلط</span>
                      <span className="text-sm font-bold text-[#00B050] font-mono">
                        {formatNumber(totalBoqMaterials.gravelM3, 2)} م³
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">مياه الخلط</span>
                      <span className="text-sm font-bold text-sky-600 font-mono">
                        {formatNumber(totalBoqMaterials.waterLiters, 0)} لتر
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
