import React from 'react';

export default function CompanyApp() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-[#003C69] max-w-md w-full text-center">
        <h1 className="text-3xl font-black text-[#003C69] mb-4">نظام الشركات</h1>
        <p className="text-slate-600">مرحباً بك في منصة إدارة المشروعات للشركات الهندسية.</p>
        <p className="text-xs text-slate-400 mt-6">هذه الصفحة مخصصة للمرحلة الأولى من التجهيز.</p>
      </div>
    </div>
  );
}