'use client';

import React from 'react';
import { useTranslation } from '../../../../hooks/useTranslation';
import { Award, BarChart3, TrendingUp, Users, Clock, Smile, ShieldAlert } from 'lucide-react';

export default function SupportReportsPage() {
  const { lang } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-text-primary dark:text-neutral-100 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-mint-500" />
          {lang === 'en' ? 'Support Portal Reports & Analytics' : 'تقارير وتحليلات بوابة الدعم'}
        </h2>
        <p className="text-xs font-semibold text-text-secondary dark:text-neutral-400 mt-1">
          {lang === 'en' ? 'Visual reports tracking ticket statuses, resolution metrics, and SLA metrics.' : 'تقارير مرئية لمتابعة حالات التذاكر ومقاييس الأداء.'}
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-2">
          <div className="flex justify-between items-center text-text-secondary">
            <span className="text-[10px] font-bold uppercase tracking-wider">{lang === 'en' ? 'Customer Satisfaction' : 'نسبة رضا العملاء'}</span>
            <Smile className="w-4 h-4 text-mint-500" />
          </div>
          <p className="text-2xl font-black text-text-primary dark:text-neutral-100">96.8%</p>
          <span className="text-[9px] font-bold text-mint-500">↑ 1.2% {lang === 'en' ? 'vs last week' : 'مقارنة بالأسبوع الماضي'}</span>
        </div>

        <div className="p-5 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-2">
          <div className="flex justify-between items-center text-text-secondary">
            <span className="text-[10px] font-bold uppercase tracking-wider">{lang === 'en' ? 'Average First Response' : 'متوسط وقت الرد الأول'}</span>
            <Clock className="w-4 h-4 text-mint-500" />
          </div>
          <p className="text-2xl font-black text-text-primary dark:text-neutral-100">1.2 hrs</p>
          <span className="text-[9px] font-bold text-mint-500">↓ 15m {lang === 'en' ? 'faster reply rate' : 'سرعة استجابة أفضل'}</span>
        </div>

        <div className="p-5 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-2">
          <div className="flex justify-between items-center text-text-secondary">
            <span className="text-[10px] font-bold uppercase tracking-wider">{lang === 'en' ? 'Average Resolution Time' : 'متوسط وقت حل التذكرة'}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-text-primary dark:text-neutral-100">4.5 hrs</p>
          <span className="text-[9px] font-bold text-mint-500">↓ 30m {lang === 'en' ? 'faster resolution' : 'سرعة حل أفضل'}</span>
        </div>

        <div className="p-5 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-2">
          <div className="flex justify-between items-center text-text-secondary">
            <span className="text-[10px] font-bold uppercase tracking-wider">{lang === 'en' ? 'SLA Compliance Rate' : 'معدل الالتزام باتفاقية الخدمة'}</span>
            <ShieldAlert className="w-4 h-4 text-mint-500" />
          </div>
          <p className="text-2xl font-black text-text-primary dark:text-neutral-100">98.5%</p>
          <span className="text-[9px] font-bold text-mint-500">99% {lang === 'en' ? 'SLA target met' : 'تحقيق الهدف المحدد'}</span>
        </div>
      </div>

      {/* Analytical Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horizontal Bar Chart: Most Common Support Issues */}
        <div className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-4">
          <h3 className="text-xs font-bold text-text-primary dark:text-neutral-100 flex items-center gap-2 border-b border-beige-100 dark:border-neutral-850 pb-2">
            <TrendingUp className="w-4 h-4 text-mint-500" />
            {lang === 'en' ? 'Most Common Support Issues' : 'المشاكل الأكثر شيوعاً'}
          </h3>

          <div className="space-y-4 text-xs font-semibold">
            {/* Password Reset */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-text-primary dark:text-neutral-300">{lang === 'en' ? 'Password Reset / Account recovery' : 'استعادة كلمة المرور / الحساب'}</span>
                <span className="text-text-secondary">40%</span>
              </div>
              <div className="w-full bg-beige-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-mint-500 h-full rounded-full transition-all duration-500" style={{ width: '40%' }} />
              </div>
            </div>

            {/* Course Enrollment */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-text-primary dark:text-neutral-300">{lang === 'en' ? 'Course Enrollment & Registration Issues' : 'مشاكل التسجيل والالتحاق بالمقررات'}</span>
                <span className="text-text-secondary">25%</span>
              </div>
              <div className="w-full bg-beige-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-mint-500 h-full rounded-full transition-all duration-500" style={{ width: '25%' }} />
              </div>
            </div>

            {/* Video Playback */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-text-primary dark:text-neutral-300">{lang === 'en' ? 'Video Playback & Buffering Problems' : 'مشاكل تشغيل وبث المحاضرات'}</span>
                <span className="text-text-secondary">20%</span>
              </div>
              <div className="w-full bg-beige-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-mint-500 h-full rounded-full transition-all duration-500" style={{ width: '20%' }} />
              </div>
            </div>

            {/* Assignments & Quizzes */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-text-primary dark:text-neutral-300">{lang === 'en' ? 'Assignments & Quizzes submissions' : 'رفع الواجبات وتسليم الاختبارات'}</span>
                <span className="text-text-secondary">15%</span>
              </div>
              <div className="w-full bg-beige-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-mint-500 h-full rounded-full transition-all duration-500" style={{ width: '15%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Support Agents Workload Performance */}
        <div className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-4">
          <h3 className="text-xs font-bold text-text-primary dark:text-neutral-100 flex items-center gap-2 border-b border-beige-100 dark:border-neutral-850 pb-2">
            <Users className="w-4 h-4 text-mint-500" />
            {lang === 'en' ? 'Support Performance by Agent' : 'أداء الوكلاء وحجم العمل'}
          </h3>

          <div className="divide-y divide-beige-100 dark:divide-neutral-850 font-semibold text-xs text-text-primary dark:text-neutral-200">
            <div className="py-2.5 flex justify-between items-center">
              <div>
                <p className="font-bold">support@lms.com</p>
                <p className="text-[10px] text-text-secondary">{lang === 'en' ? 'Enterprise Support Agent' : 'وكيل الدعم الفني الافتراضي'}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">182 {lang === 'en' ? 'Resolved' : 'تم حلها'}</p>
                <p className="text-[9px] text-mint-500 font-bold">98.2% CSAT</p>
              </div>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <div>
                <p className="font-bold">admin@lms.com</p>
                <p className="text-[10px] text-text-secondary">{lang === 'en' ? 'Fallback Admin Escalation' : 'المدير العام للدعم الفني'}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">63 {lang === 'en' ? 'Resolved' : 'تم حلها'}</p>
                <p className="text-[9px] text-mint-500 font-bold">95.5% CSAT</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
