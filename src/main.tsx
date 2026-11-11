import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// تحميل نظام الشركات فقط عند الحاجة (Lazy Loading) لحماية سرعة الموقع الأساسي
const CompanyApp = lazy(() => import('./company/CompanyApp.tsx'));

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-[#003C69]">جاري التحميل...</div>}>
        <Routes>
          {/* المسار الأساسي للحاسبة */}
          <Route path="/" element={<App />} />
          {/* مسار نظام الشركات الجديد */}
          <Route path="/company/*" element={<CompanyApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
);