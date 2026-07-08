'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useToastStore } from '../../hooks/useToastStore';
import { Loader2, BookOpen, Lock, Mail, User } from 'lucide-react';
import Link from 'next/link';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: z.enum(['DOCTOR', 'TA', 'STUDENT']),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'STUDENT',
    }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const response = await axios.post(`${API_URL}/auth/signup`, data);

      addToast(response.data.message || 'Account created successfully!', 'success');
      router.push('/login');
    } catch (error: any) {
      console.error('Registration submit error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to register. Please try again.';
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
          <p className="text-sm text-text-secondary">Create your portal workspace account</p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Name input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary block">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary">
                <User className="w-4 h-4" />
              </span>
              <input
                {...register('name')}
                type="text"
                className="w-full py-2 pl-10 pr-4 text-sm font-medium text-text-primary"
              />
            </div>
            {errors.name && (
              <p className="text-xs font-semibold text-rose-500">{errors.name.message}</p>
            )}
          </div>

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

          {/* Password input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary block">Password</label>
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

          {/* Role select */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary block">Select Portal Role</label>
            <select
              {...register('role')}
              className="w-full py-2.5 px-3 text-sm font-medium text-text-primary bg-white border border-beige-300 rounded-xl focus:border-mint-400 focus:outline-none"
            >
              <option value="STUDENT">Student (Course Catalog & Lectures Portal)</option>
              <option value="DOCTOR">Doctor (Course Builder & Grading Dashboard)</option>
              <option value="TA">Teaching Assistant (TA Portal)</option>
            </select>
            {errors.role && (
              <p className="text-xs font-semibold text-rose-500">{errors.role.message}</p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center w-full py-3 mt-2 text-sm font-bold text-white rounded-xl shadow-soft bg-mint-500 hover:bg-mint-400 active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs font-semibold text-text-secondary">
          Already registered?{' '}
          <Link href="/login" className="text-mint-500 hover:underline">
            Sign In Here
          </Link>
        </div>

      </div>
    </div>
  );
}
