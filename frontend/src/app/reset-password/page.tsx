'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToastStore } from '../../hooks/useToastStore';
import { Loader2, BookOpen, Lock, Mail, Key } from 'lucide-react';
import Link from 'next/link';

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  resetToken: z.string().min(6, 'Reset code must be 6 digits'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToastStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const emailParam = searchParams.get('email') || '';
  const codeParam = searchParams.get('code') || '';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailParam,
      resetToken: codeParam,
    }
  });

  // Keep defaults sync'd with query params if they load late
  useEffect(() => {
    if (emailParam) setValue('email', emailParam);
    if (codeParam) setValue('resetToken', codeParam);
  }, [emailParam, codeParam, setValue]);

  const onSubmit = async (data: ResetPasswordValues) => {
    setIsSubmitting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
      const response = await axios.post(`${API_URL}/auth/reset-password`, data);

      addToast(response.data.message || 'Password reset successfully!', 'success');
      router.push('/login');
    } catch (error: any) {
      console.error('Reset password submit error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to reset password. Please check your details.';
      addToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Email input */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-text-primary block">Email Address</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary">
            <Mail className="w-4 h-4" />
          </span>
          <input
            {...register('email')}
            type="email"
            placeholder="you@lms.com"
            className="w-full py-2 pl-10 pr-4 text-sm font-medium text-text-primary"
          />
        </div>
        {errors.email && (
          <p className="text-xs font-semibold text-rose-500">{errors.email.message}</p>
        )}
      </div>

      {/* Code input */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-text-primary block">Verification Reset Code</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary">
            <Key className="w-4 h-4" />
          </span>
          <input
            {...register('resetToken')}
            type="text"
            placeholder="123456"
            className="w-full py-2 pl-10 pr-4 text-sm font-medium text-text-primary"
          />
        </div>
        {errors.resetToken && (
          <p className="text-xs font-semibold text-rose-500">{errors.resetToken.message}</p>
        )}
      </div>

      {/* Password input */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-text-primary block">New Strong Password</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary">
            <Lock className="w-4 h-4" />
          </span>
          <input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            className="w-full py-2 pl-10 pr-4 text-sm font-medium text-text-primary"
          />
        </div>
        {errors.password && (
          <p className="text-xs font-semibold text-rose-500 max-w-xs">{errors.password.message}</p>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center justify-center w-full py-3 mt-2 text-sm font-bold text-white rounded-xl shadow-soft bg-mint-500 hover:bg-mint-400 active:scale-[0.98] disabled:opacity-75"
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          'Reset Password'
        )}
      </button>

      <div className="text-center text-xs font-semibold text-text-secondary pt-2">
        Remember your password?{' '}
        <Link href="/login" className="text-mint-500 hover:underline">
          Sign In Here
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-tr from-beige-100 via-beige-50 to-mint-100 animate-fade-in">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-premium border border-beige-200">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 mb-6 text-center">
          <div className="flex items-center justify-center w-14 h-14 bg-mint-400 text-white rounded-2xl shadow-soft">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">LMS</h1>
          <p className="text-sm text-text-secondary">Set a new account password</p>
        </div>

        <React.Suspense fallback={
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-mint-500" />
          </div>
        }>
          <ResetPasswordForm />
        </React.Suspense>

      </div>
    </div>
  );
}
