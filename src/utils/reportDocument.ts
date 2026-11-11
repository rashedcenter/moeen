/**
 * يبني "ورقة التقرير" (صفحات A4 حقيقية) من بيانات التقرير، ويقسّمها على الصفحات بذكاء:
 *  - رأس الجدول لا يبقى وحده في آخر الصفحة (يتحرك مع أول صف).
 *  - الصف لا ينقسم أبداً بين صفحتين.
 *  - رأس الجدول يتكرر في كل صفحة جديدة.
 *  - إجمالي القسم يبقى مع آخر صف.
 *  - الملخص + الملاحظة الهندسية + التوقيعات في آخر كل تقرير.
 *  - رقم الصفحة "صفحة n من N" أسفل كل صفحة.
 */
import { CRITICAL_ENGINEERING_DISCLAIMER } from '../data/projectStore';
import {
  ReportCell,
  ReportColumn,
  ReportData,
  ReportSection,
  getReportData,
  localizeDigits,
} from './reportStore';

const PAGE_W = 794; // عرض A4 بالبكسل (96dpi)
const PAGE_H = 1123; // ارتفاع A4 بالبكسل
const SAFE = 3; // هامش أمان في قياس الامتلاء

const BLUE = '#003C69';
const GREEN = '#00B050';
const GOLD = '#B1A06D';
const TEXT = '#1F1F1F';

