import React, { useState, useMemo } from 'react';
import { useSEO } from '../hooks/useSEO';
import {
  ApartmentSpecs,
  CurrencyCode,
  FinishingTier,
  FinishingCategoryResult,
  UserPriceOverride,
  CustomFinishingItem,
} from '../types';
import {
  FINISHING_STAGES,
  FINISHING_TIERS,
  calculateApartmentFinishes,
} from '../data/finishingGuides';
import {
  formatCurrency,
  formatNumber,
  CURRENCIES,
  loadCurrencyPricingMode,
  getActiveRate,
} from '../data/currencies';
import { SingleTradeCalculator } from './SingleTradeCalculator';
import {
  Home,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  DollarSign,
  Coins,
  Info,
  Hammer,
  ShieldCheck,
  Paintbrush,
  Droplets,
  Zap,
  Building2,
  Layers,
  SquareCode,
  DoorOpen,
  Maximize2,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Tag,
  Check,
  Settings2,
} from 'lucide-react';

import { registerReport } from '../utils/reportStore';
import { buildFinishesReport } from '../utils/reportBuilders';

interface FinishingSectionProps {
  currency: CurrencyCode;
  onUpdateFinishesSummary?: (total: number, materials: number, labor: number, itemsCount: number) => void;
}

export const FinishingSection: React.FC<FinishingSectionProps> = ({
  currency,
  onUpdateFinishesSummary,
}) => {
  const [subTab, setSubTab] = useState<'quick' | 'itemized' | 'guide'>('quick');

  // Specs for Flat Estimator - strictly tailored for building a NEW home from scratch on concrete frame
  const [specs, setSpecs] = useState<ApartmentSpecs>({
    totalArea: 120,
    roomsCount: 3,
    bathroomsCount: 2,
    kitchensCount: 1,
    balconiesCount: 2,
    ceilingHeight: 2.85,
    customWallFactor: 2.7,
    tier: 'medium', // Default to medium tier so items and materials are immediately prominent
    currency,
    masonryMode: 'full_new_building',
    externalWallThickness: '25', // 25cm full-brick exterior walls for thermal/acoustic insulation
    internalWallThickness: '12', // 12cm half-brick partition walls
    brickType: 'clay_25_12_6',
    flooringType: 'porcelain',
    ceilingType: 'gypsum_perimeter',
    aluminumType: 'medium_jumbo',
    doorQuality: 'oak_veneer',
  });

  // User-defined price overrides map: itemId -> { material, labor }
  const [userPrices, setUserPrices] = useState<Record<string, UserPriceOverride>>({});

  // User-defined quantity overrides map: itemId -> quantity number | null
  const [userQuantityOverrides, setUserQuantityOverrides] = useState<Record<string, number | null>>({});

  // Custom Items added by client freely
  const [customItems, setCustomItems] = useState<CustomFinishingItem[]>([]);
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);
  const [newCustomItem, setNewCustomItem] = useState<{
    categoryName: string;
    title: string;
    unit: string;
    quantity: number;
    materialUnitCost: number;
    laborUnitCost: number;
    details: string;
  }>({
    categoryName: 'أعمال ديكورية خاصة',
    title: 'تجليد خشب جداري أو بديل رخام',
    unit: 'م²',
    quantity: 20,
    materialUnitCost: 350,
    laborUnitCost: 90,
    details: 'توريد وتركيب حسب رغبة العميل',
  });

  // Sync currency in useEffect
  React.useEffect(() => {
    if (specs.currency !== currency) {
      setSpecs((prev) => ({ ...prev, currency }));
    }
  }, [currency, specs.currency]);

  // Expanded categories state - all expanded by default so all items are visible!
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    masonry: true,
    plaster: true,
    plumbing: true,
    electrical: true,
    flooring: true,
    gypsum: true,
    paint: true,
    'carpentry-windows': true,
    custom_client_items: true,
  });

  const toggleCategory = (id: string) => {
    setExpandedCats((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Run calculation with all user overrides (pure calculation without side-effects)
  const categories: FinishingCategoryResult[] = useMemo(() => {
    return calculateApartmentFinishes(specs, userPrices, customItems, userQuantityOverrides);
  }, [specs, userPrices, customItems, userQuantityOverrides]);

  const totalCost = useMemo(() => categories.reduce((a, b) => a + b.totalCost, 0), [categories]);
  const totalMaterials = useMemo(() => categories.reduce((a, b) => a + b.materialCost, 0), [categories]);
  const totalLabor = useMemo(() => categories.reduce((a, b) => a + b.laborCost, 0), [categories]);
  const totalItemsCount = useMemo(() => categories.reduce((a, b) => a + b.items.length, 0), [categories]);
  const totalUnpricedCount = useMemo(() => categories.reduce((a, b) => a + (b.unpricedItemsCount || 0), 0), [categories]);
  const overriddenQuantitiesCount = Object.keys(userQuantityOverrides).length;
  const costPerM2 = specs.totalArea > 0 ? Math.round(totalCost / specs.totalArea) : 0;

  // Sync summary with parent cleanly inside useEffect to prevent setState-in-render warning
  React.useEffect(() => {
    if (onUpdateFinishesSummary) {
      onUpdateFinishesSummary(totalCost, totalMaterials, totalLabor, totalItemsCount);
    }
  }, [totalCost, totalMaterials, totalLabor, totalItemsCount, onUpdateFinishesSummary]);

  // Handle tier selection: updates tier AND immediately expands all categories so all items are shown
  const handleSelectTier = (newTier: FinishingTier) => {
    setSpecs((prev) => ({ ...prev, tier: newTier }));
    // Open all category accordions so items are immediately visible
    const allOpen: Record<string, boolean> = {
      masonry: true,
      plaster: true,
      plumbing: true,
      electrical: true,
      flooring: true,
      gypsum: true,
      paint: true,
      'carpentry-windows': true,
      custom_client_items: true,
    };
    setExpandedCats(allOpen);
  };

  // Handle quantity change by user
  const handleQuantityChange = (itemId: string, val: string) => {
    if (val === '') {
      // Keep as blank or revert to null
      setUserQuantityOverrides((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      return;
    }
    const num = Number(val);
    if (!isNaN(num)) {
      setUserQuantityOverrides((prev) => ({
        ...prev,
        [itemId]: Math.max(0, num),
      }));
    }
  };

  // Reset a specific item's quantity back to engine calculation
  const handleResetQuantity = (itemId: string) => {
    setUserQuantityOverrides((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  // Reset all quantity overrides
  const handleResetAllQuantities = () => {
    setUserQuantityOverrides({});
  };

  // Handle price change for any item
  const handlePriceChange = (itemId: string, field: 'material' | 'labor', val: string) => {
    const num = val === '' ? null : Number(val);
    setUserPrices((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: num,
      },
    }));
  };

  // Reset prices to zero (Unpriced Mode)
  const handleClearAllPrices = () => {
    const cleared: Record<string, UserPriceOverride> = {};
    categories.forEach((cat) => {
      cat.items.forEach((it) => {
        cleared[it.id] = { material: 0, labor: 0 };
      });
    });
    setUserPrices(cleared);
  };

  // Load benchmark suggestions
  const handleLoadDefaultBenchmarks = () => {
    setUserPrices({}); // resetting user price overrides falls back to active tier benchmarks
  };

  // Add custom item
  const handleAddCustom = () => {
    if (!newCustomItem.title) return;
    const item: CustomFinishingItem = {
      id: `custom-${Date.now()}`,
      categoryName: newCustomItem.categoryName || 'بنود مخصصة',
      title: newCustomItem.title,
      unit: newCustomItem.unit || 'وحدة',
      quantity: Math.max(0.1, Number(newCustomItem.quantity) || 1),
      materialUnitCost: Number(newCustomItem.materialUnitCost) || 0,
      laborUnitCost: Number(newCustomItem.laborUnitCost) || 0,
      details: newCustomItem.details,
    };
    setCustomItems((prev) => [...prev, item]);
    setShowAddCustomModal(false);
  };

  const handleRemoveCustomItem = (id: string) => {
    setCustomItems((prev) => prev.filter((i) => i.id !== id));
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2': return <Building2 className="w-5 h-5 text-[#003C69]" />;
      case 'Droplets': return <Droplets className="w-5 h-5 text-sky-600" />;
      case 'Zap': return <Zap className="w-5 h-5 text-amber-500" />;
      case 'Layers': return <Layers className="w-5 h-5 text-stone-600" />;
      case 'Grid': return <Maximize2 className="w-5 h-5 text-indigo-600" />;
      case 'SquareCode': return <SquareCode className="w-5 h-5 text-emerald-600" />;
      case 'Paintbrush': return <Paintbrush className="w-5 h-5 text-rose-500" />;
      case 'DoorOpen': return <DoorOpen className="w-5 h-5 text-amber-800" />;
      case 'PlusCircle': return <Plus className="w-5 h-5 text-purple-600" />;
      default: return <Hammer className="w-5 h-5 text-[#003C69]" />;
    }
  };

  const activeTierConfig = FINISHING_TIERS[specs.tier] || FINISHING_TIERS.medium;

  /*mrp-reg*/
  // تسجيل بيانات تقرير الطباعة (يتحدث مع كل تغيير في الحسابات)
  React.useEffect(() => {
    registerReport('finishes', () =>
      subTab !== 'quick'
        ? null
        : buildFinishesReport({
            categories,
            specs,
            tierName: activeTierConfig.name,
            currency,
            totalCost,
            totalMaterials,
            totalLabor,
            totalItemsCount,
            totalUnpricedCount,
            costPerM2,
          })
    );
  });

  useSEO({
    title: 'حاسبة تكاليف وبنود التشطيبات - معين',
    description: 'احسب كميات وتكاليف بنود الدهانات، المحارة، السيراميك، والسباكة والكهرباء بسهولة.',
    keywords: 'حاسبة التشطيبات, حساب المحارة, حساب السيراميك, تكلفة الدهانات, معين'
  });

  return (
    <div className="space-y-6">
      
      {/* Hero Header Card */}
      <section className="bg-gradient-to-l from-[#003C69] via-[#002f54] to-[#002340] text-white p-6 sm:p-8 rounded-2xl shadow-lg border-b-4 border-[#B1A06D]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[#B1A06D] text-xs font-bold mb-3 border border-white/10">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>القسم الأول: حاسبة ودليل التشطيبات المعمارية لبناء جديد</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-white">
            حاسبة ودليل التشطيبات المعمارية وحساب الكميات بدقة هندسية
          </h1>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
            منظومة هندسية استرشادية متكاملة لحساب كميات جميع بنود التشطيبات لبناء بيت أو شقة جديدة من الصفر على العظم. يتم إظهار جميع البنود فور اختيار باقة التشطيب، مع إمكانية تعديل كمية أو سعر أي بند وإعادة الضبط بمرونة مطلقة.
          </p>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-white/15">
          <button
            type="button"
            onClick={() => setSubTab('quick')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'quick'
                ? 'bg-white text-[#003C69] shadow-md scale-[1.02]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>1. حاسبة الشقة والمقايسة الشاملة لبناء جديد</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('itemized')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'itemized'
                ? 'bg-white text-[#003C69] shadow-md scale-[1.02]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>2. حاسبة تفاصيل أي بند بشكل منفصل (مباني، محارة، دهانات...)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('guide')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'guide'
                ? 'bg-[#00B050] text-white shadow-md scale-[1.02]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>3. دليل المراحل والتنفيذ والاستلام الهندسي (9 مراحل)</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: QUICK APARTMENT ESTIMATOR WITH TIER CARDS & EDITABLE QUANTITIES */}
      {/* ========================================================================= */}
      {subTab === 'quick' && (
        <div className="space-y-6">

          {/* REQUIREMENT 1: PROMINENT TIER SELECTOR CARDS - SHOWS ITEMS IMMEDIATELY */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#003C69] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#B1A06D]" />
                  <span>باقات وأنماط التشطيب الاسترشادية (اختر النمط لعرض البنود وتحديث المواصفات فوراً):</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  عند النقر على أي باقة، يتم تحديث مواصفات الخامات وإظهار جميع البنود المحصورة فوراً مع أسعارها الاسترشادية
                </p>
              </div>
            </div>

            {/* 6 Interactive Tier Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.values(FINISHING_TIERS).map((t) => {
                const isSelected = specs.tier === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTier(t.id as FinishingTier)}
                    className={`p-3.5 rounded-xl text-right transition-all border flex flex-col justify-between gap-2 cursor-pointer relative ${
                      isSelected
                        ? 'border-[#003C69] bg-gradient-to-b from-[#003C69]/5 to-[#003C69]/15 shadow-md ring-2 ring-[#003C69]'
                        : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 hover:border-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#003C69] text-white flex items-center justify-center text-[11px]">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <div>
                      <span className={`text-xs font-black block leading-tight ${isSelected ? 'text-[#003C69]' : 'text-slate-800'}`}>
                        {t.name}
                      </span>
                      <span className="text-[10px] text-slate-500 line-clamp-2 mt-1">
                        {t.description}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#00B050] font-mono">
                        {t.multiplier}x معامل
                      </span>
                      <span className="text-slate-400">
                        {isSelected ? 'الباقة المفعلة' : 'اختر'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Tier Specifications Banner */}
            {activeTierConfig?.specsHighlight && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-200/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#003C69]">
                  <CheckCircle2 className="w-4 h-4 text-[#00B050]" />
                  <span>المواصفات الفنية المعتمدة لباقة: <strong>{activeTierConfig.name}</strong></span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] text-slate-700">
                  <div className="bg-white/80 p-2 rounded border border-slate-200">
                    <span className="font-bold text-[#003C69] block mb-0.5">الأرضيات والسيراميك:</span>
                    <span>{activeTierConfig.specsHighlight.flooring}</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded border border-slate-200">
                    <span className="font-bold text-[#003C69] block mb-0.5">الدهانات والمعجون:</span>
                    <span>{activeTierConfig.specsHighlight.paint}</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded border border-slate-200">
                    <span className="font-bold text-[#003C69] block mb-0.5">الألوميتال والشبابيك:</span>
                    <span>{activeTierConfig.specsHighlight.aluminum}</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded border border-slate-200">
                    <span className="font-bold text-[#003C69] block mb-0.5">أعمال الأبواب والنجارة:</span>
                    <span>{activeTierConfig.specsHighlight.doors}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Controls Form Column (4 cols) - Free Non-Restricted Inputs for a NEW BUILDING */}
            <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-[#003C69] flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#B1A06D]" />
                    <span>بيانات بناء العقار الجديد</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    حسابات دقيقة لحصر بناء بيت أو دور جديد على الهيكل الخرساني
                  </p>
                </div>
              </div>

              {/* Total Area - Free Input */}
              <div>
                <label htmlFor="fin-total-area" className="block text-xs font-bold text-slate-700 mb-1">
                  المساحة الكلية للعقار / الدور (م²):
                </label>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 focus-within:border-[#00B050]">
                  <input
                    id="fin-total-area"
                    type="number"
                    min="1"
                    step="1"
                    value={specs.totalArea}
                    onChange={(e) => setSpecs({ ...specs, totalArea: Math.max(1, Number(e.target.value)) })}
                    className="w-full p-2.5 text-sm font-mono font-bold text-slate-800 bg-transparent outline-none text-right"
                  />
                  <span className="px-3 bg-slate-100 text-xs font-bold text-slate-500 border-r border-slate-200">
                    م²
                  </span>
                </div>
              </div>

              {/* Rooms, Baths, Kitchens, Balconies - Free Numeric Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fin-rooms-count" className="block text-xs font-semibold text-slate-600 mb-1">عدد الغرف والصالة</label>
                  <input
                    id="fin-rooms-count"
                    type="number"
                    min="1"
                    max="50"
                    value={specs.roomsCount}
                    onChange={(e) => setSpecs({ ...specs, roomsCount: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-800 font-mono text-center"
                  />
                </div>

                <div>
                  <label htmlFor="fin-baths-count" className="block text-xs font-semibold text-slate-600 mb-1">عدد الحمامات</label>
                  <input
                    id="fin-baths-count"
                    type="number"
                    min="0"
                    max="20"
                    value={specs.bathroomsCount}
                    onChange={(e) => setSpecs({ ...specs, bathroomsCount: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-800 font-mono text-center"
                  />
                </div>

                <div>
                  <label htmlFor="fin-kitchens-count" className="block text-xs font-semibold text-slate-600 mb-1">عدد المطابخ</label>
                  <input
                    id="fin-kitchens-count"
                    type="number"
                    min="0"
                    max="10"
                    value={specs.kitchensCount}
                    onChange={(e) => setSpecs({ ...specs, kitchensCount: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-800 font-mono text-center"
                  />
                </div>

                <div>
                  <label htmlFor="fin-balconies-count" className="block text-xs font-semibold text-slate-600 mb-1">عدد البلكونات / الشرفات</label>
                  <input
                    id="fin-balconies-count"
                    type="number"
                    min="0"
                    max="20"
                    value={specs.balconiesCount}
                    onChange={(e) => setSpecs({ ...specs, balconiesCount: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-800 font-mono text-center"
                  />
                </div>
              </div>

              {/* Height & Wall Thickness Options */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fin-ceiling-height" className="block text-xs font-semibold text-slate-600 mb-1">الارتفاع الصافي (متر)</label>
                  <input
                    id="fin-ceiling-height"
                    type="number"
                    step="0.05"
                    min="2.2"
                    max="5.0"
                    value={specs.ceilingHeight}
                    onChange={(e) => setSpecs({ ...specs, ceilingHeight: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-800 font-mono text-center"
                  />
                </div>

                <div>
                  <label htmlFor="fin-ext-wall" className="block text-xs font-semibold text-slate-600 mb-1">سمك الحائط الخارجي</label>
                  <select
                    id="fin-ext-wall"
                    value={specs.externalWallThickness || '25'}
                    onChange={(e) => setSpecs({ ...specs, externalWallThickness: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800"
                  >
                    <option value="25">25 سم (طوبة كاملة — عزل حراري)</option>
                    <option value="12">12 سم (نصف طوبة)</option>
                    <option value="double_isolated">25 سم (جدار مزدوج معزول)</option>
                  </select>
                </div>
              </div>

              {/* Pricing Mode Quick Controls */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  التحكم السريع في أسعار البنود:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleLoadDefaultBenchmarks}
                    className="py-1.5 px-2 bg-white hover:bg-slate-100 text-[#003C69] border border-slate-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>تطبيق أسعار الباقة الاسترشادية</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAllPrices}
                    className="py-1.5 px-2 bg-white hover:bg-slate-100 text-rose-700 border border-slate-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>تصفير الأسعار (حصر كميات فقط)</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  يمكنك كتابة السعر المناسب لك مباشرة أمام أي بند في الجدول، وفي حال تركته فارغاً أو صفر يُحسب البند ككمية فقط.
                </p>
              </div>

              {/* Add Custom Item Button */}
              <button
                type="button"
                onClick={() => setShowAddCustomModal(true)}
                className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-100 text-purple-900 border-2 border-dashed border-purple-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-purple-700" />
                <span>إضافة بند مخصص أو أعمال إضافية</span>
              </button>
            </div>

            {/* Results & Pricing Column (8 cols) */}
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
                          ? '• بنمط التسعير المستقل لبلدك بدون معادلة صرف لتجنب أخطاء تذبذب الأسعار.'
                          : `• محولة بسعر الصرف اليومي الحي (1 ${CURRENCIES[currency].symbol} = ${getActiveRate(currency)} ج.م).`}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#003C69] bg-white px-2.5 py-1 rounded-md border border-sky-300 shrink-0 self-start sm:self-auto">
                    {loadCurrencyPricingMode() === 'direct' ? 'تسعير حر مستقل' : 'سعر صرف مرن'}
                  </span>
                </div>
              )}
              
              {/* KPI Cards Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-[#00B050]">
                  <span className="text-xs text-slate-500 block mb-1">إجمالي تكلفة البنود المسعّرة</span>
                  <span className="text-xl sm:text-2xl font-black text-[#003C69] font-mono tabular-nums block">
                    {formatCurrency(totalCost, currency)}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    {totalUnpricedCount > 0
                      ? `(${totalUnpricedCount} بند بحاجة لتسعير)`
                      : 'جميع البنود مسعّرة'}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-sky-600">
                  <span className="text-xs text-slate-500 block mb-1">تكلفة الخامات والمواد</span>
                  <span className="text-lg sm:text-xl font-bold text-slate-800 font-mono tabular-nums block">
                    {formatCurrency(totalMaterials, currency)}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {totalCost > 0 ? `${Math.round((totalMaterials / totalCost) * 100)}% من المسعّر` : '0%'}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-amber-500">
                  <span className="text-xs text-slate-500 block mb-1">أجور العمالة والمصنعيات</span>
                  <span className="text-lg sm:text-xl font-bold text-slate-800 font-mono tabular-nums block">
                    {formatCurrency(totalLabor, currency)}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {totalCost > 0 ? `${Math.round((totalLabor / totalCost) * 100)}% من المسعّر` : '0%'}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-[#B1A06D]">
                  <span className="text-xs text-slate-500 block mb-1">عدد البنود المحصورة</span>
                  <span className="text-lg sm:text-xl font-bold text-[#003C69] font-mono tabular-nums block">
                    {totalItemsCount} بند
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {costPerM2 > 0 ? `${formatCurrency(costPerM2, currency)} / م²` : 'حصر كميات كامل'}
                  </span>
                </div>
              </div>

              {/* Notice if any quantity was modified manually */}
              {overriddenQuantitiesCount > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold text-xs sm:text-sm block">
                        تنبيه: تم تعديل كميات {overriddenQuantitiesCount} بند يدوياً حسب رغبتك.
                      </span>
                      <span className="text-[11px] text-amber-800">
                        تظهر ملاحظة وزر إعادة الضبط أمام كل بند معدل، أو يمكنك استعادة الحسابات الهندسية للكل بنقرة واحدة.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetAllQuantities}
                    className="px-3 py-1.5 bg-white hover:bg-amber-100 text-[#003C69] border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#003C69]" />
                    <span>إعادة ضبط جميع الكميات للحسابات التلقائية</span>
                  </button>
                </div>
              )}

              {/* Custom Item Modal */}
              {showAddCustomModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-right">
                    <div className="flex justify-between items-center border-b pb-3">
                      <h3 className="font-bold text-base text-[#003C69]">إضافة بند تشطيب مخصص جديد</h3>
                      <button
                        type="button"
                        onClick={() => setShowAddCustomModal(false)}
                        className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">اسم البند أو التجهيز:</label>
                        <input
                          type="text"
                          placeholder="مثال: ورق حائط / جاكوزي / بديل رخام"
                          value={newCustomItem.title}
                          onChange={(e) => setNewCustomItem({ ...newCustomItem, title: e.target.value })}
                          className="w-full border rounded-lg p-2 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">الوحدة:</label>
                          <input
                            type="text"
                            placeholder="م² / متر / عدد / مقطوعية"
                            value={newCustomItem.unit}
                            onChange={(e) => setNewCustomItem({ ...newCustomItem, unit: e.target.value })}
                            className="w-full border rounded-lg p-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">الكمية:</label>
                          <input
                            type="number"
                            value={newCustomItem.quantity}
                            onChange={(e) => setNewCustomItem({ ...newCustomItem, quantity: Number(e.target.value) })}
                            className="w-full border rounded-lg p-2 text-xs font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">سعر الخامة (اختياري):</label>
                          <input
                            type="number"
                            placeholder="0 إذا بدون سعر"
                            value={newCustomItem.materialUnitCost || ''}
                            onChange={(e) => setNewCustomItem({ ...newCustomItem, materialUnitCost: Number(e.target.value) })}
                            className="w-full border rounded-lg p-2 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">سعر المصنعية (اختياري):</label>
                          <input
                            type="number"
                            placeholder="0 إذا بدون سعر"
                            value={newCustomItem.laborUnitCost || ''}
                            onChange={(e) => setNewCustomItem({ ...newCustomItem, laborUnitCost: Number(e.target.value) })}
                            className="w-full border rounded-lg p-2 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">ملاحظات أو مواصفات إضافية:</label>
                        <input
                          type="text"
                          placeholder="تفاصيل التوريد أو المواصفة الفنية"
                          value={newCustomItem.details}
                          onChange={(e) => setNewCustomItem({ ...newCustomItem, details: e.target.value })}
                          className="w-full border rounded-lg p-2 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <button
                        type="button"
                        onClick={handleAddCustom}
                        className="flex-1 py-2 bg-[#003C69] hover:bg-[#002f54] text-white rounded-lg font-bold text-xs cursor-pointer"
                      >
                        حفظ وإضافة البند
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddCustomModal(false)}
                        className="px-4 py-2 border rounded-lg text-xs cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Itemized Categories with Direct Inline Quantity & Price Editing */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#003C69]" />
                      <span>حصر الكميات ومقايسة البنود الشاملة:</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      يمكنك تعديل أي كمية أو سعر مباشرة، وفي حال الشك بالكمية تظهر ملاحظة وزر إعادة الضبط للوضع الهندسي التلقائي
                    </p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        const all: Record<string, boolean> = {};
                        categories.forEach((c) => (all[c.categoryId] = true));
                        setExpandedCats(all);
                      }}
                      className="text-[#003C69] hover:underline font-bold cursor-pointer"
                    >
                      فتح الكل
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setExpandedCats({})}
                      className="text-slate-500 hover:underline cursor-pointer"
                    >
                      طي الكل
                    </button>
                  </div>
                </div>

                {categories.map((cat) => {
                  const isOpen = !!expandedCats[cat.categoryId];
                  return (
                    <div
                      key={cat.categoryId}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all"
                    >
                      {/* Header Bar */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat.categoryId)}
                        className="w-full p-4 flex items-center justify-between text-right bg-slate-50/70 hover:bg-slate-100/80 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-white shadow-xs border border-slate-200 flex items-center justify-center">
                            {getCategoryIcon(cat.iconName)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">{cat.categoryName}</h4>
                            <span className="text-xs text-slate-500">{cat.description}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-left font-mono">
                            <span className="text-sm font-black text-[#003C69] block">
                              {cat.totalCost > 0 ? formatCurrency(cat.totalCost, currency) : 'حصر كميات'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {cat.items.length} بنود
                            </span>
                          </div>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Collapsible Content */}
                      {isOpen && (
                        <div className="p-4 sm:p-5 border-t border-slate-200 space-y-4">
                          <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs sm:text-sm">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-500">
                                  <th className="pb-2 font-bold min-w-[210px]">البند والمواصفة الفنية</th>
                                  <th className="pb-2 font-bold min-w-[190px]">الكمية (قابلة للتعديل وإعادة الضبط)</th>
                                  <th className="pb-2 font-bold min-w-[105px]">سعر الخامة ({CURRENCIES[currency].symbol})</th>
                                  <th className="pb-2 font-bold min-w-[105px]">سعر المصنعية ({CURRENCIES[currency].symbol})</th>
                                  <th className="pb-2 font-bold min-w-[110px]">الإجمالي</th>
                                  {cat.categoryId === 'custom_client_items' && <th className="pb-2 font-bold">حذف</th>}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {cat.items.map((item) => (
                                  <tr key={item.id} className="hover:bg-slate-50/50">
                                    <td className="py-3 pl-2">
                                      <span className="font-bold text-slate-800 block">{item.title}</span>
                                      <ul className="text-[11px] text-slate-500 list-disc list-inside mt-0.5 space-y-0.5">
                                        {item.details.map((d, idx) => (
                                          <li key={idx}>{d}</li>
                                        ))}
                                      </ul>
                                    </td>

                                    {/* REQUIREMENT 4: EDITABLE QUANTITY CELL WITH NOTICE & RESET BUTTON */}
                                    <td className="py-3 pr-2 min-w-[190px]">
                                      <div
                                        className={`flex items-center border rounded-lg px-2 py-1 bg-white focus-within:border-[#003C69] max-w-[170px] ${
                                          item.isQuantityOverridden
                                            ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-300'
                                            : 'border-slate-200'
                                        }`}
                                      >
                                        <input
                                          type="number"
                                          step="0.1"
                                          value={item.quantity}
                                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                          className="w-full text-xs font-mono font-black text-right outline-none bg-transparent text-[#003C69]"
                                          title="يمكنك تعديل الكمية مباشرة حسب رغبتك"
                                        />
                                        <span className="text-[11px] font-bold text-slate-500 shrink-0 mr-1.5">
                                          {item.unit}
                                        </span>
                                      </div>

                                      {/* If user modified quantity: Show Warning Note & Reset Button */}
                                      {item.isQuantityOverridden && (
                                        <div className="mt-1.5 p-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-[10px] space-y-1 max-w-[210px]">
                                          <div className="flex items-center gap-1 font-semibold">
                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                            <span>تم تعديل الكمية حسب رغبة المستخدم</span>
                                          </div>
                                          <div className="flex items-center justify-between gap-1 text-[10px] text-slate-600 font-mono">
                                            <span>(الأصل: {formatNumber(item.calculatedQuantity, 1)} {item.unit})</span>
                                            <button
                                              type="button"
                                              onClick={() => handleResetQuantity(item.id)}
                                              className="inline-flex items-center gap-1 font-bold text-[#003C69] bg-white hover:bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded shadow-xs cursor-pointer transition-colors"
                                              title="إعادة ضبط الكمية للحسابات التلقائية"
                                            >
                                              <RotateCcw className="w-2.5 h-2.5 text-[#003C69]" />
                                              <span>إعادة الضبط</span>
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </td>

                                    {/* Editable Material Price */}
                                    <td className="py-3 font-mono whitespace-nowrap pr-2">
                                      <div className="flex items-center border border-slate-200 rounded px-1.5 py-1 bg-white focus-within:border-[#003C69] max-w-[100px]">
                                        <input
                                          type="number"
                                          placeholder="0"
                                          value={
                                            userPrices[item.id]?.material !== undefined
                                              ? userPrices[item.id].material ?? ''
                                              : item.materialUnitCost || ''
                                          }
                                          onChange={(e) => handlePriceChange(item.id, 'material', e.target.value)}
                                          className="w-full text-xs font-mono font-bold text-right outline-none bg-transparent"
                                        />
                                      </div>
                                    </td>

                                    {/* Editable Labor Price */}
                                    <td className="py-3 font-mono whitespace-nowrap pr-2">
                                      <div className="flex items-center border border-slate-200 rounded px-1.5 py-1 bg-white focus-within:border-[#003C69] max-w-[100px]">
                                        <input
                                          type="number"
                                          placeholder="0"
                                          value={
                                            userPrices[item.id]?.labor !== undefined
                                              ? userPrices[item.id].labor ?? ''
                                              : item.laborUnitCost || ''
                                          }
                                          onChange={(e) => handlePriceChange(item.id, 'labor', e.target.value)}
                                          className="w-full text-xs font-mono font-bold text-right outline-none bg-transparent"
                                        />
                                      </div>
                                    </td>

                                    {/* Total Item Cost */}
                                    <td className="py-3 font-mono font-black text-slate-900 whitespace-nowrap">
                                      {item.totalCost > 0 ? (
                                        formatCurrency(item.totalCost, currency)
                                      ) : (
                                        <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-sans font-normal">
                                          غير مسعّر (كمية فقط)
                                        </span>
                                      )}
                                    </td>

                                    {/* Delete Custom Item if custom */}
                                    {cat.categoryId === 'custom_client_items' && (
                                      <td className="py-3">
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveCustomItem(item.id)}
                                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                          title="حذف هذا البند"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Trade Pro-Tip for Homeowners */}
                          {cat.items.length > 0 && cat.items[0].tips && (
                            <div className="bg-emerald-50 border-r-4 border-emerald-600 p-3 rounded-lg text-xs text-emerald-900 flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold ml-1">توجيه هندسي واستلام:</span>
                                <span>{cat.items[0].tips}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: REQUIREMENT 3 - ISOLATED SINGLE TRADE DEEP CALCULATOR          */}
      {/* ========================================================================= */}
      {subTab === 'itemized' && (
        <SingleTradeCalculator currency={currency} />
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: 9-STAGE ENGINEERING INSPECTION GUIDE & CHECKLIST               */}
      {/* ========================================================================= */}
      {subTab === 'guide' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold mb-2 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>دليل الاستلام الهندسي للمالك العادي (خطوة بخطوة)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#003C69]">
                المراحل الهندسية الـ 9 لتشطيب الشقة واستلام كل مرحلة
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                التشطيب الناجح يبدأ بالترتيب الهندسي الصحيح. لا تدفع مستحقات أي صنايعي إلا بعد استلام بنوده وفق القوائم أدناه والتأكد من عدم وجود أخطاء مكلفة.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {FINISHING_STAGES.map((stage) => (
              <div
                key={stage.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <span className="text-xs font-bold text-[#B1A06D] block">
                      المرحلة رقم {stage.id}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-[#003C69]">
                      {stage.title}
                    </h3>
                    <span className="text-xs text-slate-500">{stage.subtitle}</span>
                  </div>
                  <div className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold self-start sm:self-auto font-mono">
                    المدة التقديرية: {stage.estimatedDuration}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {stage.description}
                </p>

                {/* Steps sequence */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#003C69]"></span>
                    <span>خطوات التنفيذ الهندسية بالترتيب:</span>
                  </h4>
                  <ol className="text-xs text-slate-600 space-y-1.5 pr-4 list-decimal list-inside leading-relaxed">
                    {stage.steps.map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ol>
                </div>

                {/* Owner Checklist */}
                <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>قائمة فحص واستلام المالك (قبل دفع الحساب):</span>
                  </h4>
                  <ul className="text-xs text-emerald-800 space-y-1.5 pr-2">
                    {stage.ownerChecklist.map((chk, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{chk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Common Mistakes */}
                <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>أخطاء شائعة احذر الوقوع فيها:</span>
                  </h4>
                  <ul className="text-xs text-rose-800 space-y-1.5 pr-2">
                    {stage.commonMistakes.map((mis, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold">✕</span>
                        <span>{mis}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cost Saving Tips */}
                <div className="bg-amber-50/60 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold ml-1">نصيحة ذهبية لترشيد التكلفة:</span>
                    <span>{stage.costSavingTips.join(' — ')}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
