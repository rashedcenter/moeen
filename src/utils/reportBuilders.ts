/**
 * بناة بيانات التقارير الثلاثة (التشطيبات / الخرسانة والحديد / التقرير الإجمالي).
 * هذه الملفات لا تعرف شيئاً عن شكل الصفحة، فقط تجهّز الجداول والأرقام.
 */
import type {
  ApartmentSpecs,
  ConcreteElement,
  ConcretePriceConfig,
  ConcreteMixOptions,
  CurrencyCode,
  FinishingCategoryResult,
} from '../types';
import { CURRENCIES } from '../data/currencies';
import { STRUCTURAL_SYSTEMS } from '../data/steelEstimator';
import {
  ReportData,
  ReportKV,
  ReportSection,
  fmtDate,
  getProjectMeta,
  metaFields,
  num,
} from './reportStore';

const money = (n: number, cur: CurrencyCode): string =>
  `${num(n, 0)} ${(CURRENCIES[cur] || CURRENCIES.EGP).symbol}`;

const sym = (cur: CurrencyCode): string => (CURRENCIES[cur] || CURRENCIES.EGP).symbol;

const reportDate = (iso: string): string =>
  fmtDate(iso) || fmtDate(new Date().toISOString().split('T')[0]);

/* ------------------------------------------------------------------ */
/* 1) التشطيبات                                                        */
/* ------------------------------------------------------------------ */

export interface FinishesReportInput {
  categories: FinishingCategoryResult[];
  specs: ApartmentSpecs;
  tierName: string;
  currency: CurrencyCode;
  totalCost: number;
  totalMaterials: number;
  totalLabor: number;
  totalItemsCount: number;
  totalUnpricedCount: number;
  costPerM2: number;
}

export function buildFinishesReport(p: FinishesReportInput): ReportData {
  const pm = getProjectMeta();
  const cur = p.currency;
  const s = sym(cur);

  const meta: ReportKV[] = [
    ...metaFields(pm),
    { label: 'باقة التشطيب', value: p.tierName },
    { label: 'المساحة الكلية', value: `${num(p.specs.totalArea, 1)} م²` },
    {
      label: 'الغرف / الحمامات / المطابخ',
      value: `${p.specs.roomsCount} / ${p.specs.bathroomsCount} / ${p.specs.kitchensCount}`,
    },
    { label: 'عدد البلكونات', value: String(p.specs.balconiesCount) },
    { label: 'الارتفاع الصافي', value: `${num(p.specs.ceilingHeight, 2)} م` },
    { label: 'العملة', value: `${CURRENCIES[cur].name} (${s})` },
  ];

  const sections: ReportSection[] = p.categories
    .filter((c) => c.items.length > 0)
    .map((cat) => {
      const rows = cat.items.map((it, i) => [
        { text: String(i + 1), muted: true },
        {
          text: it.title,
          bold: true,
          sub: (it.details || []).map((d) => `• ${d}`),
        },
        it.unit,
        {
          text: num(it.quantity, 2),
          bold: true,
          sub: it.isQuantityOverridden ? ['(معدّلة يدوياً)'] : undefined,
        },
        it.materialUnitCost > 0 ? num(it.materialUnitCost, 2) : '—',
        it.laborUnitCost > 0 ? num(it.laborUnitCost, 2) : '—',
        it.totalCost > 0 ? { text: num(it.totalCost, 0), bold: true } : { text: 'كمية فقط', muted: true },
      ]);

      const tips = cat.items.find((it) => it.tips)?.tips;
      const priced = cat.totalCost > 0;

      return {
        title: cat.categoryName,
        subtitle: cat.description,
        columns: [
          { label: 'م', w: 0.55, align: 'center' as const },
          { label: 'البند والمواصفة الفنية', w: 5.2 },
          { label: 'الوحدة', w: 0.9, align: 'center' as const },
          { label: 'الكمية', w: 1.2, align: 'center' as const },
          { label: `سعر الخامة (${s})`, w: 1.3, align: 'center' as const },
          { label: `سعر المصنعية (${s})`, w: 1.4, align: 'center' as const },
          { label: `الإجمالي (${s})`, w: 1.5, align: 'center' as const },
        ],
        rows,
        footers: [
          {
            label: priced
              ? `إجمالي ${cat.categoryName}  —  خامات ${num(cat.materialCost, 0)} + مصنعيات ${num(cat.laborCost, 0)}`
              : `${cat.categoryName}: حصر كميات فقط (بدون أسعار)`,
            value: priced ? money(cat.totalCost, cur) : '—',
            strong: true,
          },
        ],
        note: tips ? `توجيه هندسي واستلام: ${tips}` : undefined,
      } as ReportSection;
    });

  const summary: ReportKV[] = [
    ...p.categories
      .filter((c) => c.items.length > 0)
      .map((c) => ({
        label: c.categoryName,
        value: c.totalCost > 0 ? money(c.totalCost, cur) : 'حصر كميات',
      })),
    { label: 'إجمالي تكلفة الخامات والمواد', value: money(p.totalMaterials, cur) },
    { label: 'إجمالي أجور العمالة والمصنعيات', value: money(p.totalLabor, cur) },
    { label: 'عدد البنود المحصورة', value: `${p.totalItemsCount} بند` },
  ];
  if (p.totalUnpricedCount > 0) {
    summary.push({ label: 'بنود بدون تسعير (كمية فقط)', value: `${p.totalUnpricedCount} بند` });
  }
  if (p.costPerM2 > 0) {
    summary.push({ label: 'متوسط التكلفة للمتر المسطح', value: `${money(p.costPerM2, cur)} / م²` });
  }
  summary.push({ label: 'إجمالي تكلفة التشطيبات', value: money(p.totalCost, cur), strong: true });

  return {
    title: 'حصر الكميات والمواصفات والتكلفة لبنود التشطيبات',
    subtitle: `باقة التشطيب: ${p.tierName}`,
    date: reportDate(pm.reportDate),
    meta,
    sections,
    summaryTitle: 'ملخص تكلفة التشطيبات',
    summary,
    signatures: true,
  };
}

