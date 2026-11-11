import React, { useState, useCallback, useEffect } from 'react';
import { CurrencyCode, UserProfile, SavedProject } from './types';
import { Navbar } from './components/Navbar';
import { SeoAbout } from './components/SeoAbout';
import { ReviewsSection } from './components/ReviewsSection';
import { FinishingSection } from './components/FinishingSection';
import { ConcreteStructureSection } from './components/ConcreteStructureSection';
import { ProjectSummaryView } from './components/ProjectSummaryView';
import { AccountModal } from './components/AccountModal';
import { ProjectsManagerModal } from './components/ProjectsManagerModal';
import { CurrencySettingsModal } from './components/CurrencySettingsModal';
import {
  loadCurrentUser,
  saveCurrentUser,
  loadSavedProjects,
  saveProject,
  syncProjectsFromFirestore,
  CRITICAL_ENGINEERING_DISCLAIMER,
} from './data/projectStore';
import { subscribeToAuthState, logOutFirebase, trackEvent, Entitlement } from './lib/firebase';
import { AlertTriangle, Save, ArrowRight, X, FolderKanban, AlertCircle } from 'lucide-react';
import { exportReportWithQuota } from './utils/reportGate';
import { buildReportDocument } from './utils/reportDocument';
import { PaywallModal } from './components/PaywallModal';
import { AdminCodesPanel } from './components/AdminCodesPanel';
import { ADMIN_UID } from './data/paymentConfig';
import { OnboardingTour } from './components/OnboardingTour';