const CSS = `
.mrp-doc, .mrp-doc * { box-sizing: border-box; margin: 0; padding: 0; letter-spacing: 0 !important; }
.mrp-doc { direction: rtl; font-family: 'Tajawal', 'Segoe UI', Tahoma, Arial, sans-serif; color: ${TEXT}; font-weight: 400; }
.mrp-doc .mrp-page { width: ${PAGE_W}px; height: ${PAGE_H}px; background: #FFFFFF; position: relative; overflow: hidden; display: flex; flex-direction: column; padding: 34px 40px 22px 40px; }
.mrp-doc .mrp-run { display: flex; align-items: center; justify-content: space-between; padding-bottom: 8px; border-bottom: 2px solid ${BLUE}; margin-bottom: 14px; font-size: 11px; color: ${TEXT}; }
.mrp-doc .mrp-run b { color: ${BLUE}; font-weight: 700; }
.mrp-doc .mrp-body { flex: 1 1 auto; min-height: 0; overflow: hidden; }
.mrp-doc .mrp-body > :first-child { padding-top: 0 !important; }
.mrp-doc .mrp-foot { flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between; border-top: 1.5px solid ${GOLD}; padding-top: 7px; margin-top: 8px; font-size: 10px; color: #5B6670; }
.mrp-doc .mrp-foot b { color: ${BLUE}; font-weight: 700; }

.mrp-doc .mrp-logo { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 7px; background: ${BLUE}; color: #FFFFFF; border: 1.5px solid ${GOLD}; font-weight: 700; font-size: 17px; line-height: 1; }
.mrp-doc .mrp-brand { display: flex; align-items: center; gap: 9px; }
.mrp-doc .mrp-brand-t { display: flex; flex-direction: column; line-height: 1.25; }
.mrp-doc .mrp-brand-t b { font-size: 15px; font-weight: 700; }
.mrp-doc .mrp-brand-t span { font-size: 10px; opacity: .85; }

.mrp-doc .mrp-hero-bar { display: flex; align-items: center; justify-content: space-between; background: ${BLUE}; color: #FFFFFF; padding: 12px 16px; border-radius: 10px 10px 0 0; border-bottom: 3px solid ${GREEN}; }
.mrp-doc .mrp-hero-date { text-align: left; font-size: 10.5px; line-height: 1.4; }
.mrp-doc .mrp-hero-date b { display: block; font-size: 13px; font-weight: 700; }
.mrp-doc .mrp-title-box { padding: 16px 4px 10px 4px; }
.mrp-doc .mrp-title { font-size: 21px; font-weight: 700; color: ${BLUE}; line-height: 1.45; }
.mrp-doc .mrp-subtitle { font-size: 12px; color: #5B6670; margin-top: 2px; }
.mrp-doc .mrp-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border: 1px solid #D5DCE3; border-radius: 8px; overflow: hidden; background: #FFFFFF; }
.mrp-doc .mrp-meta-i { padding: 7px 11px; border-bottom: 1px solid #E5EAEF; border-left: 1px solid #E5EAEF; min-width: 0; }
.mrp-doc .mrp-meta-i span { display: block; font-size: 9.5px; color: #5B6670; line-height: 1.4; }
.mrp-doc .mrp-meta-i b { display: block; font-size: 11.5px; font-weight: 700; color: ${TEXT}; line-height: 1.5; word-break: break-word; }

.mrp-doc .mrp-gap { padding-top: 16px; }
.mrp-doc .mrp-stitle { display: flex; align-items: flex-start; gap: 8px; padding-bottom: 7px; }
.mrp-doc .mrp-stitle i { display: block; flex: 0 0 5px; width: 5px; align-self: stretch; min-height: 18px; background: ${GREEN}; border-radius: 2px; }
.mrp-doc .mrp-stitle b { display: block; font-size: 14px; font-weight: 700; color: ${BLUE}; line-height: 1.5; }
.mrp-doc .mrp-stitle span { display: block; font-size: 10px; color: #5B6670; line-height: 1.5; }

.mrp-doc .mrp-row { display: flex; align-items: stretch; border-bottom: 1px solid #E0E6EC; font-size: 11px; line-height: 1.55; }
.mrp-doc .mrp-row.z { background: #F5F8FB; }
.mrp-doc .mrp-c { padding: 5px 7px; min-width: 0; word-break: break-word; overflow-wrap: anywhere; }
.mrp-doc .mrp-c.center { text-align: center; }
.mrp-doc .mrp-c.end { text-align: left; }
.mrp-doc .mrp-b { font-weight: 700; }
.mrp-doc .mrp-m { color: #7A858F; }
.mrp-doc .mrp-sub { font-size: 9.5px; color: #5B6670; line-height: 1.5; }
.mrp-doc .mrp-head { display: flex; align-items: stretch; background: ${BLUE}; color: #FFFFFF; font-size: 10.5px; font-weight: 700; line-height: 1.4; border-radius: 4px 4px 0 0; }
.mrp-doc .mrp-head .mrp-c { padding: 7px 7px; }
.mrp-doc .mrp-foot-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #E6EEF5; border-top: 1.5px solid ${BLUE}; padding: 7px 10px; font-size: 11.5px; font-weight: 700; color: ${BLUE}; }
.mrp-doc .mrp-foot-row.strong { background: ${BLUE}; color: #FFFFFF; border-top: 0; border-bottom: 3px solid ${GOLD}; }
.mrp-doc .mrp-foot-row .v { white-space: nowrap; }
.mrp-doc .mrp-note { margin-top: 7px; padding: 7px 10px; background: #F0FAF4; border-right: 3px solid ${GREEN}; font-size: 10px; line-height: 1.65; color: ${TEXT}; }

.mrp-doc .mrp-kv { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 6px 10px; border-bottom: 1px solid #E0E6EC; font-size: 11.5px; }
.mrp-doc .mrp-kv.z { background: #F5F8FB; }
.mrp-doc .mrp-kv .v { font-weight: 700; white-space: nowrap; }
.mrp-doc .mrp-kv.strong { background: ${BLUE}; color: #FFFFFF; font-size: 13px; font-weight: 700; border-bottom: 3px solid ${GOLD}; padding: 9px 10px; }

.mrp-doc .mrp-disc { margin-top: 0; padding: 9px 12px; background: #FAF7EF; border: 1px solid ${GOLD}; border-radius: 7px; font-size: 10.5px; line-height: 1.8; color: ${TEXT}; }
.mrp-doc .mrp-disc b { color: ${BLUE}; font-weight: 700; }
.mrp-doc .mrp-sigs { display: flex; gap: 18px; margin-top: 12px; }
.mrp-doc .mrp-sig { flex: 1 1 0; border: 1px solid #D5DCE3; border-radius: 8px; padding: 10px 12px 9px 12px; text-align: center; background: #FFFFFF; }
.mrp-doc .mrp-sig b { display: block; font-size: 12px; font-weight: 700; color: ${BLUE}; }
.mrp-doc .mrp-sig .ln { height: 52px; border-bottom: 1.5px dashed #8A949E; margin: 0 14px 6px 14px; }
.mrp-doc .mrp-sig span { font-size: 10px; color: #5B6670; }
`;