/* ------------------------------------------------------------------ */
/* 2) الخرسانة والحديد                                                  */
/* ------------------------------------------------------------------ */

interface MaterialsResult {
  rawVolume: number;
  wetVolume: number;
  cementKg: number;
  cementBags: number;
  exactBags: number;
  sandM3: number;
  gravelM3: number;
  waterLiters: number;
}

interface CostResult {
  cementCost: number;
  sandCost: number;
  gravelCost: number;
  laborCost: number;
  materialsCost: number;
  totalCost: number;
  isPriced: boolean;
}

interface DiameterRow {
  diameter: number;
  usage: string;
  percentage: number;
  weightTons: number;
  weightKg: number;
  meterWeight: number;
  approxBarsCount: number;
}

export interface ConcreteReportInput {
  currency: CurrencyCode;
  boqList: ConcreteElement[];
  totalBoqVolume: number;
  totalBoqMaterials: MaterialsResult;
  totalBoqCost: CostResult;
  concretePrices: ConcretePriceConfig;
  activeMix: ConcreteMixOptions;
  steelMode: 'area' | 'volume';
  steelAreaResults: {
    slabArea: number;
    floorsCount: number;
    system: string;
    steelPerM2: number;
    slabSteelKg: number;
    columnsSteelKg: number;
    footingsSteelKg: number;
    totalSteelKg: number;
    totalSteelTons: number;
    tieWireKg: number;
    totalCost: number;
    diameters: DiameterRow[];
  };
  steelVolumeResults: {
    totalKg: number;
    totalTons: number;
    ratePerM3: number;
    concreteVol: number;
    tieWireKg: number;
    totalCost: number;
    diameters: DiameterRow[];
  };
  includeSubstructure: boolean;
  elementCategory: string;
  steelPricePerTon: number;
  activeSteelTons: number;
  activeSteelCost: number;
}

const ELEMENT_LABELS: Record<string, string> = {
  solid_slab: 'أسقف سوليد سلاب',
  flat_slab: 'أسقف فلات سلاب',
  columns: 'أعمدة',
  footings: 'قواعد',
  raft: 'لبشة',
};

