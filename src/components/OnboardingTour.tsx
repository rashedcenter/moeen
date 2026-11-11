import React, { useEffect, useState } from 'react';
import {
  Building2,
  Layers,
  CheckCircle,
  Coins,
  FolderKanban,
  Printer,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const TOUR_KEY = 'moeen_tour_done';

type Step = {
  icon: React.ReactNode;
  title: string;
  text: string;
};

const STEPS: Step[] = [
  {
    icon: <Building2 className="w-7 h-7" />,
    title: 'أهلًا بك في مُعِين البناء والتشطيب',
    text: 'موقع يساعدك على حساب كميات وتكلفة التشطيبات والخرسانات والحديد، ثم إخراج تقرير جاهز. هذه جولة سريعة من أقل من دقيقة تعرّفك على الأزرار الرئيسية.',
  },
  {
    icon: <Layers className="w-7 h-7" />,
    title: '1. حاسبة ودليل التشطيبات',
    text: 'من هنا تحسب كميات مواد التشطيب وتكلفتها (بلاط، دهانات، أرضيات وغيرها). الأسعار قابلة للتعديل لتناسب السوق عندك.',
  },
  {
    icon: <Building2 className="w-7 h-7" />,
    title: '2. حاسبة الخرسانات والحديد',
    text: 'احسب حجم الخرسانة وعدد أكياس الأسمنت وأطنان الحديد وتكلفتها للعناصر الإنشائية. الحسابات استرشادية ولا تغني عن مراجعة المهندس المختص.',
  },
  {
    icon: <CheckCircle className="w-7 h-7" />,
    title: '3. تقرير الكميات والتكلفة',
    text: 'يجمع نتائج التشطيبات والخرسانات في تقرير واحد بالإجمالي النهائي. ومنه تستطيع حفظ المشروع باسمك.',
  },
  {
    icon: <Coins className="w-7 h-7" />,
    title: 'العملة وسعر الصرف',
    text: 'اختر العملة التي تعمل بها من أعلى الصفحة، ويمكنك ضبط سعر الصرف أو التسعير الحر من زر إعدادات الصرف بجوارها.',
  },
  {
    icon: <FolderKanban className="w-7 h-7" />,
    title: 'حسابي ومشروعاتي',
    text: 'سجّل الدخول لتحفظ مشروعاتك وتعود إليها في أي وقت من أي جهاز. مشروعاتك تظهر لك أنت فقط ولا يراها أحد غيرك.',
  },
  {
    icon: <Printer className="w-7 h-7" />,
    title: 'تنزيل التقرير PDF',
    text: 'زر الطباعة ينزّل التقرير مباشرة كملف PDF على جهازك. لكل حساب 5 تقارير مجانية، وبعدها يمكنك تفعيل باقة جديدة بكود التفعيل.',
  },
];

export const OnboardingTour: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    let done = false;
    try {
      done = localStorage.getItem(TOUR_KEY) === '1';
    } catch {
      /* ignore */
    }
    // لا تظهر في لوحة الأدمن
    const isAdminPage = new URLSearchParams(window.location.search).get('admin') === '1';
    if (done || isAdminPage) return;
    const t = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(t);
  }, []);

  const finish = () => {
    try {
      localStorage.setItem(TOUR_KEY, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const step = STEPS[i];
  const isFirst = i === 0;
  const isLast = i === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-label="جولة تعريفية بالموقع"
    >
      <div
        className="bg-white text-[#1F1F1F] rounded-2xl max-w-md w-full shadow-2xl border-b-4 border-[#B1A06D] overflow-hidden text-right"
        dir="rtl"
      >
        <div className="bg-[#003C69] text-white px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#B1A06D] shrink-0">
              {step.icon}
            </div>
            <h2 className="font-bold text-base sm:text-lg leading-snug">{step.title}</h2>
          </div>
          <button
            type="button"
            onClick={finish}
            aria-label="إغلاق الجولة"
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-200 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm leading-7 text-[#1F1F1F]">{step.text}</p>

          <div className="flex items-center justify-center gap-1.5 mt-5" aria-hidden="true">
            {STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? 'w-6 bg-[#00B050]' : 'w-1.5 bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="px-5 pb-5 flex items-center justify-between gap-3">
          {isLast ? (
            <span className="text-[11px] text-slate-500">{i + 1} / {STEPS.length}</span>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              تخطي الجولة
            </button>
          )}

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setI(i - 1)}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? finish() : setI(i + 1))}
              className="px-4 py-2 rounded-xl bg-[#00B050] hover:bg-[#009b46] text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <span>{isLast ? 'ابدأ الاستخدام' : 'التالي'}</span>
              {!isLast && <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
