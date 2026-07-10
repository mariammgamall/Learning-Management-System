'use client';

import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  BrainCircuit,
  Compass,
  Briefcase,
  Layers,
  Users,
  CheckCircle2,
  Tv
} from 'lucide-react';

export default function AboutLMSPage() {
  const { lang } = useTranslation();

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-12">
      {/* 1. Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-mint-600 to-mint-400 dark:from-mint-950 dark:to-neutral-900 p-8 sm:p-12 text-white border border-beige-200/10 shadow-premium text-center space-y-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-20 -mb-20" />
        
        <span className="inline-block px-3 py-1 bg-white/10 text-white text-[10px] font-black uppercase rounded-full tracking-wider">
          {lang === 'en' ? 'LMS Innovation Hub' : 'مركز ابتكار LMS'}
        </span>
        <h2 className="text-xl sm:text-3xl font-black leading-tight max-w-2xl mx-auto">
          {lang === 'en'
            ? 'A Next-Generation Learning & Career Platform'
            : 'نظام إدارة التعلم والتطوير المهني من الجيل القادم'}
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-white/80 max-w-xl mx-auto leading-relaxed">
          {lang === 'en'
            ? 'A modern educational ecosystem designed to connect students, instructors, and administrators through intelligent learning tools, collaboration features, and career development opportunities.'
            : 'بيئة تعليمية متكاملة تربط الطلاب والمعلمين والإداريين بأدوات ذكية، تواصل اجتماعي، وتتبع الفرص المهنية.'}
        </p>
      </div>

      {/* 2. Why Choose Our LMS (Feature Grid) */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-black text-text-primary dark:text-neutral-100">
            {lang === 'en' ? 'Why Choose Our LMS Platform?' : 'لماذا منصة LMS الخاصة بنا؟'}
          </h3>
          <p className="text-xs text-text-secondary dark:text-neutral-400 font-semibold mt-1">
            {lang === 'en' ? 'Engineered from scratch to replace old, static portals with dynamic features.' : 'مصمم بالكامل ليحل محل الأنظمة القديمة بتجربة تفاعلية متطورة.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Smart Learning Experience */}
          <div className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-3">
            <div className="p-3 bg-mint-50 dark:bg-mint-950/20 rounded-xl text-mint-500 w-fit">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-text-primary dark:text-neutral-100">
              {lang === 'en' ? 'Smart Learning Experience' : 'تجربة تعليمية ذكية'}
            </h4>
            <p className="text-xs text-text-secondary dark:text-neutral-450 font-semibold leading-relaxed">
              {lang === 'en'
                ? 'Supports interactive courses, personalized roadmap steps, dynamic PDF academic transcript reports, and auto-certificates.'
                : 'دعم المقررات التفاعلية، والخرائط الأكاديمية المخصصة، وتصدير شهادات التخرج بشكل فوري.'}
            </p>
          </div>

          {/* Academic Management */}
          <div className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-3">
            <div className="p-3 bg-mint-50 dark:bg-mint-950/20 rounded-xl text-mint-500 w-fit">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-text-primary dark:text-neutral-100">
              {lang === 'en' ? 'Academic Management' : 'إدارة العملية الأكاديمية'}
            </h4>
            <p className="text-xs text-text-secondary dark:text-neutral-450 font-semibold leading-relaxed">
              {lang === 'en'
                ? 'Comprehensive quizzes builders with points weights, assignment managers, and live lecture video portals with instant summaries.'
                : 'أدوات متطورة لإنشاء الاختبارات وتوزيع العلامات، وإدارة الواجبات، وعرض بث المحاضرات.'}
            </p>
          </div>

          {/* AI-Powered Education */}
          <div className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-3">
            <div className="p-3 bg-mint-50 dark:bg-mint-950/20 rounded-xl text-mint-500 w-fit">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-text-primary dark:text-neutral-100">
              {lang === 'en' ? 'AI-Powered Education' : 'الذكاء الاصطناعي التعليمي'}
            </h4>
            <p className="text-xs text-text-secondary dark:text-neutral-450 font-semibold leading-relaxed">
              {lang === 'en'
                ? 'Includes AI Copilot chat assistance, automated smart summaries of lecture notes, and performance recommendation guides.'
                : 'مساعد ذكي للدردشة التفاعلية، وتلخيص تلقائي لنصوص المحاضرات، وتوصيات دراسية مخصصة.'}
            </p>
          </div>

          {/* Collaboration Platform */}
          <div className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-3">
            <div className="p-3 bg-mint-50 dark:bg-mint-950/20 rounded-xl text-mint-500 w-fit">
              <Compass className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-text-primary dark:text-neutral-100">
              {lang === 'en' ? 'Collaboration Platform' : 'منصة تواصل تفاعلية'}
            </h4>
            <p className="text-xs text-text-secondary dark:text-neutral-450 font-semibold leading-relaxed">
              {lang === 'en'
                ? 'Features a unified Social Activity Feed, bookmarks, repost tools, language translations, and comments section threads.'
                : 'ساحة تفاعل متكاملة، إشارات مرجعية، أدوات إعادة النشر، ترجمة فورية للمنشورات، ومناقشات التعليقات.'}
            </p>
          </div>

          {/* Career Development Hub */}
          <div className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-3">
            <div className="p-3 bg-mint-50 dark:bg-mint-950/20 rounded-xl text-mint-500 w-fit">
              <Briefcase className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-text-primary dark:text-neutral-100">
              {lang === 'en' ? 'Career Development Hub' : 'حاضنة التطوير المهني'}
            </h4>
            <p className="text-xs text-text-secondary dark:text-neutral-450 font-semibold leading-relaxed">
              {lang === 'en'
                ? 'Student Workspace to form research teams, build projects repositories, and apply to internship training opportunities.'
                : 'مساحة عمل خاصة بالطلاب لتكوين الفرق الأكاديمية، وعرض المشاريع البرمجية، والتقدم لفرص التدريب.'}
            </p>
          </div>

          {/* Advanced Technology */}
          <div className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-3">
            <div className="p-3 bg-mint-50 dark:bg-mint-950/20 rounded-xl text-mint-500 w-fit">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-text-primary dark:text-neutral-100">
              {lang === 'en' ? 'Advanced Tech Stack' : 'تكنولوجيا متطورة'}
            </h4>
            <p className="text-xs text-text-secondary dark:text-neutral-450 font-semibold leading-relaxed">
              {lang === 'en'
                ? 'Built on Next.js, Node.js, Prisma ORM, and PostgreSQL. Full RTL Arabic support and dynamic dark/light aesthetics.'
                : 'نظام مبني بأحدث الأدوات لضمان السرعة الفائقة والأمان، يدعم الوضع الداكن والواجهة العربية.'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. User Roles Showcase */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-black text-text-primary dark:text-neutral-100">
            {lang === 'en' ? 'Empowering All Educational Roles' : 'تمكين جميع الأطراف التعليمية'}
          </h3>
          <p className="text-xs text-text-secondary dark:text-neutral-400 font-semibold mt-1">
            {lang === 'en' ? 'Personalized workspaces crafted uniquely for each member role.' : 'أدوات مخصصة لتلبية احتياجات كل حساب بالمنظومة.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-semibold text-xs text-text-primary dark:text-neutral-200">
          {/* Students */}
          <div className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft flex items-start gap-4">
            <div className="p-2 bg-mint-100 dark:bg-mint-950/40 text-mint-500 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold">{lang === 'en' ? 'Student Role' : 'دور الطالب'}</h4>
              <ul className="space-y-1.5 text-text-secondary dark:text-neutral-400">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-mint-500" /> {lang === 'en' ? 'Interactive study modules' : 'دراسة المقررات والمحاضرات'}</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-mint-500" /> {lang === 'en' ? 'Submit quizzes & assignments' : 'تسليم الاختبارات والواجبات'}</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-mint-500" /> {lang === 'en' ? 'Team formation & internship applications' : 'تكوين فرق عمل والتقدم للتدريبات'}</li>
              </ul>
            </div>
          </div>

          {/* Instructors / Doctors */}
          <div className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft flex items-start gap-4">
            <div className="p-2 bg-mint-100 dark:bg-mint-950/40 text-mint-500 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold">{lang === 'en' ? 'Doctor / Instructor Role' : 'دور الدكتور / الأستاذ'}</h4>
              <ul className="space-y-1.5 text-text-secondary dark:text-neutral-400">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-mint-500" /> {lang === 'en' ? 'Construct quizzes with marks weights' : 'بناء اختبارات مع تحديد درجات الأسئلة'}</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-mint-500" /> {lang === 'en' ? 'Upload lecture notes and record attendance' : 'رفع ملفات المحاضرات وتسجيل الحضور'}</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-mint-500" /> {lang === 'en' ? 'Publish announcements and monitor logs' : 'نشر إعلانات المادة ومتابعة أداء الطلاب'}</li>
              </ul>
            </div>
          </div>

          {/* Teaching Assistants */}
          <div className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft flex items-start gap-4">
            <div className="p-2 bg-mint-100 dark:bg-mint-950/40 text-mint-500 rounded-lg">
              <Tv className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold">{lang === 'en' ? 'Teaching Assistant (TA) Role' : 'دور المعيد / المساعد'}</h4>
              <ul className="space-y-1.5 text-text-secondary dark:text-neutral-400">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-mint-500" /> {lang === 'en' ? 'Grade assignment files & quiz papers' : 'تقييم تسليمات الطلاب ورصد درجاتهم'}</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-mint-500" /> {lang === 'en' ? 'Generate class attendance report logs' : 'تصدير تقارير حضور وغياب الساعات'}</li>
              </ul>
            </div>
          </div>

          {/* Support Portal Agents */}
          <div className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft flex items-start gap-4">
            <div className="p-2 bg-mint-100 dark:bg-mint-950/40 text-mint-500 rounded-lg">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold">{lang === 'en' ? 'Help Centre Support Agent' : 'دور وكيل الدعم والمساعدة'}</h4>
              <ul className="space-y-1.5 text-text-secondary dark:text-neutral-400">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-mint-500" /> {lang === 'en' ? 'Real-time ticket workspace dashboard' : 'لوحة تحكم فورية وتتبع وإسناد التذاكر'}</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-mint-500" /> {lang === 'en' ? 'Internal note logging and student histories' : 'تدوين الملاحظات الداخلية ومراجعة سجل الطالب'}</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-mint-500" /> {lang === 'en' ? 'KB articles and visual charts reports' : 'نشر مقالات قاعدة المعرفة وتتبع مؤشرات الأداء'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
