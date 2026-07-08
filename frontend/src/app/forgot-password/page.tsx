'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useToastStore } from '../../hooks/useToastStore';
import { Loader2, BookOpen, Mail, Key } from 'lucide-react';
import Link from 'next/link';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetCode, setResetCode] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    setIsSubmitting(true);
    setResetCode(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
      const response = await axios.post(`${API_URL}/auth/forgot-password`, data);

      addToast('Reset code generated successfully!', 'success');
      setResetCode(response.data.resetToken);
      setUserEmail(data.email);
    } catch (error: any) {
      console.error('Forgot password submit error:', error);
      const errorMsg = error.response?.data?.message || 'Email address not found.';
      addToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-tr from-beige-100 via-beige-50 to-mint-100 animate-fade-in">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-premium border border-beige-200">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 mb-6 text-center">
          <div className="flex items-center justify-center w-14 h-14 bg-mint-400 text-white rounded-2xl shadow-soft">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">LMS</h1>
          <p className="text-sm text-text-secondary">Recover your account password</p>
        </div>

        {resetCode && userEmail ? (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="p-4 bg-mint-50 border border-mint-200 rounded-xl space-y-2 text-xs font-semibold text-mint-800">
              <Key className="w-8 h-8 text-mint-500 mx-auto mb-1 animate-pulse" />
              <p>Demo Reset Code Generated:</p>
              <div className="text-2xl font-extrabold text-mint-600 select-all tracking-widest my-2 bg-white px-4 py-2.5 rounded-lg border border-mint-200">
                {resetCode}
              </div>
              <p className="text-[10px] text-mint-700/80">Please use this code along with your new password to reset your login access.</p>
            </div>

            <Link
              href={`/reset-password?email=${encodeURIComponent(userEmail)}&code=${resetCode}`}
              className="flex items-center justify-center w-full py-3 text-sm font-bold text-white rounded-xl shadow-soft bg-mint-500 hover:bg-mint-400"
            >
              Proceed to Reset Password
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <p className="text-xs text-text-secondary leading-relaxed text-center">
              Enter the email address registered with your account, and we will generate a password recovery verification token for you.
            </p>

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
                  required
                />
              </div>
              {errors.email && (
                <p className="text-xs font-semibold text-rose-500">{errors.email.message}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center w-full py-3 text-sm font-bold text-white rounded-xl shadow-soft bg-mint-500 hover:bg-mint-400 active:scale-[0.98] disabled:opacity-75"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Generate Recovery Code'
              )}
            </button>

            <div className="text-center text-xs font-semibold text-text-secondary">
              Remember your password?{' '}
              <Link href="/login" className="text-mint-500 hover:underline">
                Sign In Here
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
