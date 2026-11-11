import React, { useState, useMemo } from 'react';
import { useSEO } from '../hooks/useSEO';
import {
  ConcreteElement,
  ConcreteMixOptions,
  ConcretePriceConfig,
  CurrencyCode,
  StructuralSystem,
} from '../types';
import {
  CONCRETE_TYPES,
  STANDARD_MIXES,
  calculateMaterialsBreakdown,
  calculateConcreteCost,
  parseSumExpression,
} from '../data/concreteEstimator';
import {
  calculateSteelEstimation,
  STRUCTURAL_SYSTEMS,
  STEEL_INSPECTION_TIPS,
  REBAR_SPECIFICATIONS,
} from '../data/steelEstimator';
import {
  formatNumber,
  formatCurrency,
  CURRENCIES,
  getActiveRate,
  loadCurrencyPricingMode,
  BENCHMARK_STEEL_PRICE_PER_TON,
} from '../data/currencies';
import {
  Building2,
  Compass,
  Plus,
  Trash2,
  Copy,
  Sliders,
  ChevronDown,
  Layers,
  CheckCircle,
  Tag,
  Coins,
  ShieldCheck,
} from 'lucide-react';

import { registerReport } from '../utils/reportStore';
import { buildConcreteReport } from '../utils/reportBuilders';

interface ConcreteStructureSectionProps {
  currency: CurrencyCode;
  onUpdateStructureSummary?: (
    concreteVol: number,
    cementBags: number,
    concreteCost: number,
    steelTons: number,
    steelCost: number
  ) => void;
}

