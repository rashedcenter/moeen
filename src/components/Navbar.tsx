import React, { useState } from 'react';
import { CurrencyCode, UserProfile } from '../types';
import { CURRENCIES, loadCurrencyPricingMode, getActiveRate } from '../data/currencies';
import { Link } from 'react-router-dom'; // تمت الإضافة
import {
  Building2,
  Layers,
  Compass,
  Printer,
  CheckCircle,
  User,
  FolderKanban,
  ChevronDown,
  LogOut,
  Settings,
  Coins,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'finishes' | 'concrete_structure' | 'summary';
  setActiveTab: (tab: 'finishes' | 'concrete_structure' | 'summary') => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  onPrint: () => void;
  currentUser: UserProfile | null;
  onOpenAccount: () => void;
  onOpenProjects: () => void;
  projectsCount: number;
  onLogout?: () => void;
  onOpenCurrencySettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  onPrint,
  currentUser,
  onOpenAccount,
  onOpenProjects,
  projectsCount,
  onLogout,
  onOpenCurrencySettings,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pricingMode = loadCurrencyPricingMode();
  const activeRate = getActiveRate(currency);

  return (
    <header className="sticky top-0 z-40 bg-[#003C69] text-white border-b-4 border-[#B1A06D] shadow-md">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between min-h-16 py-2 gap-x-3 gap-y-2">
          
          {/* Brand Zone */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-white/10 hidden sm:flex items-center justify-center border border-white/20">
              <Building2 className="w-6 h-6 text-[#B1A06D]" />
            </div>
            <div>
              <span className="text-base sm:text-xl font-bold tracking-tight text-white block">
                مُعِين البناء والتشطيب
              </span>
              <span className="text-[11px] text-slate-300 hidden sm:block">
                حاسبة ودليل التشطيبات والخرسانات وحصر الكميات والتكلفة
              </span>
            </div>
          </div>

          {/* Navigation Links - 3 main sections */}
          <nav className="hidden 2xl:flex items-center gap-1.5 p-1 bg-black/20 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('finishes')}
              className={`px-3.5 py-2 text-xs xl:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'finishes'
                  ? 'bg-white text-[#003C69] shadow-sm font-bold'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>1. حاسبة ودليل التشطيبات</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('concrete_structure')}
              className={`px-3.5 py-2 text-xs xl:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'concrete_structure'
                  ? 'bg-white text-[#003C69] shadow-sm font-bold'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>2. حاسبة الخرسانات والحديد</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`px-3.5 py-2 text-xs xl:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'summary'
                  ? 'bg-[#00B050] text-white shadow-sm font-bold'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>3. تقرير الكميات والتكلفة</span>
            </button>
          </nav>

          {/* Controls: Projects, Account, Currency & Print */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* زرار نظام الشركات - تمت الإضافة */}
            <Link 
              to="/company" 
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#B1A06D]/20 hover:bg-[#B1A06D]/40 border border-[#B1A06D]/50 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-[#B1A06D]" />
              <span>الشركات</span>
            </Link>

            {/* Quick My Projects Button (Only visible after login) */}
            {currentUser && (
              <button
                type="button"
                onClick={onOpenProjects}
                title="مشروعاتي والتقارير المحفوظة"
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <FolderKanban className="w-4 h-4 text-[#B1A06D]" />
                <span className="hidden sm:inline">مشروعاتي</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#00B050] text-white text-[10px] font-mono">
                  {projectsCount}
                </span>
              </button>
            )}

            {/* Currency Selector with Live Status & Exchange Rate Manager */}
            <div className="hidden sm:flex items-center gap-1.5 bg-white/10 rounded-lg p-1 border border-white/20">
              <label htmlFor="top-currency-select" className="text-xs text-slate-300 mr-1.5 ml-0.5">
                العملة:
              </label>
              <select
                id="top-currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                aria-label="اختر عملة الحساب"
                className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer py-1 pl-1"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                    {c.symbol} ({c.name})
                  </option>
                ))}
              </select>

              {onOpenCurrencySettings && (
                <button
                  type="button"
                  onClick={onOpenCurrencySettings}
                  title="إعدادات العملات وسعر الصرف اليومي ومنع أخطاء الحساب"
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#B1A06D]/20 text-[#B1A06D] hover:bg-[#B1A06D]/30 hover:text-white border border-[#B1A06D]/40 transition-colors cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5 text-[#B1A06D]" />
                  {currency === 'EGP' ? (
                    <span className="hidden xl:inline">إعدادات الصرف</span>
                  ) : pricingMode === 'direct' ? (
                    <span>تسعير حر مستقل</span>
                  ) : (
                    <span>1 {CURRENCIES[currency].symbol} = {activeRate} ج.م</span>
                  )}
                </button>
              )}
            </div>

            {/* Mobile Currency Quick Trigger */}
            {onOpenCurrencySettings && (
              <button
                type="button"
                onClick={onOpenCurrencySettings}
                title="إعدادات العملة وسعر الصرف اليومي"
                className="sm:hidden px-2 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>{CURRENCIES[currency].symbol}</span>
                <Coins className="w-3.5 h-3.5 text-[#B1A06D]" />
              </button>
            )}

            {/* User Account Button & Dropdown */}
            <div className="relative">
              {currentUser ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                    title={`حساب: ${currentUser.name}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#B1A06D] text-slate-900 flex items-center justify-center font-black text-xs shrink-0">
                      {(currentUser.name || currentUser.email || "؟").charAt(0)}
                    </div>
                    <span className="font-bold text-white max-w-[80px] sm:max-w-[130px] truncate block text-xs">
                      {currentUser.name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute left-0 mt-2 w-56 rounded-xl bg-white text-slate-800 shadow-2xl border border-slate-200 py-2 z-50 text-right"
                      dir="rtl"
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] bg-sky-100 text-sky-800 font-bold">
                          {currentUser.role || 'مستخدم مسجل'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenProjects();
                        }}
                        className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <FolderKanban className="w-4 h-4 text-[#003C69]" />
                        <span>قائمة مشروعاتي ({projectsCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenAccount();
                        }}
                        className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        <span>إعدادات الحساب</span>
                      </button>

                      {onLogout && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>تسجيل الخروج</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAccount}
                  className="px-3 py-1.5 bg-[#B1A06D] hover:bg-[#a1905f] text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="تسجيل الدخول أو إنشاء حساب"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>حسابي</span>
                </button>
              )}
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={onPrint}
              title="طباعة التقرير الشامل"
              aria-label="طباعة التقرير"
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden xl:inline">طباعة</span>
            </button>
          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="2xl:hidden py-2 flex items-center justify-around border-t border-white/10 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('finishes')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
              activeTab === 'finishes' ? 'bg-white text-[#003C69] font-bold' : 'text-slate-200'
            }`}
          >
            1. التشطيبات
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('concrete_structure')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
              activeTab === 'concrete_structure' ? 'bg-white text-[#003C69] font-bold' : 'text-slate-200'
            }`}
          >
            2. الخرسانات والحديد
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
              activeTab === 'summary' ? 'bg-[#00B050] text-white font-bold' : 'text-slate-200'
            }`}
          >
            3. التقرير الإجمالي
          </button>
          {/* Mobile link for company system */}
          <Link to="/company" className="px-3 py-1.5 text-xs font-bold text-[#B1A06D] border border-[#B1A06D]/40 rounded-md whitespace-nowrap">
            الشركات
          </Link>
        </div>
      </div>
    </header>
  );
};