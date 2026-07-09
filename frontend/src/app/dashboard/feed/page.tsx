'use client';

import React from 'react';
import ActivityFeed from '@/components/ActivityFeed';
import { useTranslation } from '@/hooks/useTranslation';

export default function FeedPage() {
  const { lang } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-10">
      <div className="border-b border-beige-200 pb-4">
        <h2 className="text-xl font-bold text-text-primary">
          {lang === 'en' ? 'Campus Social Feed' : 'ساحة التفاعل والأنشطة الجامعية'}
        </h2>
        <p className="text-xs text-text-secondary mt-1">
          {lang === 'en' 
            ? 'Connect with doctors, TAs, and peers. Share achievements and discuss academic topics.' 
            : 'تواصل مع الأساتذة، المعيدين، وزملائك. شارك إنجازاتك وناقش مختلف المواضيع الأكاديمية.'}
        </p>
      </div>

      <ActivityFeed />
    </div>
  );
}
