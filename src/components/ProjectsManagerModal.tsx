import React, { useState, useEffect } from 'react';
import { SavedProject, CustomProjectField, CurrencyCode, UserProfile } from '../types';
import { formatCurrency, formatNumber, CURRENCIES } from '../data/currencies';
import {
  CRITICAL_ENGINEERING_DISCLAIMER,
  saveProject,
  deleteProject,
  duplicateProject,
} from '../data/projectStore';
import {
  FolderKanban,
  X,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  MapPin,
  User,
  FileText,
  Printer,
  AlertTriangle,
  Building2,
  Compass,
  Layers,
  ChevronLeft,
  CheckCircle,
  Tag,
  Search,
  ArrowRight,
  UploadCloud,
  Copy,
  Sparkles,
} from 'lucide-react';
import { exportReportWithQuota } from '../utils/reportGate';

interface ProjectsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  projects: SavedProject[];
  onRefreshProjects: () => void;
  onLoadProjectIntoApp: (project: SavedProject) => void;
  activeProjectId?: string | null;
  currentAppState?: {
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
    grandTotal: number;
  };
}

export const ProjectsManagerModal: React.FC<ProjectsManagerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  projects,
  onRefreshProjects,
  onLoadProjectIntoApp,
  activeProjectId,
  currentAppState,
}) => {
  const [selectedProject, setSelectedProject] = useState<SavedProject | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Partial<SavedProject> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // When opening from top navbar, always ensure we are on the main projects list
  useEffect(() => {
    if (isOpen) {
      setSelectedProject(null);
      setIsEditing(false);
      setEditingProject(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.projectName.toLowerCase().includes(q) ||
      p.reportName.toLowerCase().includes(q) ||
      p.ownerName.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q)
    );
  });

  // Handle clicking on a project to show all details
  const handleOpenProjectDetails = (project: SavedProject) => {
    setSelectedProject(project);
    setIsEditing(false);
  };

  // Start creating a new project from current app state
  const handleStartNewProject = () => {
    const today = new Date().toISOString().split('T')[0];
    const initial: Partial<SavedProject> = {
      userId: currentUser?.id,
      projectName: 'مشروع سكني جديد',
      reportName: 'مقايسة حصر الكميات والتكلفة التقديرية',
      ownerName: '',
      location: 'القاهرة',
      date: today,
      customFields: [
        { id: 'cf_1', label: 'رقم القطعة', value: '' },
        { id: 'cf_2', label: 'المهندس المشرف', value: currentUser?.name || '' },
      ],
      currency: currentAppState?.currency || 'EGP',
      finishesTotal: currentAppState?.finishesTotal || 0,
      finishesMaterials: currentAppState?.finishesMaterials || 0,
      finishesLabor: currentAppState?.finishesLabor || 0,
      finishesItemsCount: currentAppState?.finishesItemsCount || 0,
      steelTons: currentAppState?.steelTons || 0,
      steelCost: currentAppState?.steelCost || 0,
      concreteVolume: currentAppState?.concreteVolume || 0,
      concreteCementBags: currentAppState?.concreteCementBags || 0,
      concreteCost: currentAppState?.concreteCost || 0,
      contingencyRate: 10,
      grandTotal: currentAppState?.grandTotal || 0,
      notes: '',
    };
    setEditingProject(initial);
    setIsEditing(true);
  };

  // Start editing existing project
  const handleEditProject = (proj: SavedProject) => {
    setEditingProject({ ...proj, customFields: [...proj.customFields] });
    setIsEditing(true);
  };

  // Add custom field
  const handleAddCustomField = () => {
    if (!editingProject) return;
    const newFields = [
      ...(editingProject.customFields || []),
      { id: `cf_${Date.now()}`, label: 'اسم الحقل', value: '' },
    ];
    setEditingProject({ ...editingProject, customFields: newFields });
  };

  // Update custom field
  const handleUpdateCustomField = (index: number, key: 'label' | 'value', val: string) => {
    if (!editingProject || !editingProject.customFields) return;
    const updated = [...editingProject.customFields];
    updated[index] = { ...updated[index], [key]: val };
    setEditingProject({ ...editingProject, customFields: updated });
  };

  // Remove custom field
  const handleRemoveCustomField = (index: number) => {
    if (!editingProject || !editingProject.customFields) return;
    const updated = editingProject.customFields.filter((_, i) => i !== index);
    setEditingProject({ ...editingProject, customFields: updated });
  };

  // Save project form
  const handleSaveProjectForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    if (!editingProject.projectName?.trim()) {
      alert('يرجى إدخال اسم المشروع.');
      return;
    }

    const payload = {
      userId: currentUser?.id,
      projectName: editingProject.projectName.trim(),
      reportName: editingProject.reportName?.trim() || 'تقرير حصر الكميات والتكلفة',
      ownerName: editingProject.ownerName?.trim() || 'غير محدد',
      location: editingProject.location?.trim() || 'غير محدد',
      date: editingProject.date || new Date().toISOString().split('T')[0],
      customFields: (editingProject.customFields || []).filter((f) => f.label.trim() !== ''),
      currency: editingProject.currency || 'EGP',
      finishesTotal: editingProject.finishesTotal || 0,
      finishesMaterials: editingProject.finishesMaterials || 0,
      finishesLabor: editingProject.finishesLabor || 0,
      finishesItemsCount: editingProject.finishesItemsCount || 0,
      steelTons: editingProject.steelTons || 0,
      steelCost: editingProject.steelCost || 0,
      concreteVolume: editingProject.concreteVolume || 0,
      concreteCementBags: editingProject.concreteCementBags || 0,
      concreteCost: editingProject.concreteCost || 0,
      contingencyRate: editingProject.contingencyRate || 10,
      grandTotal:
        editingProject.grandTotal ||
        Math.round(
          ((editingProject.finishesTotal || 0) +
            (editingProject.steelCost || 0) +
            (editingProject.concreteCost || 0)) *
            1.1
        ),
      notes: editingProject.notes || '',
      id: editingProject.id,
    };

    const saved = saveProject(payload);
    onRefreshProjects();
    setSelectedProject(saved);
    setIsEditing(false);
    setEditingProject(null);
  };

  // Duplicate project from outside
  const handleDuplicateProject = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const dup = duplicateProject(id);
    if (dup) {
      onRefreshProjects();
      setToastMessage(`تم إنشاء نسخة من مشروع "${dup.projectName}" بنجاح!`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Delete project
  const handleDeleteProject = async (id: string) => { /*delete-fixed*/
    await deleteProject(id, currentUser?.id);
    onRefreshProjects();
    setDeleteConfirmId(null);
    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }
  };

  // Print dedicated project report
  const handlePrintProject = () => {
    exportReportWithQuota(
      document.getElementById('project-report-area'),
      selectedProject?.projectName || 'تقرير-مشروع',
      currentUser?.id,
      'saved_project'
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-slate-50 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] text-right font-sans"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-[#003C69] text-white p-5 flex items-center justify-between border-b-4 border-[#B1A06D] shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FolderKanban className="w-6 h-6 text-[#B1A06D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">مشروعاتي والتقارير المسجلة</h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold font-mono">
                  {projects.length}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                سجل متكامل لحفظ وعرض وتعديل وطباعة تقارير مقايساتك لكل عميل ومشروع
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={handleStartNewProject}
                className="px-3.5 py-1.5 bg-[#00B050] hover:bg-[#009b46] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">تسجيل تقرير مشروع جديد</span>
                <span className="sm:hidden">مشروع جديد</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* VIEW 1: Edit / Create Form */}
          {isEditing && editingProject && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#003C69]" />
                  <h3 className="font-bold text-slate-800 text-base">
                    {editingProject.id ? 'تعديل بيانات المشروع' : 'تسجيل مشروع وتقرير جديد'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingProject(null);
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>إلغاء التعديل</span>
                </button>
              </div>

              <form onSubmit={handleSaveProjectForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اسم المشروع <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editingProject.projectName || ''}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, projectName: e.target.value })
                      }
                      placeholder="مثال: فيلا حي الياسمين - القاهرة الجديدة"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">اسم التقرير</label>
                    <input
                      type="text"
                      value={editingProject.reportName || ''}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, reportName: e.target.value })
                      }
                      placeholder="مثال: مقايسة حصر التشطيبات والخرسانات والحديد"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اسم مالك المشروع / العميل
                    </label>
                    <input
                      type="text"
                      value={editingProject.ownerName || ''}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, ownerName: e.target.value })
                      }
                      placeholder="مثال: د. عبد الله الشريف"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      مكان المشروع / الموقع
                    </label>
                    <input
                      type="text"
                      value={editingProject.location || ''}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, location: e.target.value })
                      }
                      placeholder="مثال: الشيخ زايد، حي الكرمة، فيلا 12"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ التقرير</label>
                    <input
                      type="date"
                      value={editingProject.date || ''}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, date: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">عملة التقرير</label>
                    <select
                      value={editingProject.currency || 'EGP'}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          currency: e.target.value as CurrencyCode,
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none bg-white"
                    >
                      {Object.values(CURRENCIES).map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.symbol} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Custom Fields Section (اتاحة اضافة خانات حسب اختيار المستخدم كبيانات عن المشروع) */}
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-[#003C69]" />
                        <span>خانات وبيانات إضافية مخصصة حسب اختيارك للمشروع</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        أضف أي خانات ترغب بها (مثل: رقم القطعة، اسم الاستشاري، رقم الترخيص، المساحة، إلخ)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCustomField}
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-[#003C69] border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة خانة جديدة</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {editingProject.customFields && editingProject.customFields.length > 0 ? (
                      editingProject.customFields.map((cf, idx) => (
                        <div key={cf.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={cf.label}
                            onChange={(e) => handleUpdateCustomField(idx, 'label', e.target.value)}
                            placeholder="اسم الخانة (مثل: رقم الترخيص)"
                            className="w-1/3 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                          />
                          <input
                            type="text"
                            value={cf.value}
                            onChange={(e) => handleUpdateCustomField(idx, 'value', e.target.value)}
                            placeholder="القيمة أو البيان"
                            className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomField(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="حذف الخانة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2 text-center">
                        لا توجد خانات مخصصة مضافة حالياً. اضغط "إضافة خانة جديدة" لإضافة بيانات حسب اختيارك.
                      </p>
                    )}
                  </div>
                </div>

                {/* Financial Summary Overrides for Project */}
                <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      إجمالي التشطيبات ({editingProject.currency})
                    </label>
                    <input
                      type="number"
                      value={editingProject.finishesTotal || 0}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          finishesTotal: Number(e.target.value),
                        })
                      }
                      className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      حديد التسليح (طن)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProject.steelTons || 0}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          steelTons: Number(e.target.value),
                        })
                      }
                      className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      تكلفة الحديد ({editingProject.currency})
                    </label>
                    <input
                      type="number"
                      value={editingProject.steelCost || 0}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          steelCost: Number(e.target.value),
                        })
                      }
                      className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      حجم الخرسانة (م³)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingProject.concreteVolume || 0}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          concreteVolume: Number(e.target.value),
                        })
                      }
                      className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ملاحظات هندسية أو تنفيذية عن المشروع
                  </label>
                  <textarea
                    rows={2}
                    value={editingProject.notes || ''}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, notes: e.target.value })
                    }
                    placeholder="أي مواصفات إضافية أو شروط للتنفيذ والتسليم..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                  ></textarea>
                </div>

                {/* Mandatory Disclaimer Display */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium">
                    {CRITICAL_ENGINEERING_DISCLAIMER}
                  </p>
                </div>

                {/* Save Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingProject(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-[#003C69] hover:bg-[#002f54] shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4 text-[#B1A06D]" />
                    <span>حفظ المشروع في قائمتي</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW 2: Deep Detail View of Selected Project (بحيث يضغط على المشروع فتظهر كافة التفاصيل لهذا المشروع) */}
          {!isEditing && selectedProject && (
            <div id="project-report-area" className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
              
              {/* Back & Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 no-print">
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>العودة لقائمة المشروعات</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onLoadProjectIntoApp(selectedProject);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-sky-50 text-[#003C69] hover:bg-sky-100 border border-sky-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="تحميل الكميات والتكاليف إلى الحاسبة الرئيسية"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>فتح في الحاسبة الرئيسية</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDuplicateProject(selectedProject.id, e)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="عمل نسخة مكررة من هذا المشروع"
                  >
                    <Copy className="w-4 h-4" />
                    <span>عمل نسخة من المشروع</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEditProject(selectedProject)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>تعديل</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintProject}
                    className="px-4 py-1.5 rounded-lg bg-[#003C69] hover:bg-[#002f54] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-[#B1A06D]" />
                    <span>طباعة التقرير</span>
                  </button>
                </div>
              </div>

              {/* Printable Project Header */}
              <div className="p-6 rounded-2xl bg-gradient-to-l from-[#003C69] to-[#00223b] text-white border-b-4 border-[#00B050] shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-[#B1A06D] text-xs font-bold mb-2 border border-white/15">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{selectedProject.reportName || 'تقرير حصر الكميات والتكلفة الإجمالي'}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
                      {selectedProject.projectName}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-[#B1A06D]" />
                        <span>المالك: <strong>{selectedProject.ownerName || 'غير محدد'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#B1A06D]" />
                        <span>الموقع: <strong>{selectedProject.location || 'غير محدد'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#B1A06D]" />
                        <span>التاريخ: <strong>{selectedProject.date}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-left text-right bg-white/10 p-4 rounded-xl border border-white/20 shrink-0">
                    <span className="text-[11px] text-slate-300 block">الميزانية الإجمالية الموصى بها</span>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                      {formatCurrency(selectedProject.grandTotal, selectedProject.currency)}
                    </span>
                    <span className="text-[10px] text-slate-300 block mt-0.5">
                      شاملة طوارئ {selectedProject.contingencyRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* CRITICAL ENGINEERING DISCLAIMER (الملاحظة الهامة جداً المطلوبة بدقة) */}
              <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-extrabold text-xs sm:text-sm text-amber-900 block">
                    ملاحظة هندسية هامة جداً جداً:
                  </span>
                  <p className="text-xs sm:text-sm leading-relaxed font-semibold">
                    {CRITICAL_ENGINEERING_DISCLAIMER}
                  </p>
                </div>
              </div>

              {/* Custom Metadata Fields Added By User (الخانات المخصصة حسب اختيار العميل) */}
              {selectedProject.customFields && selectedProject.customFields.length > 0 && (
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#003C69]" />
                    <span>بيانات وخانات المشروع المخصصة (حسب اختيار المستخدم)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedProject.customFields.map((cf) => (
                      <div key={cf.id} className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-[11px] text-slate-500 block mb-0.5 font-medium">
                          {cf.label}
                        </span>
                        <span className="text-xs font-bold text-slate-800 block">
                          {cf.value || '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deep Details Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Finishes */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-[#003C69] font-bold text-sm border-b border-slate-200 pb-2">
                    <Layers className="w-4 h-4" />
                    <span>1. التشطيبات المعمارية</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">عدد البنود:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {selectedProject.finishesItemsCount} بنداً
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">تكلفة الخامات:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {formatCurrency(selectedProject.finishesMaterials, selectedProject.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">أجور المصنعيات:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {formatCurrency(selectedProject.finishesLabor, selectedProject.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 font-bold text-[#003C69] bg-sky-50 px-2 rounded">
                      <span>إجمالي التشطيبات:</span>
                      <span className="font-mono">
                        {formatCurrency(selectedProject.finishesTotal, selectedProject.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Steel */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-sm border-b border-slate-200 pb-2">
                    <Compass className="w-4 h-4" />
                    <span>2. حديد التسليح الإنشائي</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">إجمالي كمية الحديد:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {formatNumber(selectedProject.steelTons, 2)} طن
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">سلك رباط محروق:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {Math.round(selectedProject.steelTons * 22)} كجم
                      </span>
                    </div>
                    <div className="flex justify-between py-1 font-bold text-amber-900 bg-amber-50 px-2 rounded">
                      <span>تكلفة شراء الحديد:</span>
                      <span className="font-mono">
                        {formatCurrency(selectedProject.steelCost, selectedProject.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Concrete */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-[#00B050] font-bold text-sm border-b border-slate-200 pb-2">
                    <Building2 className="w-4 h-4" />
                    <span>3. الخرسانة المسلحة والمواد</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">حجم الخرسانة المسلحة:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {formatNumber(selectedProject.concreteVolume, 3)} م³
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">أكياس الأسمنت:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {selectedProject.concreteCementBags} كيس
                      </span>
                    </div>
                    <div className="flex justify-between py-1 font-bold text-emerald-900 bg-emerald-50 px-2 rounded">
                      <span>تكلفة الخرسانة:</span>
                      <span className="font-mono">
                        {formatCurrency(selectedProject.concreteCost, selectedProject.currency)}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Notes if present */}
              {selectedProject.notes && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">ملاحظات المشروع:</span>
                  <p className="text-slate-600 leading-relaxed">{selectedProject.notes}</p>
                </div>
              )}

              {/* Printable signature strip */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
                <div>
                  <span className="block font-bold text-slate-700 mb-6">توقيع واعتماد المهندس المختص:</span>
                  <div className="border-b border-dashed border-slate-400 w-48 mx-auto"></div>
                </div>
                <div>
                  <span className="block font-bold text-slate-700 mb-6">توقيع مالك المشروع / العميل:</span>
                  <div className="border-b border-dashed border-slate-400 w-48 mx-auto"></div>
                </div>
              </div>

            </div>
          )}

          {/* VIEW 3: List of Projects (When not editing and no project deeply selected) */}
          {!isEditing && !selectedProject && (
            <div className="space-y-5">
              
              {/* Search & Actions Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث باسم المشروع أو المالك أو الموقع..."
                    className="w-full pr-9 pl-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none bg-white"
                  />
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  يتم عرض {filteredProjects.length} من أصل {projects.length} مشروع
                </div>
              </div>

              {/* Toast Notification */}
              {toastMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{toastMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setToastMessage(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Mandatory Notice */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  اضغط على أي مشروع لفتح <strong>كافة تفاصيله الهندسية والمالية</strong> وطباعته أو تعديل خاناته المخصصة، أو اضغط زر النسخ لعمل نسخة مكررة فوراً.
                </span>
              </div>

              {/* Projects Grid */}
              {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => handleOpenProjectDetails(project)}
                      className={`bg-white rounded-2xl border transition-all cursor-pointer p-5 flex flex-col justify-between group hover:shadow-md ${
                        activeProjectId === project.id
                          ? 'border-[#003C69] ring-2 ring-[#003C69]/20 shadow-xs'
                          : 'border-slate-200 hover:border-[#003C69]'
                      }`}
                    >
                      <div>
                        {/* Top Badge & Date */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-sky-50 text-[#003C69] font-bold">
                              {project.reportName || 'مقايسة شاملة'}
                            </span>
                            {activeProjectId === project.id && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                <span>المشروع النشط في الحاسبة</span>
                              </span>
                            )}
                          </div>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {project.date}
                          </span>
                        </div>

                        {/* Project Title */}
                        <h3 className="font-black text-slate-900 text-base mb-1.5 group-hover:text-[#003C69] transition-colors">
                          {project.projectName}
                        </h3>

                        {/* Location & Owner */}
                        <div className="space-y-1 text-xs text-slate-600 mb-3">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>المالك: <strong className="text-slate-800">{project.ownerName || 'غير محدد'}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">الموقع: {project.location || 'غير محدد'}</span>
                          </div>
                        </div>

                        {/* Custom Fields tags if any */}
                        {project.customFields && project.customFields.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {project.customFields.slice(0, 3).map((cf) => (
                              <span
                                key={cf.id}
                                className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium border border-slate-200"
                              >
                                {cf.label}: {cf.value}
                              </span>
                            ))}
                            {project.customFields.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500">
                                +{project.customFields.length - 3} أخرى
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quantities & Financial Summary Bar */}
                      <div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-3 gap-2 text-center text-xs mb-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block">حديد التسليح</span>
                            <span className="font-bold text-slate-800 font-mono">
                              {formatNumber(project.steelTons, 1)} طن
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">الخرسانة</span>
                            <span className="font-bold text-slate-800 font-mono">
                              {formatNumber(project.concreteVolume, 1)} م³
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">بنود التشطيب</span>
                            <span className="font-bold text-slate-800 font-mono">
                              {project.finishesItemsCount} بنداً
                            </span>
                          </div>
                        </div>

                        {/* Grand Total & Action Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-400 block">الميزانية الإجمالية</span>
                            <span className="text-base font-black text-[#003C69] font-mono">
                              {formatCurrency(project.grandTotal, project.currency)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {/* Duplicate Button from outside */}
                            <button
                              type="button"
                              onClick={(e) => handleDuplicateProject(project.id, e)}
                              title="عمل نسخة مكررة من هذا المشروع"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#003C69] hover:bg-sky-50 transition-colors cursor-pointer border border-transparent hover:border-sky-200"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEditProject(project)}
                              title="تعديل بيانات المشروع"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {deleteConfirmId === project.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProject(project.id)}
                                  className="px-2 py-1 bg-rose-600 text-white rounded text-[11px] font-bold cursor-pointer"
                                >
                                  تأكيد الحذف
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-1.5 py-1 text-slate-500 text-[11px] cursor-pointer"
                                >
                                  إلغاء
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(project.id)}
                                title="حذف المشروع"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}

                            <span className="text-xs font-bold text-[#003C69] flex items-center gap-0.5 mr-1 group-hover:translate-x-[-3px] transition-transform">
                              <span>التفاصيل</span>
                              <ChevronLeft className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-3">
                  <FolderKanban className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-700 text-base">لا توجد مشروعات مطابقة للبحث</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    يمكنك تسجيل تقارير مشروعاتك مع تحديد اسم المالك والموقع وإضافة أي خانات مخصصة لحفظها ومراجعتها في أي وقت.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartNewProject}
                    className="px-4 py-2 bg-[#003C69] text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-1.5 hover:bg-[#002f54]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>تسجيل تقرير مشروع جديد الآن</span>
                  </button>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0 no-print">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              {currentUser
                ? `الحساب النشط: ${currentUser.name} (${currentUser.role || 'مسجل'})`
                : 'وضع الاستخدام المحلي (الحفظ متاح على هذا الجهاز)'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-200 text-slate-700 rounded-lg font-bold border border-slate-300 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
