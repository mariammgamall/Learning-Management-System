'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { useToastStore } from '@/hooks/useToastStore';
import { Loader2, ArrowLeft, CreditCard, ShieldCheck, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CourseCheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [courseId, setCourseId] = useState('');

  // Form states
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryId = urlParams.get('courseId');
      if (queryId) {
        setCourseId(queryId);
      }
    }
  }, []);

  // Fetch Course details
  const { data: course, isLoading: isCourseLoading } = useQuery({
    queryKey: ['checkoutCourseDetails', courseId],
    queryFn: async () => {
      const response = await api.get(`/courses/${courseId}`);
      return response.data;
    },
    enabled: !!courseId,
  });

  // Fetch Student Stats for Achievement Discounts
  const { data: statsData } = useQuery({
    queryKey: ['studentStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
  });

  const metrics = statsData?.metrics || {
    lectureCompletionPercentage: 0,
    averageAssignmentGrade: 0,
    averageQuizGrade: 0,
  };

  const perfectAttendanceUnlocked = metrics.lectureCompletionPercentage >= 75;
  const quizChampionUnlocked = (metrics.averageQuizGrade || 0) >= 85;
  const fastGraduateUnlocked = metrics.lectureCompletionPercentage === 100;
  const codeCadetUnlocked = metrics.averageAssignmentGrade >= 80;

  const unlockedCount = (perfectAttendanceUnlocked ? 1 : 0) + (quizChampionUnlocked ? 1 : 0) + (fastGraduateUnlocked ? 1 : 0) + (codeCadetUnlocked ? 1 : 0);
  const discountPercent = unlockedCount * 10; // 10% per badge

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/courses/${courseId}/enroll`, {
        paymentToken: 'DEMO_PAYMENT_SUCCESS',
        discountPercent,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentEnrolledCourses'] });
      queryClient.invalidateQueries({ queryKey: ['catalogCourses'] });
      addToast('Payment successful! Course access granted.', 'success');
      router.replace(`/dashboard/student/courses/${courseId}`);
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Payment enrollment failed', 'error');
      setIsProcessing(false);
    },
  });

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || cardNumber.length < 16 || expiry.length < 5 || cvv.length < 3) {
      return addToast('Please enter valid credit card credentials', 'error');
    }

    setIsProcessing(true);
    // Simulate payment transaction latency before triggering database enrollment
    setTimeout(() => {
      enrollMutation.mutate();
    }, 1800);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format card number with spaces every 4 digits
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format expiry date as MM/YY
    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
    let formatted = val;
    if (val.length >= 2) {
      formatted = `${val.substring(0, 2)}/${val.substring(2)}`;
    }
    setExpiry(formatted);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCvv(val);
  };

  if (isCourseLoading || !course) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-mint-500 animate-spin" />
        <p className="text-xs text-text-secondary mt-2">Initializing secure payment gateway...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header back link */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/student/catalog"
          className="p-2.5 bg-beige-200 text-text-secondary hover:text-text-primary rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Payment Checkout</h2>
          <p className="text-xs text-text-secondary">Simulated Sandbox Payment Gateway</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left Form Panel */}
        <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-3xl border border-beige-200/80 shadow-premium space-y-6">
          <div className="flex items-center gap-2 border-b border-beige-100 pb-3">
            <CreditCard className="w-5 h-5 text-mint-500" />
            <h3 className="text-sm font-bold text-text-primary">Sandbox Credit Card Details</h3>
          </div>

          <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs font-semibold">
            {/* Card Holder Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Cardholder Name</label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="w-full px-3 py-2.5 bg-beige-50/50 border border-beige-200 rounded-xl focus:border-mint-500 outline-none text-text-primary font-bold text-xs"
                required
              />
            </div>

            {/* Card Number */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Card Number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="xxxx-xxxx-xxxx-xxxx"
                className="w-full px-3 py-2.5 bg-beige-50/50 border border-beige-200 rounded-xl focus:border-mint-500 outline-none text-text-primary font-bold text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Expiration Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Expiry Date (MM/YY)</label>
                <input
                  type="text"
                  value={expiry}
                  onChange={handleExpiryChange}
                  className="w-full px-3 py-2.5 bg-beige-50/50 border border-beige-200 rounded-xl focus:border-mint-500 outline-none text-text-primary font-bold text-xs"
                  required
                />
              </div>

              {/* CVV */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">CVV (3 Digits)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="new-password"
                  value={cvv}
                  onChange={handleCvvChange}
                  placeholder="***"
                  className="w-full px-3 py-2.5 bg-beige-50/50 border border-beige-200 rounded-xl focus:border-mint-500 outline-none text-text-primary font-bold text-xs"
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft transition-all active:scale-[0.98] disabled:opacity-80 flex items-center justify-center gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing Payment Transaction...
                  </>
                ) : (
                  `Pay ${Math.max(0, course.price - Math.round((course.price * (unlockedCount * 10)) / 100)).toLocaleString()} LE & Enroll`
                )}
              </button>
            </div>
          </form>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-text-secondary border-t border-beige-100 pt-4">
            <ShieldCheck className="w-4 h-4 text-mint-500" />
            <span>256-bit SSL encrypted mock transaction framework</span>
          </div>
        </div>

        {/* Right Summary Panel */}
        <div className="lg:col-span-2 bg-beige-100/50 p-6 rounded-3xl border border-beige-200/80 space-y-6">
          <div>
            <span className="text-[9px] font-bold px-2 py-0.5 bg-mint-100 text-mint-500 rounded-full">
              {course.code}
            </span>
            <h4 className="text-sm font-bold text-text-primary mt-2">{course.title}</h4>
            <p className="text-[11px] text-text-secondary mt-1 line-clamp-3" dangerouslySetInnerHTML={{ __html: course.description }} />
          </div>

          {(() => {
            const originalPrice = course.price;
            const discountAmount = Math.round((originalPrice * discountPercent) / 100);
            const finalPrice = originalPrice - discountAmount;

            return (
              <div className="border-t border-beige-200 pt-4 space-y-3 text-xs font-semibold">
                <h5 className="text-[10px] font-bold text-text-secondary uppercase">Order Summary</h5>
                <div className="flex justify-between text-text-secondary">
                  <span>Course Tuition:</span>
                  <span>{originalPrice.toLocaleString()} LE</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-rose-500 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40">
                    <span>Gamification Discount (-{discountPercent}%):</span>
                    <span>- {discountAmount.toLocaleString()} LE</span>
                  </div>
                )}
                <div className="flex justify-between text-text-secondary">
                  <span>Platform Service Fee:</span>
                  <span>0.00 LE</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Value Added Tax (VAT):</span>
                  <span>0.00 LE</span>
                </div>
                <div className="flex justify-between text-text-primary font-bold border-t border-dashed border-beige-300 pt-3 text-sm">
                  <span>Total Price:</span>
                  <span className="text-mint-500">{finalPrice.toLocaleString()} LE</span>
                </div>
              </div>
            );
          })()}

          {discountPercent > 0 && (
            <div className="p-4 bg-mint-50 border border-mint-200 rounded-2xl text-[10px] text-mint-700 leading-relaxed font-bold animate-pulse">
              🎉 Achievements Discount Applied! You have unlocked {unlockedCount} badge(s) in your Gamification Hub, saving you {discountPercent}% on this course purchase!
            </div>
          )}

          <div className="p-4 bg-white border border-beige-200 rounded-2xl text-[10px] text-text-secondary leading-relaxed">
            * This is a sandbox demonstration page. Submitting payments checks authorization logic and performs complete simulator enrollments without charging actual credit cards.
          </div>
        </div>
      </div>
    </div>
  );
}
