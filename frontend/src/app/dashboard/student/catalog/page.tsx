'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { useToastStore } from '@/hooks/useToastStore';
import { BookOpen, User, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

export default function StudentCatalog() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const { t, lang } = useTranslation();

  // Fetch Available Catalog
  const { data: catalog = [], isLoading } = useQuery({
    queryKey: ['catalogCourses'],
    queryFn: async () => {
      const response = await api.get('/courses?catalog=true');
      return response.data;
    },
  });

  // Enroll Mutation
  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const response = await api.post(`/courses/${courseId}/enroll`);
      return response.data;
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['catalogCourses'] });
      queryClient.invalidateQueries({ queryKey: ['studentCourses'] });
      queryClient.invalidateQueries({ queryKey: ['studentStats'] });
      addToast('Enrolled in course successfully!', 'success');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Enrollment failed';
      addToast(msg, 'error');
    },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-xs font-semibold">
      
      {/* Back button header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/student"
          className="p-2 bg-beige-200 text-text-secondary hover:text-text-primary rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4 animate-flip-on-rtl" />
        </Link>
        <div>
          <h2 className="text-lg font-bold text-text-primary">{t('catalog_title')}</h2>
          <p className="text-xs text-text-secondary">{t('catalog_subtitle')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-beige-200">
          <Loader2 className="w-8 h-8 text-mint-500 animate-spin" />
          <p className="text-xs text-text-secondary mt-2">Loading open catalog...</p>
        </div>
      ) : catalog.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-beige-200 flex flex-col items-center justify-center gap-3">
          <Sparkles className="w-10 h-10 text-mint-400" />
          <h3 className="text-sm font-bold text-text-primary">All Caught Up!</h3>
          <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
            There are no new open courses available for registration. You have enrolled in all published curriculum pathways.
          </p>
          <Link
            href="/dashboard/student"
            className="px-4 py-2 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft mt-2"
          >
            {t('courses')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {catalog.map((course: any) => (
            <div
              key={course.id}
              className="bg-white p-6 rounded-2xl shadow-soft border border-beige-200/80 hover:shadow-premium transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-mint-100 text-mint-500 rounded-full">
                      {course.code}
                    </span>
                    {course.isPaid ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full">
                        {course.price.toLocaleString()} LE
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                        {lang === 'en' ? 'Free' : 'مجاني'}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-text-secondary flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-mint-400" /> {course._count?.lectures || 0} {t('lectures')}
                  </span>
                </div>
                
                <h3 className="text-base font-bold text-text-primary mt-3">{course.title}</h3>
                
                {/* Render course description safely */}
                <div
                  className="text-xs text-text-secondary mt-2 line-clamp-3 leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{ __html: course.description }}
                />

                <div className="flex items-center gap-2 mt-4 text-[11px] text-text-secondary font-medium">
                  <User className="w-3.5 h-3.5 text-beige-300" />
                  <span>Instructor: <strong className="text-text-primary">{course.doctor?.name}</strong></span>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-beige-100">
                <button
                  onClick={() => {
                    if (course.isPaid) {
                      router.push(`/dashboard/student/courses/checkout?courseId=${course.id}`);
                    } else {
                      enrollMutation.mutate(course.id);
                    }
                  }}
                  disabled={enrollMutation.isPending}
                  className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft active:scale-[0.98] disabled:opacity-70 transition-all"
                >
                  {enrollMutation.isPending && enrollMutation.variables === course.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : course.isPaid ? (
                    t('buy_enroll')
                  ) : (
                    t('enroll_free')
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