/* ---------- أدوات DOM صغيرة ---------- */

function div(cls = '', text?: string): HTMLDivElement {
  const d = document.createElement('div');
  if (cls) d.className = cls;
  if (text !== undefined) d.textContent = text;
  return d;
}

function alignClass(a?: ReportColumn['align']): string {
  return a === 'center' ? ' center' : a === 'end' ? ' end' : '';
}

function cellEl(c: ReportCell, col: ReportColumn): HTMLElement {
  const d = div('mrp-c' + alignClass(col.align));
  d.style.flex = `${col.w} 1 0`;
  if (typeof c === 'string') {
    d.textContent = c;
    return d;
  }
  const t = div((c.bold ? 'mrp-b ' : '') + (c.muted ? 'mrp-m' : ''), c.text);
  d.appendChild(t);
  (c.sub || []).forEach((s) => d.appendChild(div('mrp-sub', s)));
  return d;
}

function rowEl(cells: ReportCell[], cols: ReportColumn[], idx: number): HTMLElement {
  const r = div('mrp-row' + (idx % 2 === 1 ? ' z' : ''));
  cols.forEach((col, i) => r.appendChild(cellEl(cells[i] ?? '', col)));
  return r;
}

function headEl(cols: ReportColumn[]): HTMLElement {
  const h = div('mrp-head');
  cols.forEach((col) => {
    const c = div('mrp-c' + alignClass(col.align), col.label);
    c.style.flex = `${col.w} 1 0`;
    h.appendChild(c);
  });
  return h;
}

function titleEl(title: string, subtitle?: string): HTMLElement {
  const t = div('mrp-stitle');
  t.appendChild(document.createElement('i'));
  const box = div();
  box.appendChild(Object.assign(document.createElement('b'), { textContent: title }));
  if (subtitle) box.appendChild(Object.assign(document.createElement('span'), { textContent: subtitle }));
  t.appendChild(box);
  return t;
}

function footRowEl(label: string, value: string, strong?: boolean): HTMLElement {
  const f = div('mrp-foot-row' + (strong ? ' strong' : ''));
  f.appendChild(div('', label));
  f.appendChild(div('v', value));
  return f;
}

/* ---------- الصفحات ---------- */

interface Cursor {
  page: HTMLElement;
  body: HTMLElement;
}

function brandMini(): HTMLElement {
  const b = div('mrp-brand');
  b.appendChild(div('mrp-logo', 'م'));
  const t = div('mrp-brand-t');
  t.appendChild(Object.assign(document.createElement('b'), { textContent: 'مُعِين البناء والتشطيب' }));
  b.appendChild(t);
  return b;
}

function buildHero(data: ReportData): HTMLElement {
  const hero = div();
  const bar = div('mrp-hero-bar');
  const brand = div('mrp-brand');
  brand.appendChild(div('mrp-logo', 'م'));
  const bt = div('mrp-brand-t');
  bt.appendChild(Object.assign(document.createElement('b'), { textContent: 'مُعِين البناء والتشطيب' }));
  bt.appendChild(Object.assign(document.createElement('span'), { textContent: 'حاسبات وتقارير حصر الكميات والتكلفة' }));
  brand.appendChild(bt);
  bar.appendChild(brand);
  const dt = div('mrp-hero-date');
  dt.appendChild(document.createTextNode('تاريخ التقرير'));
  dt.appendChild(Object.assign(document.createElement('b'), { textContent: data.date }));
  bar.appendChild(dt);
  hero.appendChild(bar);

  const tb = div('mrp-title-box');
  tb.appendChild(div('mrp-title', data.title));
  if (data.subtitle) tb.appendChild(div('mrp-subtitle', data.subtitle));
  hero.appendChild(tb);

  if (data.meta.length) {
    const grid = div('mrp-meta');
    data.meta.forEach((m) => {
      const it = div('mrp-meta-i');
      it.appendChild(Object.assign(document.createElement('span'), { textContent: m.label }));
      it.appendChild(Object.assign(document.createElement('b'), { textContent: m.value }));
      grid.appendChild(it);
    });
    hero.appendChild(grid);
  }
  return hero;
}

