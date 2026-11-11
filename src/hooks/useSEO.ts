import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
}

/**
 * Hook مخصص لتحديث بيانات SEO والعنوان برمجياً داخل تطبيق React (SPA)
 */
export const useSEO = ({ title, description, keywords }: SEOProps) => {
  useEffect(() => {
    // 1. تحديث عنوان الصفحة
    document.title = `${title} | مُعِين - الحاسبة الهندسية`;

    // 2. تحديث وسم Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', description);
      document.head.appendChild(metaDescription);
    }

    // 3. تحديث وسم Meta Keywords (إذا وُجدت)
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute('content', keywords);
      } else {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        metaKeywords.setAttribute('content', keywords);
        document.head.appendChild(metaKeywords);
      }
    }
  }, [title, description, keywords]);
};