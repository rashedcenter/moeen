import { exportElementToPdf } from './exportPdf';
import { getEntitlement, consumeReport, trackEvent, Entitlement } from '../lib/firebase';

let busy = false;

function fire(name: string, detail?: Entitlement) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

/**
 * تنزيل تقرير PDF مع احتساب رصيد المستخدم:
 * - يجب تسجيل الدخول.
 * - إذا انتهى الرصيد تظهر نافذة التفعيل بدل التنزيل.
 * - يُخصم تقرير واحد فقط بعد نجاح التنزيل.
 * - reportType: نوع التقرير لأغراض الإحصاء (مثل main_summary أو saved_project).
 */
export async function exportReportWithQuota(
  element: HTMLElement | null,
  fileName: string,
  userId?: string | null,
  reportType: string = 'general'
): Promise<void> {
  if (busy) return;
  if (!userId) {
    fire('moeen:login-required');
    trackEvent('report_blocked_login', { report_type: reportType });
    return;
  }

  busy = true;
  try {
    let ent: Entitlement;
    try {
      ent = await getEntitlement(userId);
    } catch (err) {
      console.error('Entitlement check failed', err);
      alert('تعذر التحقق من رصيد التقارير. تأكد من الاتصال بالإنترنت وحاول مرة أخرى.');
      return;
    }

    if (ent.used >= ent.limit) {
      fire('moeen:paywall', ent);
      trackEvent('paywall_shown', { report_type: reportType });
      return;
    }

    const ok = await exportElementToPdf(element, fileName);
    if (!ok) return;

    trackEvent('report_downloaded', { report_type: reportType });

    try {
      const updated = await consumeReport(userId);
      fire('moeen:report-done', updated);
    } catch (err) {
      console.warn('Could not record report usage', err);
    }
  } finally {
    busy = false;
  }
}