export default function App() {
  const [activeTab, setActiveTab] = useState<'finishes' | 'concrete_structure' | 'summary'>('finishes');
  const [currency, setCurrency] = useState<CurrencyCode>('EGP');
  const [isCurrencySettingsModalOpen, setIsCurrencySettingsModalOpen] = useState(false);
  const [currencyRefreshKey, setCurrencyRefreshKey] = useState(0);

  // User and Projects state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => loadCurrentUser());
  const [projects, setProjects] = useState<SavedProject[]>(() => loadSavedProjects());
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [paywall, setPaywall] = useState<Entitlement | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [adminOpen, setAdminOpen] = useState<boolean>(
    () => new URLSearchParams(window.location.search).get('admin') === '1'
  );

  // Subscribe to Firebase Auth changes to keep state and projects synchronized
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (user) => {
      setCurrentUser(user);
      saveCurrentUser(user);
      if (user) {
        try {
          const synced = await syncProjectsFromFirestore(user.id);
          setProjects(synced);
        } catch {
          setProjects(loadSavedProjects(user.id));
        }
      } else {
        setProjects(loadSavedProjects());
      }
    });

    return () => unsubscribe();
  }, []);

  // Reports quota events (login required / paywall / report downloaded)
  useEffect(() => {
    let timer: number | undefined;
    const showToast = (msg: string) => {
      setToast(msg);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setToast(null), 5000);
    };
    const onLogin = () => {
      setIsAccountModalOpen(true);
      showToast('سجّل الدخول أولًا لتنزيل التقرير.');
    };
    const onPaywall = (e: Event) => setPaywall((e as CustomEvent).detail as Entitlement);
    const onDone = (e: Event) => {
      const d = (e as CustomEvent).detail as Entitlement;
      showToast(`تم تنزيل التقرير. المتبقي لك ${Math.max(d.limit - d.used, 0)} من ${d.limit} تقارير.`);
    };
    window.addEventListener('moeen:login-required', onLogin);
    window.addEventListener('moeen:paywall', onPaywall);
    window.addEventListener('moeen:report-done', onDone);
    return () => {
      window.removeEventListener('moeen:login-required', onLogin);
      window.removeEventListener('moeen:paywall', onPaywall);
      window.removeEventListener('moeen:report-done', onDone);
      window.clearTimeout(timer);
    };
  }, []);

  // Analytics: which calculator section is being viewed
  useEffect(() => {
    trackEvent('calculator_view', { tab: activeTab });
  }, [activeTab]);

  // Active Project & Unsaved changes tracking
  const [activeProject, setActiveProject] = useState<SavedProject | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showUnsavedConfirmModal, setShowUnsavedConfirmModal] = useState<boolean>(false);

  // Shared Project Summary State
  const [finishesTotal, setFinishesTotal] = useState<number>(0);
  const [finishesMaterials, setFinishesMaterials] = useState<number>(0);
  const [finishesLabor, setFinishesLabor] = useState<number>(0);
  const [finishesItemsCount, setFinishesItemsCount] = useState<number>(0);

  const [concreteVolume, setConcreteVolume] = useState<number>(0);
  const [concreteCementBags, setConcreteCementBags] = useState<number>(0);
  const [concreteCost, setConcreteCost] = useState<number>(0);

  const [steelTons, setSteelTons] = useState<number>(0);
  const [steelCost, setSteelCost] = useState<number>(0);

  const refreshProjects = useCallback(() => {
    if (currentUser) {
      syncProjectsFromFirestore(currentUser.id)
        .then((synced) => setProjects(synced))
        .catch(() => setProjects(loadSavedProjects(currentUser.id)));
    } else {
      setProjects(loadSavedProjects());
    }
  }, [currentUser]);

  const handleUpdateFinishes = useCallback(
    (total: number, materials: number, labor: number, count: number) => {
      setFinishesTotal(total);
      setFinishesMaterials(materials);
      setFinishesLabor(labor);
      setFinishesItemsCount(count);
      if (activeProject) {
        setHasUnsavedChanges(true);
      }
    },
    [activeProject]
  );

  const handleUpdateStructure = useCallback(
    (vol: number, bags: number, cCost: number, tons: number, sCost: number) => {
      setConcreteVolume(vol);
      setConcreteCementBags(bags);
      setConcreteCost(cCost);
      setSteelTons(tons);
      setSteelCost(sCost);
      if (activeProject) {
        setHasUnsavedChanges(true);
      }
    },
    [activeProject]
  );

  // Load project from My Projects into the active app session
  const handleLoadProjectIntoApp = useCallback((proj: SavedProject) => {
    setActiveProject(proj);
    setHasUnsavedChanges(false);
    setCurrency(proj.currency);
    setFinishesTotal(proj.finishesTotal);
    setFinishesMaterials(proj.finishesMaterials);
    setFinishesLabor(proj.finishesLabor);
    setFinishesItemsCount(proj.finishesItemsCount);
    setConcreteVolume(proj.concreteVolume);
    setConcreteCementBags(proj.concreteCementBags);
    setConcreteCost(proj.concreteCost);
    setSteelTons(proj.steelTons);
    setSteelCost(proj.steelCost);
    setActiveTab('summary');
  }, []);

  // Handler when user saves a project in Summary view
  const handleProjectSaved = useCallback(
    (saved: SavedProject) => {
      setActiveProject(saved);
      setHasUnsavedChanges(false);
      refreshProjects();
    },
    [refreshProjects]
  );

  // Unlink project to start a new blank calculation
  const handleUnlinkActiveProject = useCallback(() => {
    setActiveProject(null);
    setHasUnsavedChanges(false);
  }, []);

  // When clicking "مشروعاتي" from top navbar or footer
  const handleNavbarOpenProjects = useCallback(() => {
    if (!currentUser) {
      setIsAccountModalOpen(true);
      return;
    }
    if (activeProject && hasUnsavedChanges) {
      setShowUnsavedConfirmModal(true);
    } else {
      setIsProjectsModalOpen(true);
    }
  }, [currentUser, activeProject, hasUnsavedChanges]);

  // Confirm save and proceed to projects list
  const handleConfirmSaveAndOpenProjects = () => {
    if (activeProject) {
      const { id, createdAt, updatedAt, ...rest } = activeProject;
      const updated = saveProject({
        ...rest,
        id,
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
        grandTotal: Math.round((finishesTotal + steelCost + concreteCost) * 1.1),
      });
      setActiveProject(updated);
      setHasUnsavedChanges(false);
      refreshProjects();
    }
    setShowUnsavedConfirmModal(false);
    setIsProjectsModalOpen(true);
  };

  // Discard changes and proceed to projects list
  const handleConfirmDiscardAndOpenProjects = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedConfirmModal(false);
    setIsProjectsModalOpen(true);
  };

  const handleLogout = useCallback(async () => {
    try {
      await logOutFirebase();
    } catch (e) {
      console.warn('Firebase sign out failed:', e);
    }
    try {
      localStorage.removeItem('moeen_saved_projects');
    } catch {
      /* ignore */
    }
    saveCurrentUser(null);
    setCurrentUser(null);
    setActiveProject(null);
    setHasUnsavedChanges(false);
    setProjects([]);
  }, []);

  /*mrp-print*/
  const handlePrint = async () => {
    const fileName =
      ({
        finishes: 'حصر-الكميات-والتكلفة-لبنود-التشطيبات',
        concrete_structure: 'حصر-الكميات-والتكلفة-للخرسانة-والحديد',
        summary: 'تقرير-حصر-الكميات-والتكلفة-الإجمالية',
      } as Record<string, string>)[activeTab] || 'تقرير-معين-البناء';

    const guard = window as unknown as { __moeenPrinting?: boolean };
    if (guard.__moeenPrinting) return;
    guard.__moeenPrinting = true;

    let doc: HTMLElement | null = null;
    try {
      try {
        // تقرير مبني من البيانات (جداول فقط + ترويسة + توقيعات + ترقيم صفحات)
        doc = await buildReportDocument(activeTab);
      } catch (e) {
        console.error('report build failed, falling back to page capture', e);
        doc = null;
      }
      // إن لم يوجد تقرير لهذا القسم نرجع لتصوير الصفحة كما كان
      await exportReportWithQuota(doc || document.querySelector('main'), fileName, currentUser?.id, 'main_' + activeTab);
    } finally {
      if (doc) doc.remove();
      guard.__moeenPrinting = false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir="rtl">
      <OnboardingTour />
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        onPrint={handlePrint}
        currentUser={currentUser}
        onOpenAccount={() => setIsAccountModalOpen(true)}
        onOpenProjects={handleNavbarOpenProjects}
        projectsCount={projects.length}
        onLogout={handleLogout}
        onOpenCurrencySettings={() => setIsCurrencySettingsModalOpen(true)}
      />

      {/* Persistent Engineering Warning Banner in Mobile/Desktop */}
      <aside aria-label="تنبيه هندسي إرشادي" className="bg-amber-500/10 border-b border-amber-300/40 text-amber-950 px-4 py-2 text-xs no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-semibold text-[11px] sm:text-xs sm:truncate">
              {CRITICAL_ENGINEERING_DISCLAIMER}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeProject && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#003C69] text-white text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>المشروع النشط: {activeProject.projectName}</span>
                {hasUnsavedChanges && (
                  <span className="text-amber-300 mr-1 text-[10px] font-medium">(تعديلات غير محفوظة)</span>
                )}
              </span>
            )}

            {currentUser && (
              <button
                type="button"
                onClick={handleNavbarOpenProjects}
                className="text-[#003C69] hover:underline font-bold text-[11px] hidden sm:inline cursor-pointer"
              >
                قائمة مشروعاتك ({projects.length})
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className={activeTab === 'finishes' ? 'block' : 'hidden'}>
          <FinishingSection
            key={`finishes-${currency}-${currencyRefreshKey}`}
            currency={currency}
            onUpdateFinishesSummary={handleUpdateFinishes}
          />
        </div>

        <div className={activeTab === 'concrete_structure' ? 'block' : 'hidden'}>
          <ConcreteStructureSection
            key={`concrete-${currency}-${currencyRefreshKey}`}
            currency={currency}
            onUpdateStructureSummary={handleUpdateStructure}
          />
        </div>

        <div className={activeTab === 'summary' ? 'block' : 'hidden'}>
          <ProjectSummaryView
            key={`summary-${currency}-${currencyRefreshKey}`}
            currency={currency}
            finishesTotal={finishesTotal}
            finishesMaterials={finishesMaterials}
            finishesLabor={finishesLabor}
            finishesItemsCount={finishesItemsCount}
            steelTons={steelTons}
            steelCost={steelCost}
            concreteVolume={concreteVolume}
            concreteCementBags={concreteCementBags}
            concreteCost={concreteCost}
            onPrint={handlePrint}
            currentUser={currentUser}
            onOpenProjects={handleNavbarOpenProjects}
            onOpenAccount={() => setIsAccountModalOpen(true)}
            onProjectsUpdated={refreshProjects}
            activeProject={activeProject}
            onProjectSaved={handleProjectSaved}
            onUnlinkActiveProject={handleUnlinkActiveProject}
            onMarkDirty={() => setHasUnsavedChanges(true)}
          />
        </div>
      </main>

      {/* User Account Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        onUserChange={(usr) => {
          setCurrentUser(usr);
          refreshProjects();
        }}
        onOpenProjects={() => {
          setIsAccountModalOpen(false);
          handleNavbarOpenProjects();
        }}
        projectsCount={projects.length}
      />

      {/* Currency & Exchange Rate Manager Modal */}
      <CurrencySettingsModal
        isOpen={isCurrencySettingsModalOpen}
        onClose={() => setIsCurrencySettingsModalOpen(false)}
        activeCurrency={currency}
        onCurrencyChange={setCurrency}
        onRatesUpdated={() => setCurrencyRefreshKey((k) => k + 1)}
      />

      {/* My Projects & Reports Modal */}
      <ProjectsManagerModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        currentUser={currentUser}
        projects={projects}
        onRefreshProjects={refreshProjects}
        onLoadProjectIntoApp={handleLoadProjectIntoApp}
        activeProjectId={activeProject?.id}
        currentAppState={{
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
          grandTotal: Math.round((finishesTotal + steelCost + concreteCost) * 1.1),
        }}
      />

      {/* Unsaved Changes Confirmation Modal before navigating to Projects List */}
      {showUnsavedConfirmModal && activeProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-right p-6 space-y-4"
            dir="rtl"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">تعديلات غير محفوظة على المشروع</h3>
                <p className="text-xs text-slate-500">{activeProject.projectName}</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              أنت تعمل حالياً داخل مشروع <strong>«{activeProject.projectName}»</strong> وتوجد تعديلات جديدة على الكميات أو البيانات لم تُحفظ بعد. هل ترغب في حفظ التعديلات على نفس هذا المشروع قبل الانتقال لقائمة المشروعات؟
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmSaveAndOpenProjects}
                className="w-full py-2.5 bg-[#00B050] hover:bg-[#009b46] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات على نفس المشروع ومتابعة</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmDiscardAndOpenProjects}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>متابعة دون حفظ التعديلات</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUnsavedConfirmModal(false)}
                className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer transition-colors text-center"
              >
                إلغاء والبقاء في المشروع الحالي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin: activation codes (visible only to the admin account) */}
      {adminOpen && currentUser?.id === ADMIN_UID && (
        <AdminCodesPanel onClose={() => setAdminOpen(false)} />
      )}

      {/* Reports quota paywall */}
      <PaywallModal
        paywall={paywall}
        user={currentUser}
        onClose={() => setPaywall(null)}
        onRedeemed={(e) => {
          setPaywall(null);
          setToast(`تم تفعيل الكود. المتبقي لك الآن ${Math.max(e.limit - e.used, 0)} تقارير.`);
          window.setTimeout(() => setToast(null), 5000);
        }}
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] bg-[#003C69] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl border-b-2 border-[#B1A06D] no-print"
        >
          {toast}
        </div>
      )}

      <ReviewsSection currentUser={currentUser} onOpenAccount={() => setIsAccountModalOpen(true)} />

      <SeoAbout />

      {/* Footer */}
      <footer className="bg-[#003C69] text-white border-t-4 border-[#B1A06D] mt-12 py-8 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
          <div>
            <p className="font-bold text-white text-sm mb-1">
              مُعِين البناء والتشطيب — المنصة الهندسية الاسترشادية المتكاملة
            </p>
            <p>
              حساب كميات مواد التشطيبات والخرسانات والحديد بدقة مع حرية التسعير الكاملة وإدارة تقارير المشروعات والعملاء.
            </p>
          </div>

          <div className="flex items-center gap-4 text-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('finishes')}
              className="hover:text-white hover:underline cursor-pointer"
            >
              1. حاسبة ودليل التشطيبات
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setActiveTab('concrete_structure')}
              className="hover:text-white hover:underline cursor-pointer"
            >
              2. حاسبة ودليل الخرسانات
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className="hover:text-white hover:underline cursor-pointer"
            >
              3. تقرير الكميات والتكلفة الإجمالي
            </button>
            {currentUser && (
              <>
                <span>·</span>
                <button
                  type="button"
                  onClick={handleNavbarOpenProjects}
                  className="text-[#B1A06D] hover:underline font-bold cursor-pointer"
                >
                  مشروعاتي ({projects.length})
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
