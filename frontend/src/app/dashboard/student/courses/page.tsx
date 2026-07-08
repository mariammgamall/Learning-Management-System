'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../utils/api';
import { BookOpen, ChevronRight, Play, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '../../../../hooks/useTranslation';

export default function StudentCoursesPage() {
  const { t } = useTranslation();
  
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['studentCoursesPageList'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data;
    },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in text-xs font-semibold">
      <div>
        <h2 className="text-xl font-bold text-text-primary">{t('enrolled_courses_title')}</h2>
        <p className="text-xs text-text-secondary mt-1">{t('enrolled_courses_subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-beige-200 shadow-soft">
          <p className="text-sm font-semibold text-text-secondary">{t('no_courses')}</p>
          <Link
            href="/dashboard/student/catalog"
            className="inline-block mt-4 px-5 py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft"
          >
            {t('browse_catalog')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course: any) => (
            <div
              key={course.id}
              className="bg-white p-5 rounded-2xl shadow-soft border border-beige-200/80 hover:shadow-premium transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[9px] font-bold px-2 py-0.5 bg-mint-100 text-mint-500 rounded-full">
                  {course.code}
                </span>
                <h4 className="text-sm font-bold text-text-primary mt-2 line-clamp-1">{course.title}</h4>
                <p className="text-[11px] text-text-secondary mt-1">Instructor: {course.doctor?.name}</p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-beige-100 flex items-center justify-between">
                <span className="text-xs font-bold text-text-secondary">
                  {course._count?.lectures || 0} {t('lectures')}
                </span>
                <Link
                  href={`/dashboard/student/courses/${course.id}`}
                  className="px-4 py-2 bg-mint-50 text-mint-500 hover:bg-mint-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> {t('enter_portal')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
