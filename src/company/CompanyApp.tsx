import React, { useState } from 'react';
import { loginCompanyUser, logoutCompanyUser, companyDb, createEngineerAccount, getCompanyMember, getCompanyEngineers, createCompanyProject } from './firebaseCompany';
import { Building2, KeyRound, Loader2, LogOut, Users, FolderKanban, X, UserPlus, HardHat } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';

export default function CompanyApp() {
  const [companyId, setCompanyId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [userData, setUserData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
 
  // States إضافة مشروع
  const [showAddProject, setShowAddProject] = useState(false);
  const [projName, setProjName] = useState('');
  const [engineers, setEngineers] = useState<any[]>([]);
  const [selectedEngineers, setSelectedEngineers] = useState<string[]>([]);
  const [projLoading, setProjLoading] = useState(false);
  const [projError, setProjError] = useState<string | null>(null);
  const [projSuccess, setProjSuccess] = useState<string | null>(null);

  // States إضافة مهندس
  const [showAddEngineer, setShowAddEngineer] = useState(false);
  const [engName, setEngName] = useState('');
  const [engUsername, setEngUsername] = useState('');
  const [engPassword, setEngPassword] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const openAddProject = async () => {
    setShowAddProject(true);
    setProjError(null);
    setProjSuccess(null);
    try {
      const engs = await getCompanyEngineers(userData.companyId);
      setEngineers(engs);
    } catch (err) {
      setProjError('حدث خطأ في تحميل قائمة المهندسين.');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) {
      setProjError('يرجى كتابة اسم المشروع.');
      return;
    }
    setProjLoading(true);
    try {
      await createCompanyProject(userData.companyId, {
        name: projName,
        assignedEngineers: selectedEngineers,
        showCost: false // ممكن تخليها ترو للتحكم في إظهار التكلفة
      });
      setProjSuccess('تم إنشاء المشروع بنجاح!');
      setProjName('');
      setSelectedEngineers([]);
    } catch (err) {
      setProjError('حدث خطأ أثناء إنشاء المشروع.');
    } finally {
      setProjLoading(false);
    }
  };

  const toggleEngineerSelection = (id: string) => {
    setSelectedEngineers(prev => 
      prev.includes(id) ? prev.filter(engId => engId !== id) : [...prev, id]
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId.trim() || !username.trim() || !password.trim()) {
      setError('يرجى ملء جميع الحقول.');
      return;
    }
    
    setError(null);
    setLoading(true);
    try {
      const authUser = await loginCompanyUser(username, companyId, password);
      const companyRef = doc(companyDb, 'companies', companyId);
      const companySnap = await getDoc(companyRef);
      
      if (!companySnap.exists()) {
        throw new Error('كود الشركة غير موجود في النظام.');
      }

      const memberData = await getCompanyMember(companyId, authUser.uid);
      
      if (!memberData) {
        await logoutCompanyUser();
        throw new Error('هذا الحساب غير مسجل في هذه الشركة. يرجى مراجعة الإدارة.');
      }

      if (memberData.isActive === false) {
        await logoutCompanyUser();
        throw new Error('هذا الحساب موقوف حالياً. يرجى التواصل مع إدارة الشركة.');
      }

      if (memberData.role !== 'manager' && memberData.role !== 'engineer') {
        await logoutCompanyUser();
        throw new Error('صلاحيات هذا الحساب غير معروفة.');
      }

      setCompanyData(companySnap.data());
      setUserData({ ...memberData, companyId });
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'بيانات الدخول غير صحيحة.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutCompanyUser();
    setUserData(null);
    setCompanyData(null);
    setCompanyId('');
    setUsername('');
    setPassword('');
  };

  const handleAddEngineer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!engName || !engUsername || !engPassword) {
      setAddError('يرجى ملء جميع الحقول.');
      return;
    }
    setAddLoading(true);
    setAddError(null);
    setAddSuccess(null);

    try {
      await createEngineerAccount(userData.companyId, engUsername, engPassword, engName);
      setAddSuccess('تم إنشاء حساب المهندس بنجاح!');
      setEngName('');
      setEngUsername('');
      setEngPassword('');
    } catch (err: any) {
      console.error("ERROR DETAILS:", err);
      if (err.code === 'auth/email-already-in-use') {
        setAddError('اسم المستخدم هذا مستخدم بالفعل في الشركة.');
      } else {
        setAddError('حدث خطأ أثناء إنشاء الحساب. تأكد من قوة الرقم السري (6 خانات على الأقل).');
      }
    } finally {
      setAddLoading(false);
    }
  };

  // ================= 1. شاشة المهندس =================
  if (userData && companyData && userData.role === 'engineer') {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center text-white">
                <HardHat className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-black text-[#003C69]">أهلاً، {userData.name}</h1>
                <p className="text-xs text-slate-500">شركة: {companyData.name} | دور: مهندس</p>
              </div>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-rose-50 text-rose-600 font-bold rounded-xl flex items-center gap-2 hover:bg-rose-100 transition-colors text-sm">
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center text-slate-500">
            <HardHat className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h2 className="text-lg font-bold text-slate-700">شاشة المهندس</h2>
            <p className="text-sm mt-2">هنا ستظهر المشاريع المسندة إليك وتسجيل التنفيذ (سيتم بناؤها لاحقاً).</p>
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. شاشة لوحة تحكم المدير =================
  if (userData && companyData && userData.role === 'manager') {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8" dir="rtl">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#003C69] rounded-xl flex items-center justify-center text-white">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-black text-[#003C69]">{companyData.name || 'اسم الشركة'}</h1>
                <p className="text-xs text-slate-500">كود الشركة: <span className="font-mono font-bold">{userData.companyId}</span> | دور: مدير</p>
              </div>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-rose-50 text-rose-600 font-bold rounded-xl flex items-center gap-2 hover:bg-rose-100 transition-colors text-sm">
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">المشاريع</h3>
                <p className="text-sm text-slate-500">إدارة مشاريع الشركة وبنود الميزانية.</p>
              </div>
              <button onClick={openAddProject} className="w-full py-2 bg-[#003C69] hover:bg-[#002f54] text-white font-bold rounded-xl text-sm transition-colors">
                إدارة المشاريع
              </button>
              {showAddProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h3 className="font-bold text-lg text-[#003C69]">إنشاء مشروع جديد</h3>
                <button onClick={() => setShowAddProject(false)} className="text-slate-400 hover:text-rose-500"><X className="w-5 h-5" /></button>
              </div>

              {projError && <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{projError}</div>}
              {projSuccess && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl font-bold">{projSuccess}</div>}

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">اسم المشروع</label>
                  <input type="text" value={projName} onChange={e => setProjName(e.target.value)} className="w-full border rounded-xl p-2.5 text-sm bg-slate-50" placeholder="مثال: فيلا 6 أكتوبر" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2">إسناد المهندسين (اختر من القائمة)</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded-xl bg-slate-50">
                    {engineers.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-2">لا يوجد مهندسين مضافين بعد.</p>
                    ) : (
                      engineers.map(eng => (
                        <label key={eng.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                          <input 
                            type="checkbox" 
                            checked={selectedEngineers.includes(eng.userId)}
                            onChange={() => toggleEngineerSelection(eng.userId)}
                            className="w-4 h-4 accent-[#003C69]"
                          />
                          <span className="text-sm font-bold text-slate-700">{eng.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <button type="submit" disabled={projLoading} className="w-full py-2.5 bg-[#00B050] text-white font-bold rounded-xl flex justify-center items-center gap-2">
                  {projLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FolderKanban className="w-5 h-5" />}
                  {projLoading ? 'جاري الحفظ...' : 'إنشاء المشروع'}
                </button>
              </form>
            </div>
          </div>
        )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">المهندسين</h3>
                <p className="text-sm text-slate-500">إضافة حسابات المهندسين وإسناد المشاريع.</p>
              </div>
              <button onClick={() => setShowAddEngineer(true)} className="w-full py-2 bg-[#003C69] hover:bg-[#002f54] text-white font-bold rounded-xl text-sm transition-colors">
                إدارة الفريق
              </button>
            </div>
          </div>
        </div>

        {showAddEngineer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h3 className="font-bold text-lg text-[#003C69]">إضافة مهندس جديد</h3>
                <button onClick={() => setShowAddEngineer(false)} className="text-slate-400 hover:text-rose-500"><X className="w-5 h-5" /></button>
              </div>

              {addError && <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{addError}</div>}
              {addSuccess && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl font-bold">{addSuccess}</div>}

              <form onSubmit={handleAddEngineer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">اسم المهندس</label>
                  <input type="text" value={engName} onChange={e => setEngName(e.target.value)} className="w-full border rounded-xl p-2.5 text-sm bg-slate-50" placeholder="م. محمد أحمد" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">اسم المستخدم (للدخول)</label>
                  <input type="text" value={engUsername} onChange={e => setEngUsername(e.target.value)} className="w-full border rounded-xl p-2.5 text-sm bg-slate-50" placeholder="mohamed" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">الرقم السري</label>
                  <input type="text" value={engPassword} onChange={e => setEngPassword(e.target.value)} className="w-full border rounded-xl p-2.5 text-sm bg-slate-50" placeholder="123456" dir="ltr" />
                </div>
                <button type="submit" disabled={addLoading} className="w-full py-2.5 bg-[#00B050] text-white font-bold rounded-xl flex justify-center items-center gap-2">
                  {addLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                  {addLoading ? 'جاري الحفظ...' : 'إضافة المهندس'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= 3. شاشة التحميل =================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4" dir="rtl">
        <Loader2 className="w-12 h-12 text-[#003C69] animate-spin mb-4" />
        <h2 className="text-lg font-bold text-[#003C69]">جاري التحقق من البيانات...</h2>
      </div>
    );
  }

  // ================= 4. شاشة تسجيل الدخول =================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border-t-4 border-[#003C69] max-w-md w-full">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-[#003C69]/10 rounded-2xl flex items-center justify-center mb-3">
            <Building2 className="w-8 h-8 text-[#003C69]" />
          </div>
          <h1 className="text-2xl font-black text-[#003C69]">نظام الشركات</h1>
        </div>

        {error && <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl text-center font-bold">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">كود الشركة</label>
            <input type="text" value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="w-full px-3 py-2.5 text-sm border rounded-xl bg-slate-50" dir="ltr" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم المستخدم</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2.5 text-sm border rounded-xl bg-slate-50" dir="ltr" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الرقم السري</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2.5 text-sm border rounded-xl bg-slate-50" dir="ltr" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-[#003C69] text-white rounded-xl font-bold flex justify-center items-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
            {loading ? 'جاري التحقق...' : 'دخول للنظام'}
          </button>
        </form>
      </div>
    </div>
  );
}