function buildSummary(data: ReportData): HTMLElement | null {
  if (!data.summary || !data.summary.length) return null;
  const blk = div('mrp-gap');
  blk.appendChild(titleEl(data.summaryTitle || 'الملخص'));
  data.summary.forEach((kv, i) => {
    const r = div('mrp-kv' + (kv.strong ? ' strong' : i % 2 === 1 ? ' z' : ''));
    r.appendChild(div('', kv.label));
    r.appendChild(div('v', kv.value));
    blk.appendChild(r);
  });
  return blk;
}

function buildEnd(data: ReportData): HTMLElement {
  const blk = div('mrp-gap');
  const disc = div('mrp-disc');
  disc.appendChild(Object.assign(document.createElement('b'), { textContent: 'ملاحظة هندسية هامة: ' }));
  disc.appendChild(document.createTextNode(localizeDigits(CRITICAL_ENGINEERING_DISCLAIMER).replace(/^ملاحظة هامة جداً جداً:\s*/, '')));
  blk.appendChild(disc);

  if (data.signatures !== false) {
    const sigs = div('mrp-sigs');
    [
      ['اعتماد المهندس الاستشاري / المشرف', 'التوقيع والخاتم'],
      ['اعتماد مالك المشروع / العميل', 'التوقيع بالاستلام والموافقة'],
    ].forEach(([a, b]) => {
      const s = div('mrp-sig');
      s.appendChild(Object.assign(document.createElement('b'), { textContent: a }));
      s.appendChild(div('ln'));
      s.appendChild(Object.assign(document.createElement('span'), { textContent: b }));
      sigs.appendChild(s);
    });
    blk.appendChild(sigs);
  }
  return blk;
}

