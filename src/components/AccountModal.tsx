import React, { useState } from 'react';
import { UserProfile, AccountType } from '../types';
import { saveCurrentUser } from '../data/projectStore';
import {
  signInWithGoogle,
  loginWithEmail,
  registerWithEmail,
  resetPasswordEmail,
  logOutFirebase,
} from '../lib/firebase';
import {
  User,
  X,
  Mail,
  Lock,
  Phone,
  Briefcase,
  LogIn,
  UserPlus,
  LogOut,
  FolderKanban,
  Loader2,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Building2,
  FileBadge,
} from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChange: (user: UserProfile | null) => void;
  onOpenProjects: () => void;
  projectsCount: number;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  onOpenProjects,
  projectsCount,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [accountType, setAccountType] = useState<AccountType>('individual');

  // Form fields
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxOrRegNumber, setTaxOrRegNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('مهندس استشاري');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);

  if (!isOpen) return null;

  // Friendly Arabic translation for Firebase error codes
  const mapFirebaseError = (err: any): string => {
    const code = err?.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'بيانات الدخول غير صحيحة، يرجى التأكد من البريد الإلكتروني وكلمة المرور.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول بدلاً من ذلك.';
    }
    if (code === 'auth/weak-password') {
      return 'كلمة المرور ضعيفة جداً، يرجى اختيار كلمة مرور من 6 خانات على الأقل.';
    }
    if (code === 'auth/invalid-email') {
      return 'صيغة البريد الإلكتروني غير صالحة.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'تم إغلاق نافذة تسجيل الدخول بجوجل قبل إتمام العملية.';
    }
    return err?.message || 'حدث خطأ أثناء الاتصال بالخدمة، يرجى المحاولة لاحقاً.';
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      saveCurrentUser(user);
      onUserChange(user);
      onClose();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(mapFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await loginWithEmail(email, password);
      saveCurrentUser(user);
      onUserChange(user);
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(mapFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (accountType === 'company') {
      if (!companyName.trim()) {
        setError('يرجى كتابة اسم الشركة أو المكتب الهندسي.');
        return;
      }
      if (!name.trim()) {
        setError('يرجى كتابة اسم المهندس أو الشخص المسؤول.');
        return;
      }
    } else {
      if (!name.trim()) {
        setError('يرجى كتابة الاسم الكامل.');
        return;
      }
    }

    if (!email.trim()) {
      setError('يرجى كتابة البريد الإلكتروني.');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب ألا تقل عن 6 خانات.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const displayName = accountType === 'company' ? `${companyName.trim()} (${name.trim()})` : name.trim();
      const userRole = accountType === 'company' ? (role || 'شركة / مكتب هندسي') : role;

      const user = await registerWithEmail(
        email,
        password,
        displayName,
        userRole,
        phone,
        accountType,
        accountType === 'company' ? companyName.trim() : undefined,
        accountType === 'company' ? taxOrRegNumber.trim() : undefined
      );

      saveCurrentUser(user);
      onUserChange(user);
      onClose();
    } catch (err: any) {
      console.error('Register error:', err);
      setError(mapFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني لإرسال رابط إعادة تعيين كلمة المرور.');
      return;
    }
    setError(null);
    setResetSuccess(null);
    setLoading(true);
    try {
      await resetPasswordEmail(email);
      setResetSuccess('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح! راجع صندوق الوارد أو مجلد الرسائل غير المرغوب فيها.');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(mapFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logOutFirebase();
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
    saveCurrentUser(null);
    onUserChange(null);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all text-right font-sans"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="bg-[#003C69] text-white p-5 flex items-center justify-between border-b-4 border-[#B1A06D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              {currentUser?.accountType === 'company' ? (
                <Building2 className="w-5 h-5 text-[#B1A06D]" />
              ) : (
                <User className="w-5 h-5 text-[#B1A06D]" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {currentUser ? `حساب: ${currentUser.name}` : 'تسجيل الدخول وإنشاء حساب'}
              </h2>
              <span className="text-xs text-slate-300">
                {currentUser
                  ? currentUser.accountType === 'company'
                    ? 'حساب شركة ومكتب هندسي معتمد'
                    : 'حساب شخصي للمهندسين والملاك'
                  : 'لحفظ مشروعاتك وإصدار مقايسات وتقارير رسمية'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {currentUser ? (
            /* Logged In Profile View */
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#003C69] text-white flex items-center justify-center font-bold text-lg shrink-0 border-2 border-[#B1A06D]">
                  {(currentUser.name || currentUser.email || "؟").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-base">{currentUser.name}</h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800">
                      {currentUser.accountType === 'company' ? '🏢 حساب شركة / مكتب' : '👤 حساب فردي'}
                    </span>
                    {currentUser.role && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200 text-slate-700">
                        {currentUser.role}
                      </span>
                    )}
                  </div>
                  {currentUser.companyName && (
                    <p className="text-xs text-[#003C69] font-bold mt-1">المنشأة: {currentUser.companyName}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">{currentUser.email}</p>
                  {currentUser.phone && (
                    <p className="text-xs text-slate-500 mt-0.5">الهاتف: {currentUser.phone}</p>
                  )}
                  {currentUser.taxOrRegNumber && (
                    <p className="text-xs text-slate-500 mt-0.5">السجل/القيد: {currentUser.taxOrRegNumber}</p>
                  )}
                </div>
              </div>

              {/* Projects Quick Card */}
              <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-sky-700 font-bold block">قائمة مشروعاتك</span>
                  <span className="text-sm text-slate-700 font-medium">
                    لديك <span className="font-bold text-[#003C69]">{projectsCount}</span> مشروع محفوظ
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProjects();
                  }}
                  className="px-4 py-2 bg-[#003C69] hover:bg-[#002f54] text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <FolderKanban className="w-4 h-4 text-[#B1A06D]" />
                  <span>فتح مشروعاتي</span>
                </button>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleLogout}
                  className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  <span>تسجيل الخروج</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          ) : (
            /* Logged Out: Sign In or Register */
            <div className="space-y-5">
              {/* Google Sign-in Button */}
              <div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 shadow-xs flex items-center justify-center gap-3 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>
                    {loading ? 'جاري الاتصال بجوجل...' : 'متابعة الدخول باستخدام حساب Google'}
                  </span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 font-medium">أو بالبريد الإلكتروني</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError(null);
                  }}
                  className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
                    tab === 'login'
                      ? 'border-[#003C69] text-[#003C69]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setError(null);
                  }}
                  className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
                    tab === 'register'
                      ? 'border-[#003C69] text-[#003C69]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>إنشاء حساب جديد</span>
                </button>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {tab === 'login' ? (
                isResetMode ? (
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-900 leading-relaxed">
                      أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً مباشراً لتعيين كلمة مرور جديدة لحسابك.
                    </div>

                    {resetSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="font-semibold">{resetSuccess}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        البريد الإلكتروني
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="engineer@example.com"
                          className="w-full pr-10 pl-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2.5 bg-[#003C69] hover:bg-[#002f54] text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>جاري إرسال الرابط...</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4" />
                            <span>إرسال رابط إعادة التعيين</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsResetMode(false);
                          setError(null);
                          setResetSuccess(null);
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        إلغاء والعودة
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        البريد الإلكتروني
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="engineer@example.com"
                          className="w-full pr-10 pl-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">كلمة المرور</label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsResetMode(true);
                            setError(null);
                            setResetSuccess(null);
                          }}
                          className="text-[11px] text-[#003C69] hover:underline font-bold cursor-pointer"
                        >
                          نسيت كلمة المرور؟
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pr-10 pl-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-[#003C69] hover:bg-[#002f54] text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>جاري تسجيل الدخول...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          <span>دخول إلى الحساب</span>
                        </>
                      )}
                    </button>
                  </form>
                )
              ) : (
                /* Registration Form with Individuals vs Companies Option */
                <form onSubmit={handleRegister} className="space-y-4">
                  
                  {/* Account Category Selector: أفراد أو شركات */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع الحساب المطلوب:</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setAccountType('individual');
                          setError(null);
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          accountType === 'individual'
                            ? 'bg-[#003C69] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span>أفراد ومهندسين</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAccountType('company');
                          setError(null);
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          accountType === 'company'
                            ? 'bg-[#003C69] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                        <span>شركات ومكاتب هندسية</span>
                      </button>
                    </div>
                  </div>

                  {accountType === 'company' ? (
                    /* Company Specific Fields */
                    <div className="space-y-3 bg-sky-50/50 p-3.5 rounded-xl border border-sky-100">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          اسم الشركة أو المكتب الهندسي <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="مثال: دار البناء للاستشارات الهندسية أو شركة الإعمار"
                            className="w-full pr-10 pl-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          يظهر اسم المنشأة بشكل رسمي في ترويسة جميع التقارير والمقايسات المطبوعة.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            اسم المهندس / المسؤول الممثل <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="م. أحمد الشريف"
                              className="w-full pr-10 pl-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            رقم السجل التجاري / القيد (اختياري)
                          </label>
                          <div className="relative">
                            <FileBadge className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                            <input
                              type="text"
                              value={taxOrRegNumber}
                              onChange={(e) => setTaxOrRegNumber(e.target.value)}
                              placeholder="س.ت / رقم قيد نقابي"
                              className="w-full pr-10 pl-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">نشاط المنشأة</label>
                        <div className="relative">
                          <Briefcase className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                          <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full pr-10 pl-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none bg-white"
                          >
                            <option value="مكتب استشارات وتصميم هندسي">مكتب استشارات وتصميم هندسي</option>
                            <option value="شركة مقاولات وتنفيذ وبناء">شركة مقاولات وتنفيذ وبناء</option>
                            <option value="شركة تطوير واستثمار عقاري">شركة تطوير واستثمار عقاري</option>
                            <option value="مكتب تصميم معماري وتشطيبات">مكتب تصميم معماري وتشطيبات وديكور</option>
                            <option value="شركة إدارة مشروعات">شركة إدارة مشروعات وإشراف</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Individual Specific Fields */
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          الاسم بالكامل (يظهر في ترويسة التقارير الرسمية) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="م. محمد علي"
                            className="w-full pr-10 pl-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">الصفة / التخصص</label>
                        <div className="relative">
                          <Briefcase className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                          <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full pr-10 pl-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none bg-white"
                          >
                            <option value="مهندس معماري">مهندس معماري</option>
                            <option value="مهندس إنشائي">مهندس إنشائي</option>
                            <option value="مهندس استشاري">مهندس استشاري</option>
                            <option value="مهندس مكتب فني وحصر">مهندس مكتب فني وحصر كميات</option>
                            <option value="مقاول تنفيذ">مقاول تنفيذ وبناء</option>
                            <option value="مالك مشروع / عميل">مالك مشروع / عميل</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Common Contact & Credential Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        البريد الإلكتروني <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full pr-10 pl-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        رقم الهاتف للتواصل (اختياري)
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="01xxxxxxxxx"
                          className="w-full pr-10 pl-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      كلمة المرور (6 خانات على الأقل) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pr-10 pl-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#003C69] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-[#003C69] hover:bg-[#002f54] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري إنشاء الحساب...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>
                          {accountType === 'company'
                            ? 'إنشاء حساب شركة وبدء الاستخدام'
                            : 'إنشاء حساب أفراد وبدء الاستخدام'}
                        </span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