export function buildConcreteReport(p: ConcreteReportInput): ReportData {
  const pm = getProjectMeta();
  const cur = p.currency;
  const s = sym(cur);
  const sections: ReportSection[] = [];
  const meta: ReportKV[] = [...metaFields(pm)];

  /* ---- جدول حصر العناصر الخرسانية ---- */
  if (p.boqList.length > 0) {
    sections.push({
      title: 'حصر العناصر الخرسانية',
      subtitle: `نسبة الخلطة (أسمنت : رمل : زلط) = ${p.activeMix.cement} : ${p.activeMix.sand} : ${p.activeMix.gravel} بالحجم — نسبة الهالك ${p.activeMix.wastePercent}%`,
      columns: [
        { label: 'م', w: 0.5, align: 'center' },
        { label: 'العنصر', w: 2.4 },
        { label: 'الأبعاد', w: 3.2, align: 'center' },
        { label: 'العدد', w: 0.9, align: 'center' },
        { label: 'الحجم (م³)', w: 1.5, align: 'center' },
      ],
      rows: p.boqList.map((el, i) => [
        { text: String(i + 1), muted: true },
        { text: el.name, bold: true },
        el.dimsDesc,
        String(el.count),
        { text: num(el.volume, 3), bold: true },
      ]),
      footers: [
        { label: 'إجمالي حجم الخرسانة للمشروع', value: `${num(p.totalBoqVolume, 3)} م³`, strong: true },
      ],
    });

    const m = p.totalBoqMaterials;
    const c = p.totalBoqCost;
    const pr = p.concretePrices;
    const priced = (price: number | undefined): boolean => (price || 0) > 0;

    sections.push({
      title: 'المواد المطلوبة لتنفيذ الخرسانة',
      subtitle: `حجم الخرسانة ${num(p.totalBoqVolume, 3)} م³ (${num(m.wetVolume, 3)} م³ بعد الهالك)`,
      columns: [
        { label: 'البند', w: 3 },
        { label: 'الكمية', w: 1.7, align: 'center' },
        { label: 'الوحدة', w: 1.1, align: 'center' },
        { label: `سعر الوحدة (${s})`, w: 1.5, align: 'center' },
        { label: `الإجمالي (${s})`, w: 1.5, align: 'center' },
      ],
      rows: [
        [
          { text: 'أسمنت', bold: true, sub: [`${num(m.cementKg, 0)} كجم`] },
          { text: num(m.cementBags, 0), bold: true },
          'كيس (50 كجم)',
          priced(pr.cementBagPrice) ? num(pr.cementBagPrice, 2) : '—',
          priced(pr.cementBagPrice) ? num(c.cementCost, 0) : '—',
        ],
        [
          { text: 'رمل', bold: true },
          { text: num(m.sandM3, 2), bold: true },
          'م³',
          priced(pr.sandM3Price) ? num(pr.sandM3Price, 2) : '—',
          priced(pr.sandM3Price) ? num(c.sandCost, 0) : '—',
        ],
        [
          { text: 'زلط (سن)', bold: true },
          { text: num(m.gravelM3, 2), bold: true },
          'م³',
          priced(pr.gravelM3Price) ? num(pr.gravelM3Price, 2) : '—',
          priced(pr.gravelM3Price) ? num(c.gravelCost, 0) : '—',
        ],
        [
          { text: 'مياه الخلط', bold: true },
          { text: num(m.waterLiters, 0), bold: true },
          'لتر',
          '—',
          '—',
        ],
        [
          { text: 'مصنعية الصب والتنفيذ', bold: true },
          { text: num(p.totalBoqVolume, 3), bold: true },
          'م³',
          priced(pr.laborM3Price) ? num(pr.laborM3Price, 2) : '—',
          priced(pr.laborM3Price) ? num(c.laborCost, 0) : '—',
        ],
      ],
      footers: [
        c.isPriced
          ? { label: 'إجمالي تكلفة مواد ومصنعية الخرسانة', value: money(c.totalCost, cur), strong: true }
          : { label: 'حصر كميات فقط (بدون أسعار)', value: '—', strong: true },
      ],
    });
  }

  /* ---- حديد التسليح ---- */
  const isArea = p.steelMode === 'area';
  const diameters = isArea ? p.steelAreaResults.diameters : p.steelVolumeResults.diameters;
  const totalTons = p.activeSteelTons;
  const totalKg = isArea ? p.steelAreaResults.totalSteelKg : p.steelVolumeResults.totalKg;
  const tieWire = isArea ? p.steelAreaResults.tieWireKg : p.steelVolumeResults.tieWireKg;
  const hasPrice = p.steelPricePerTon > 0;

  let basis: string;
  if (isArea) {
    const a = p.steelAreaResults;
    const sysName = STRUCTURAL_SYSTEMS[a.system as keyof typeof STRUCTURAL_SYSTEMS]?.name || a.system;
    basis =
      `الحساب بمساحة السقف: ${num(a.slabArea, 1)} م² × ${a.floorsCount} دور — النظام الإنشائي: ${sysName} — ` +
      `معدل التسليح ${num(a.steelPerM2, 1)} كجم/م²` +
      (p.includeSubstructure ? ' — شامل حديد القواعد والأعمدة' : ' — بدون حديد القواعد والأعمدة');
    meta.push({ label: 'مساحة السقف', value: `${num(a.slabArea, 1)} م²` });
    meta.push({ label: 'عدد الأدوار', value: String(a.floorsCount) });
  } else {
    const v = p.steelVolumeResults;
    basis =
      `الحساب بحجم الخرسانة: ${num(v.concreteVol, 2)} م³ — نوع العناصر: ${ELEMENT_LABELS[p.elementCategory] || ''} — ` +
      `معدل التسليح ${num(v.ratePerM3, 0)} كجم/م³`;
    meta.push({ label: 'حجم الخرسانة المسلحة', value: `${num(v.concreteVol, 2)} م³` });
  }
  meta.push({ label: 'العملة', value: `${CURRENCIES[cur].name} (${s})` });

  sections.push({
    title: 'حصر حديد التسليح وتوزيع الأقطار',
    subtitle: basis + (hasPrice ? ` — سعر الطن ${num(p.steelPricePerTon, 0)} ${s}` : ''),
    columns: [
      { label: 'القطر (مم)', w: 1, align: 'center' },
      { label: 'الاستخدام', w: 3.6 },
      { label: 'النسبة', w: 0.9, align: 'center' },
      { label: 'الوزن (طن)', w: 1.2, align: 'center' },
      { label: 'الوزن (كجم)', w: 1.2, align: 'center' },
      { label: 'عدد الأسياخ (12م)', w: 1.5, align: 'center' },
      ...(hasPrice ? [{ label: `التكلفة (${s})`, w: 1.4, align: 'center' as const }] : []),
    ],
    rows: diameters.map((d) => [
      { text: `Ø${d.diameter}`, bold: true },
      d.usage,
      `${d.percentage}%`,
      { text: num(d.weightTons, 2), bold: true },
      num(d.weightKg, 0),
      num(d.approxBarsCount, 0),
      ...(hasPrice ? [num(d.weightTons * p.steelPricePerTon, 0)] : []),
    ]),
    footers: [
      {
        label: `إجمالي حديد التسليح  —  ${num(totalKg, 0)} كجم  —  سلك رباط محروق حوالي ${num(tieWire, 0)} كجم`,
        value: `${num(totalTons, 2)} طن`,
        strong: true,
      },
    ],
  });

  /* ---- الملخص ---- */
  const summary: ReportKV[] = [];
  if (p.boqList.length > 0) {
    summary.push({ label: 'إجمالي حجم الخرسانة المسلحة', value: `${num(p.totalBoqVolume, 3)} م³` });
    summary.push({
      label: 'أكياس الأسمنت المطلوبة',
      value: `${num(p.totalBoqMaterials.cementBags, 0)} كيس`,
    });
    summary.push({
      label: 'تكلفة الخرسانة',
      value: p.totalBoqCost.isPriced ? money(p.totalBoqCost.totalCost, cur) : 'حصر كميات فقط',
    });
  }
  summary.push({ label: 'إجمالي حديد التسليح', value: `${num(totalTons, 2)} طن` });
  summary.push({
    label: 'تكلفة حديد التسليح',
    value: p.activeSteelCost > 0 ? money(p.activeSteelCost, cur) : 'حصر كميات فقط',
  });
  const structural = (p.boqList.length > 0 ? p.totalBoqCost.totalCost : 0) + p.activeSteelCost;
  summary.push({
    label: 'إجمالي تكلفة الأعمال الإنشائية المسعّرة',
    value: structural > 0 ? money(structural, cur) : 'حصر كميات فقط',
    strong: true,
  });

  return {
    title: 'حصر الكميات والتكلفة لأعمال الخرسانة وحديد التسليح',
    date: reportDate(pm.reportDate),
    meta,
    sections,
    summaryTitle: 'ملخص الأعمال الإنشائية',
    summary,
    signatures: true,
  };
}

