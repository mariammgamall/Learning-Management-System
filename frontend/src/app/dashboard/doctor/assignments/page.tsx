'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../utils/api';
import { ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function DoctorAssignmentsWorkspace() {
  const { lang } = useTranslation();
  
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['doctorCoursesAssignments'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data;
    },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-text-primary">
          {lang === 'en' ? 'Assignments Manager' : 'إدارة الواجبات الدراسية'}
        </h2>
        <p className="text-xs text-text-secondary mt-1">
          {lang === 'en' 
            ? 'Select one of your taught courses to post assignments, evaluate homework uploads, and approve TA grading.' 
            : 'اختر أحد المقررات التي تدرسها لنشر الواجبات، وتقييم الملفات المرفوعة من الطلاب، واعتماد رصد درجات المعيدين.'}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-mint-500 animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-beige-200 text-text-secondary text-xs">
          {lang === 'en' ? 'You are not currently teaching any courses.' : 'لا تقوم بتدريس أي مقررات حالياً.'}
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
                <h4 className="text-sm font-bold text-text-primary mt-2">{course.title}</h4>
                <p className="text-[11px] text-text-secondary mt-1">
                  {lang === 'en' ? 'Assignments: ' : 'الواجبات: '} {course._count?.assignments || 0}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-beige-100 flex justify-end">
                <Link
                  href={`/dashboard/doctor/courses/${course.id}?tab=assignments`}
                  className="px-4 py-2 bg-mint-50 text-mint-500 hover:bg-mint-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  {lang === 'en' ? 'Manage Assignments' : 'إدارة الواجبات'} <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