function paginate(root: HTMLElement, data: ReportData): number {
  const pages: HTMLElement[] = [];
  const state: { cur: Cursor } = { cur: null as unknown as Cursor };

  const newPage = (): void => {
    const page = div('mrp-page');
    page.setAttribute('data-mrp-page', '1');
    if (pages.length > 0) {
      const run = div('mrp-run');
      run.appendChild(brandMini());
      const info = div();
      const b = Object.assign(document.createElement('b'), { textContent: data.title });
      info.appendChild(b);
      const proj = data.meta.find((m) => m.label === 'اسم المشروع');
      if (proj) info.appendChild(document.createTextNode('  |  ' + proj.value));
      run.appendChild(info);
      page.appendChild(run);
    }
    const body = div('mrp-body');
    page.appendChild(body);
    const foot = div('mrp-foot');
    const left = div();
    left.appendChild(Object.assign(document.createElement('b'), { textContent: 'مُعِين البناء والتشطيب' }));
    left.appendChild(document.createTextNode('  —  تقرير استرشادي، والكميات المعتمدة هي الواردة بالمخططات'));
    foot.appendChild(left);
    const pn = div();
    pn.setAttribute('data-pn', '1');
    foot.appendChild(pn);
    page.appendChild(foot);
    root.appendChild(page);
    pages.push(page);
    state.cur = { page, body };
  };

  const fits = (): boolean => {
    const c = state.cur;
    const last = c.body.lastElementChild as HTMLElement | null;
    if (!last) return true;
    return last.getBoundingClientRect().bottom <= c.body.getBoundingClientRect().bottom - SAFE;
  };

  /** يضيف عنصراً كاملاً؛ إن لم يتّسع ينتقل لصفحة جديدة */
  const put = (el: HTMLElement): void => {
    state.cur.body.appendChild(el);
    if (fits()) return;
    el.remove();
    newPage();
    state.cur.body.appendChild(el);
  };

  const makeFrag = (sec: ReportSection, continued: boolean): HTMLElement => {
    const f = div(continued ? '' : 'mrp-gap');
    f.appendChild(titleEl(continued ? `${sec.title} (تابع)` : sec.title, continued ? undefined : sec.subtitle));
    f.appendChild(headEl(sec.columns));
    return f;
  };

  const placeSection = (sec: ReportSection): void => {
    const n = sec.rows.length;
    if (n === 0) return;

    // وحدات الصفوف: كل صف وحدة، وآخر وحدة = آخر صف + الإجماليات + الملاحظة
    const units: HTMLElement[] = [];
    sec.rows.forEach((r, i) => {
      const re = rowEl(r, sec.columns, i);
      if (i < n - 1) {
        units.push(re);
        return;
      }
      const g = div();
      g.appendChild(re);
      (sec.footers || []).forEach((f) => g.appendChild(footRowEl(f.label, f.value, f.strong)));
      if (sec.note) g.appendChild(div('mrp-note', sec.note));
      units.push(g);
    });

    // أول وحدة تتحرك مع العنوان ورأس الجدول معاً
    let frag = makeFrag(sec, false);
    // الوحدة الأولى تُضاف داخل الجزء نفسه (قبل القياس)
    frag.appendChild(units[0]);
    put(frag);

    for (let i = 1; i < units.length; i++) {
      const u = units[i];
      frag.appendChild(u);
      if (fits()) continue;
      u.remove();
      newPage();
      frag = makeFrag(sec, true);
      frag.appendChild(u);
      state.cur.body.appendChild(frag);
    }
  };

  newPage();
  put(buildHero(data));
  data.sections.forEach(placeSection);

  // الملخص + الملاحظة + التوقيعات تبقى معاً في نفس الصفحة
  const sum = buildSummary(data);
  const end = buildEnd(data);
  const body = state.cur.body;
  if (sum) body.appendChild(sum);
  body.appendChild(end);
  if (!fits()) {
    if (sum) sum.remove();
    end.remove();
    newPage();
    const nb = state.cur.body;
    if (sum) nb.appendChild(sum);
    nb.appendChild(end);
  }

  // ترقيم الصفحات
  const total = pages.length;
  pages.forEach((p, i) => {
    const pn = p.querySelector('[data-pn]');
    if (pn) pn.textContent = `صفحة ${i + 1} من ${total}`;
  });
  return total;
}

async function loadFonts(): Promise<void> {
  try {
    if (document.fonts && document.fonts.load) {
      const sample = 'مرحبا أبجد هوز 0123456789';
      await Promise.all([
        document.fonts.load('400 12px Tajawal', sample),
        document.fonts.load('700 12px Tajawal', sample),
      ]);
      if (document.fonts.ready) await document.fonts.ready;
    }
  } catch {
    /* الخط الاحتياطي يكفي */
  }
}

/**
 * يبني ورقة التقرير خارج الشاشة ويرجعها (أو null إن لم يكن هناك تقرير لهذا القسم).
 * على المستدعي حذف العنصر بعد التصدير: doc.remove()
 */
function deepLocalize<T>(v: T): T {
  if (typeof v === 'string') return localizeDigits(v) as unknown as T;
  if (Array.isArray(v)) return v.map((x) => deepLocalize(x)) as unknown as T;
  if (v && typeof v === 'object') {
    const o: Record<string, unknown> = {};
    Object.entries(v as Record<string, unknown>).forEach(([k, x]) => (o[k] = deepLocalize(x)));
    return o as T;
  }
  return v;
}

export async function buildReportDocument(key: string): Promise<HTMLElement | null> {
  const raw = getReportData(key);
  if (!raw) return null;
  const data = deepLocalize(raw);
  await loadFonts();

  const root = document.createElement('div');
  root.className = 'mrp-doc';
  root.setAttribute('data-mrp-doc', '1');
  root.setAttribute('dir', 'rtl');
  root.style.cssText = `position:absolute;top:-200000px;left:0;width:${PAGE_W}px;pointer-events:none;`;
  const st = document.createElement('style');
  st.textContent = CSS;
  root.appendChild(st);
  document.body.appendChild(root);

  try {
    paginate(root, data);
  } catch (e) {
    root.remove();
    throw e;
  }
  return root;
}
