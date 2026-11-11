import { ConcreteElement, ConcreteMixOptions } from '../types';

export interface ConcreteElementTypeConfig {
  key: 'slab' | 'beam' | 'column' | 'footing' | 'wall';
  name: string;
  fields: { name: string; unit: string; defaultValue: number }[];
  areaFields?: { name: string; unit: string; defaultValue: number }[];
}

export const CONCRETE_TYPES: Record<string, ConcreteElementTypeConfig> = {
  slab: {
    key: 'slab',
    name: 'بلاطة / سقف',
    fields: [
      { name: 'الطول', unit: 'م', defaultValue: 5 },
      { name: 'العرض', unit: 'م', defaultValue: 4 },
      { name: 'السُمك', unit: 'سم', defaultValue: 12 },
    ],
    areaFields: [
      { name: 'المساحة الكلية (أو جمع أجزاء مثل 15+22)', unit: 'م²', defaultValue: 20 },
      { name: 'السُمك', unit: 'سم', defaultValue: 12 },
    ],
  },
  beam: {
    key: 'beam',
    name: 'كمرة / جسر',
    fields: [
      { name: 'الطول', unit: 'م', defaultValue: 4 },
      { name: 'العرض', unit: 'سم', defaultValue: 25 },
      { name: 'العمق', unit: 'سم', defaultValue: 60 },
    ],
  },
  column: {
    key: 'column',
    name: 'عمود خرساني',
    fields: [
      { name: 'العرض', unit: 'سم', defaultValue: 25 },
      { name: 'العمق', unit: 'سم', defaultValue: 60 },
      { name: 'الارتفاع', unit: 'م', defaultValue: 3 },
    ],
  },
  footing: {
    key: 'footing',
    name: 'قاعدة مسلحة',
    fields: [
      { name: 'الطول', unit: 'م', defaultValue: 1.5 },
      { name: 'العرض', unit: 'م', defaultValue: 1.5 },
      { name: 'السُمك', unit: 'سم', defaultValue: 50 },
    ],
  },
  wall: {
    key: 'wall',
    name: 'حائط خرساني / سور',
    fields: [
      { name: 'الطول', unit: 'م', defaultValue: 6 },
      { name: 'الارتفاع', unit: 'م', defaultValue: 3 },
      { name: 'السُمك', unit: 'سم', defaultValue: 20 },
    ],
  },
};

export const STANDARD_MIXES: { id: string; label: string; c: number; s: number; g: number }[] = [
  { id: '1,2,4', label: '1 : 2 : 4 — خلطة شائعة (مسلحة عادية)', c: 1, s: 2, g: 4 },
  { id: '1,1.5,3', label: '1 : 1.5 : 3 — خلطة غنية بالأسمنت (أعمدة وقواعد)', c: 1, s: 1.5, g: 3 },
  { id: '1,1,2', label: '1 : 1 : 2 — خلطة فائقة القوة (عناصر مجهدة)', c: 1, s: 1, g: 2 },
  { id: '1,3,6', label: '1 : 3 : 6 — خرسانة عادية نظافة بدون تسليح', c: 1, s: 3, g: 6 },
  { id: 'custom', label: 'خلطة مخصصة', c: 1, s: 2, g: 4 },
];

export function parseSumExpression(raw: string, defaultValue: number): number {
  if (!raw) return defaultValue;
  const normalized = String(raw)
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[٫,،]/g, '.')
    .trim();

  if (normalized === '') return defaultValue;
  const parts = normalized.split('+');
  let sum = 0;
  let hasValid = false;

  for (const part of parts) {
    const p = part.trim();
    if (!p) continue;
    const n = Number(p);
    if (!isFinite(n) || n < 0) return defaultValue;
    sum += n;
    hasValid = true;
  }

  return hasValid ? sum : defaultValue;
}

export function calculateMaterialsBreakdown(volumeM3: number, opts: ConcreteMixOptions) {
  const sumRatios = opts.cement + opts.sand + opts.gravel;
  const wetVolume = volumeM3 * (1 + opts.wastePercent / 100);
  const dryVolume = wetVolume * opts.dryVolumeFactor;

  const cementM3 = (dryVolume * opts.cement) / sumRatios;
  const sandM3 = (dryVolume * opts.sand) / sumRatios;
  const gravelM3 = (dryVolume * opts.gravel) / sumRatios;

  const cementKg = cementM3 * opts.cementDensity;
  const cementBags = cementKg / opts.bagWeight;
  const waterLiters = cementKg * opts.waterCementRatio;
  const cementPerM3 = (opts.dryVolumeFactor * (opts.cement / sumRatios) * opts.cementDensity);

  return {
    rawVolume: volumeM3,
    wetVolume,
    dryVolume,
    cementKg: Math.round(cementKg),
    cementBags: Math.ceil(cementBags - 1e-9),
    exactBags: cementBags,
    sandM3: Math.round(sandM3 * 100) / 100,
    gravelM3: Math.round(gravelM3 * 100) / 100,
    waterLiters: Math.round(waterLiters),
    cementPerM3: Math.round(cementPerM3),
  };
}

export function calculateConcreteCost(
  materials: {
    rawVolume: number;
    cementBags: number;
    sandM3: number;
    gravelM3: number;
  },
  prices: {
    cementBagPrice?: number;
    sandM3Price?: number;
    gravelM3Price?: number;
    laborM3Price?: number;
  }
) {
  const cementCost = Math.round(materials.cementBags * (prices.cementBagPrice || 0));
  const sandCost = Math.round(materials.sandM3 * (prices.sandM3Price || 0));
  const gravelCost = Math.round(materials.gravelM3 * (prices.gravelM3Price || 0));
  const laborCost = Math.round(materials.rawVolume * (prices.laborM3Price || 0));
  const materialsCost = cementCost + sandCost + gravelCost;
  const totalCost = materialsCost + laborCost;

  return {
    cementCost,
    sandCost,
    gravelCost,
    materialsCost,
    laborCost,
    totalCost,
    isPriced: totalCost > 0,
  };
}
