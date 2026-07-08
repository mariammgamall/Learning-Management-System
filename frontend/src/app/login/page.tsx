'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useToastStore } from '../../hooks/useToastStore';
import { Loader2, BookOpen, Lock, Mail } from 'lucide-react';
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
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-tr from-beige-100 via-beige-50 to-mint-100 relative">
      
      {/* Floating Language Toggler */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          className="px-3 py-1.5 bg-white border border-beige-200 rounded-xl text-text-secondary hover:text-text-primary font-bold text-[10px] uppercase shadow-soft"
          suppressHydrationWarning
        >
          {mounted && lang === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-premium border border-beige-200 animate-slide-up text-xs font-semibold">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <div className="flex items-center justify-center w-14 h-14 bg-mint-400 text-white rounded-2xl shadow-soft animate-bounce">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">LMS</h1>
          <p className="text-xs text-text-secondary">{tSafe('login_title')}</p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary block">{tSafe('email_address')}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 rtl:right-0 rtl:left-auto flex items-center pl-3.5 rtl:pr-3.5 text-text-secondary">
                <Mail className="w-4 h-4" />
              </span>
              <input
                {...register('email')}
                type="email"
                placeholder="you@lms.com"
                className="w-full py-2.5 pl-10 pr-4 rtl:pl-4 rtl:pr-10 text-xs font-semibold text-text-primary bg-beige-50/50 border border-beige-200 rounded-xl outline-none focus:border-mint-500 transition-all"
                suppressHydrationWarning
              />
            </div>
            {errors.email && (
              <p className="text-xs font-semibold text-rose-500 animate-fade-in">{errors.email.message}</p>
            )}
          </div>

          {/* Password input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary block">{tSafe('password')}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 rtl:right-0 rtl:left-auto flex items-center pl-3.5 rtl:pr-3.5 text-text-secondary">
                <Lock className="w-4 h-4" />
              </span>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full py-2.5 pl-10 pr-4 rtl:pl-4 rtl:pr-10 text-xs font-semibold text-text-primary bg-beige-50/50 border border-beige-200 rounded-xl outline-none focus:border-mint-500 transition-all"
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
  );
}
