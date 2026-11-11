import React from 'react';

const FAQ: { q: string; a: string }[] = [
  {
    q: 'كيف أحسب تكلفة تشطيب شقتي؟',
    a: 'افتح حاسبة التشطيبات، وأدخل مساحات الغرف والبنود التي ستنفذها، وعدّل أسعار الخامات والمصنعية لتناسب السوق عندك، فتظهر لك الكميات والتكلفة الإجمالية. ثم اجمعها مع باقي المشروع في تقرير واحد.',
  },
  {
    q: 'هل نتائج حساب تكلفة البناء والتشطيب دقيقة؟',
    a: 'النتائج تقديرية واسترشادية، وتعتمد على الأسعار والمقاسات التي تدخلها أنت. هي مناسبة للتخطيط وتقدير الميزانية المبدئية، ولا تغني عن المقايسة التفصيلية ومراجعة المهندس المختص قبل التنفيذ.',
  },
  {
    q: 'هل حاسبة البناء والتشطيب مجانية؟',
    a: 'نعم، يمكنك استخدام الحاسبة مجانًا، ويحصل كل حساب على 5 تقارير PDF مجانية. وإن احتجت تقارير أكثر يمكنك تفعيل باقة جديدة بكود التفعيل.',
  },
  {
    q: 'هل يمكنني الحساب بعملة غير الجنيه المصري؟',
    a: 'نعم، يمكنك اختيار العملة التي تعمل بها من أعلى الصفحة، وضبط سعر الصرف أو استخدام التسعير الحر.',
  },
];

export const SeoAbout: React.FC = () => (
  <section
    aria-labelledby="seo-about-title"
    className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-10 no-print"
    dir="rtl"
  >
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 text-right text-[#1F1F1F]">
      <h2 id="seo-about-title" className="text-lg sm:text-xl font-bold text-[#003C69] border-b-2 border-[#B1A06D] pb-2 mb-4">
        حاسبة البناء والتشطيب من مُعِين: ماذا تستطيع أن تحسب؟
      </h2>
      <p className="text-sm leading-7 mb-5">
        مُعِين البناء والتشطيب حاسبة هندسية مجانية أونلاين تساعدك على حساب تكلفة البناء والتشطيب وحصر الكميات
        في دقائق، سواء كنت تخطط لبناء منزل أو تشطيب شقة، أو كنت مهندسًا أو مقاولًا يعدّ مقايسة لمشروع.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div>
          <h3 className="font-bold text-sm text-[#00B050] mb-1">حساب تكلفة التشطيبات</h3>
          <p className="text-xs leading-6">
            حصر كميات التشطيبات وتقدير تكلفة الخامات والمصنعية لبنود مثل أعمال الكهرباء والسباكة والجبسوم بورد والأسقف،
            مع حرية تعديل الأسعار.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-sm text-[#00B050] mb-1">حساب الخرسانة وحديد التسليح</h3>
          <p className="text-xs leading-6">
            حساب حجم الخرسانة وعدد أكياس الأسمنت وأطنان الحديد وتكلفتها للعناصر الإنشائية، كحاسبة استرشادية
            لتقدير الكميات.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-sm text-[#00B050] mb-1">تقرير الكميات والتكلفة</h3>
          <p className="text-xs leading-6">
            تجميع نتائج التشطيبات والخرسانات والحديد في تقرير واحد بالإجمالي النهائي، وتنزيله ملف PDF جاهزًا
            لعرضه على العميل.
          </p>
        </div>
      </div>

      <h3 className="font-bold text-sm text-[#003C69] mb-1">لمن هذه الحاسبة؟</h3>
      <p className="text-xs leading-6 mb-6">
        للأفراد الراغبين في معرفة تكلفة بناء أو تشطيب وحدتهم السكنية مبدئيًا، وللمهندسين المعماريين والإنشائيين،
        وللمقاولين وشركات المقاولات والمكاتب الهندسية التي تحتاج إلى حصر كميات وتقدير تكاليف بسرعة.
      </p>

      <h3 className="font-bold text-sm text-[#003C69] mb-2">أسئلة شائعة</h3>
      <div className="space-y-2">
        {FAQ.map((f) => (
          <details key={f.q} className="group border border-slate-200 rounded-xl px-4 py-2.5">
            <summary className="cursor-pointer text-sm font-bold text-[#1F1F1F] list-none flex items-center justify-between gap-3">
              <span>{f.q}</span>
              <span className="text-[#B1A06D] group-open:rotate-45 transition-transform text-lg leading-none">+</span>
            </summary>
            <p className="text-xs leading-6 mt-2 text-[#1F1F1F]">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);
