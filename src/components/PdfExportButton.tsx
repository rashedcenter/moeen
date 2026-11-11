import React from 'react';
import html2pdf from 'html2pdf.js';

// تعريف أنواع البيانات المُمَررة للمكون (Props)
interface PdfExportButtonProps {
  /** المرجع الخاص بالعنصر المراد طباعته */
  contentRef: React.RefObject<HTMLDivElement>;
  /** اسم الحاسبة الحالية لتحديده في التذييل واسم الملف */
  calculatorName?: string;
  /** حالة تسجيل دخول المستخدم (True: مسجل دخول, False: غير مسجل) */
  isLoggedIn: boolean;
}

/**
 * مكون زر تصدير PDF المخصص لتطبيق مُعِين البناء والتشطيب
 */
export const PdfExportButton: React.FC<PdfExportButtonProps> = ({
  contentRef,
  calculatorName = "مُعِين البناء والتشطيب - حاسبة جميع بنود الإنشاءات",
  isLoggedIn,
}) => {
  // دالة تنفيذ إنشاء وتنزيل ملف الـ PDF
  const handleGeneratePdf = () => {
    const element = contentRef.current;
    if (!element) {
      console.error('لم يتم العثور على العنصر المراد تصديره.');
      return;
    }

    // إعدادات تصدير ملف الـ PDF مع تحديد الأنواع بدقة لمنع أخطاء TypeScript
    const options = {
      margin:       [10, 10, 15, 10] as [number, number, number, number],
      filename:     `تقرير_${calculatorName.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        logging: false 
      },
      jsPDF:        { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' as const
      }
    };

    // تشغيل مكتبة html2pdf لتوليد وتنزيل الملف
    html2pdf().set(options).from(element).save();
  };

  return (
    <button
      onClick={handleGeneratePdf}
      className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 px-5 rounded-lg shadow transition-all duration-200"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      تحميل التقرير بصيغة PDF
    </button>
  );
};