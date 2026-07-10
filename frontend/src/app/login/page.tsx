'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useToastStore } from '../../hooks/useToastStore';
import { Loader2, BookOpen, Lock, Mail, GraduationCap, Sparkles, BrainCircuit, Compass, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '../../hooks/useTranslation';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { addToast } = useToastStore();
  const { t, lang, setLang } = useTranslation();
  const [mounted, setMounted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const tSafe = (key: string) => {
    return mounted ? t(key) : key;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
      // Post request supporting refresh token cookie
      const response = await axios.post(`${API_URL}/auth/login`, data, {
        withCredentials: true,
      });

      const { accessToken, user } = response.data;
      setAuth(accessToken, user);
      addToast(`Welcome back, ${user.name}!`, 'success');

      // Direct to role dashboard
      const role = user.role.toLowerCase();
      router.push(`/dashboard/${role}`);
    } catch (error: any) {
      console.error('Login submit error:', error);
      const errorMsg = error.response?.data?.message || 'Invalid email or password. Please try again.';
      addToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-tr from-beige-100 via-beige-50 to-mint-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 text-xs font-semibold relative">
      
      {/* Floating Language Toggler */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 text-text-primary dark:text-neutral-200 rounded-xl hover:text-mint-500 font-bold text-[10px] uppercase shadow-soft"
          suppressHydrationWarning
        >
          {mounted && lang === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      {/* Left side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md p-8 bg-white dark:bg-neutral-900 rounded-2xl shadow-premium border border-beige-200 dark:border-neutral-850 animate-slide-up">
          
          {/* Brand Header */}
          <div className="flex flex-col items-center gap-2 mb-8 text-center">
            <div className="flex items-center justify-center w-14 h-14 bg-mint-400 text-white rounded-2xl shadow-soft animate-bounce">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary dark:text-neutral-100">LMS</h1>
            <p className="text-xs text-text-secondary dark:text-neutral-400">{tSafe('login_title')}</p>
          </div>

          {/* Form Container */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-primary dark:text-neutral-300 block">{tSafe('email_address')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 rtl:right-0 rtl:left-auto flex items-center pl-3.5 rtl:pr-3.5 text-text-secondary">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@lms.com"
                  className="w-full py-2.5 pl-10 pr-4 rtl:pl-4 rtl:pr-10 text-xs font-semibold text-text-primary dark:text-neutral-200 bg-beige-50/50 dark:bg-neutral-850 border border-beige-200 dark:border-neutral-700 rounded-xl outline-none focus:border-mint-500 transition-all"
                  suppressHydrationWarning
                />
              </div>
              {errors.email && (
                <p className="text-xs font-semibold text-rose-500 animate-fade-in">{errors.email.message}</p>
              )}
            </div>

            {/* Password input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-primary dark:text-neutral-300 block">{tSafe('password')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 rtl:right-0 rtl:left-auto flex items-center pl-3.5 rtl:pr-3.5 text-text-secondary">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className="w-full py-2.5 pl-10 pr-4 rtl:pl-4 rtl:pr-10 text-xs font-semibold text-text-primary dark:text-neutral-250 bg-beige-50/50 dark:bg-neutral-850 border border-beige-200 dark:border-neutral-700 rounded-xl outline-none focus:border-mint-500 transition-all"
                  suppressHydrationWarning
                />
              </div>
              {errors.password && (
                <p className="text-xs font-semibold text-rose-500 animate-fade-in">{errors.password.message}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center w-full py-3 mt-2 text-xs font-bold text-white rounded-xl shadow-soft bg-mint-500 hover:bg-mint-400 active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none transition-colors"
              suppressHydrationWarning
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                tSafe('sign_in')
              )}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-2 text-xs font-semibold text-text-secondary">
            <Link href="/forgot-password" className="text-mint-500 hover:underline">
              {mounted && lang === 'ar' ? 'نسيت / إعادة تعيين كلمة المرور؟' : 'Forgot/Reset Password?'}
            </Link>
            <div>
              {mounted && lang === 'ar' ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
              <Link href="/register" className="text-mint-500 hover:underline">
                {mounted && lang === 'ar' ? 'سجل حساباً جديداً هنا' : 'Sign Up Here'}
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Right side: Split screen Showcase */}
      <div className="hidden md:flex flex-1 flex-col justify-center bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md border-l border-beige-200 dark:border-neutral-850 p-12 overflow-y-auto max-h-screen custom-scrollbar">
        <div className="space-y-8 max-w-lg mx-auto">
          {/* Showcase Header */}
          <div className="space-y-3">
            <span className="inline-block px-3 py-1 bg-mint-500/10 text-mint-600 dark:text-mint-400 text-[10px] font-black uppercase rounded-full tracking-wider">
              {lang === 'en' ? 'LMS Innovation Hub' : 'مركز ابتكار LMS'}
            </span>
            <h2 className="text-2xl font-black text-text-primary dark:text-neutral-100 leading-tight">
              {lang === 'en' ? 'A Next-Generation Learning & Career Platform' : 'نظام إدارة التعلم والتطوير المهني من الجيل القادم'}
            </h2>
            <p className="text-xs font-semibold text-text-secondary dark:text-neutral-400 leading-relaxed">
              {lang === 'en'
                ? 'A modern educational ecosystem designed to connect students, instructors, and administrators through intelligent learning tools, collaboration features, and career development opportunities.'
                : 'بيئة تعليمية متكاملة تربط الطلاب والمعلمين والإداريين بأدوات ذكية، تواصل اجتماعي، وتتبع الفرص المهنية.'}
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Feature 1 */}
            <div className="p-4 bg-white dark:bg-neutral-900/90 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-2">
              <div className="p-2 bg-mint-50 dark:bg-mint-950/20 rounded-lg text-mint-500 w-fit">
                <BookOpen className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-text-primary dark:text-neutral-100">
                {lang === 'en' ? 'Smart Courses' : 'المقررات الذكية'}
              </h4>
              <p className="text-[10px] text-text-secondary dark:text-neutral-450 leading-relaxed font-semibold">
                {lang === 'en' ? 'Interactive roadmaps, video portals, and assignments.' : 'خرائط أكاديمية تفاعلية، محاضرات مرئية، وتتبع للواجبات.'}
              </p>
            </div>
            {/* Feature 2 */}
            <div className="p-4 bg-white dark:bg-neutral-900/90 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-2">
              <div className="p-2 bg-mint-50 dark:bg-mint-950/20 rounded-lg text-mint-500 w-fit">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-text-primary dark:text-neutral-100">
                {lang === 'en' ? 'AI Study Copilot' : 'مساعد الذكاء الاصطناعي'}
              </h4>
              <p className="text-[10px] text-text-secondary dark:text-neutral-450 leading-relaxed font-semibold">
                {lang === 'en' ? 'Get instant AI lecture summaries and recommendations.' : 'تلخيص فوري للمحاضرات وإرشاد دراسي ذكي لتطوير مستواك.'}
              </p>
            </div>
            {/* Feature 3 */}
            <div className="p-4 bg-white dark:bg-neutral-900/90 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-2">
              <div className="p-2 bg-mint-50 dark:bg-mint-950/20 rounded-lg text-mint-500 w-fit">
                <Compass className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-text-primary dark:text-neutral-100">
                {lang === 'en' ? 'Social Collaboration' : 'التفاعل الاجتماعي'}
              </h4>
              <p className="text-[10px] text-text-secondary dark:text-neutral-450 leading-relaxed font-semibold">
                {lang === 'en' ? 'Social feed posts, bookmarking, and thread comments.' : 'ساحة تواصل، إشارات مرجعية، وإعادة نشر وترجمة تلقائية للمنشورات.'}
              </p>
            </div>
            {/* Feature 4 */}
            <div className="p-4 bg-white dark:bg-neutral-900/90 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-2">
              <div className="p-2 bg-mint-50 dark:bg-mint-950/20 rounded-lg text-mint-500 w-fit">
                <Briefcase className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-text-primary dark:text-neutral-100">
                {lang === 'en' ? 'Workspace & Portfolios' : 'مساحة العمل والتدريب'}
              </h4>
              <p className="text-[10px] text-text-secondary dark:text-neutral-450 leading-relaxed font-semibold">
                {lang === 'en' ? 'Build team projects, files submissions, and training paths.' : 'إنشاء المشاريع البرمجية، تسليم الملفات، والتقدم للتدريبات المهنية.'}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
