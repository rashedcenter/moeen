import { SteelEstimateResult, StructuralSystem } from '../types';

export interface DiameterDetail {
  diameter: number; // mm
  label: string;
  usage: string;
  percentage: number;
  meterWeight: number; // kg/m
  barWeight: number; // 12m bar weight in kg
  barsCount: number;
  tons: number;
  kg: number;
}

export const STRUCTURAL_SYSTEMS: Record<
  StructuralSystem,
  {
    name: string;
    description: string;
    steelPerM2Range: [number, number]; // [min, max] kg/m2
    defaultSteelPerM2: number;
    equivalentConcreteThickness: number; // m
    suitability: string;
  }
> = {
  solid_slab: {
    name: 'سقف كمرات ساقطة وبلاطة عادية (Solid Slab)',
    description: 'النظام التقليدي الأكثر اقتصاداً، يعتمد على وجود كمرات ساقطة أسفل الجدران لتوزيع الأحمال على الأعمدة.',
    steelPerM2Range: [20, 26],
    defaultSteelPerM2: 22,
    equivalentConcreteThickness: 0.22,
    suitability: 'مناسب للبحور الصغيرة (أقل من 5 أمتار بين الأعمدة) والشقق السكنية ذات التقسيم الثابت، ويوفر جداً في كمية الحديد.',
  },
  flat_slab: {
    name: 'سقف لاكمري مسطح (Flat Slab)',
    description: 'بلاطة مستوية خالية من الكمرات الداخلية، تتيح حرية كاملة في تعديل الحوائط وفتح الغرف لاحقاً.',
    steelPerM2Range: [32, 40],
    defaultSteelPerM2: 35,
    equivalentConcreteThickness: 0.26,
    suitability: 'الخيار الأفضل للصالات الكبيرة والوحدات المفتوحة والبحور حتى 7-8 أمتار، ولكنه يستهلك كمية حديد أعلى بنحو 40-50% مقارنة بالسوليد.',
  },
  hollow_block: {
    name: 'سقف هوردي بلوك مفرغ (Hollow Block / Waffle)',
    description: 'بلاطة مفرغة باستخدام بلوكات خفيفة (طوب أحمر أو فوم أو أسمنتي مفرغ) بين أعصاب خرسانية.',
    steelPerM2Range: [28, 35],
    defaultSteelPerM2: 30,
    equivalentConcreteThickness: 0.28,
    suitability: 'ممتاز للبحور الكبيرة والعزل الحراري والصوتي وتخفيف وزن السقف مع كفاءة إنشائية عالية.',
  },
  custom: {
    name: 'نظام مخصص (تحديد معدل التسليح يدوياً)',
    description: 'إدخال معدل استهلاك الحديد بالكيلوجرام لكل متر مسطح بحرية تامة.',
    steelPerM2Range: [15, 60],
    defaultSteelPerM2: 25,
    equivalentConcreteThickness: 0.25,
    suitability: 'للأنظمة الخاصة أو الحالات التي يحدد فيها المهندس معدلاً خاصاً.',
  },
};

export const REBAR_SPECIFICATIONS = [
  { diameter: 8, meterWeight: 0.395, defaultShare: 0.15, usage: 'كانات للأعمدة والكمرات والسملات' },
  { diameter: 10, meterWeight: 0.617, defaultShare: 0.20, usage: 'حديد فرش وغطاء لبلاطات الأسقف العادية وشبكات الحوائط' },
  { diameter: 12, meterWeight: 0.888, defaultShare: 0.25, usage: 'حديد فرش وغطاء رئيسي للأسقف الفلات والكمرات الخفيفة' },
  { diameter: 16, meterWeight: 1.579, defaultShare: 0.30, usage: 'تسليح رئيسي للأعمدة والكمرات والقواعد المسلحة' },
  { diameter: 18, meterWeight: 1.999, defaultShare: 0.10, usage: 'تسليح رئيسي للقواعد المشتركة واللبشة والبحور العميقة' },
];

/**
 * Calculates advisory steel reinforcement requirements
 */