/* ------------------------------------------------------------------ */
/* 3) التقرير الإجمالي                                                  */
/* ------------------------------------------------------------------ */

export interface SummaryReportInput {
  currency: CurrencyCode;
  finishesTotal: number;
  finishesMaterials: number;
  finishesLabor: number;
  finishesItemsCount: number;
  steelTons: number;
  steelCost: number;
  concreteVolume: number;
  concreteCementBags: number;
  concreteCost: number;
  contingencyRate: number;
  contingencyAmount: number;
  directPricedTotal: number;
  grandTotal: number;
}

export function buildSummaryReport(p: SummaryReportInput): ReportData {
  const pm = getProjectMeta();
  const cur = p.currency;
  const s = sym(cur);

  const cols = [
    { label: 'البيان', w: 3.4 },
    { label: 'القيمة', w: 2, align: 'center' as const },
  ];

  const sections: ReportSection[] = [
    {
      title: '1. التشطيبات المعمارية',
      subtitle: 'المباني، المحارة، السباكة، الكهرباء، الأرضيات، الدهانات، النجارة والألوميتال',
      columns: cols,
      rows: [
        ['عدد البنود المحصورة', `${p.finishesItemsCount} بند`],
        ['تكلفة الخامات والمواد', money(p.finishesMaterials, cur)],
        ['أجور العمالة والمصنعيات', money(p.finishesLabor, cur)],
      ],
      footers: [{ label: 'إجمالي التشطيبات', value: money(p.finishesTotal, cur), strong: true }],
    },
    {
      title: '2. حديد التسليح الإنشائي',
      subtitle: 'الأسقف والأعمدة والقواعد وتوزيع الأقطار',
      columns: cols,
      rows: [
        ['إجمالي كمية الحديد', `${num(p.steelTons, 2)} طن`],
        ['سلك رباط محروق (تقديري)', `${num(Math.round(p.steelTons * 22), 0)} كجم`],
        ['حالة التسعير', p.steelCost > 0 ? 'مسعّر' : 'كمية فقط'],
      ],
      footers: [
        {
          label: 'تكلفة شراء الحديد',
          value: p.steelCost > 0 ? money(p.steelCost, cur) : 'حصر كميات فقط',
          strong: true,
        },
      ],
    },
    {
      title: '3. الخرسانة والأسمنت والمواد',
      subtitle: 'حصر الأسمنت والرمل والزلط لجدول المشروع',
      columns: cols,
      rows: [
        ['إجمالي حجم الخرسانة', `${num(p.concreteVolume, 3)} م³`],
        ['أكياس الأسمنت المطلوبة', `${num(p.concreteCementBags, 0)} كيس (50 كجم)`],
      ],
      footers: [
        {
          label: 'تكلفة صب ومواد الخرسانة',
          value: p.concreteCost > 0 ? money(p.concreteCost, cur) : 'حصر كميات فقط',
          strong: true,
        },
      ],
    },
  ];

  const summary: ReportKV[] = [
    { label: 'التكلفة المباشرة للبنود المسعّرة (خامات + مصنعيات)', value: money(p.directPricedTotal, cur) },
    {
      label: `احتياطي طوارئ وهالك غير مرئي (${num(p.contingencyRate, 1)}%)`,
      value: money(p.contingencyAmount, cur),
    },
    { label: 'إجمالي الميزانية الموصى برصدها', value: money(p.grandTotal, cur), strong: true },
  ];

  const meta: ReportKV[] = [...metaFields(pm), { label: 'العملة', value: `${CURRENCIES[cur].name} (${s})` }];

  return {
    title: pm.reportName.trim() || 'تقرير حصر الكميات والتكلفة الإجمالية للمشروع',
    subtitle: 'التشطيبات المعمارية + حديد التسليح + الخرسانة',
    date: reportDate(pm.reportDate),
    meta,
    sections,
    summaryTitle: 'ملخص الميزانية الإجمالية',
    summary,
    signatures: true,
  };
}
