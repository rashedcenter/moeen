import React, { useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import { CurrencyCode } from '../types';
import { formatCurrency, formatNumber, CURRENCIES } from '../data/currencies';
import {
  Building2,
  Layers,
  Paintbrush,
  SquareCode,
  Zap,
  Droplets,
  Grid,
  DoorOpen,
  Info,
  CheckCircle2,
  Calculator,
  RotateCcw,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface SingleTradeCalculatorProps {
  currency: CurrencyCode;
}

type TradeType =
  | 'masonry'
  | 'plaster'
  | 'paint'
  | 'tiles'
  | 'electrical'
  | 'plumbing'
  | 'gypsum'
  | 'carpentry';

export const SingleTradeCalculator: React.FC<SingleTradeCalculatorProps> = ({
  currency,
}) => {
  const [activeTrade, setActiveTrade] = useState<TradeType>('masonry');

  // ==========================================
  // 1. MASONRY STATE
  // ==========================================
  const [masWallLength, setMasWallLength] = useState<number>(20); // meters
  const [masWallHeight, setMasWallHeight] = useState<number>(2.85); // meters
  const [masWallThickness, setMasWallThickness] = useState<'12' | '25' | '20' | '10'>('12');
  const [masBrickType, setMasBrickType] = useState<'clay' | 'cement_solid' | 'aac'>('clay');
  const [masDoorsCount, setMasDoorsCount] = useState<number>(2); // 1x2.2m
  const [masWindowsCount, setMasWindowsCount] = useState<number>(2); // 1.2x1.2m
  const [masWastePercent, setMasWastePercent] = useState<number>(5);
  // Optional custom unit prices (0 if unpriced)
  const [masBrickThousandPrice, setMasBrickThousandPrice] = useState<number>(1900);
  const [masCementBagPrice, setMasCementBagPrice] = useState<number>(280);
  const [masSandM3Price, setMasSandM3Price] = useState<number>(220);
  const [masLaborThousandPrice, setMasLaborThousandPrice] = useState<number>(650);

  // Masonry Calculations:
  const masGrossArea = masWallLength * masWallHeight;
  const masOpeningsArea = masDoorsCount * (1.0 * 2.2) + masWindowsCount * (1.2 * 1.2);
  const masNetArea = Math.max(0.5, masGrossArea - masOpeningsArea);

  // Bricks per m2 based on thickness and type
  let masBricksPerM2 = 55;
  if (masBrickType === 'clay' || masBrickType === 'cement_solid') {
    if (masWallThickness === '25') masBricksPerM2 = 110;
    else if (masWallThickness === '20') masBricksPerM2 = 90;
    else if (masWallThickness === '10') masBricksPerM2 = 50;
    else masBricksPerM2 = 55; // 12cm half brick
  } else {
    // AAC blocks 60x20cm = 8.3 blocks per m2
    masBricksPerM2 = 8.33;
  }
  const masTotalBricks = Math.round(masNetArea * masBricksPerM2 * (1 + masWastePercent / 100));
  const masThousandsOfBricks = masTotalBricks / 1000;

  // Mortar calculations:
  // Per 1000 clay bricks: 3.5 bags cement + 0.60 m3 sand
  // Per 1000 solid cement bricks: 4.5 bags cement + 0.65 m3 sand
  const masCementBagsPer1000 = masBrickType === 'cement_solid' ? 4.5 : 3.5;
  const masSandM3Per1000 = masBrickType === 'cement_solid' ? 0.65 : 0.60;
  const masTotalCementBags = Math.round(masThousandsOfBricks * masCementBagsPer1000);
  const masTotalSandM3 = Math.round(masThousandsOfBricks * masSandM3Per1000 * 10) / 10;
  const masWaterLiters = Math.round(masThousandsOfBricks * 90);
  const masWallTiesCount = Math.round((masWallLength / 3.0) * (masWallHeight / 0.40));
  const masLintelsCount = masDoorsCount + masWindowsCount;

  const masMaterialCost =
    masThousandsOfBricks * (masBrickThousandPrice || 0) +
    masTotalCementBags * (masCementBagPrice || 0) +
    masTotalSandM3 * (masSandM3Price || 0) +
    masLintelsCount * 220;
  const masLaborCost = masThousandsOfBricks * (masLaborThousandPrice || 0);
  const masTotalCost = masMaterialCost + masLaborCost;

  // ==========================================
  // 2. PLASTERING STATE
  // ==========================================
  const [plsArea, setPlsArea] = useState<number>(150); // m2
  const [plsIncludeCeiling, setPlsIncludeCeiling] = useState<boolean>(true);
  const [plsCeilingArea, setPlsCeilingArea] = useState<number>(40);
  const [plsThicknessCm, setPlsThicknessCm] = useState<number>(2.0); // 2 cm
  const [plsCementBagPrice, setPlsCementBagPrice] = useState<number>(280);
  const [plsSandM3Price, setPlsSandM3Price] = useState<number>(230);
  const [plsLaborM2Price, setPlsLaborM2Price] = useState<number>(55);

  const plsTotalArea = plsArea + (plsIncludeCeiling ? plsCeilingArea : 0);
  // Spatter dash: 1 bag per 22 m2
  // Screeds & undercoat: 1 bag per (20 / plsThicknessCm * 0.67) = 1 bag per ~6.7m2 for 2cm
  const plsSpatterBags = Math.round(plsTotalArea / 22);
  const plsCoatBags = Math.round(plsTotalArea / (13.4 / plsThicknessCm));
  const plsTotalCementBags = plsSpatterBags + plsCoatBags;
  const plsTotalSandM3 = Math.round(plsTotalArea * (plsThicknessCm / 100) * 1.25 * 10) / 10;
  const plsFiberMeshRolls = Math.max(1, Math.round(plsTotalArea / 60));
  const plsCornerBeads = Math.max(4, Math.round(plsTotalArea / 12));
  const plsAdibondLiters = Math.max(2, Math.round(plsTotalArea / 30));

  const plsMaterialCost =
    plsTotalCementBags * (plsCementBagPrice || 0) +
    plsTotalSandM3 * (plsSandM3Price || 0) +
    plsFiberMeshRolls * 150 +
    plsCornerBeads * 25 +
    plsAdibondLiters * 65;
  const plsLaborCost = plsTotalArea * (plsLaborM2Price || 0);
  const plsTotalCost = plsMaterialCost + plsLaborCost;

  // ==========================================
  // 3. PAINTING STATE
  // ==========================================
  const [pntArea, setPntArea] = useState<number>(180); // m2
  const [pntPuttyCoats, setPntPuttyCoats] = useState<number>(3); // 2, 3, or 4 coats
  const [pntFinishBrand, setPntFinishBrand] = useState<'jotun' | 'glc' | 'sipes' | 'caparol'>('jotun');
  const [pntPrimerPrice, setPntPrimerPrice] = useState<number>(450);
  const [pntPuttyBagPrice, setPntPuttyBagPrice] = useState<number>(220);
  const [pntFinishBucketPrice, setPntFinishBucketPrice] = useState<number>(1450);
  const [pntLaborM2Price, setPntLaborM2Price] = useState<number>(45);

  const pntPrimerBuckets = Math.max(1, Math.round(pntArea / 110)); // 14L primer covers ~110m2
  // Putty bag (20kg): 1 coat ~ 55m2, 2 coats ~ 30m2, 3 coats ~ 20m2, 4 coats ~ 15m2
  const pntPuttyCoverage = pntPuttyCoats === 2 ? 30 : pntPuttyCoats === 3 ? 20 : 15;
  const pntPuttyBags = Math.max(2, Math.round(pntArea / pntPuttyCoverage));
  const pntUndercoatBuckets = Math.max(1, Math.round(pntArea / 100));
  const pntFinishBuckets = Math.max(2, Math.round(pntArea / 75)); // 14L finish covers ~75m2 in 2 coats
  const pntTapeRolls = Math.max(2, Math.round(pntArea / 40));

  const pntMaterialCost =
    pntPrimerBuckets * (pntPrimerPrice || 0) +
    pntPuttyBags * (pntPuttyBagPrice || 0) +
    pntUndercoatBuckets * 550 +
    pntFinishBuckets * (pntFinishBucketPrice || 0) +
    pntTapeRolls * 35 +
    250; // brushes, rollers, sandpaper
  const pntLaborCost = pntArea * (pntLaborM2Price || 0);
  const pntTotalCost = pntMaterialCost + pntLaborCost;

  // ==========================================
  // 4. TILES & FLOORING STATE
  // ==========================================
  const [tilFloorArea, setTilFloorArea] = useState<number>(80);
  const [tilWallTilesArea, setTilWallTilesArea] = useState<number>(45); // bathrooms/kitchens
  const [tilType, setTilType] = useState<'ceramic' | 'porcelain' | 'marble' | 'hdf'>('porcelain');
  const [tilWastePercent, setTilWastePercent] = useState<number>(10);
  const [tilSandBedThickness, setTilSandBedThickness] = useState<number>(8); // cm
  const [tilTileM2Price, setTilTileM2Price] = useState<number>(380);
  const [tilCementPrice, setTilCementPrice] = useState<number>(280);
  const [tilLaborM2Price, setTilLaborM2Price] = useState<number>(75);

  const tilTotalNetArea = tilFloorArea + tilWallTilesArea;
  const tilTotalGrossArea = Math.round(tilTotalNetArea * (1 + tilWastePercent / 100));
  const tilSandBedM3 = Math.round(tilFloorArea * (tilSandBedThickness / 100) * 10) / 10;
  // If porcelain: adhesive bags (20kg covers ~4.5 m2). If ceramic: cement bags (~1 bag per 5m2)
  const tilAdhesiveBags = tilType === 'porcelain' ? Math.round(tilTotalGrossArea / 4.5) : 0;
  const tilCementBags = tilType === 'porcelain' ? Math.round(tilFloorArea / 15) : Math.round(tilTotalGrossArea / 5.0);
  const tilGroutBags = Math.max(2, Math.round(tilTotalGrossArea / 25));
  const tilClipsCount = Math.round(tilTotalGrossArea * 18);

  const tilMaterialCost =
    tilTotalGrossArea * (tilTileM2Price || 0) +
    tilSandBedM3 * 220 +
    tilCementBags * (tilCementPrice || 0) +
    tilAdhesiveBags * 190 +
    tilGroutBags * 110 +
    (tilType === 'porcelain' ? 350 : 0); // adibond
  const tilLaborCost = tilTotalGrossArea * (tilLaborM2Price || 0);
  const tilTotalCost = tilMaterialCost + tilLaborCost;

  // ==========================================
  // 5. ELECTRICAL STATE
  // ==========================================
  const [elecRooms, setElecRooms] = useState<number>(3);
  const [elecBaths, setElecBaths] = useState<number>(2);
  const [elecKitchens, setElecKitchens] = useState<number>(1);
  const [elecACCount, setElecACCount] = useState<number>(3);
  const [elecTier, setElecTier] = useState<'standard' | 'premium' | 'smart'>('premium');

  const elecBoxes = elecRooms * 16 + elecBaths * 5 + elecKitchens * 14 + 16;
  const elecPipesMeters = elecBoxes * 4.5;
  const elecWireRolls1_5 = Math.max(2, Math.round((elecRooms * 1.2)));
  const elecWireRolls2_5 = Math.max(3, Math.round((elecRooms * 1.5 + elecKitchens * 2)));
  const elecWireRolls4_0 = Math.max(2, Math.round(elecKitchens * 1.5 + elecBaths * 0.8));
  const elecWireRolls6_0 = Math.max(1, elecACCount);
  const elecBreakersCount = elecRooms * 2 + elecBaths * 1 + elecKitchens * 3 + elecACCount + 4;

  const elecMaterialCost =
    elecBoxes * 45 +
    elecPipesMeters * 18 +
    (elecWireRolls1_5 * 1450 +
      elecWireRolls2_5 * 2250 +
      elecWireRolls4_0 * 3400 +
      elecWireRolls6_0 * 5100) +
    3800 + // panel + RCCB
    elecBoxes * (elecTier === 'smart' ? 220 : elecTier === 'premium' ? 110 : 65);
  const elecLaborCost = elecBoxes * 95;
  const elecTotalCost = elecMaterialCost + elecLaborCost;

  // ==========================================
  // 6. PLUMBING & WATERPROOFING STATE
  // ==========================================
  const [plmBaths, setPlmBaths] = useState<number>(2);
  const [plmKitchens, setPlmKitchens] = useState<number>(1);
  const [plmIncludeWaterproof, setPlmIncludeWaterproof] = useState<boolean>(true);
  const [plmBrand, setPlmBrand] = useState<'elsherif' | 'aquatherm' | 'banninger'>('elsherif');

  const plmWaterPoints = plmBaths * 4 + plmKitchens * 3 + 2;
  const plmSupplyMeters = plmWaterPoints * 6.5;
  const plmDrainMeters = plmBaths * 18 + plmKitchens * 14;
  const plmWaterproofArea = plmBaths * 6.5 * 1.35 + plmKitchens * 9.0 * 1.25;
  const plmSikatopPails = Math.max(2, Math.round(plmWaterproofArea / 12));

  const plmMaterialCost =
    plmSupplyMeters * (plmBrand === 'aquatherm' ? 140 : 105) +
    plmDrainMeters * 90 +
    (plmIncludeWaterproof ? plmSikatopPails * 1150 : 0) +
    (plmBaths * 9500 + plmKitchens * 4500); // fixtures baseline
  const plmLaborCost = (plmBaths + plmKitchens) * 3500;
  const plmTotalCost = plmMaterialCost + plmLaborCost;

  // ==========================================
  // 7. GYPSUM CEILING STATE
  // ==========================================
  const [gypArea, setGypArea] = useState<number>(50); // m2
  const [gypDesign, setGypDesign] = useState<'flat' | 'perimeter' | 'simple'>('perimeter');
  const [gypSheetPrice, setGypSheetPrice] = useState<number>(240);
  const [gypLaborM2Price, setGypLaborM2Price] = useState<number>(90);

  const gypSheetsCount = Math.ceil((gypArea * (gypDesign === 'flat' ? 1.15 : 0.85)) / 2.88);
  const gypOmegaMeters = Math.round(gypArea * 2.8);
  const gypChannelMeters = Math.round(gypArea * 2.2);
  const gypMeshTapeRolls = Math.max(1, Math.round(gypArea / 40));
  const gypJointCompoundBags = Math.max(2, Math.round(gypArea / 22));

  const gypMaterialCost =
    gypSheetsCount * (gypSheetPrice || 0) +
    gypOmegaMeters * 35 +
    gypChannelMeters * 30 +
    gypMeshTapeRolls * 110 +
    gypJointCompoundBags * 220 +
    300; // screws & hangers
  const gypLaborCost = gypArea * (gypLaborM2Price || 0);
  const gypTotalCost = gypMaterialCost + gypLaborCost;

  // ==========================================
  // 8. DOORS & WINDOWS STATE
  // ==========================================
  const [drCount, setDrCount] = useState<number>(5);
  const [drArmoredDoor, setDrArmoredDoor] = useState<boolean>(true);
  const [winArea, setWinArea] = useState<number>(14); // m2
  const [winType, setWinType] = useState<'bs_small' | 'bs_large' | 'jumbo' | 'upvc'>('jumbo');

  const winM2Price =
    winType === 'upvc'
      ? 3800
      : winType === 'jumbo'
      ? 2600
      : winType === 'bs_large'
      ? 1950
      : 1450;
  const drPrice = 4200; // wood door + subframe + lock + paint
  const drArmoredPrice = 11500;

  const drWinMaterialCost =
    drCount * drPrice + (drArmoredDoor ? drArmoredPrice : 0) + winArea * winM2Price;
  const drWinLaborCost = drCount * 500 + winArea * 150;
  const drWinTotalCost = drWinMaterialCost + drWinLaborCost;

  const tradesList: { id: TradeType; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'masonry',
      label: 'أعمال المباني بالطوب',
      icon: <Building2 className="w-5 h-5" />,
      desc: 'حساب عدد الطوب، شكاير الأسمنت، الرمل، الكانات والأعتاب',
    },
    {
      id: 'plaster',
      label: 'أعمال المحارة واللياسة',
      icon: <Layers className="w-5 h-5" />,
      desc: 'طرطشة، بؤج وأوتار، بطانة، شبك فايبر، زوايا وأديبوند',
    },
    {
      id: 'paint',
      label: 'أعمال الدهانات والمعجون',
      icon: <Paintbrush className="w-5 h-5" />,
      desc: 'سيلر مائي، معجون، بطانة، دهان نهائي وصنفرة ليزر',
    },
    {
      id: 'tiles',
      label: 'أعمال السيراميك والبورسلين',
      icon: <SquareCode className="w-5 h-5" />,
      desc: 'أرضيات وحوائط، رمل ردم، مونة، لاصق C2TE وروبة',
    },
    {
      id: 'electrical',
      label: 'أعمال تأسيس وتشطيب الكهرباء',
      icon: <Zap className="w-5 h-5" />,
      desc: 'خراطيم، علب ماجيك، بكرات سلك، لوحة قواطع ومفاتيح',
    },
    {
      id: 'plumbing',
      label: 'أعمال السباكة والعزل المائي',
      icon: <Droplets className="w-5 h-5" />,
      desc: 'مواسير PPR، صرف PVC، عزل سيكاتوب وأطقم صحية',
    },
    {
      id: 'gypsum',
      label: 'أعمال الجبسوم بورد والأسقف',
      icon: <Grid className="w-5 h-5" />,
      desc: 'ألواح كناوف، شاسيه صاج، أوميجا، تيش ومعجون فواصل',
    },
    {
      id: 'carpentry',
      label: 'أعمال الأبواب والشبابيك والألوميتال',
      icon: <DoorOpen className="w-5 h-5" />,
      desc: 'باب مصفح، أبواب غرف موسكي، ألوميتال جامبو أو UPVC',
    },
  ];

  useSEO({
    title: 'حاسبة البنود المنفردة للإنشاءات - معين',
    description: 'حساب دقيق لبنود وتكاليف الأعمال الهندسية والإنشائية المحددة بشكل منفصل.',
    keywords: 'بنود إنشائية, حساب تكلفة بند, معين البناء, حاسبة هندسية'
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#003C69]/10 text-[#003C69] rounded-full text-xs font-bold mb-2">
            <Calculator className="w-3.5 h-3.5 text-[#B1A06D]" />
            <span>حاسبة تفاصيل البند المنفرد بدقة متناهية</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#003C69]">
            حاسبة البنود المستقلة وفق الكود والمواصفات القياسية
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            اختر أي بند أدناه لإدخال أبعاده ومواصفاته التفصيلية؛ يُحسب لك عدد المواد والشكاير والمصنعيات خطوة بخطوة مع إمكانية إدخال الأسعار بحرية أو تركها لحساب الكميات فقط.
          </p>
        </div>
      </div>

      {/* Trade Selector Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {tradesList.map((t) => {
          const isActive = activeTrade === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTrade(t.id)}
              className={`p-3 sm:p-4 rounded-xl text-right transition-all border flex flex-col justify-between gap-2 cursor-pointer ${
                isActive
                  ? 'bg-[#003C69] text-white border-[#003C69] shadow-md scale-[1.02]'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-white/15 text-[#B1A06D]' : 'bg-slate-100 text-[#003C69]'
                  }`}
                >
                  {t.icon}
                </div>
                {isActive && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00B050] text-white">نشط</span>}
              </div>
              <div>
                <span className="font-bold text-xs sm:text-sm block">{t.label}</span>
                <span className={`text-[10px] line-clamp-1 mt-0.5 ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
                  {t.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. MASONRY DEEP CALCULATOR                                                */}
      {/* ========================================================================= */}
      {activeTrade === 'masonry' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Inputs Column */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-[#003C69] flex items-center gap-2 border-b pb-2">
              <Building2 className="w-5 h-5 text-[#B1A06D]" />
              <span>مدخلات ومقاسات جدران المباني</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">طول الجدار (متر):</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={masWallLength}
                  onChange={(e) => setMasWallLength(Math.max(0.1, Number(e.target.value)))}
                  className="w-full border rounded-lg p-2 text-sm font-bold font-mono text-center bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الارتفاع الصافي (متر):</label>
                <input
                  type="number"
                  min="1"
                  step="0.05"
                  value={masWallHeight}
                  onChange={(e) => setMasWallHeight(Math.max(0.5, Number(e.target.value)))}
                  className="w-full border rounded-lg p-2 text-sm font-bold font-mono text-center bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سمك الحائط:</label>
                <select
                  value={masWallThickness}
                  onChange={(e) => setMasWallThickness(e.target.value as any)}
                  className="w-full border rounded-lg p-2 text-xs font-bold bg-slate-50"
                >
                  <option value="12">12 سم (نصف طوبة — قواطع غرف)</option>
                  <option value="25">25 سم (طوبة كاملة — حوائط خارجية)</option>
                  <option value="20">20 سم (طوب مفرغ عازل)</option>
                  <option value="10">10 سم (قواطع حمامات خفيفة)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع الطوب:</label>
                <select
                  value={masBrickType}
                  onChange={(e) => setMasBrickType(e.target.value as any)}
                  className="w-full border rounded-lg p-2 text-xs font-bold bg-slate-50"
                >
                  <option value="clay">طوب أحمر طفلي مفرغ (25×12×6 سم)</option>
                  <option value="cement_solid">طوب أسمنتي مصمت (عازل للرطوبة)</option>
                  <option value="aac">طوب خفيف AAC عازل (سيبوريكس)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عدد الأبواب (خصم 2.2 م²):</label>
                <input
                  type="number"
                  min="0"
                  value={masDoorsCount}
                  onChange={(e) => setMasDoorsCount(Math.max(0, Number(e.target.value)))}
                  className="w-full border rounded-lg p-2 text-xs font-bold font-mono text-center bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عدد الشبابيك (خصم 1.44 م²):</label>
                <input
                  type="number"
                  min="0"
                  value={masWindowsCount}
                  onChange={(e) => setMasWindowsCount(Math.max(0, Number(e.target.value)))}
                  className="w-full border rounded-lg p-2 text-xs font-bold font-mono text-center bg-slate-50"
                />
              </div>
            </div>

            {/* Optional Unit Prices */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">أسعار الوحدة الاسترشادية (اختياري):</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <label className="text-slate-500 block mb-0.5">سعر ألف الطوب:</label>
                  <input
                    type="number"
                    value={masBrickThousandPrice || ''}
                    placeholder="0"
                    onChange={(e) => setMasBrickThousandPrice(Number(e.target.value))}
                    className="w-full border rounded p-1 font-mono font-bold text-right"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">سعر كيس الأسمنت:</label>
                  <input
                    type="number"
                    value={masCementBagPrice || ''}
                    placeholder="0"
                    onChange={(e) => setMasCementBagPrice(Number(e.target.value))}
                    className="w-full border rounded p-1 font-mono font-bold text-right"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">سعر متر الرمل:</label>
                  <input
                    type="number"
                    value={masSandM3Price || ''}
                    placeholder="0"
                    onChange={(e) => setMasSandM3Price(Number(e.target.value))}
                    className="w-full border rounded p-1 font-mono font-bold text-right"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">مصنعية البناء/ألف:</label>
                  <input
                    type="number"
                    value={masLaborThousandPrice || ''}
                    placeholder="0"
                    onChange={(e) => setMasLaborThousandPrice(Number(e.target.value))}
                    className="w-full border rounded p-1 font-mono font-bold text-right"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="font-extrabold text-[#003C69] text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#00B050]" />
                  <span>نتائج حصر كميات أعمال المباني بالتفصيل:</span>
                </h4>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  صافي المسطح: {formatNumber(masNetArea, 2)} م²
                </span>
              </div>

              {/* Quantities Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-bold block mb-1">إجمالي عدد الطوب:</span>
                  <span className="text-xl font-black text-emerald-900 font-mono block">
                    {masTotalBricks.toLocaleString('ar-EG')} طوبة
                  </span>
                  <span className="text-[10px] text-emerald-700">
                    ({formatNumber(masThousandsOfBricks, 2)} ألف طوبة شامل 5% هالك)
                  </span>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                  <span className="text-[11px] text-blue-800 font-bold block mb-1">أسمنت مونة البناء:</span>
                  <span className="text-xl font-black text-blue-900 font-mono block">
                    {masTotalCementBags} كيس
                  </span>
                  <span className="text-[10px] text-blue-700">
                    ({formatNumber((masTotalCementBags * 50) / 1000, 2)} طن أسمنت بورتلاندي)
                  </span>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                  <span className="text-[11px] text-amber-800 font-bold block mb-1">رمل حرش مفلتر:</span>
                  <span className="text-xl font-black text-amber-900 font-mono block">
                    {masTotalSandM3} م³
                  </span>
                  <span className="text-[10px] text-amber-700">
                    (نظيف خالي من الطفلة والأملاح)
                  </span>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200">
                  <span className="text-[11px] text-purple-800 font-bold block mb-1">كانات تشريك مجلفنة:</span>
                  <span className="text-xl font-black text-purple-900 font-mono block">
                    {masWallTiesCount} كانة
                  </span>
                  <span className="text-[10px] text-purple-700">
                    (تثبيت مع الأعمدة كل 3 مداميك)
                  </span>
                </div>

                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200">
                  <span className="text-[11px] text-indigo-800 font-bold block mb-1">أعتاب خرسانية مسلحة:</span>
                  <span className="text-xl font-black text-indigo-900 font-mono block">
                    {masLintelsCount} عتب
                  </span>
                  <span className="text-[10px] text-indigo-700">
                    (ركوب 20 سم من كل طرف للفتحة)
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-700 font-bold block mb-1">مياه الخلط والرش:</span>
                  <span className="text-xl font-black text-slate-800 font-mono block">
                    {masWaterLiters} لتر
                  </span>
                  <span className="text-[10px] text-slate-500">
                    (رش الطوب قبل وبعد البناء 3 أيام)
                  </span>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 block">التكلفة التقديرية لبند المباني:</span>
                  <span className="text-2xl font-black text-[#003C69] font-mono">
                    {masTotalCost > 0 ? formatCurrency(masTotalCost, currency) : 'كميات فقط (بدون أسعار)'}
                  </span>
                </div>
                <div className="flex gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">الخامات:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(masMaterialCost, currency)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">المصنعية:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(masLaborCost, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Engineering Pro Tips */}
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-950 space-y-1">
                <span className="font-bold flex items-center gap-1 text-sky-800">
                  <Info className="w-4 h-4" />
                  أصول الصنعة والاستلام لبند المباني (الكود المصري):
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-sky-900 pr-1">
                  <li>رش الطوب بالمياه حتى التشبع التام قبل وضعه في المونة، لمنع سحب مياه الأسمنت واحتراق المونة.</li>
                  <li>بناء مدماك القد ومراجعته بالزاوية القائمة وميزان الخيط لضمان استقامة الغرف وتربيعها 90 درجة.</li>
                  <li>استخدام كانات حديد مجلفنة لتثبيت المباني مع الخرسانات كل 40 سم ارتفاع لتفادي الشروخ الفاصلة.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PLASTERING DEEP CALCULATOR                                             */}
      {/* ========================================================================= */}
      {activeTrade === 'plaster' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-[#003C69] flex items-center gap-2 border-b pb-2">
              <Layers className="w-5 h-5 text-stone-600" />
              <span>مدخلات ومقاسات المحارة واللياسة</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">مسطح محارة الحوائط (م²):</label>
              <input
                type="number"
                min="1"
                value={plsArea}
                onChange={(e) => setPlsArea(Math.max(1, Number(e.target.value)))}
                className="w-full border rounded-lg p-2 text-sm font-bold font-mono text-center bg-slate-50"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border">
              <span className="text-xs font-bold text-slate-700">هل يشمل محارة الأسقف الخرسانية؟</span>
              <input
                type="checkbox"
                checked={plsIncludeCeiling}
                onChange={(e) => setPlsIncludeCeiling(e.target.checked)}
                className="w-4 h-4 accent-[#003C69] cursor-pointer"
              />
            </div>

            {plsIncludeCeiling && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مسطح محارة الأسقف (م²):</label>
                <input
                  type="number"
                  min="0"
                  value={plsCeilingArea}
                  onChange={(e) => setPlsCeilingArea(Math.max(0, Number(e.target.value)))}
                  className="w-full border rounded-lg p-2 text-sm font-bold font-mono text-center bg-slate-50"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">متوسط سمك المحارة (سم):</label>
              <input
                type="number"
                step="0.2"
                min="1.0"
                max="4.0"
                value={plsThicknessCm}
                onChange={(e) => setPlsThicknessCm(Math.max(1.0, Number(e.target.value)))}
                className="w-full border rounded-lg p-2 text-sm font-bold font-mono text-center bg-slate-50"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">أسعار الوحدة (اختياري):</span>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <label className="text-slate-500 block mb-0.5">كيس الأسمنت:</label>
                  <input
                    type="number"
                    value={plsCementBagPrice || ''}
                    placeholder="0"
                    onChange={(e) => setPlsCementBagPrice(Number(e.target.value))}
                    className="w-full border rounded p-1 font-mono font-bold text-right"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">متر الرمل:</label>
                  <input
                    type="number"
                    value={plsSandM3Price || ''}
                    placeholder="0"
                    onChange={(e) => setPlsSandM3Price(Number(e.target.value))}
                    className="w-full border rounded p-1 font-mono font-bold text-right"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">مصنعية م²:</label>
                  <input
                    type="number"
                    value={plsLaborM2Price || ''}
                    placeholder="0"
                    onChange={(e) => setPlsLaborM2Price(Number(e.target.value))}
                    className="w-full border rounded p-1 font-mono font-bold text-right"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="font-extrabold text-[#003C69] text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#00B050]" />
                  <span>نتائج حصر أعمال المحارة (بؤج وأوتار):</span>
                </h4>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  إجمالي المسطح: {plsTotalArea} م²
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                  <span className="text-[11px] text-blue-800 font-bold block mb-1">إجمالي شكاير الأسمنت:</span>
                  <span className="text-xl font-black text-blue-900 font-mono block">
                    {plsTotalCementBags} كيس
                  </span>
                  <span className="text-[10px] text-blue-700">
                    ({plsSpatterBags} طرطشة + {plsCoatBags} بطانة)
                  </span>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                  <span className="text-[11px] text-amber-800 font-bold block mb-1">رمل محارة ناعم مفلتر:</span>
                  <span className="text-xl font-black text-amber-900 font-mono block">
                    {plsTotalSandM3} م³
                  </span>
                  <span className="text-[10px] text-amber-700">
                    (مصفى بالهزاز لمنع الكرات الحجرية)
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-bold block mb-1">لفات شبك فايبر 50م:</span>
                  <span className="text-xl font-black text-emerald-900 font-mono block">
                    {plsFiberMeshRolls} لفة
                  </span>
                  <span className="text-[10px] text-emerald-700">
                    (عند فواصل الطوب والخرسانات)
                  </span>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200">
                  <span className="text-[11px] text-purple-800 font-bold block mb-1">زوايا فلبي معدنية:</span>
                  <span className="text-xl font-black text-purple-900 font-mono block">
                    {plsCornerBeads} زاوية
                  </span>
                  <span className="text-[10px] text-purple-700">
                    (لحماية النواصي والأعتاب من الصدمات)
                  </span>
                </div>

                <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200">
                  <span className="text-[11px] text-sky-800 font-bold block mb-1">أديبوند 65 للطرطشة:</span>
                  <span className="text-xl font-black text-sky-900 font-mono block">
                    {plsAdibondLiters} لتر
                  </span>
                  <span className="text-[10px] text-sky-700">
                    (يخلط مع ماء الطرطشة لزيادة التماسك)
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-700 font-bold block mb-1">وزن الأسمنت الكلي:</span>
                  <span className="text-xl font-black text-slate-800 font-mono block">
                    {formatNumber((plsTotalCementBags * 50) / 1000, 2)} طن
                  </span>
                  <span className="text-[10px] text-slate-500">
                    (أسمنت بورتلاندي رتبة 42.5N)
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 block">التكلفة التقديرية لبند المحارة:</span>
                  <span className="text-2xl font-black text-[#003C69] font-mono">
                    {plsTotalCost > 0 ? formatCurrency(plsTotalCost, currency) : 'حصر كميات فقط'}
                  </span>
                </div>
                <div className="flex gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">الخامات:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(plsMaterialCost, currency)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">المصنعية:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(plsLaborCost, currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PAINTING DEEP CALCULATOR                                               */}
      {/* ========================================================================= */}
      {activeTrade === 'paint' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-[#003C69] flex items-center gap-2 border-b pb-2">
              <Paintbrush className="w-5 h-5 text-rose-500" />
              <span>مدخلات مسطحات ومواصفات الدهانات</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">مسطح الدهان الكلي (م²):</label>
              <input
                type="number"
                min="1"
                value={pntArea}
                onChange={(e) => setPntArea(Math.max(1, Number(e.target.value)))}
                className="w-full border rounded-lg p-2 text-sm font-bold font-mono text-center bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عدد سكاكين المعجون:</label>
                <select
                  value={pntPuttyCoats}
                  onChange={(e) => setPntPuttyCoats(Number(e.target.value))}
                  className="w-full border rounded-lg p-2 text-xs font-bold bg-slate-50"
                >
                  <option value="2">سكينتين معجون (اقتصادي)</option>
                  <option value="3">3 سكاكين معجون (قياسي ناعم)</option>
                  <option value="4">4 سكاكين معجون (VIP فائق النعومة)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ماركة التشطيب النهائي:</label>
                <select
                  value={pntFinishBrand}
                  onChange={(e) => setPntFinishBrand(e.target.value as any)}
                  className="w-full border rounded-lg p-2 text-xs font-bold bg-slate-50"
                >
                  <option value="jotun">جوتن فينوماستيك ناعم / ماي هوم</option>
                  <option value="glc">GLC 7070 أو Daytone نص لمعة</option>
                  <option value="sipes">سايبس 700 / فاشون ناعم</option>
                  <option value="caparol">كابارول ألماني فاخر</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">أسعار الخامات والمصنعية (اختياري):</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <label className="text-slate-500 block mb-0.5">بستلة السيلر المائي:</label>
                  <input
                    type="number"
                    value={pntPrimerPrice || ''}
                    placeholder="0"
                    onChange={(e) => setPntPrimerPrice(Number(e.target.value))}
                    className="w-full border rounded p-1 font-mono font-bold text-right"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">شكارة المعجون الناعم:</label>
                  <input
                    type="number"
                    value={pntPuttyBagPrice || ''}
                    placeholder="0"
                    onChange={(e) => setPntPuttyBagPrice(Number(e.target.value))}
                    className="w-full border rounded p-1 font-mono font-bold text-right"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">بستلة الفينيش النهائي:</label>
                  <input
                    type="number"
                    value={pntFinishBucketPrice || ''}
                    placeholder="0"
                    onChange={(e) => setPntFinishBucketPrice(Number(e.target.value))}
                    className="w-full border rounded p-1 font-mono font-bold text-right"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">مصنعية م² دهان:</label>
                  <input
                    type="number"
                    value={pntLaborM2Price || ''}
                    placeholder="0"
                    onChange={(e) => setPntLaborM2Price(Number(e.target.value))}
                    className="w-full border rounded p-1 font-mono font-bold text-right"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="font-extrabold text-[#003C69] text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#00B050]" />
                  <span>نتائج حصر مواد ومستلزمات الدهانات:</span>
                </h4>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  المسطح: {pntArea} م²
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200">
                  <span className="text-[11px] text-sky-800 font-bold block mb-1">بستلات سيلر مائي عازل:</span>
                  <span className="text-xl font-black text-sky-900 font-mono block">
                    {pntPrimerBuckets} بستلة
                  </span>
                  <span className="text-[10px] text-sky-700">(سعة 14-16 لتر بعد التخفيف)</span>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                  <span className="text-[11px] text-amber-800 font-bold block mb-1">شكاير معجون ناعم:</span>
                  <span className="text-xl font-black text-amber-900 font-mono block">
                    {pntPuttyBags} شكارة
                  </span>
                  <span className="text-[10px] text-amber-700">({pntPuttyCoats} سكاكين معجون)</span>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-bold block mb-1">بستلات دهان نهائي:</span>
                  <span className="text-xl font-black text-emerald-900 font-mono block">
                    {pntFinishBuckets} بستلة
                  </span>
                  <span className="text-[10px] text-emerald-700">(وجهين تشطيب قابل للغسيل)</span>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200">
                  <span className="text-[11px] text-purple-800 font-bold block mb-1">بستلات بلاستيك بطانة:</span>
                  <span className="text-xl font-black text-purple-900 font-mono block">
                    {pntUndercoatBuckets} بستلة
                  </span>
                  <span className="text-[10px] text-purple-700">(وجه بطانة مط قبل الفينيش)</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-700 font-bold block mb-1">بكر لزق تيب وشطرطون:</span>
                  <span className="text-xl font-black text-slate-800 font-mono block">
                    {pntTapeRolls} بكرة
                  </span>
                  <span className="text-[10px] text-slate-500">(حماية الوزرات والألوميتال)</span>
                </div>

                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200">
                  <span className="text-[11px] text-rose-800 font-bold block mb-1">مهمات الصنفرة والرول:</span>
                  <span className="text-xl font-black text-rose-900 font-mono block">
                    طقم كامل
                  </span>
                  <span className="text-[10px] text-rose-700">(صنفرة ليزر، رولات، كفوف معجون)</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 block">إجمالي تكلفة بند الدهانات:</span>
                  <span className="text-2xl font-black text-[#003C69] font-mono">
                    {pntTotalCost > 0 ? formatCurrency(pntTotalCost, currency) : 'حصر كميات فقط'}
                  </span>
                </div>
                <div className="flex gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">الخامات:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(pntMaterialCost, currency)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">المصنعية:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(pntLaborCost, currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TILES & FLOORING DEEP CALCULATOR                                       */}
      {/* ========================================================================= */}
      {activeTrade === 'tiles' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-[#003C69] flex items-center gap-2 border-b pb-2">
              <SquareCode className="w-5 h-5 text-emerald-600" />
              <span>مدخلات ومقاسات السيراميك والبورسلين</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مساحة الأرضية (م²):</label>
                <input
                  type="number"
                  min="1"
                  value={tilFloorArea}
                  onChange={(e) => setTilFloorArea(Math.max(1, Number(e.target.value)))}
                  className="w-full border rounded-lg p-2 text-sm font-bold font-mono text-center bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">حوائط حمام/مطبخ (م²):</label>
                <input
                  type="number"
                  min="0"
                  value={tilWallTilesArea}
                  onChange={(e) => setTilWallTilesArea(Math.max(0, Number(e.target.value)))}
                  className="w-full border rounded-lg p-2 text-sm font-bold font-mono text-center bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع البلاط:</label>
                <select
                  value={tilType}
                  onChange={(e) => setTilType(e.target.value as any)}
                  className="w-full border rounded-lg p-2 text-xs font-bold bg-slate-50"
                >
                  <option value="porcelain">بورسلين 60×120 (يحتاج لاصق C2TE)</option>
                  <option value="ceramic">سيراميك فرز أول (مونة أسمنتية)</option>
                  <option value="marble">رخام طبيعي فاخر</option>
                  <option value="hdf">باركيه ألماني HDF</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نسبة الهالك والوزرات:</label>
                <select
                  value={tilWastePercent}
                  onChange={(e) => setTilWastePercent(Number(e.target.value))}
                  className="w-full border rounded-lg p-2 text-xs font-bold bg-slate-50"
                >
                  <option value="8">8% (تركيب عدل بسيط)</option>
                  <option value="10">10% (قياسي مع وزرات)</option>
                  <option value="15">15% (تركيب سمبوكسة أو زوايا)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">سمك فرشة رمل الردم (سم):</label>
              <input
                type="number"
                min="4"
                max="15"
                value={tilSandBedThickness}
                onChange={(e) => setTilSandBedThickness(Math.max(4, Number(e.target.value)))}
                className="w-full border rounded-lg p-2 text-sm font-bold font-mono text-center bg-slate-50"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">أسعار الوحدة (اختياري):</span>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <label className="text-slate-500 block mb-0.5">سعر متر البلاط:</label>
                  <input
                    type="number"
                    value={tilTileM2Price || ''}
                    placeholder="0"
                    onChange={(e) => setTilTileM2Price(Number(e.target.value))}
                    className="w-full border rounded p-1 font-mono font-bold text-right"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">كيس الأسمنت:</label>
                  <input
                    type="number"
                    value={tilCementPrice || ''}
                    placeholder="0"
                    onChange={(e) => setTilCementPrice(Number(e.target.value))}
                    className="w-full border rounded p-1 font-mono font-bold text-right"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">مصنعية م²:</label>
                  <input
                    type="number"
                    value={tilLaborM2Price || ''}
                    placeholder="0"
                    onChange={(e) => setTilLaborM2Price(Number(e.target.value))}
                    className="w-full border rounded p-1 font-mono font-bold text-right"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="font-extrabold text-[#003C69] text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#00B050]" />
                  <span>نتائج حصر مواد الأرضيات والسيراميك:</span>
                </h4>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  الصافي: {tilTotalNetArea} م²
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-bold block mb-1">كمية البلاط للشراء:</span>
                  <span className="text-xl font-black text-emerald-900 font-mono block">
                    {tilTotalGrossArea} م²
                  </span>
                  <span className="text-[10px] text-emerald-700">(شامل {tilWastePercent}% هالك ووزرات)</span>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                  <span className="text-[11px] text-amber-800 font-bold block mb-1">رمل ردم نظيف:</span>
                  <span className="text-xl font-black text-amber-900 font-mono block">
                    {tilSandBedM3} م³
                  </span>
                  <span className="text-[10px] text-amber-700">(فرشة تسوية سمك {tilSandBedThickness} سم)</span>
                </div>

                {tilType === 'porcelain' ? (
                  <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200">
                    <span className="text-[11px] text-purple-800 font-bold block mb-1">شكاير لاصق بورسلين:</span>
                    <span className="text-xl font-black text-purple-900 font-mono block">
                      {tilAdhesiveBags} شكارة
                    </span>
                    <span className="text-[10px] text-purple-700">(مادة C2TE معتمدة شكارة 20 كجم)</span>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                    <span className="text-[11px] text-blue-800 font-bold block mb-1">شكاير أسمنت التركيب:</span>
                    <span className="text-xl font-black text-blue-900 font-mono block">
                      {tilCementBags} كيس
                    </span>
                    <span className="text-[10px] text-blue-700">(لمونة تركيب البلاط)</span>
                  </div>
                )}

                <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200">
                  <span className="text-[11px] text-sky-800 font-bold block mb-1">شكاير سقية الفواصل:</span>
                  <span className="text-xl font-black text-sky-900 font-mono block">
                    {tilGroutBags} شكارة
                  </span>
                  <span className="text-[10px] text-sky-700">(روبة ملونة مضادة للبكتيريا)</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-700 font-bold block mb-1">صلايب وكليبسات تسوية:</span>
                  <span className="text-xl font-black text-slate-800 font-mono block">
                    {tilClipsCount} قطعة
                  </span>
                  <span className="text-[10px] text-slate-500">(فواصل 2-3 مم وضبط الاستواء)</span>
                </div>

                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200">
                  <span className="text-[11px] text-rose-800 font-bold block mb-1">تغطية كرتون حماية:</span>
                  <span className="text-xl font-black text-rose-900 font-mono block">
                    {tilFloorArea} م²
                  </span>
                  <span className="text-[10px] text-rose-700">(حماية البلاط بعد التركيب)</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 block">إجمالي تكلفة بند الأرضيات والسيراميك:</span>
                  <span className="text-2xl font-black text-[#003C69] font-mono">
                    {tilTotalCost > 0 ? formatCurrency(tilTotalCost, currency) : 'حصر كميات فقط'}
                  </span>
                </div>
                <div className="flex gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">الخامات:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(tilMaterialCost, currency)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">المصنعية:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(tilLaborCost, currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ELECTRICAL DEEP CALCULATOR                                             */}
      {/* ========================================================================= */}
      {activeTrade === 'electrical' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-[#003C69] flex items-center gap-2 border-b pb-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>مدخلات شبكة الكهرباء والإنارة</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عدد الغرف والصالة:</label>
                <input
                  type="number"
                  min="1"
                  value={elecRooms}
                  onChange={(e) => setElecRooms(Math.max(1, Number(e.target.value)))}
                  className="w-full border rounded-lg p-2 text-xs font-bold font-mono text-center bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عدد الحمامات:</label>
                <input
                  type="number"
                  min="0"
                  value={elecBaths}
                  onChange={(e) => setElecBaths(Math.max(0, Number(e.target.value)))}
                  className="w-full border rounded-lg p-2 text-xs font-bold font-mono text-center bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عدد المطابخ:</label>
                <input
                  type="number"
                  min="0"
                  value={elecKitchens}
                  onChange={(e) => setElecKitchens(Math.max(0, Number(e.target.value)))}
                  className="w-full border rounded-lg p-2 text-xs font-bold font-mono text-center bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عدد أجهزة التكييف:</label>
                <input
                  type="number"
                  min="0"
                  value={elecACCount}
                  onChange={(e) => setElecACCount(Math.max(0, Number(e.target.value)))}
                  className="w-full border rounded-lg p-2 text-xs font-bold font-mono text-center bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">مستوى التجهيز والمفاتيح:</label>
              <select
                value={elecTier}
                onChange={(e) => setElecTier(e.target.value as any)}
                className="w-full border rounded-lg p-2 text-xs font-bold bg-slate-50"
              >
                <option value="standard">قياسي معتمد (فينوس أو ما يعادلها)</option>
                <option value="premium">فاخر مودرن (شنايدر أو باناسونيك أو ليجراند)</option>
                <option value="smart">منزل ذكي Smart Home (مفاتيح لمس وشبكة)</option>
              </select>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="font-extrabold text-[#003C69] text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#00B050]" />
                  <span>نتائج حصر شبكة وتجهيزات الكهرباء:</span>
                </h4>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {elecBoxes} مخرج علبة ماجيك
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                  <span className="text-[11px] text-amber-800 font-bold block mb-1">سلك 1.5 مم² (إنارة):</span>
                  <span className="text-xl font-black text-amber-900 font-mono block">
                    {elecWireRolls1_5} لفة
                  </span>
                  <span className="text-[10px] text-amber-700">(السويدي معتمد 100م)</span>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                  <span className="text-[11px] text-blue-800 font-bold block mb-1">سلك 2.5/3 مم² (أفياش):</span>
                  <span className="text-xl font-black text-blue-900 font-mono block">
                    {elecWireRolls2_5} لفة
                  </span>
                  <span className="text-[10px] text-blue-700">(للأفياش العادية والشواحن)</span>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200">
                  <span className="text-[11px] text-purple-800 font-bold block mb-1">سلك 4 مم² (مطبخ/سخان):</span>
                  <span className="text-xl font-black text-purple-900 font-mono block">
                    {elecWireRolls4_0} لفة
                  </span>
                  <span className="text-[10px] text-purple-700">(للأجهزة ذات الاستهلاك العالي)</span>
                </div>

                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200">
                  <span className="text-[11px] text-rose-800 font-bold block mb-1">سلك 6 مم² (تكييفات):</span>
                  <span className="text-xl font-black text-rose-900 font-mono block">
                    {elecWireRolls6_0} لفة
                  </span>
                  <span className="text-[10px] text-rose-700">(خطوط مباشرة من اللوحة)</span>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-bold block mb-1">خراطيم PVC مسلحة:</span>
                  <span className="text-xl font-black text-emerald-900 font-mono block">
                    {elecPipesMeters} متر
                  </span>
                  <span className="text-[10px] text-emerald-700">(تمديد الحوائط والأسقف)</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-700 font-bold block mb-1">لوحة وقواطع Schneider:</span>
                  <span className="text-xl font-black text-slate-800 font-mono block">
                    {elecBreakersCount} خط
                  </span>
                  <span className="text-[10px] text-slate-500">(شامل قاطع الحماية RCCB)</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 block">التكلفة التقديرية لبند الكهرباء:</span>
                  <span className="text-2xl font-black text-[#003C69] font-mono">
                    {formatCurrency(elecTotalCost, currency)}
                  </span>
                </div>
                <div className="flex gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">الخامات:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(elecMaterialCost, currency)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">المصنعية:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(elecLaborCost, currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PLUMBING & WATERPROOFING DEEP CALCULATOR                               */}
      {/* ========================================================================= */}
      {activeTrade === 'plumbing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-[#003C69] flex items-center gap-2 border-b pb-2">
              <Droplets className="w-5 h-5 text-sky-600" />
              <span>مدخلات السباكة والصرف والعزل</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عدد الحمامات:</label>
                <input
                  type="number"
                  min="1"
                  value={plmBaths}
                  onChange={(e) => setPlmBaths(Math.max(1, Number(e.target.value)))}
                  className="w-full border rounded-lg p-2 text-xs font-bold font-mono text-center bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عدد المطابخ:</label>
                <input
                  type="number"
                  min="0"
                  value={plmKitchens}
                  onChange={(e) => setPlmKitchens(Math.max(0, Number(e.target.value)))}
                  className="w-full border rounded-lg p-2 text-xs font-bold font-mono text-center bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ماركة مواسير التغذية PPR:</label>
              <select
                value={plmBrand}
                onChange={(e) => setPlmBrand(e.target.value as any)}
                className="w-full border rounded-lg p-2 text-xs font-bold bg-slate-50"
              >
                <option value="elsherif">الشريف (ضمان 10 سنوات معتمد)</option>
                <option value="aquatherm">أكواثيرم ألماني أصلي</option>
                <option value="banninger">باننجر ألماني أصلي</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border">
              <span className="text-xs font-bold text-slate-700">عزل مائي كيميائي سيكاتوب 107 واختبار 48 ساعة؟</span>
              <input
                type="checkbox"
                checked={plmIncludeWaterproof}
                onChange={(e) => setPlmIncludeWaterproof(e.target.checked)}
                className="w-4 h-4 accent-[#003C69] cursor-pointer"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="font-extrabold text-[#003C69] text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#00B050]" />
                  <span>نتائج حصر شبكة السباكة والعزل:</span>
                </h4>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {plmWaterPoints} نقطة تغذية
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200">
                  <span className="text-[11px] text-sky-800 font-bold block mb-1">مواسير تغذية PPR:</span>
                  <span className="text-xl font-black text-sky-900 font-mono block">
                    {plmSupplyMeters} متر
                  </span>
                  <span className="text-[10px] text-sky-700">(3/4" رئيسي و 1/2" فروع مع الضمان)</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-700 font-bold block mb-1">مواسير صرف PVC:</span>
                  <span className="text-xl font-black text-slate-800 font-mono block">
                    {plmDrainMeters} متر
                  </span>
                  <span className="text-[10px] text-slate-500">(4 بوصة و 2 بوصة مع بيبات مانعة)</span>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-bold block mb-1">مسطح العزل المائي:</span>
                  <span className="text-xl font-black text-emerald-900 font-mono block">
                    {formatNumber(plmWaterproofArea, 1)} م²
                  </span>
                  <span className="text-[10px] text-emerald-700">(أرضيات + وزرة رقبة زجاجة 30 سم)</span>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200">
                  <span className="text-[11px] text-purple-800 font-bold block mb-1">بستلات سيكاتوب 107:</span>
                  <span className="text-xl font-black text-purple-900 font-mono block">
                    {plmSikatopPails} بستلة
                  </span>
                  <span className="text-[10px] text-purple-700">(عزل أسمنتي بوليمري وجهين)</span>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                  <span className="text-[11px] text-amber-800 font-bold block mb-1">اختبار الضغط والغمر:</span>
                  <span className="text-xl font-black text-amber-900 font-mono block">
                    48 ساعة
                  </span>
                  <span className="text-[10px] text-amber-700">(كبس 12 بار بمندوب الشركة)</span>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                  <span className="text-[11px] text-blue-800 font-bold block mb-1">أطقم وخلاطات:</span>
                  <span className="text-xl font-black text-blue-900 font-mono block">
                    {plmBaths + plmKitchens} طقم
                  </span>
                  <span className="text-[10px] text-blue-700">(أطقم صيني وخلاطات قلب سيراميك)</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 block">إجمالي تكلفة السباكة والعزل:</span>
                  <span className="text-2xl font-black text-[#003C69] font-mono">
                    {formatCurrency(plmTotalCost, currency)}
                  </span>
                </div>
                <div className="flex gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">الخامات:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(plmMaterialCost, currency)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">المصنعية:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(plmLaborCost, currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. GYPSUM CEILING DEEP CALCULATOR                                         */}
      {/* ========================================================================= */}
      {activeTrade === 'gypsum' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-[#003C69] flex items-center gap-2 border-b pb-2">
              <Grid className="w-5 h-5 text-indigo-600" />
              <span>مدخلات الأسقف المعلقة (جبسوم بورد)</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">مسطح السقف (م²):</label>
              <input
                type="number"
                min="1"
                value={gypArea}
                onChange={(e) => setGypArea(Math.max(1, Number(e.target.value)))}
                className="w-full border rounded-lg p-2 text-sm font-bold font-mono text-center bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">طبيعة وتصميم السقف:</label>
              <select
                value={gypDesign}
                onChange={(e) => setGypDesign(e.target.value as any)}
                className="w-full border rounded-lg p-2 text-xs font-bold bg-slate-50"
              >
                <option value="perimeter">بيت نور محيطي هادئ (محيط الصالة/الغرف)</option>
                <option value="flat">سقف فلات كامل (Flat Ceiling مع سبوتات)</option>
                <option value="simple">كرانيش وزوايا بسيطة</option>
              </select>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">أسعار الوحدة (اختياري):</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <label className="text-slate-500 block mb-0.5">سعر لوح الجبس كناوف:</label>
                  <input
                    type="number"
                    value={gypSheetPrice || ''}
                    placeholder="0"
                    onChange={(e) => setGypSheetPrice(Number(e.target.value))}
                    className="w-full border rounded p-1 font-mono font-bold text-right"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">مصنعية تركيب م²:</label>
                  <input
                    type="number"
                    value={gypLaborM2Price || ''}
                    placeholder="0"
                    onChange={(e) => setGypLaborM2Price(Number(e.target.value))}
                    className="w-full border rounded p-1 font-mono font-bold text-right"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="font-extrabold text-[#003C69] text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#00B050]" />
                  <span>نتائج حصر ألواح وشاسيهات الجبسوم بورد:</span>
                </h4>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {gypArea} م²
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200">
                  <span className="text-[11px] text-indigo-800 font-bold block mb-1">ألواح جبسوم بورد كناوف:</span>
                  <span className="text-xl font-black text-indigo-900 font-mono block">
                    {gypSheetsCount} لوح
                  </span>
                  <span className="text-[10px] text-indigo-700">(مقاس 1.2 × 2.4 م سماكة 12.5 مم)</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-700 font-bold block mb-1">أوميجا صاج مجلفن:</span>
                  <span className="text-xl font-black text-slate-800 font-mono block">
                    {gypOmegaMeters} متر
                  </span>
                  <span className="text-[10px] text-slate-500">(سماكة 0.5 مم محمل)</span>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                  <span className="text-[11px] text-blue-800 font-bold block mb-1">قطاعات C-Stud & U:</span>
                  <span className="text-xl font-black text-blue-900 font-mono block">
                    {gypChannelMeters} متر
                  </span>
                  <span className="text-[10px] text-blue-700">(شاسيه التعليق والزوايا)</span>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-bold block mb-1">شريط شاش فايبر تيب:</span>
                  <span className="text-xl font-black text-emerald-900 font-mono block">
                    {gypMeshTapeRolls} لفة
                  </span>
                  <span className="text-[10px] text-emerald-700">(طول 90م لمنع شروخ الفواصل)</span>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                  <span className="text-[11px] text-amber-800 font-bold block mb-1">معجون فواصل كناوف:</span>
                  <span className="text-xl font-black text-amber-900 font-mono block">
                    {gypJointCompoundBags} شكارة
                  </span>
                  <span className="text-[10px] text-amber-700">(معجون مخصص لفواصل الجبس)</span>
                </div>

                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200">
                  <span className="text-[11px] text-rose-800 font-bold block mb-1">مسامير جبس وتيش:</span>
                  <span className="text-xl font-black text-rose-900 font-mono block">
                    طقم كامل
                  </span>
                  <span className="text-[10px] text-rose-700">(مسامير سوداء + تيش وسوسنة)</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 block">إجمالي تكلفة الجبسوم بورد:</span>
                  <span className="text-2xl font-black text-[#003C69] font-mono">
                    {formatCurrency(gypTotalCost, currency)}
                  </span>
                </div>
                <div className="flex gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">الخامات:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(gypMaterialCost, currency)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">المصنعية:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(gypLaborCost, currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. CARPENTRY & WINDOWS DEEP CALCULATOR                                    */}
      {/* ========================================================================= */}
      {activeTrade === 'carpentry' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-[#003C69] flex items-center gap-2 border-b pb-2">
              <DoorOpen className="w-5 h-5 text-amber-800" />
              <span>مدخلات الأبواب والشبابيك والألوميتال</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">عدد أبواب الغرف والحمامات:</label>
              <input
                type="number"
                min="1"
                value={drCount}
                onChange={(e) => setDrCount(Math.max(1, Number(e.target.value)))}
                className="w-full border rounded-lg p-2 text-sm font-bold font-mono text-center bg-slate-50"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border">
              <span className="text-xs font-bold text-slate-700">هل يشمل باب شقة رئيسي تركي مصفح؟</span>
              <input
                type="checkbox"
                checked={drArmoredDoor}
                onChange={(e) => setDrArmoredDoor(e.target.checked)}
                className="w-4 h-4 accent-[#003C69] cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">إجمالي مسطح شبابيك الألوميتال (م²):</label>
              <input
                type="number"
                min="1"
                value={winArea}
                onChange={(e) => setWinArea(Math.max(1, Number(e.target.value)))}
                className="w-full border rounded-lg p-2 text-sm font-bold font-mono text-center bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نوع قطاع الألوميتال / UPVC:</label>
              <select
                value={winType}
                onChange={(e) => setWinType(e.target.value as any)}
                className="w-full border rounded-lg p-2 text-xs font-bold bg-slate-50"
              >
                <option value="jumbo">جامبو كبير بزجاج دبل عازل وسلك بليسيه</option>
                <option value="upvc">UPVC عازل للصوت والحرارة بنسبة 85%</option>
                <option value="bs_large">BS كبير زجاج سنجل 6 مم عاكس</option>
                <option value="bs_small">BS صغير اقتصادي</option>
              </select>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="font-extrabold text-[#003C69] text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#00B050]" />
                  <span>نتائج حصر الأبواب والشبابيك والألوميتال:</span>
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {drArmoredDoor && (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                    <span className="text-[11px] text-amber-800 font-bold block mb-1">باب الشقة المصفح:</span>
                    <span className="text-xl font-black text-amber-900 font-mono block">1 باب مصفح</span>
                    <span className="text-[10px] text-amber-700">(تركي أصلي متعدد الأقفال)</span>
                  </div>
                )}

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                  <span className="text-[11px] text-blue-800 font-bold block mb-1">أبواب الغرف والحمام:</span>
                  <span className="text-xl font-black text-blue-900 font-mono block">{drCount} باب</span>
                  <span className="text-[10px] text-blue-700">(حلق موسكي زفر + برور + كوالين)</span>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-bold block mb-1">مسطح الألوميتال:</span>
                  <span className="text-xl font-black text-emerald-900 font-mono block">{winArea} م²</span>
                  <span className="text-[10px] text-emerald-700">({winType.toUpperCase()} مع زجاج وسلك)</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 block">إجمالي تكلفة الأبواب والألوميتال:</span>
                  <span className="text-2xl font-black text-[#003C69] font-mono">
                    {formatCurrency(drWinTotalCost, currency)}
                  </span>
                </div>
                <div className="flex gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">الخامات:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(drWinMaterialCost, currency)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">المصنعية:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(drWinLaborCost, currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
