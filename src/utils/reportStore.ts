/**
 * مخزن بيانات التقارير: كل قسم في الموقع يسجّل هنا "دالة" تبني بيانات تقريره،
 * وعند الضغط على زر الطباعة يتم بناء ورقة التقرير من هذه البيانات (وليس من شكل الصفحة).
 */

export type ReportCell =
  | string
  | { text: string; sub?: string[]; bold?: boolean; muted?: boolean };

export interface ReportColumn {
  label: string;
  /** وزن عرض العمود (نسبي) */
  w: number;
  align?: 'start' | 'center' | 'end';
}

export interface ReportFooterRow {
  label: string;
  value: string;
  strong?: boolean;
}

export interface ReportSection {
  title: string;
  subtitle?: string;
  columns: ReportColumn[];
  rows: ReportCell[][];
  footers?: ReportFooterRow[];
  note?: string;
}

export interface ReportKV {
  label: string;
  value: string;
  strong?: boolean;
}

export interface ReportData {
  title: string;
  subtitle?: string;
  /** تاريخ التقرير كنص جاهز للعرض */
  date: string;
  meta: ReportKV[];
  sections: ReportSection[];
  summaryTitle?: string;
  summary?: ReportKV[];
  /** يظهر دائماً ما لم يُمنع صراحةً */
  signatures?: boolean;
}

export interface ProjectMeta {
  projectName: string;
  reportName: string;
  ownerName: string;
  location: string;
  reportDate: string;
  customFields: { label: string; value: string }[];
}

type Builder = () => ReportData | null;

const builders: Record<string, Builder> = {};
let metaGetter: (() => ProjectMeta) | null = null;

export function registerReport(key: string, fn: Builder): void {
  builders[key] = fn;
}

export function registerProjectMeta(fn: () => ProjectMeta): void {
  metaGetter = fn;
}

export function getProjectMeta(): ProjectMeta {
  try {
    if (metaGetter) return metaGetter();
  } catch {
    /* ignore */
  }
  return {
    projectName: '',
    reportName: '',
    ownerName: '',
    location: '',
    reportDate: new Date().toISOString().split('T')[0],
    customFields: [],
  };
}

export function getReportData(key: string): ReportData | null {
  const fn = builders[key];
  if (!fn) return null;
  try {
    return fn();
  } catch (e) {
    console.error('report builder failed', e);
    return null;
  }
}

/** لغة الأرقام في التقرير: 'en-US' أرقام 123 — أو 'ar-EG' أرقام ١٢٣ */
const DIGITS_LOCALE = 'en-US';

export function num(n: number, decimals = 2): string {
  if (typeof n !== 'number' || isNaN(n) || !isFinite(n)) return '0';
  return n.toLocaleString(DIGITS_LOCALE, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
}

/** يوحّد شكل الأرقام داخل أي نص (بعض نصوص المواصفات تأتي بأرقام عربية ١٢٣) */
export function localizeDigits(s: string): string {
  if (typeof s !== 'string') return s;
  if (DIGITS_LOCALE.startsWith('ar')) {
    return s.replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
  }
  return s
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/٬/g, ',')
    .replace(/٫/g, '.');
}

export function fmtDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return iso || '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** بيانات المشروع كما تظهر في ترويسة التقرير (الحقول الفارغة تُحذف) */
export function metaFields(meta: ProjectMeta): ReportKV[] {
  const out: ReportKV[] = [];
  if (meta.projectName.trim()) out.push({ label: 'اسم المشروع', value: meta.projectName.trim() });
  if (meta.ownerName.trim()) out.push({ label: 'المالك / العميل', value: meta.ownerName.trim() });
  if (meta.location.trim()) out.push({ label: 'موقع المشروع', value: meta.location.trim() });
  meta.customFields.forEach((f) => {
    if (f.label.trim() && f.value.trim()) out.push({ label: f.label.trim(), value: f.value.trim() });
  });
  return out;
}