export const ConcreteStructureSection: React.FC<ConcreteStructureSectionProps> = ({
  currency,
  onUpdateStructureSummary,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'concrete' | 'steel' | 'guide'>('concrete');

  // ==========================================
  // Concrete Calculator State
  // ==========================================
  const [selectedType, setSelectedType] = useState<'slab' | 'beam' | 'column' | 'footing' | 'wall'>('slab');
  const [slabMode, setSlabMode] = useState<'area' | 'dims'>('area');
  const [dimValues, setDimValues] = useState<{ [key: string]: string }>({
    d0: '20',
    d1: '12',
    d2: '60',
  });
  const [count, setCount] = useState<number>(1);
  const [mixChoice, setMixChoice] = useState<string>('1,2,4');
  const [customMix, setCustomMix] = useState<{ c: number; s: number; g: number }>({ c: 1, s: 2, g: 4 });
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

  // User Prices for Concrete Materials (0 if unpriced / free input)
  const [concretePrices, setConcretePrices] = useState<ConcretePriceConfig>({
    cementBagPrice: 280, // benchmark in EGP
    sandM3Price: 220,
    gravelM3Price: 380,
    laborM3Price: 150,
  });

  // Project BOQ List
  const [boqList, setBoqList] = useState<ConcreteElement[]>([]);
  const [copiedBoq, setCopiedBoq] = useState<boolean>(false);

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

    return {
      ...advancedOpts,
      cement: c,
      sand: s,
      gravel: g,
    };
  }, [mixChoice, customMix, advancedOpts]);

  // Current Concrete Element Calculation
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
      const len = parseSumExpression(dimValues.d0 || '6', 6);
      const height = parseSumExpression(dimValues.d1 || '3', 3);
      const thicknessM = parseSumExpression(dimValues.d2 || '20', 20) / 100;
      vol = len * height * thicknessM * count;
      dimsText = `${len}م × ${height}م × ${dimValues.d2 || '20'}سم`;
    }

    const materials = calculateMaterialsBreakdown(vol, activeMix);
    const costData = calculateConcreteCost(materials, concretePrices);

    return {
      name: config.name,
      dimsText,
      count,
      vol,
      materials,
      costData,
    };
  }, [selectedType, slabMode, dimValues, count, activeMix, concretePrices]);

  // Total BOQ Materials & Cost
  const totalBoqVolume = boqList.reduce((acc, el) => acc + el.volume, 0);
  const totalBoqMaterials = useMemo(() => {
    return calculateMaterialsBreakdown(totalBoqVolume, activeMix);
  }, [totalBoqVolume, activeMix]);
  const totalBoqCost = useMemo(() => {
    return calculateConcreteCost(totalBoqMaterials, concretePrices);
  }, [totalBoqMaterials, concretePrices]);

  // ==========================================
  // Steel Calculator State
  // ==========================================
  const [steelMode, setSteelMode] = useState<'area' | 'volume'>('area');
  const [slabArea, setSlabArea] = useState<number>(140);
  const [floorsCount, setFloorsCount] = useState<number>(1);
  const [system, setSystem] = useState<StructuralSystem>('flat_slab');
  const [customSteelPerM2, setCustomSteelPerM2] = useState<number>(35);
  const [includeSubstructure, setIncludeSubstructure] = useState<boolean>(true);
  const [concreteDirectVol, setConcreteDirectVol] = useState<number>(35);
  const [elementCategory, setElementCategory] = useState<'solid_slab' | 'flat_slab' | 'columns' | 'footings' | 'raft'>('flat_slab');

  const pricingMode = loadCurrencyPricingMode();
  const activeRate = getActiveRate(currency);
  const defaultSteelPrice = useMemo(() => {
    if (pricingMode === 'direct') {
      return BENCHMARK_STEEL_PRICE_PER_TON[currency] || 41000;
    }
    return Math.round(41000 / (activeRate || 1));
  }, [currency, pricingMode, activeRate]);

  const [steelPricePerTon, setSteelPricePerTon] = useState<number>(defaultSteelPrice);

  React.useEffect(() => {
    setSteelPricePerTon(defaultSteelPrice);
  }, [defaultSteelPrice]);

  // Area Mode Steel calculation
  const steelAreaResults = useMemo(() => {
    return calculateSteelEstimation(
      slabArea,
      floorsCount,
      system,
      includeSubstructure,
      customSteelPerM2,
      steelPricePerTon
    );
  }, [slabArea, floorsCount, system, includeSubstructure, customSteelPerM2, steelPricePerTon]);

  // Volume Mode Steel calculation
  const steelVolumeResults = useMemo(() => {
    let ratePerM3 = 135;
    if (elementCategory === 'solid_slab') ratePerM3 = 90;
    else if (elementCategory === 'flat_slab') ratePerM3 = 135;
    else if (elementCategory === 'columns') ratePerM3 = 175;
    else if (elementCategory === 'footings') ratePerM3 = 115;
    else if (elementCategory === 'raft') ratePerM3 = 145;

    const totalKg = concreteDirectVol * ratePerM3;
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
      concreteVol: concreteDirectVol,
      tieWireKg,
      totalCost: Math.round(totalTons * (steelPricePerTon || 0)),
      diameters,
    };
  }, [concreteDirectVol, elementCategory, steelPricePerTon]);

  const activeSteelTons = steelMode === 'area' ? steelAreaResults.totalSteelTons : steelVolumeResults.totalTons;
  const activeSteelCost = steelMode === 'area' ? steelAreaResults.totalCost : steelVolumeResults.totalCost;

  // Sync with summary parent
  React.useEffect(() => {
    if (onUpdateStructureSummary) {
      onUpdateStructureSummary(
        totalBoqVolume,
        totalBoqMaterials.cementBags,
        totalBoqCost.totalCost,
        activeSteelTons,
        activeSteelCost
      );
    }
  }, [onUpdateStructureSummary, totalBoqVolume, totalBoqMaterials, totalBoqCost, activeSteelTons, activeSteelCost]);

  /*mrp-reg*/
  // تسجيل بيانات تقرير الطباعة (يتحدث مع كل تغيير في الحسابات)
  React.useEffect(() => {
    registerReport('concrete_structure', () =>
      activeSubTab === 'guide'
        ? null
        : buildConcreteReport({
            currency,
            boqList,
            totalBoqVolume,
            totalBoqMaterials,
            totalBoqCost,
            concretePrices,
            activeMix,
            steelMode,
            steelAreaResults,
            steelVolumeResults,
            includeSubstructure,
            elementCategory,
            steelPricePerTon,
            activeSteelTons,
            activeSteelCost,
          })
    );
  });

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
      cost: currentElement.costData.totalCost,
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
    lines.push(`عدد أكياس الأسمنت: ${totalBoqMaterials.cementBags} كيس (${formatNumber(totalBoqMaterials.cementKg, 0)} كجم)`);
    lines.push(`الرمل المطلوب: ${formatNumber(totalBoqMaterials.sandM3, 2)} م³`);
    lines.push(`الزلط المطلوب: ${formatNumber(totalBoqMaterials.gravelM3, 2)} م³`);
    lines.push(`مياه الخلط: ${formatNumber(totalBoqMaterials.waterLiters, 0)} لتر`);
    if (totalBoqCost.totalCost > 0) {
      lines.push(`التكلفة التقديرية لمواد ومصنعية الخرسانة: ${formatCurrency(totalBoqCost.totalCost, currency)}`);
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(lines.join('\n'));
      setCopiedBoq(true);
      setTimeout(() => setCopiedBoq(false), 2000);
    }
  };

  useSEO({
    title: 'حاسبة الهياكل والعناصر الخرسانية - معين',
    description: 'احسب تكاليف وكميات الهياكل الخرسانية المسلحة والأسقف والأعمدة والقواعد.',
    keywords: 'خرسانة مسلحة, هياكل خرسانية, كميات البناء, أعمدة خرسانية, معين'
  });

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <section className="bg-gradient-to-l from-[#003C69] via-[#002f54] to-[#002340] text-white p-6 sm:p-8 rounded-2xl shadow-lg border-b-4 border-[#B1A06D]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[#B1A06D] text-xs font-bold mb-3 border border-white/10">
            <Building2 className="w-3.5 h-3.5" />
            <span>القسم الثاني: حاسبة ودليل الخرسانات وحديد التسليح</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-white">
            حاسبة ودليل الخرسانات المسلحة وحصر حديد التسليح
          </h1>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
            حصر دقيق لكميات الأسمنت والرمل والزلط ومياه الخلط للعناصر الإنشائية المختلفة، مع تقدير أطنان وأسياخ حديد التسليح وتوزيع أقطارها استرشادياً، وتسعير المواد حر بالكامل أو تركه فارغاً لحساب الكميات فقط.
          </p>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-white/15">
          <button
            type="button"
            onClick={() => setActiveSubTab('concrete')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'concrete'
                ? 'bg-white text-[#003C69] shadow-md scale-[1.02]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>حاسبة الخرسانة والأسمنت (BOQ)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('steel')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'steel'
                ? 'bg-white text-[#003C69] shadow-md scale-[1.02]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>حصر حديد التسليح والأقطار</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('guide')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'guide'
                ? 'bg-[#00B050] text-white shadow-md scale-[1.02]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>دليل استلام الخرسانات والحديد هندسياً</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: CONCRETE CALCULATOR WITH FLEXIBLE USER PRICING                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'concrete' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-[#003C69] flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#B1A06D]" />
                  <span>بيانات العنصر الخرساني</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  أدخل أبعاد العنصر مباشرة أو اجمع عدة مساحات
                </p>
              </div>
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
                    <label htmlFor="concrete-struct-slab-area" className="block text-xs font-semibold text-slate-600 mb-1">
                      المساحة الكلية (يمكنك جمع أجزاء مثل 15.5+20.8+30):
                    </label>
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 focus-within:border-[#00B050]">
                      <input
                        id="concrete-struct-slab-area"
                        type="text"
                        value={dimValues.d0 || '20'}
                        onChange={(e) => setDimValues({ ...dimValues, d0: e.target.value })}
                        className="w-full p-2 text-sm font-mono text-right bg-transparent outline-none"
                      />
                      <span className="px-3 bg-slate-100 text-xs text-slate-500 font-bold border-r border-slate-200">
                        م²
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="concrete-struct-slab-thick" className="block text-xs font-semibold text-slate-600 mb-1">سُمك البلاطة:</label>
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                      <input
                        id="concrete-struct-slab-thick"
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
                    <label htmlFor="concrete-struct-len" className="block text-[11px] font-semibold text-slate-600 mb-1">الطول (م)</label>
                    <input
                      id="concrete-struct-len"
                      type="number"
                      value={dimValues.d0 || '5'}
                      onChange={(e) => setDimValues({ ...dimValues, d0: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="concrete-struct-width" className="block text-[11px] font-semibold text-slate-600 mb-1">العرض (م)</label>
                    <input
                      id="concrete-struct-width"
                      type="number"
                      value={dimValues.d1 || '4'}
                      onChange={(e) => setDimValues({ ...dimValues, d1: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="concrete-struct-depth" className="block text-[11px] font-semibold text-slate-600 mb-1">السُمك (سم)</label>
                    <input
                      id="concrete-struct-depth"
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
                    <label htmlFor="concrete-struct-field0" className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {CONCRETE_TYPES[selectedType].fields[0].name} ({CONCRETE_TYPES[selectedType].fields[0].unit})
                    </label>
                    <input
                      id="concrete-struct-field0"
                      type="number"
                      value={dimValues.d0 || ''}
                      onChange={(e) => setDimValues({ ...dimValues, d0: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="concrete-struct-field1" className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {CONCRETE_TYPES[selectedType].fields[1].name} ({CONCRETE_TYPES[selectedType].fields[1].unit})
                    </label>
                    <input
                      id="concrete-struct-field1"
                      type="number"
                      value={dimValues.d1 || ''}
                      onChange={(e) => setDimValues({ ...dimValues, d1: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="concrete-struct-field2" className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {CONCRETE_TYPES[selectedType].fields[2].name} ({CONCRETE_TYPES[selectedType].fields[2].unit})
                    </label>
                    <input
                      id="concrete-struct-field2"
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
                <label htmlFor="concrete-struct-count" className="block text-xs font-semibold text-slate-600 mb-1">العدد المتكرر:</label>
                <input
                  id="concrete-struct-count"
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
              <label htmlFor="concrete-struct-mix" className="block text-xs font-bold text-slate-700 mb-1">
                نسبة الخلطة (أسمنت : رمل : زلط) بالحجم:
              </label>
              <select
                id="concrete-struct-mix"
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
                    <label htmlFor="concrete-struct-c" className="block text-[10px] text-slate-500">أسمنت</label>
                    <input
                      id="concrete-struct-c"
                      type="number"
                      value={customMix.c}
                      onChange={(e) => setCustomMix({ ...customMix, c: Number(e.target.value) })}
                      className="w-full border rounded p-1 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="concrete-struct-s" className="block text-[10px] text-slate-500">رمل</label>
                    <input
                      id="concrete-struct-s"
                      type="number"
                      value={customMix.s}
                      onChange={(e) => setCustomMix({ ...customMix, s: Number(e.target.value) })}
                      className="w-full border rounded p-1 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="concrete-struct-g" className="block text-[10px] text-slate-500">زلط</label>
                    <input
                      id="concrete-struct-g"
                      type="number"
                      value={customMix.g}
                      onChange={(e) => setCustomMix({ ...customMix, g: Number(e.target.value) })}
                      className="w-full border rounded p-1 text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Concrete User Pricing (Optional & Editable) */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#003C69] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#B1A06D]" />
                  <span>تسعير مواد الخرسانة (اختياري بالكامل):</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setConcretePrices({
                      cementBagPrice: 0,
                      sandM3Price: 0,
                      gravelM3Price: 0,
                      laborM3Price: 0,
                    })
                  }
                  className="text-[10px] text-rose-600 hover:underline"
                >
                  تصفير الأسعار
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label htmlFor="concrete-price-cement" className="block text-[10px] text-slate-500">سعر كيس الأسمنت (50 كجم)</label>
                  <input
                    id="concrete-price-cement"
                    type="number"
                    placeholder="0 إذا بدون سعر"
                    value={concretePrices.cementBagPrice || ''}
                    onChange={(e) =>
                      setConcretePrices({ ...concretePrices, cementBagPrice: Number(e.target.value) || 0 })
                    }
                    className="w-full border rounded p-1 text-xs font-mono font-bold text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="concrete-price-sand" className="block text-[10px] text-slate-500">سعر متر الرمل (م³)</label>
                  <input
                    id="concrete-price-sand"
                    type="number"
                    placeholder="0 إذا بدون سعر"
                    value={concretePrices.sandM3Price || ''}
                    onChange={(e) =>
                      setConcretePrices({ ...concretePrices, sandM3Price: Number(e.target.value) || 0 })
                    }
                    className="w-full border rounded p-1 text-xs font-mono font-bold text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="concrete-price-gravel" className="block text-[10px] text-slate-500">سعر متر الزلط (م³)</label>
                  <input
                    id="concrete-price-gravel"
                    type="number"
                    placeholder="0 إذا بدون سعر"
                    value={concretePrices.gravelM3Price || ''}
                    onChange={(e) =>
                      setConcretePrices({ ...concretePrices, gravelM3Price: Number(e.target.value) || 0 })
                    }
                    className="w-full border rounded p-1 text-xs font-mono font-bold text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="concrete-price-labor" className="block text-[10px] text-slate-500">مصنعية الصب / م³ خرسانة</label>
                  <input
                    id="concrete-price-labor"
                    type="number"
                    placeholder="0 إذا بدون سعر"
                    value={concretePrices.laborM3Price || ''}
                    onChange={(e) =>
                      setConcretePrices({ ...concretePrices, laborM3Price: Number(e.target.value) || 0 })
                    }
                    className="w-full border rounded p-1 text-xs font-mono font-bold text-slate-800 bg-white"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                في حال ترك أي حقل فارغاً أو صفر، يتم حساب الكميات (أكياس ورمل وزلط) عادي جداً دون أي تأثير.
              </p>
            </div>

            {/* Advanced Settings */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-[#003C69] font-bold flex items-center justify-between w-full"
              >
                <span>الإعدادات الهندسية (معامل الحجم الجاف والهالك)</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label htmlFor="concrete-adv-waste" className="block text-[10px] text-slate-500">نسبة الهالك (%)</label>
                    <input
                      id="concrete-adv-waste"
                      type="number"
                      value={advancedOpts.wastePercent}
                      onChange={(e) => setAdvancedOpts({ ...advancedOpts, wastePercent: Number(e.target.value) })}
                      className="w-full border rounded p-1 font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="concrete-adv-dry" className="block text-[10px] text-slate-500">معامل الحجم الجاف</label>
                    <input
                      id="concrete-adv-dry"
                      type="number"
                      step="0.01"
                      value={advancedOpts.dryVolumeFactor}
                      onChange={(e) => setAdvancedOpts({ ...advancedOpts, dryVolumeFactor: Number(e.target.value) })}
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
              className="w-full bg-[#003C69] hover:bg-[#002f54] text-white py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة هذا العنصر إلى جدول حصر المشروع</span>
            </button>
          </div>

          {/* Results Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Live Result Tile */}
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
                    ({formatNumber(currentElement.materials.exactBags, 2)} كيس بالحساب الدقيق)
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
                  {concretePrices.cementBagPrice > 0 && (
                    <span className="text-[10px] text-emerald-700 block mt-1 font-mono">
                      {formatCurrency(currentElement.costData.cementCost, currency)}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">الرمل المطلوب</span>
                  <span className="text-base font-bold text-[#B1A06D] font-mono">
                    {formatNumber(currentElement.materials.sandM3, 2)} م³
                  </span>
                  {concretePrices.sandM3Price > 0 && (
                    <span className="text-[10px] text-emerald-700 block mt-1 font-mono">
                      {formatCurrency(currentElement.costData.sandCost, currency)}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">الزلط المطلوب</span>
                  <span className="text-base font-bold text-[#00B050] font-mono">
                    {formatNumber(currentElement.materials.gravelM3, 2)} م³
                  </span>
                  {concretePrices.gravelM3Price > 0 && (
                    <span className="text-[10px] text-emerald-700 block mt-1 font-mono">
                      {formatCurrency(currentElement.costData.gravelCost, currency)}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">مياه الخلط</span>
                  <span className="text-base font-bold text-sky-600 font-mono">
                    {formatNumber(currentElement.materials.waterLiters, 0)} لتر
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                    (ماء نظيف صالح للشرب)
                  </span>
                </div>
              </div>

              {/* Total Cost for this element if priced */}
              {currentElement.costData.isPriced && (
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-[#003C69]">التكلفة التقديرية لهذا العنصر الخرساني:</span>
                  <span className="text-base font-black text-[#003C69] font-mono">
                    {formatCurrency(currentElement.costData.totalCost, currency)}
                  </span>
                </div>
              )}
            </div>

            {/* Project BOQ Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-[#003C69] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#B1A06D]" />
                    <span>جدول حصر خرسانة المشروع الكامل (BOQ)</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    {boqList.length} عناصر مضافة
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
                      <span>{copiedBoq ? 'تم النسخ!' : 'نسخ الحصر'}</span>
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

                  {/* Total Materials Breakdown */}
                  <div className="p-4 bg-emerald-50/50 border-t border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-emerald-950 block">
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
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: STEEL REBAR ESTIMATOR WITH FREE CUSTOM INPUTS                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'steel' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Controls Column (4 cols) */}
          <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-[#003C69] flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#B1A06D]" />
                  <span>معايير ومدخلات حديد التسليح</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  جميع المدخلات قابلة للتعديل بحرية تامة
                </p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSteelMode('area')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  steelMode === 'area' ? 'bg-white text-[#003C69] shadow-xs' : 'text-slate-600'
                }`}
              >
                بمساحة السقف
              </button>
              <button
                type="button"
                onClick={() => setSteelMode('volume')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  steelMode === 'volume' ? 'bg-white text-[#003C69] shadow-xs' : 'text-slate-600'
                }`}
              >
                بمكعبات الخرسانة (م³)
              </button>
            </div>

            {steelMode === 'area' ? (
              <>
                {/* Slab Area */}
                <div>
                  <label htmlFor="concrete-struct-slab-m2" className="block text-xs font-bold text-slate-700 mb-1">
                    مساحة مسطح السقف (م²):
                  </label>
                  <input
                    id="concrete-struct-slab-m2"
                    type="number"
                    min="1"
                    value={slabArea}
                    onChange={(e) => setSlabArea(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-mono font-bold text-slate-800"
                  />
                </div>

                {/* Floors Count */}
                <div>
                  <label htmlFor="concrete-struct-floors" className="block text-xs font-bold text-slate-700 mb-1">
                    عدد الأدوار والأسقف:
                  </label>
                  <input
                    id="concrete-struct-floors"
                    type="number"
                    min="1"
                    value={floorsCount}
                    onChange={(e) => setFloorsCount(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-mono font-bold text-slate-800"
                  />
                </div>

                {/* System & Free Custom Rate */}
                <div>
                  <label htmlFor="concrete-struct-sys" className="block text-xs font-bold text-slate-700 mb-1">
                    النظام الإنشائي:
                  </label>
                  <select
                    id="concrete-struct-sys"
                    value={system}
                    onChange={(e) => {
                      const sysKey = e.target.value as StructuralSystem;
                      setSystem(sysKey);
                      if (STRUCTURAL_SYSTEMS[sysKey]) {
                        setCustomSteelPerM2(STRUCTURAL_SYSTEMS[sysKey].defaultSteelPerM2);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-[#003C69]"
                  >
                    {Object.entries(STRUCTURAL_SYSTEMS).map(([k, sys]) => (
                      <option key={k} value={k}>
                        {sys.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Free Steel Rate input */}
                <div>
                  <label htmlFor="concrete-struct-rate" className="block text-xs font-bold text-slate-700 mb-1">
                    معدل استهلاك الحديد (كجم / م² مسطح):
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <input
                      id="concrete-struct-rate"
                      type="number"
                      step="0.5"
                      min="5"
                      max="100"
                      value={customSteelPerM2}
                      onChange={(e) => setCustomSteelPerM2(Math.max(1, Number(e.target.value)))}
                      className="w-full p-2 text-xs font-mono font-bold text-slate-800 bg-transparent outline-none text-right"
                    />
                    <span className="px-2.5 bg-slate-100 text-xs font-bold text-slate-500 border-r border-slate-200">
                      كجم/م²
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    يمكنك كتابة أي رقم تريده بحرية (سوليد سلاب ~22، فلات سلاب ~35، هوردي ~30)
                  </span>
                </div>

                {/* Checkbox Substructure */}
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
                      <span className="text-[11px] text-slate-500 block">
                        لحساب إجمالي حديد المبنى كاملاً
                      </span>
                    </div>
                  </label>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="concrete-struct-dir-vol" className="block text-xs font-bold text-slate-700 mb-1">
                    حجم الخرسانة المسلحة (م³):
                  </label>
                  <input
                    id="concrete-struct-dir-vol"
                    type="number"
                    min="1"
                    value={concreteDirectVol}
                    onChange={(e) => setConcreteDirectVol(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-mono font-bold"
                  />
                </div>

                <div>
                  <label htmlFor="concrete-struct-elem-cat" className="block text-xs font-bold text-slate-700 mb-1">نوع العنصر:</label>
                  <select
                    id="concrete-struct-elem-cat"
                    value={elementCategory}
                    onChange={(e) => setElementCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-[#003C69]"
                  >
                    <option value="solid_slab">سقف سوليد سلاب عادية (90 كجم/م³)</option>
                    <option value="flat_slab">سقف فلات سلاب لاكمرية (135 كجم/م³)</option>
                    <option value="columns">أعمدة وحوائط خرسانية (175 كجم/م³)</option>
                    <option value="footings">قواعد مسلحة وسملات (115 كجم/م³)</option>
                    <option value="raft">لبشة خرسانية مسلحة (145 كجم/م³)</option>
                  </select>
                </div>
              </>
            )}

            {/* Steel Price per ton (Optional / Free input) */}
            <div className="pt-2 border-t border-slate-100">
              <label htmlFor="concrete-struct-steel-ton-price" className="block text-xs font-bold text-slate-700 mb-1">
                سعر طن الحديد (اختياري - اتركه 0 لحساب الكمية فقط):
              </label>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <input
                  id="concrete-struct-steel-ton-price"
                  type="number"
                  placeholder="0 إذا بدون سعر"
                  value={steelPricePerTon || ''}
                  onChange={(e) => setSteelPricePerTon(Number(e.target.value) || 0)}
                  className="w-full p-2 text-xs font-mono font-bold text-slate-800 bg-transparent outline-none text-right"
                />
                <span className="px-2.5 bg-slate-100 text-xs font-bold text-slate-500 border-r border-slate-200">
                  {CURRENCIES[currency].symbol} / طن
                </span>
              </div>
            </div>
          </div>

          {/* Results Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Currency Pricing Model Advisory Banner if non-EGP */}
            {currency !== 'EGP' && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-sky-950 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#003C69] shrink-0" />
                  <div>
                    <span className="font-bold text-[#003C69] ml-1">
                      العملة المعتمدة: {CURRENCIES[currency].name} ({CURRENCIES[currency].symbol})
                    </span>
                    <span className="text-[11px] text-slate-600 block sm:inline">
                      {loadCurrencyPricingMode() === 'direct'
                        ? '• بنمط التسعير المستقل لسوقك (سعر طن الحديد وخامات الخرسانة بعملتك مباشرة).'
                        : `• محولة بسعر الصرف اليومي الحي (1 ${CURRENCIES[currency].symbol} = ${getActiveRate(currency)} ج.م).`}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#003C69] bg-white px-2.5 py-1 rounded-md border border-sky-300 shrink-0 self-start sm:self-auto">
                  {loadCurrencyPricingMode() === 'direct' ? 'تسعير حر مستقل' : 'سعر صرف مرن'}
                </span>
              </div>
            )}
            
            {/* Key Metric Tiles Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-[#00B050]">
                <span className="text-xs text-slate-500 block mb-1">إجمالي كمية الحديد</span>
                <span className="text-2xl sm:text-3xl font-black text-[#003C69] font-mono tabular-nums block">
                  {formatNumber(activeSteelTons, 2)}
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  طـن ({formatNumber(steelMode === 'area' ? steelAreaResults.totalSteelKg : steelVolumeResults.totalKg, 0)} كجم)
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-sky-600">
                <span className="text-xs text-slate-500 block mb-1">التكلفة التقديرية للحديد</span>
                <span className="text-lg sm:text-xl font-bold text-slate-800 font-mono tabular-nums block">
                  {activeSteelCost > 0 ? (
                    formatCurrency(activeSteelCost, currency)
                  ) : (
                    <span className="text-xs text-amber-700 font-normal">كمية فقط (غير مسعّر)</span>
                  )}
                </span>
                <span className="text-[11px] text-slate-500">
                  {steelPricePerTon > 0 ? `بسعر ${formatCurrency(steelPricePerTon, currency)}/طن` : 'أدخل سعر الطن للحساب'}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-[#B1A06D]">
                <span className="text-xs text-slate-500 block mb-1">معدل التسليح المستخدم</span>
                <span className="text-lg sm:text-xl font-bold text-[#003C69] font-mono tabular-nums block">
                  {steelMode === 'area' ? `${customSteelPerM2} كجم/م²` : `${steelVolumeResults.ratePerM3} كجم/م³`}
                </span>
                <span className="text-[11px] text-slate-500">معدل حر مخصص</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-amber-500">
                <span className="text-xs text-slate-500 block mb-1">سلك رباط محروق</span>
                <span className="text-lg sm:text-xl font-bold text-slate-800 font-mono tabular-nums block">
                  {steelMode === 'area' ? steelAreaResults.tieWireKg : steelVolumeResults.tieWireKg} كجم
                </span>
                <span className="text-[11px] text-slate-500">22 كجم لكل طن حديد</span>
              </div>
            </div>

            {/* Rebar Diameter Breakdown Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-[#003C69] flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#B1A06D]" />
                    <span>توزيع الأقطار وعدد الأسياخ التقديري (طول 12م):</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    لحساب طلبيات التوريد والشحنات بدقة
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
                    {(steelMode === 'area' ? steelAreaResults.diameters : steelVolumeResults.diameters).map((d) => (
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

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: CONCRETE & REBAR ENGINEERING INSPECTION GUIDE                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'guide' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#00B050]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#003C69]">
                الدليل الهندسي الشامل: استلام ومراجعة الخرسانات والحديد في الموقع
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                قواعد هندسية أساسية لحماية المالك من التلاعب في أوزان الحديد أو عيوب صب الخرسانة وتفادي التعشيش والصدأ.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STEEL_INSPECTION_TIPS.map((tip, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
                <h3 className="text-sm font-bold text-[#003C69] flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{tip.title}</span>
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {tip.content}
                </p>
              </div>
            ))}

            {/* Additional concrete pouring tips */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
              <h3 className="text-sm font-bold text-[#003C69] flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>شروط ومعايير صب الخرسانة ودمكها بالهزاز</span>
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                استخدام الهزاز الميكانيكي ضروري جداً لتفريغ فقاعات الهواء ومنع حدوث التعشيش، مع الحذر من الإفراط في الهز (لا تزد عن 15-20 ثانية في النقطة الواحدة) حتى لا يحدث انفصال حبيبي (Segregation) للزلط والأسمنت.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
              <h3 className="text-sm font-bold text-[#003C69] flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>معالجة ورش الخرسانة بالمياه بعد الصب (Curing)</span>
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                تبدأ معالجة الخرسانة بالرش بالمياه بعد الشك الابتدائي (اليوم التالي للصب) وتستمر لمدة 7 أيام متتالية صباحاً ومساءً أو تغطيتها بالخيش المبلل، لأن التفاعل الكيميائي للأسمنت يحتاج ماء ليحقق المقاومة التصميمية الكاملة.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};