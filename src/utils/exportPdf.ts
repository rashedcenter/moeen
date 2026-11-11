import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

/**
 * تصدير عنصر من الصفحة إلى ملف PDF (A4) وتنزيله مباشرة على الجهاز.
 * يرجع true عند نجاح التنزيل، وfalse عند الفشل.
 */
export async function exportElementToPdf(
  element: HTMLElement | null,
  fileName = 'تقرير-معين-البناء'
): Promise<boolean> {
  if (!element) {
    alert('لم يتم العثور على محتوى التقرير.');
    return false;
  }

  /*mrp-pages*/
  // ورقة التقرير المبنية من البيانات: كل صفحة A4 تُصوَّر وحدها
  if (element.hasAttribute('data-mrp-doc')) {
    return exportReportPages(element, fileName);
  }

  const SCALE = 2;
  const MARKER = 'data-pdf-root';
  const breakBlocks: { top: number; bottom: number }[] = [];

  document.body.style.cursor = 'progress';
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    element.setAttribute(MARKER, '1');

    const canvas = await html2canvas(element, {
      scale: SCALE,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      windowWidth: 1200,
      onclone: (clonedDoc) => {
        const root = clonedDoc.querySelector(`[${MARKER}]`) as HTMLElement | null;
        if (!root) return;

        // إلغاء المسافة بين الحروف حتى لا تنفصل الحروف العربية
        const fix = clonedDoc.createElement('style');
        fix.textContent = '* { letter-spacing: 0 !important; }';
        clonedDoc.head.appendChild(fix);

        /*report-titles*/
        // تنظيف رؤوس التقرير: إزالة "القسم الأول/الثاني/الثالث" وكلمة "حاسبة" وإعطاء عنوان مناسب لكل تقرير
        {
          const SECTION_RE = /^\s*القسم\s+(الأول|الثاني|الثالث|الرابع)/;
          const cands = Array.from(
            root.querySelectorAll<HTMLElement>('span, div, p, small, h2, h3')
          ).filter((e) => {
            const t = (e.textContent || '').trim();
            return t.length < 140 && SECTION_RE.test(t);
          });
          cands.forEach((e) => {
            if (cands.some((o) => o !== e && o.contains(e))) return;
            e.remove();
          });

          const TITLES: [string, string][] = [
            ['تقرير المقايسة التنفيذي', 'تقرير حصر الكميات والتكلفة الإجمالية للمشروع'],
            ['حاسبة ودليل التشطيبات', 'حصر الكميات والمواصفات والتكلفة لبنود التشطيبات'],
            ['حاسبة ودليل الخرسانات', 'حصر الكميات والتكلفة لأعمال الخرسانة وحديد التسليح'],
          ];
          const today = new Date().toLocaleDateString('ar-EG');
          root.querySelectorAll<HTMLElement>('h1, h2, h3').forEach((h) => {
            const t = (h.textContent || '').trim();
            if (t.length > 120) return;
            const hit = TITLES.find(([key]) => t.includes(key));
            if (!hit) return;
            h.textContent = hit[1];
            const next = h.nextElementSibling as HTMLElement | null;
            if (next && next.tagName === 'P') {
              next.textContent = 'تقرير استرشادي صادر من مُعِين البناء والتشطيب بتاريخ ' + today;
            }
          });
        }

        /*inputs-fix*/
        // استبدال خانات الإدخال (الكمية والسعر ...) بنص ثابت يحمل قيمتها الحالية حتى تظهر في الـ PDF
        {
          const SEL = 'input, textarea, select';
          const SKIP = ['checkbox', 'radio', 'hidden', 'button', 'submit', 'reset', 'range', 'file', 'color', 'image'];
          const liveEls = Array.from((element as HTMLElement).querySelectorAll<HTMLElement>(SEL));
          const cloneEls = Array.from(root.querySelectorAll<HTMLElement>(SEL));
          cloneEls.forEach((c, i) => {
            const l = (liveEls.length === cloneEls.length ? liveEls[i] : null) as
              | HTMLInputElement
              | HTMLTextAreaElement
              | HTMLSelectElement
              | null;
            const src = (l || c) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            if (src instanceof HTMLInputElement && SKIP.includes(src.type)) return;
            let text = '';
            if (src instanceof HTMLSelectElement) {
              text = src.selectedOptions && src.selectedOptions[0] ? src.selectedOptions[0].text : '';
            } else {
              text = src.value || '';
            }
            const align = l ? getComputedStyle(l).textAlign : 'start';
            const color = l ? getComputedStyle(l).color : '';
            const box = clonedDoc.createElement('div');
            box.className = c.className;
            box.style.cssText = c.style.cssText;
            box.style.display = 'flex';
            box.style.alignItems = 'center';
            box.style.overflow = 'visible';
            const span = clonedDoc.createElement('span');
            span.textContent = text;
            span.style.width = '100%';
            span.style.textAlign = align;
            span.style.whiteSpace = 'pre-wrap';
            span.style.wordBreak = 'break-word';
            if (color) span.style.color = color;
            box.appendChild(span);
            c.parentNode?.replaceChild(box, c);
          });
        }

        let p: HTMLElement | null = root;
        while (p) {
          p.style.overflow = 'visible';
          p.style.maxHeight = 'none';
          if (p !== root) p.style.height = 'auto';
          p = p.parentElement;
        }

        root
          .querySelectorAll<HTMLElement>('.no-print, button')
          .forEach((n) => (n.style.display = 'none'));

        const rootTop = root.getBoundingClientRect().top;
        root
          .querySelectorAll<HTMLElement>('tr, section, [data-pdf-block]')
          .forEach((n) => {
            const r = n.getBoundingClientRect();
            if (r.height > 0) {
              breakBlocks.push({
                top: (r.top - rootTop) * SCALE,
                bottom: (r.bottom - rootTop) * SCALE,
              });
            }
          });
      },
    });

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const margin = 10;
    const contentW = 210 - margin * 2;
    const contentH = 297 - margin * 2;
    const mmPerPx = contentW / canvas.width;
    const pageHpx = Math.floor(contentH / mmPerPx);

    let y = 0;
    let first = true;
    while (y < canvas.height - 1) {
      let end = Math.min(y + pageHpx, canvas.height);

      if (end < canvas.height) {
        let best = end;
        for (const b of breakBlocks) {
          const fits = b.bottom - b.top < pageHpx * 0.9;
          if (fits && b.top > y + 20 && b.top < end && b.bottom > end) {
            if (b.top < best) best = b.top;
          }
        }
        end = Math.floor(best);
      }

      const sliceH = end - y;
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = sliceH;
      const ctx = slice.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

      if (!first) pdf.addPage();
      first = false;
      pdf.addImage(
        slice.toDataURL('image/jpeg', 0.95),
        'JPEG',
        margin,
        margin,
        contentW,
        sliceH * mmPerPx
      );
      y = end;
    }

    const safe = fileName.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '-');
    pdf.save(`${safe}.pdf`);
    return true;
  } catch (err) {
    console.error('PDF export failed', err);
    alert('تعذر إنشاء ملف PDF. حاول مرة أخرى.');
    return false;
  } finally {
    element.removeAttribute(MARKER);
    document.body.style.cursor = '';
  }
}