export function calculateSteelEstimation(
  slabArea: number,
  floorsCount: number,
  system: StructuralSystem,
  includeSubstructure: boolean = true,
  customSteelPerM2?: number,
  steelPricePerTon: number = 0
): SteelEstimateResult {
  const safeArea = Math.max(1, slabArea);
  const safeFloors = Math.max(1, Math.floor(floorsCount));
  const sysConfig = STRUCTURAL_SYSTEMS[system] || STRUCTURAL_SYSTEMS.solid_slab;

  const steelPerM2 = (customSteelPerM2 && customSteelPerM2 > 0) ? customSteelPerM2 : sysConfig.defaultSteelPerM2;
  const concreteVolumeEst = safeArea * sysConfig.equivalentConcreteThickness * safeFloors;

  // Slabs steel
  const slabSteelKg = safeArea * steelPerM2 * safeFloors;

  // Columns & Shear walls steel (approx 10 kg per m2 of total built area)
  const columnsSteelKg = includeSubstructure ? safeArea * 10 * safeFloors : 0;

  // Footings & Ground Beams (approx 16 kg per m2 of ground footprint)
  const footingsSteelKg = includeSubstructure ? safeArea * 17 : 0;

  const totalSteelKg = slabSteelKg + columnsSteelKg + footingsSteelKg;
  const totalSteelTons = Math.round((totalSteelKg / 1000) * 100) / 100;
  const steelPerM3 = concreteVolumeEst > 0 ? Math.round(totalSteelKg / concreteVolumeEst) : 0;

  // Tie wire: ~ 22 kg per ton of rebar
  const tieWireKg = Math.round(totalSteelTons * 22);

  const diameters = REBAR_SPECIFICATIONS.map((spec) => {
    const shareKg = totalSteelKg * spec.defaultShare;
    const shareTons = Math.round((shareKg / 1000) * 100) / 100;
    const barWeight = spec.meterWeight * 12; // 12-meter commercial bar standard
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
    slabArea: safeArea,
    floorsCount: safeFloors,
    system,
    concreteVolumeEst: Math.round(concreteVolumeEst * 10) / 10,
    steelPerM2,
    steelPerM3,
    slabSteelKg: Math.round(slabSteelKg),
    columnsSteelKg: Math.round(columnsSteelKg),
    footingsSteelKg: Math.round(footingsSteelKg),
    totalSteelKg: Math.round(totalSteelKg),
    totalSteelTons,
    tieWireKg,
    steelPricePerTon: steelPricePerTon || 0,
    totalCost: Math.round(totalSteelTons * (steelPricePerTon || 0)),
    diameters,
  };
}

export const STEEL_INSPECTION_TIPS = [
  {
    title: 'كيف تتأكد من وزن وعدد الأسياخ في الطن؟',
    content: 'المتر الطولي للحديد له وزن فيزيائي ثابت يحسب بالمعادلة: (القطر بالمليمتر × القطر بالمليمتر) ÷ 162. والسيخ التجاري القياسي طوله 12 متراً. مثلاً سيخ قطر 12 مم وزنه = (144 ÷ 162) × 12 = 10.66 كجم، وبالتالي الطن يحتوي على 94 سيخاً تقريباً. عد الأسياخ أو اطلب وزن الشاحنة على ميزان بسكول معتمد.',
  },
  {
    title: 'طول ركوب ووصلات الأسياخ (Overlap Length)',
    content: 'عند وصل سيخين معاً، يجب ألا يقل طول الوصلة عن 50 إلى 60 مرة قطر السيخ (مثال: لسيخ قطر 12 مم، طول الوصلة = 12 مم × 50 = 60 سم على الأقل)، مع ربط الوصلة بسلك الرباط في 3 مواضع على الأقل، وتجنب عمل جميع الوصلات في نفس المقطع (وصلات متبادلة/Staggered).',
  },
  {
    title: 'الغطاء الخرساني والبسكوت (Concrete Cover)',
    content: 'ممنوع أن يلامس الحديد لوح الخشب أو الشدة نهائياً، لأن ملامسته للهواء ستسبب صدأ الحديد وتآكله وانتفاخه مما يفجر الخرسانة. يجب وضع قطع بسكوت أسمنتي أو بلاستيكي بارتفاع 2.5 سم للبلاطات والكمرات، و 5 سم للقواعد الملامسة للتربة.',
  },
  {
    title: 'الفرق بين الصدأ السطحي المسموح والصدأ القشري المرفوض',
    content: 'الصدأ البني الفاتح السطحي (Flash Rust) ناتج عن رطوبة الهواء وهو طبيعي ومفيد لزيادة قوة تماسك الحديد مع الخرسانة (Bond). أما الصدأ المرفوض هندسياً فهو الصدأ القشري العميق الذي يسقط قشوراً ويقلل قطر السيخ الفعلي أو يسبب تنقيراً واضحاً (Pitting).',
  },
  {
    title: 'تخزين الحديد في الموقع',
    content: 'يجب رفع أسياخ الحديد عن الأرض بوضعها فوق عروق خشبية (Bratins) لمنع ملامسة مياه الأمطار أو رطوبة التربة، وتغطية المشال بطبقة مشمع بلاستيكي سميك مع ترك فتحات تهوية سفلية.',
  },
];
