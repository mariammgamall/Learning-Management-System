'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import { BookOpen, Calendar, BookOpenCheck, Award, ChevronRight, Play, Flame, Zap, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '../../../hooks/useTranslation';

export default function StudentDashboard() {
  const { t } = useTranslation();
  
  // 1. Fetch Dashboard Stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['studentStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
  });

  // 2. Fetch Enrolled Courses
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['studentCourses'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data;
    },
  });

  const metrics = statsData?.metrics || {
    enrolledCoursesCount: 0,
    lectureCompletionPercentage: 0,
    averageAssignmentGrade: 0,
    averageQuizGrade: 0,
    pendingAssignmentsCount: 0,
    quizzesTakenCount: 0,
  };

  const statCards = [
    {
      label: t('enrolled_courses'),
      value: metrics.enrolledCoursesCount,
      icon: BookOpen,
      color: 'bg-mint-100 text-mint-500',
    },
    {
      label: t('pending_assignments'),
      value: metrics.pendingAssignmentsCount,
      icon: Calendar,
      color: 'bg-amber-100 text-amber-500',
    },
    {
      label: t('avg_assignment_score'),
      value: `${metrics.averageAssignmentGrade}%`,
      icon: Award,
      color: 'bg-indigo-100 text-indigo-500',
    },
    {
      label: t('avg_quiz_score'),
      value: `${metrics.averageQuizGrade || 0}%`,
      icon: Award,
      color: 'bg-purple-100 text-purple-500',
    },
    {
      label: t('quizzes_taken'),
      value: metrics.quizzesTakenCount,
      icon: BookOpenCheck,
      color: 'bg-teal-100 text-teal-500',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* 1. Header Hero Panel */}
      <div className="p-6 md:p-8 bg-gradient-to-tr from-mint-500 to-mint-400 text-white rounded-3xl shadow-premium relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] font-bold tracking-widest bg-white/20 px-3 py-1 rounded-full uppercase">
            {t('student_hub')}
          </span>
          <h2 className="text-xl md:text-3xl font-extrabold">{t('excel_academics')}</h2>
          <p className="text-xs md:text-sm text-mint-100 max-w-md leading-relaxed">
            {t('hero_description')}
          </p>
        </div>
        <BooksBackground />
      </div>

      {/* 2. Visual Statistics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-5 bg-white rounded-2xl shadow-soft border border-beige-200/80 flex items-center gap-4 transition-transform hover:translate-y-[-2px]"
            >
              <div className={`p-3.5 rounded-xl ${card.color} flex-shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-secondary block uppercase tracking-wider">
                  {card.label}
                </span>
                <span className="text-lg font-extrabold text-text-primary block mt-0.5">
                  {card.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Progress Ring Circle & My Active Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Enrolled Courses list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-text-primary">{t('my_enrolled_courses')}</h3>
            <Link
              href="/dashboard/student/catalog"
              className="text-xs font-bold text-mint-500 hover:text-mint-400 flex items-center gap-1"
            >
              {t('discover_catalog')} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isCoursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-40 bg-white rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl shadow-soft border border-beige-200">
              <p className="text-sm font-semibold text-text-secondary">You are not enrolled in any courses yet.</p>
              <Link
                href="/dashboard/student/catalog"
                className="inline-block mt-4 px-5 py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft"
              >
                Browse Course Catalog
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

        {/* Gamification, Streaks & Achievements Hub */}
        <div className="space-y-6">
          {/* Level & XP Card */}
          <div className="p-5 bg-white rounded-2xl shadow-soft border border-beige-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">{t('gamification_hub')}</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" /> {t('level')} 3
              </span>
            </div>

            {/* Streak & XP Stats */}
            <div className="grid grid-cols-2 gap-3">
              {/* Daily Streak */}
              <div className="p-4 bg-orange-50 border border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/40 rounded-xl text-center shadow-soft relative overflow-hidden group">
                <Flame className="w-8 h-8 text-orange-500 mx-auto fill-current animate-pulse" />
                <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300 block uppercase mt-2">5 {t('day_streak')}</span>
                <span className="text-[8px] text-orange-600/70 dark:text-orange-400/80 block leading-tight mt-0.5">{t('streak_active')}</span>
              </div>

              {/* Experience Points */}
              <div className="p-4 bg-mint-50 border border-mint-100 dark:bg-mint-950/20 dark:border-mint-900/40 rounded-xl text-center shadow-soft relative overflow-hidden group">
                <Trophy className="w-8 h-8 text-mint-500 mx-auto fill-current" />
                <span className="text-[10px] font-bold text-mint-700 dark:text-mint-300 block uppercase mt-2">2,450 XP</span>
                <span className="text-[8px] text-mint-600/70 dark:text-mint-400/80 block leading-tight mt-0.5">{t('xp_to_next')}</span>
              </div>
            </div>

            {/* XP progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-bold text-text-secondary">
                <span>{t('xp_level_progress')}:</span>
                <span>80%</span>
              </div>
              <div className="w-full bg-beige-100 rounded-full h-1.5 overflow-hidden border border-beige-200">
                <div className="bg-mint-500 h-full rounded-full transition-all" style={{ width: '80%' }} />
              </div>
            </div>
          </div>

          {/* Academic Achievements / Badges locker */}
          <div className="p-5 bg-white rounded-2xl shadow-soft border border-beige-200/80 space-y-4">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">{t('achievements_locker')}</h4>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: t('perfect_attend'), desc: t('perfect_attend_desc'), icon: '🏆', color: 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-900/40 dark:text-indigo-300' },
                { name: t('quiz_champion'), desc: t('quiz_champion_desc'), icon: '🧠', color: 'bg-purple-50 border-purple-100 text-purple-700 dark:bg-purple-950/30 dark:border-purple-900/40 dark:text-purple-300' },
                { name: t('fast_graduate'), desc: t('fast_graduate_desc'), icon: '🎓', color: 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-300' },
                { name: t('code_cadet'), desc: t('code_cadet_desc'), icon: '💻', color: 'bg-teal-50 border-teal-100 text-teal-700 dark:bg-teal-950/30 dark:border-teal-900/40 dark:text-teal-300' },
              ].map((badge) => (
                <div key={badge.name} className={`p-3 rounded-xl border ${badge.color} text-center space-y-1 relative group cursor-pointer shadow-soft hover:shadow-md transition-all`}>
                  <div className="text-lg">{badge.icon}</div>
                  <h5 className="text-[9px] font-extrabold truncate">{badge.name}</h5>
                  <p className="text-[8px] text-text-secondary dark:text-neutral-300 leading-tight opacity-0 group-hover:opacity-100 absolute inset-0 bg-white/95 dark:bg-neutral-900/95 rounded-xl flex items-center justify-center p-1.5 transition-opacity font-bold">
                    {badge.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Lecture progress bar card */}
          <div className="p-5 bg-white rounded-2xl shadow-soft border border-beige-200/80 space-y-3">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">{t('course_syllabus_progress')}</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-text-secondary">
                <span>{t('lecture_completion')}:</span>
                <span className="text-mint-500">{metrics.lectureCompletionPercentage}%</span>
              </div>
              <div className="w-full bg-beige-100 rounded-full h-2 overflow-hidden border border-beige-200">
                <div
                  className="bg-mint-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${metrics.lectureCompletionPercentage}%` }}
                />
              </div>
              <p className="text-[9.5px] text-text-secondary leading-normal pt-1">
                {t('you_watched_pre')}<strong className="text-text-primary">{metrics.lectureCompletionPercentage}%</strong>{t('you_watched_post')}
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

// Background illustration layout helper
function BooksBackground() {
  return (
    <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 hidden md:flex items-center justify-center">
      <svg
        className="w-40 h-40 stroke-white stroke-[1.5] fill-none"
        viewBox="0 0 24 24"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    </div>
  );
}