/**
 * تصدير ورقة التقرير (صفحات A4 جاهزة) إلى PDF: كل صفحة تُلتقط منفصلة وتوضع كاملة في صفحة PDF.
 */
async function exportReportPages(root: HTMLElement, fileName: string): Promise<boolean> {
  document.body.style.cursor = 'progress';
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    const pages = Array.from(root.querySelectorAll<HTMLElement>('[data-mrp-page]'));
    if (pages.length === 0) throw new Error('empty report');

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      page.setAttribute('data-mrp-target', '1');
      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(page, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
          windowWidth: 794,
          windowHeight: 1123,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc) => {
            const target = clonedDoc.querySelector('[data-mrp-target]') as HTMLElement | null;
            if (!target) return;
            const docRoot = target.closest('[data-mrp-doc]') as HTMLElement | null;
            if (!docRoot) return;
            // نُبقي الصفحة المطلوبة فقط، ونحذف باقي الصفحات وباقي الموقع من النسخة
            docRoot.querySelectorAll('[data-mrp-page]').forEach((pg) => {
              if (pg !== target) pg.remove();
            });
            Array.from(clonedDoc.body.children).forEach((ch) => {
              if (ch !== docRoot) ch.remove();
            });
            docRoot.style.top = '0px';
            docRoot.style.left = '0px';
            let a: HTMLElement | null = docRoot;
            while (a) {
              a.style.overflow = 'visible';
              a.style.maxHeight = 'none';
              if (a !== docRoot) a.style.height = 'auto';
              a = a.parentElement;
            }
          },
        });
      } finally {
        page.removeAttribute('data-mrp-target');
      }
      if (i > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, 210, 297);
    }

    const safe = fileName.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '-');
    pdf.save(`${safe}.pdf`);
    return true;
  } catch (err) {
    console.error('PDF export failed', err);
    alert('تعذر إنشاء ملف PDF. حاول مرة أخرى.');
    return false;
  } finally {
    document.body.style.cursor = '';
  }
}
