'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import { BookOpen, Users, FileText, ClipboardList, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function DoctorDashboard() {
  const { t, lang } = useTranslation();

  // 1. Fetch Doctor Stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['doctorStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
  });

  // 2. Fetch Own Courses
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['doctorCoursesList'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data;
    },
  });

  const metrics = statsData?.metrics || {
    coursesCount: 0,
    totalEnrolledStudents: 0,
    lecturesCount: 0,
    assignmentsCount: 0,
    pendingGrading: 0,
    quizzesCount: 0,
  };

  const statCards = [
    { 
      label: lang === 'en' ? 'My Courses' : 'مقرراتي التدريسية', 
      value: metrics.coursesCount, 
      icon: BookOpen, 
      color: 'bg-indigo-50 border-indigo-100 text-indigo-500 dark:bg-indigo-950/20 dark:border-indigo-900/30' 
    },
    { 
      label: lang === 'en' ? 'Total Enrolled Students' : 'إجمالي الطلاب المسجلين', 
      value: metrics.totalEnrolledStudents, 
      icon: Users, 
      color: 'bg-mint-50 border-mint-100 text-mint-500 dark:bg-mint-950/20 dark:border-mint-900/30' 
    },
    { 
      label: lang === 'en' ? 'Grading Queue' : 'قائمة انتظار التقييم', 
      value: metrics.pendingGrading, 
      icon: FileText, 
      color: metrics.pendingGrading > 0 
        ? 'bg-amber-50 text-amber-500 border-amber-200 shadow-sm animate-pulse dark:bg-amber-950/20 dark:border-amber-900/30' 
        : 'bg-beige-100 text-text-secondary border-beige-200 dark:bg-neutral-850 dark:border-neutral-800' 
    },
    { 
      label: lang === 'en' ? 'Total Quizzes' : 'إجمالي الاختبارات', 
      value: metrics.quizzesCount, 
      icon: ClipboardList, 
      color: 'bg-teal-50 border-teal-100 text-teal-500 dark:bg-teal-950/20 dark:border-teal-900/30' 
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Hero Panel */}
      <div className="p-6 md:p-8 bg-gradient-to-tr from-mint-500 to-mint-400 text-white rounded-3xl shadow-premium relative overflow-hidden flex flex-col justify-between">
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] font-bold tracking-widest bg-white/20 px-3 py-1 rounded-full uppercase">
            {lang === 'en' ? 'Instructor Portal' : 'بوابة المحاضر'}
          </span>
          <h2 className="text-xl md:text-3xl font-extrabold">{lang === 'en' ? 'Academic Management' : 'الإدارة الأكاديمية'}</h2>
          <p className="text-xs md:text-sm text-mint-100 max-w-md leading-relaxed">
            {lang === 'en' 
              ? 'Manage course curriculum chapters, build testing sheets, and review assignment submissions.' 
              : 'إدارة فصول ومناهج المقررات، إعداد أوراق الاختبارات، ومراجعة تسليمات الطلاب للواجبات والتكليفات.'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 bg-white dark:bg-neutral-900 rounded-2xl shadow-soft border flex items-center gap-4 ${card.color}`}
            >
              <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 shadow-sm flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-text-secondary dark:text-neutral-300 uppercase tracking-wider block">
                  {card.label}
                </span>
                <span className="text-lg font-black block mt-0.5">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Courses List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-text-primary">
          {lang === 'en' ? 'Instructed Courses Registry' : 'سجل المقررات التدريسية'}
        </h3>

        {isCoursesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 bg-white dark:bg-neutral-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-beige-200 dark:border-neutral-800 text-text-secondary text-xs">
            {lang === 'en' ? 'You do not instruct any courses yet.' : 'لا توجد لديك مقررات تدريسية حالياً.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => (
              <div
                key={course.id}
                className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-soft border border-beige-200/80 dark:border-neutral-800 hover:shadow-premium transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold px-2.5 py-0.5 bg-mint-100 dark:bg-mint-950 text-mint-500 dark:text-mint-300 rounded-full">
                      {course.code}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-beige-200 dark:bg-neutral-800 text-text-primary dark:text-neutral-100 rounded-full">
                      {course.isPublished 
                        ? (lang === 'en' ? 'Published' : 'منشور') 
                        : (lang === 'en' ? 'Draft' : 'مسودة')}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-text-primary mt-3 line-clamp-1">{course.title}</h4>
                  
                  {/* Stats list */}
                  <div className="mt-4 space-y-1.5 text-[11px] text-text-secondary dark:text-neutral-400 font-medium">
                    <div className="flex justify-between">
                      <span>{lang === 'en' ? 'Enrolled students:' : 'الطلاب المسجلون:'}</span>
                      <strong className="text-text-primary">{course._count?.enrollments || 0}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{lang === 'en' ? 'Lectures:' : 'المحاضرات:'}</span>
                      <strong className="text-text-primary">{course._count?.lectures || 0}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-beige-100 dark:border-neutral-800">
                  <Link
                    href={`/dashboard/doctor/courses/${course.id}`}
                    className="w-full py-2 bg-mint-50 dark:bg-mint-950/20 hover:bg-mint-500 text-mint-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    {lang === 'en' ? 'Enter Control Workspace' : 'دخول مساحة التحكم'} 
                    <ArrowRight className="w-3.5 h-3.5 animate-flip-on-rtl" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
