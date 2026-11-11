import React, { useState, useEffect } from 'react';
import { CurrencyCode, CustomProjectField, UserProfile, SavedProject } from '../types';
import { formatCurrency, formatNumber, CURRENCIES } from '../data/currencies';
import {
  CRITICAL_ENGINEERING_DISCLAIMER,
  saveProject,
} from '../data/projectStore';
import {
  CheckCircle,
  FileText,
  Printer,
  Copy,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  Building,
  Layers,
  Compass,
  Tag,
  Info,
  Save,
  Plus,
  Trash2,
  FolderKanban,
  MapPin,
  User,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FilePlus,
  Unlink,
} from 'lucide-react';

import { registerProjectMeta, registerReport } from '../utils/reportStore';
import { buildSummaryReport } from '../utils/reportBuilders';

interface ProjectSummaryProps {
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
  onPrint: () => void;
  currentUser?: UserProfile | null;
  onOpenProjects?: () => void;
  onOpenAccount?: () => void;
  onProjectsUpdated?: () => void;
  activeProject?: SavedProject | null;
  onProjectSaved?: (project: SavedProject) => void;
  onUnlinkActiveProject?: () => void;
  onMarkDirty?: () => void;
}

export const ProjectSummaryView: React.FC<ProjectSummaryProps> = ({
  currency,
  finishesTotal,
  finishesMaterials,
  finishesLabor,
  finishesItemsCount,
  steelTons,
  steelCost,
  concreteVolume,
  concreteCementBags,
  concreteCost,
  onPrint,
  currentUser,
  onOpenProjects,
  onOpenAccount,
  onProjectsUpdated,
  activeProject,
  onProjectSaved,
  onUnlinkActiveProject,
  onMarkDirty,
}) => {
  const [contingencyRate, setContingencyRate] = useState<number>(10);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Project Identity Form Fields
  const [projectName, setProjectName] = useState<string>('مشروع فيلا سكنية - تشطيب وبناء');
  const [reportName, setReportName] = useState<string>('مقايسة حصر الكميات والتكلفة الإجمالي');
  const [ownerName, setOwnerName] = useState<string>('');
  const [location, setLocation] = useState<string>('القاهرة الجديدة');
  const [reportDate, setReportDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isMetaExpanded, setIsMetaExpanded] = useState<boolean>(true);

  // Dynamic user-defined custom fields
  const [customFields, setCustomFields] = useState<CustomProjectField[]>([
    { id: 'f_default_1', label: 'رقم القطعة / المبنى', value: '' },
    { id: 'f_default_2', label: 'المهندس المشرف', value: currentUser?.name || '' },
  ]);

  // Sync state whenever an activeProject is loaded or changed
  useEffect(() => {
    if (activeProject) {
      setProjectName(activeProject.projectName);
      setReportName(activeProject.reportName || 'مقايسة حصر الكميات والتكلفة الإجمالي');
      setOwnerName(activeProject.ownerName || '');
      setLocation(activeProject.location || '');
      setReportDate(activeProject.date || new Date().toISOString().split('T')[0]);
      setCustomFields(activeProject.customFields ? [...activeProject.customFields] : []);
      if (activeProject.contingencyRate !== undefined) {
        setContingencyRate(activeProject.contingencyRate);
      }
    }
  }, [activeProject]);

  // Overall grand total of priced items
  const directPricedTotal = finishesTotal + steelCost + (concreteCost || 0);
  const contingencyAmount = Math.round(directPricedTotal * (contingencyRate / 100));
  const grandTotal = directPricedTotal + contingencyAmount;

  // Add custom field
  /*mrp-reg*/
  // تسجيل بيانات المشروع وتقرير الطباعة (يتحدث مع كل تغيير)
  useEffect(() => {
    registerProjectMeta(() => ({
      projectName,
      reportName,
      ownerName,
      location,
      reportDate,
      customFields: customFields.map((f) => ({ label: f.label, value: f.value })),
    }));
    registerReport('summary', () =>
      buildSummaryReport({
        currency,
        finishesTotal,
        finishesMaterials,
        finishesLabor,
        finishesItemsCount,
        steelTons,
        steelCost,
        concreteVolume,
        concreteCementBags,
        concreteCost,
        contingencyRate,
        contingencyAmount,
        directPricedTotal,
        grandTotal,
      })
    );
  });

  const handleAddCustomField = () => {
    const newField: CustomProjectField = {
      id: `cf_${Date.now()}`,
      label: 'بيان إضافي',
      value: '',
    };
    setCustomFields([...customFields, newField]);
    onMarkDirty?.();
  };

  const handleUpdateCustomField = (index: number, key: 'label' | 'value', val: string) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], [key]: val };
    setCustomFields(updated);
    onMarkDirty?.();
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
    onMarkDirty?.();
  };

  // Save report into user's projects: updates the same project if active, or creates new
  const handleSaveToSameProject = () => {
    if (!projectName.trim()) {
      alert('يرجى كتابة اسم المشروع لحفظه.');
      return;
    }

    const payload = {
      id: activeProject?.id,
      userId: currentUser?.id,
      projectName: projectName.trim(),
      reportName: reportName.trim() || 'مقايسة حصر الكميات والتكلفة',
      ownerName: ownerName.trim() || 'غير محدد',
      location: location.trim() || 'غير محدد',
      date: reportDate,
      customFields: customFields.filter((f) => f.label.trim() !== ''),
      currency,
      finishesTotal,
      finishesMaterials,
      finishesLabor,
      finishesItemsCount,
      steelTons,
      steelCost,
      concreteVolume,
      concreteCementBags,
      concreteCost,
      contingencyRate,
      grandTotal,
      notes: activeProject
        ? `تم تحديث المشروع في ${new Date().toLocaleDateString('ar-EG')}`
        : `تم الحفظ في ${new Date().toLocaleDateString('ar-EG')}`,
    };

    const saved = saveProject(payload);

    if (onProjectsUpdated) {
      onProjectsUpdated();
    }
    if (onProjectSaved) {
      onProjectSaved(saved);
    }

    setSavedSuccess(
      activeProject
        ? `تم حفظ التعديلات بنجاح على نفس المشروع: "${saved.projectName}"`
        : `تم حفظ مشروع "${saved.projectName}" بنجاح في قائمة مشروعاتك!`
    );
    setTimeout(() => setSavedSuccess(null), 4000);
  };

  // Save as a new duplicate copy
  const handleSaveAsNewCopy = () => {
    if (!projectName.trim()) {
      alert('يرجى كتابة اسم المشروع لحفظه.');
      return;
    }

    const copyName = `${projectName} (نسخة جديدة)`;
    const newProj = saveProject({
      userId: currentUser?.id,
      projectName: copyName,
      reportName: reportName.trim() || 'مقايسة حصر الكميات والتكلفة',
      ownerName: ownerName.trim() || 'غير محدد',
      location: location.trim() || 'غير محدد',
      date: reportDate,
      customFields: customFields.filter((f) => f.label.trim() !== ''),
      currency,
      finishesTotal,
      finishesMaterials,
      finishesLabor,
      finishesItemsCount,
      steelTons,
      steelCost,
      concreteVolume,
      concreteCementBags,
      concreteCost,
      contingencyRate,
      grandTotal,
      notes: `نسخة منبثقة ومكررة من ${activeProject ? activeProject.projectName : projectName}`,
    });

    if (onProjectsUpdated) {
      onProjectsUpdated();
    }
    if (onProjectSaved) {
      onProjectSaved(newProj);
    }

    setSavedSuccess(`تم إنشاء وحفظ نسخة جديدة منفصلة: "${newProj.projectName}" بنجاح!`);
    setTimeout(() => setSavedSuccess(null), 4000);
  };

  const handleCopyReport = () => {
    const lines = [
      `المخرج النهائي: ${reportName}`,
      '==============================================================',
      `اسم المشروع: ${projectName}`,
      `مالك المشروع: ${ownerName || 'غير محدد'}`,
      `مكان المشروع: ${location || 'غير محدد'}`,
      `تاريخ التقرير: ${reportDate}`,
      `العملة: ${CURRENCIES[currency].name} (${CURRENCIES[currency].symbol})`,
      '',
      customFields.length > 0 ? 'بيانات إضافية عن المشروع:' : '',
      ...customFields
        .filter((f) => f.label && f.value)
        .map((f) => `   - ${f.label}: ${f.value}`),
      customFields.length > 0 ? '' : '',
      '1. حصر وتكاليف قسم التشطيبات المعمارية:',
      `   - إجمالي تكلفة البنود المسعرة: ${finishesTotal > 0 ? formatCurrency(finishesTotal, currency) : 'حصر كميات فقط'}`,
      `   - تكلفة الخامات والمواد: ${formatCurrency(finishesMaterials, currency)}`,
      `   - أجور العمالة والمصنعيات: ${formatCurrency(finishesLabor, currency)}`,
      `   - إجمالي عدد بنود التشطيبات المحصورة: ${finishesItemsCount} بنداً`,
      '',
      '2. حصر وتكاليف قسم حديد التسليح الإنشائي:',
      `   - إجمالي كمية الحديد التقديرية: ${formatNumber(steelTons, 2)} طن`,
      `   - سلك رباط محروق: حوالي ${Math.round(steelTons * 22)} كجم`,
      `   - التكلفة المقدرة لشراء الحديد: ${steelCost > 0 ? formatCurrency(steelCost, currency) : 'كمية فقط (غير مسعّر)'}`,
      '',
      '3. حصر وتكاليف قسم الخرسانات ومواد البناء:',
      `   - حجم الخرسانة المسلحة المحصورة: ${formatNumber(concreteVolume, 3)} م³`,
      `   - عدد أكياس الأسمنت المطلوبة: ${concreteCementBags} كيس (50 كجم)`,
      `   - تكلفة مواد ومصنعية الخرسانة: ${concreteCost > 0 ? formatCurrency(concreteCost, currency) : 'كمية فقط (غير مسعّر)'}`,
      '',
      '4. ملخص الميزانية الإجمالية الموصى برصدها:',
      `   - التكلفة المباشرة للبنود المسعرة: ${formatCurrency(directPricedTotal, currency)}`,
      `   - احتياطي طوارئ وهالك غير مرئي (${contingencyRate}%): ${formatCurrency(contingencyAmount, currency)}`,
      `   - إجمالي الميزانية الموصى برصدها: ${formatCurrency(grandTotal, currency)}`,
      '',
      '==============================================================',
      '⚠️ ' + CRITICAL_ENGINEERING_DISCLAIMER,
      '==============================================================',
    ];

    if (navigator.clipboard) {
      navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <section className="bg-gradient-to-l from-[#003C69] via-[#002f54] to-[#002340] text-white p-6 sm:p-8 rounded-2xl shadow-lg border-b-4 border-[#00B050]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-emerald-400 text-xs font-bold mb-3 border border-white/10">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>القسم الثالث: المخرج النهائي — تقرير الكميات والتكلفة الإجمالي</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-white">
            تقرير المقايسة التنفيذي وحصر الكميات الشامل
          </h1>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
            المخرج النهائي الكامل لمشروعك؛ يجمع كميات وتكاليف بنود التشطيبات المعمارية وحديد التسليح ومواد الخرسانة في جدول موحد جاهز للطباعة وتوثيق بيانات المشروع والمالك.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 pt-4 border-t border-white/15">
          <button
            type="button"
            onClick={onPrint}
            className="px-5 py-2.5 rounded-xl bg-[#00B050] hover:bg-[#009b46] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير الشامل الرسمي (PDF / A4)</span>
          </button>

          {activeProject ? (
            <>
              <button
                type="button"
                onClick={handleSaveToSameProject}
                className="px-5 py-2.5 rounded-xl bg-[#00B050] hover:bg-[#009b46] text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                title={`حفظ التعديلات مباشرة على نفس المشروع: ${activeProject.projectName}`}
              >
                <Save className="w-4 h-4 text-white" />
                <span>حفظ التعديلات في نفس المشروع</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAsNewCopy}
                className="px-4 py-2.5 rounded-xl bg-[#B1A06D] hover:bg-[#9e8f5e] text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                title="حفظ التعديلات كنسخة جديدة منفصلة تماماً في قائمة مشروعاتك"
              >
                <Copy className="w-4 h-4" />
                <span>حفظ كنسخة جديدة منفصلة</span>
              </button>
            </>
          ) : currentUser ? (
            <button
              type="button"
              onClick={handleSaveToSameProject}
              className="px-5 py-2.5 rounded-xl bg-[#B1A06D] hover:bg-[#9e8f5e] text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التقرير في قائمة مشروعاتي</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAccount}
              className="px-5 py-2.5 rounded-xl bg-[#B1A06D] hover:bg-[#9e8f5e] text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              title="سجل دخولك لحفظ وتوثيق هذا التقرير في مشروعاتك"
            >
              <Save className="w-4 h-4" />
              <span>تسجيل الدخول لحفظ المشروع في مشروعاتي</span>
            </button>
          )}

          {onOpenProjects && currentUser && (
            <button
              type="button"
              onClick={onOpenProjects}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
            >
              <FolderKanban className="w-4 h-4 text-[#B1A06D]" />
              <span>فتح مشروعاتي المسجلة</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyReport}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>{copied ? 'تم نسخ التقرير كاملاً!' : 'نسخ التقرير إلى الحافظة'}</span>
          </button>
        </div>

        {/* Success Alert */}
        {savedSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-400 text-emerald-100 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span className="font-bold">{savedSuccess}</span>
            </div>
            {onOpenProjects && currentUser && (
              <button
                type="button"
                onClick={onOpenProjects}
                className="underline text-xs font-bold hover:text-white"
              >
                عرض في مشروعاتي
              </button>
            )}
          </div>
        )}
      </section>

      {/* Active Project Indicator Bar (قم بالتعديل بحيث يكون واضح انه داخل اي مشروع من مشروعاتي يتم الحفظ على نفس المشروع) */}
      {activeProject && (
        <section className="bg-sky-50 border-2 border-[#003C69]/30 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#003C69] text-white flex items-center justify-center shrink-0 shadow-xs border-2 border-[#B1A06D]">
                <FolderKanban className="w-6 h-6 text-[#B1A06D]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#003C69] text-white text-[11px] font-black">
                    المشروع النشط المفتوح حالياً
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-[#003C69]">
                    {activeProject.projectName}
                  </h2>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  أي تعديل في الكميات أو الأسعار أو البيانات يتم حفظه وتحديثه على <strong>نفس هذا المشروع</strong> دون إنشاء نسخ مكررة.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={handleSaveToSameProject}
                className="px-4 py-2 rounded-xl bg-[#003C69] hover:bg-[#002f54] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#B1A06D]" />
                <span>حفظ التعديلات على نفس المشروع</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAsNewCopy}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-[#003C69] border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="حفظ نسخة جديدة مكررة من هذا المشروع"
              >
                <Copy className="w-4 h-4 text-[#B1A06D]" />
                <span>حفظ كنسخة جديدة منفصلة</span>
              </button>

              {onUnlinkActiveProject && (
                <button
                  type="button"
                  onClick={onUnlinkActiveProject}
                  className="px-3 py-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  title="إلغاء ربط هذا المشروع وبدء حساب مقايسة جديدة فارغة"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>مشروع جديد فارغ</span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CRITICAL ENGINEERING DISCLAIMER BOX (الملاحظة الهامة جداً المطلوبة) */}
      <section className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm text-amber-950">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-sm font-extrabold text-amber-900 flex items-center gap-2">
              <span>ملاحظة هندسية هامة جداً جداً</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-200 text-amber-900 font-bold">
                تنبيه اعتمادات
              </span>
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-amber-950 leading-relaxed">
              {CRITICAL_ENGINEERING_DISCLAIMER}
            </p>
          </div>
        </div>
      </section>

      {/* PROJECT METADATA & CUSTOM FIELDS CARD (اتاحة اضافة خانات حسب اختيار المستخدم كبيانات عن المشروع) */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div
          onClick={() => setIsMetaExpanded(!isMetaExpanded)}
          className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#003C69] text-white flex items-center justify-center">
              <Building className="w-5 h-5 text-[#B1A06D]" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                <span>بيانات وهوية المشروع والتقرير</span>
                <span className="text-[11px] font-normal text-slate-500 hidden sm:inline">
                  (تظهر في ترويسة التقرير والطباعة الرسمية وعند الحفظ في مشروعاتي)
                </span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                المشروع: <strong className="text-[#003C69]">{projectName}</strong> · المالك: {ownerName || 'غير مسجل'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">
              {isMetaExpanded ? 'طي الخانات' : 'تعديل البيانات والخانات'}
            </span>
            {isMetaExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>

        {isMetaExpanded && (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Standard Project Metadata Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#003C69]" />
                  <span>اسم المشروع</span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="مثال: فيلا حي الياسمين - القاهرة الجديدة"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#003C69]" />
                  <span>اسم أو عنوان التقرير</span>
                </label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="مثال: مقايسة حصر التشطيبات والخرسانات والحديد"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#003C69]" />
                  <span>اسم مالك المشروع / العميل</span>
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="مثال: أ. محمد عبد العزيز"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#003C69]" />
                  <span>مكان المشروع / الموقع</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="مثال: التجمع الخامس، حي النرجس، قطعة 45"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#003C69]" />
                  <span>تاريخ التقرير</span>
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleSaveToSameProject}
                  className="w-full py-2.5 bg-[#003C69] hover:bg-[#002f54] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#B1A06D]" />
                  <span>{activeProject ? 'حفظ التعديلات في نفس المشروع' : 'حفظ البيانات في مشروعاتي'}</span>
                </button>
              </div>
            </div>

            {/* Dynamic Custom Fields (اتاحة اضافة خانات حسب اختيار المستخدم كبيانات عن المشروع) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-[#003C69]" />
                    <span>خانات وبيانات إضافية مخصصة حسب رغبتك</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    أضف أي خانة تريدها كبيان للمشروع (مثل: رقم الترخيص، المهندس المشرف، المقاول المنفذ، المساحة، رقم الهاتف، إلخ)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddCustomField}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#003C69] border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ إضافة خانة جديدة</span>
                </button>
              </div>

              <div className="space-y-2">
                {customFields.length > 0 ? (
                  customFields.map((cf, idx) => (
                    <div key={cf.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cf.label}
                        onChange={(e) => handleUpdateCustomField(idx, 'label', e.target.value)}
                        placeholder="اسم الخانة (مثل: رقم ترخيص البناء)"
                        className="w-1/3 sm:w-1/4 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        value={cf.value}
                        onChange={(e) => handleUpdateCustomField(idx, 'value', e.target.value)}
                        placeholder="القيمة أو البيان المطلوب إدراجه"
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="حذف هذه الخانة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-2 text-center">
                    لا توجد خانات مخصصة مضافة حالياً. اضغط على "+ إضافة خانة جديدة" لإدراج أي بيانات تحتاجها.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Grand Financial Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-[#00B050]">
          <span className="text-xs text-slate-500 block mb-1">الميزانية الإجمالية الموصى برصدها</span>
          <span className="text-2xl sm:text-3xl font-black text-[#003C69] font-mono tabular-nums block">
            {formatCurrency(grandTotal, currency)}
          </span>
          <span className="text-xs text-emerald-700 font-bold">
            شاملة احتياطي الطوارئ ({contingencyRate}%)
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-[#003C69]">
          <span className="text-xs text-slate-500 block mb-1">إجمالي تكلفة البنود المسعرة</span>
          <span className="text-xl sm:text-2xl font-bold text-slate-800 font-mono tabular-nums block">
            {formatCurrency(directPricedTotal, currency)}
          </span>
          <span className="text-xs text-slate-500">
            خامات + مصنعيات مباشرة
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-amber-500">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="summary-contingency-rate" className="text-xs text-slate-500">احتياطي طوارئ حر (%):</label>
            <div className="flex items-center gap-1">
              <input
                id="summary-contingency-rate"
                type="number"
                min="0"
                max="50"
                value={contingencyRate}
                onChange={(e) => setContingencyRate(Math.max(0, Number(e.target.value)))}
                className="w-12 text-xs font-bold bg-slate-100 rounded px-1 text-center font-mono"
              />
              <span className="text-xs text-slate-400">%</span>
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-amber-700 font-mono tabular-nums block">
            {formatCurrency(contingencyAmount, currency)}
          </span>
          <span className="text-[11px] text-slate-400">
            لتغطية تقلبات الأسعار والهالك غير المحسوب
          </span>
        </div>
      </div>

      {/* Main Breakdown Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Section 1: Finishes Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-[#003C69]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">1. التشطيبات المعمارية</h3>
              <span className="text-xs text-slate-500">المباني، السباكة، الكهرباء، المحارة، الدهانات</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-slate-50">
              <span className="text-slate-600">عدد البنود المحصورة:</span>
              <span className="font-mono font-bold text-slate-800">{finishesItemsCount} بنداً</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-50">
              <span className="text-slate-600">تكلفة الخامات والمواد:</span>
              <span className="font-mono font-bold text-slate-800">{formatCurrency(finishesMaterials, currency)}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-50">
              <span className="text-slate-600">أجور العمالة والمصنعيات:</span>
              <span className="font-mono font-bold text-slate-800">{formatCurrency(finishesLabor, currency)}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-sky-50 font-bold text-sm">
              <span className="text-[#003C69]">إجمالي التشطيبات:</span>
              <span className="font-mono text-[#003C69]">{formatCurrency(finishesTotal, currency)}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Steel Rebar Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">2. حديد التسليح الإنشائي</h3>
              <span className="text-xs text-slate-500">الأسقف، الأعمدة، القواعد، وتوزيع الأقطار</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-slate-50">
              <span className="text-slate-600">إجمالي كمية الحديد:</span>
              <span className="font-mono font-bold text-slate-800">{formatNumber(steelTons, 2)} طن</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-50">
              <span className="text-slate-600">سلك رباط محروق:</span>
              <span className="font-mono font-bold text-slate-800">{Math.round(steelTons * 22)} كجم</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-50">
              <span className="text-slate-600">حالة التسعير:</span>
              <span className="font-bold text-slate-700">{steelCost > 0 ? 'مسعّر' : 'كمية فقط'}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-amber-50 font-bold text-sm">
              <span className="text-amber-900">تكلفة شراء الحديد:</span>
              <span className="font-mono text-amber-900">{formatCurrency(steelCost, currency)}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Concrete Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#00B050]">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">3. الخرسانة والأسمنت والمواد</h3>
              <span className="text-xs text-slate-500">حصر الأسمنت والرمل والزلط لجدول المشروع</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-slate-50">
              <span className="text-slate-600">إجمالي حجم الخرسانة:</span>
              <span className="font-mono font-bold text-slate-800">{formatNumber(concreteVolume, 3)} م³</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-50">
              <span className="text-slate-600">أكياس الأسمنت المطلوبة:</span>
              <span className="font-mono font-bold text-slate-800">{concreteCementBags} كيس (50 كجم)</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-50">
              <span className="text-slate-600">تكلفة صب ومواد الخرسانة:</span>
              <span className="font-mono font-bold text-slate-800">{formatCurrency(concreteCost, currency)}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-emerald-50 font-bold text-sm">
              <span className="text-emerald-900">إجمالي الخرسانة:</span>
              <span className="font-mono text-emerald-900">{formatCurrency(concreteCost, currency)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Official Signatures Box for Print & Documentation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block mb-6">اعتماد المهندس الاستشاري / المشرف</span>
            <div className="border-b border-dashed border-slate-400 w-48 mx-auto mb-2"></div>
            <span className="text-[11px] text-slate-500">التوقيع والخاتم</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block mb-6">اعتماد مالك المشروع / العميل</span>
            <div className="border-b border-dashed border-slate-400 w-48 mx-auto mb-2"></div>
            <span className="text-[11px] text-slate-500">التوقيع بالاستلام والموافقة</span>
          </div>
        </div>
      </div>

      {/* Advisory Guidance Box */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#003C69] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-slate-800 block mb-0.5">ضوابط استخدام التقرير:</span>
          يمكن تقديم هذا التقرير مباشرة للمقاولين والتجار للحصول على عروض أسعار تفصيلية ومقارنة التكاليف بأمان تام، مع ضرورة الالتزام بالملاحظة الهندسية أعلاه.
        </div>
      </div>

    </div>
  );
};
