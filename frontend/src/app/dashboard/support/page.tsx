'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../../../hooks/useTranslation';
import { api } from '../../../utils/api';
import {
  LayoutDashboard,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  BarChart3,
  Loader2,
  Users
} from 'lucide-react';

export default function SupportDashboard() {
  const { lang } = useTranslation();

  // Fetch all tickets to calculate dashboard statistics dynamically
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-dashboard-tickets'],
    queryFn: async () => {
      const response = await api.get('/support/tickets');
      return response.data;
    },
  });

  // Calculate statistics
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t: any) => t.status === 'Open').length;
  const inProgressTickets = tickets.filter((t: any) => t.status === 'In Progress').length;
  const waitingTickets = tickets.filter((t: any) => t.status === 'Waiting for Student').length;
  const resolvedTickets = tickets.filter((t: any) => t.status === 'Resolved' || t.status === 'Closed').length;
  
  const pendingTickets = inProgressTickets + waitingTickets;
  const highPriorityTickets = tickets.filter((t: any) => t.priority === 'High' || t.priority === 'Urgent').length;

  // New tickets created today
  const todayStr = new Date().toDateString();
  const newTicketsToday = tickets.filter((t: any) => new Date(t.createdAt).toDateString() === todayStr).length;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft">
        <h2 className="text-xl font-black text-text-primary dark:text-neutral-100 flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-mint-500" />
          {lang === 'en' ? 'Support Portal Command Center' : 'لوحة تحكم بوابة الدعم الفني'}
        </h2>
        <p className="text-xs font-semibold text-text-secondary dark:text-neutral-400 mt-1">
          {lang === 'en'
            ? 'Monitor system workload, solve student workspace issues, and track help center satisfaction.'
            : 'متابعة حجم العمل، وحل مشكلات الطلاب الأكاديمية، ومتابعة مؤشرات الأداء.'}
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-8 h-8 text-mint-500 animate-spin" />
          <span className="text-xs text-text-secondary font-bold">
            {lang === 'en' ? 'Calculating portal stats...' : 'جاري حساب إحصائيات البوابة...'}
          </span>
        </div>
      ) : (
        <>
          {/* Stats Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Tickets */}
            <div className="p-5 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                  {lang === 'en' ? 'Total Tickets' : 'إجمالي التذاكر'}
                </span>
                <p className="text-2xl font-black text-text-primary dark:text-neutral-100">{totalTickets}</p>
                <span className="text-[9px] text-text-secondary font-bold">{lang === 'en' ? 'Life time submissions' : 'التذاكر المقدمة كلياً'}</span>
              </div>
              <div className="p-3 bg-beige-50 dark:bg-neutral-850 rounded-xl text-text-secondary">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            {/* New Tickets Today */}
            <div className="p-5 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                  {lang === 'en' ? 'New Today' : 'التذاكر الجديدة اليوم'}
                </span>
                <p className="text-2xl font-black text-text-primary dark:text-neutral-100">{newTicketsToday}</p>
                <span className="text-[9px] text-mint-500 font-bold">+{newTicketsToday} {lang === 'en' ? 'submissions today' : 'تذاكر اليوم'}</span>
              </div>
              <div className="p-3 bg-mint-50 dark:bg-mint-950/20 rounded-xl text-mint-500">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* Open / Pending */}
            <div className="p-5 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                  {lang === 'en' ? 'Open & Pending' : 'المفتوحة وقيد المراجعة'}
                </span>
                <p className="text-2xl font-black text-text-primary dark:text-neutral-100">
                  {openTickets} <span className="text-sm font-semibold text-text-secondary">/ {pendingTickets}</span>
                </p>
                <span className="text-[9px] text-amber-500 font-bold">{lang === 'en' ? 'Awaiting replies' : 'في انتظار الرد'}</span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl text-amber-500">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* High Priority / Urgent */}
            <div className="p-5 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                  {lang === 'en' ? 'Urgent / High Priority' : 'تذاكر عالية الأهمية'}
                </span>
                <p className="text-2xl font-black text-text-primary dark:text-neutral-100">{highPriorityTickets}</p>
                <span className="text-[9px] text-rose-500 font-bold">{lang === 'en' ? 'Requires immediate action' : 'تتطلب تدخلاً عاجلاً'}</span>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl text-rose-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Charts Visualization Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution SVG Pie-like Donut Representer */}
            <div className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-4">
              <h3 className="text-xs font-bold text-text-primary dark:text-neutral-100 flex items-center gap-2 border-b border-beige-100 dark:border-neutral-850 pb-2">
                <BarChart3 className="w-4 h-4 text-mint-500" />
                {lang === 'en' ? 'Ticket Status Distribution' : 'توزيع حالات التذاكر'}
              </h3>

              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
                {/* SVG Semi-donut representation */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background Circle */}
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--beige-200, #f5f2eb)" strokeWidth="3" />
                    
                    {/* Resolved circle */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="3.5"
                      strokeDasharray={`${totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0} ${100 - (totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0)}`}
                      strokeDashoffset="0"
                    />

                    {/* Pending circle */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke="#f59e0b"
                      strokeWidth="3.5"
                      strokeDasharray={`${totalTickets > 0 ? (pendingTickets / totalTickets) * 100 : 0} ${100 - (totalTickets > 0 ? (pendingTickets / totalTickets) * 100 : 0)}`}
                      strokeDashoffset={`-${totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0}`}
                    />
                  </svg>
                  
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-text-primary dark:text-neutral-100">{resolvedTickets}</span>
                    <span className="text-[8px] font-bold text-text-secondary uppercase">{lang === 'en' ? 'Resolved' : 'تم حلها'}</span>
                  </div>
                </div>

                {/* Legends */}
                <div className="space-y-2 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-mint-500" />
                    <span className="text-text-primary dark:text-neutral-300">{lang === 'en' ? 'Resolved / Closed' : 'تم الحل والإغلاق'}: {resolvedTickets}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-amber-500" />
                    <span className="text-text-primary dark:text-neutral-300">{lang === 'en' ? 'In Progress / Pending' : 'قيد المراجعة'}: {pendingTickets}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-beige-300" />
                    <span className="text-text-primary dark:text-neutral-300">{lang === 'en' ? 'Open / New' : 'تذاكر جديدة مفتوحة'}: {openTickets}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Goals / Resolution Speed Card */}
            <div className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-4">
              <h3 className="text-xs font-bold text-text-primary dark:text-neutral-100 flex items-center gap-2 border-b border-beige-100 dark:border-neutral-850 pb-2">
                <HelpCircle className="w-4 h-4 text-mint-500" />
                {lang === 'en' ? 'Support Portal Health & SLA' : 'سلامة البوابة والالتزام بالاتفاقيات'}
              </h3>

              <div className="grid grid-cols-2 gap-4 py-3 font-semibold text-xs text-text-primary dark:text-neutral-200">
                <div className="p-4 bg-beige-50/50 dark:bg-neutral-850 rounded-xl text-center space-y-1">
                  <span className="text-[9px] text-text-secondary uppercase font-bold block">{lang === 'en' ? 'Average Response' : 'متوسط وقت الرد'}</span>
                  <p className="text-xl font-black text-mint-500">1.2 hrs</p>
                  <span className="text-[8px] text-text-secondary">{lang === 'en' ? 'Goal: < 2 hours' : 'الهدف: أقل من ساعتين'}</span>
                </div>

                <div className="p-4 bg-beige-50/50 dark:bg-neutral-850 rounded-xl text-center space-y-1">
                  <span className="text-[9px] text-text-secondary uppercase font-bold block">{lang === 'en' ? 'Customer Score' : 'مؤشر رضا الطلاب'}</span>
                  <p className="text-xl font-black text-mint-500">4.8 / 5.0</p>
                  <span className="text-[8px] text-text-secondary">{lang === 'en' ? 'Goal: > 4.5 score' : 'الهدف: أعلى من 4.5'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-mint-50/30 dark:bg-mint-950/10 rounded-xl border border-mint-100/50 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-mint-500 flex-shrink-0" />
                <p className="text-[10px] leading-relaxed text-text-secondary dark:text-neutral-300">
                  {lang === 'en'
                    ? 'All systems active. Support team is operating within normal response rate SLA thresholds.'
                    : 'جميع الأنظمة نشطة. يعمل فريق الدعم الفني بكفاءة تامة وضمن النطاق الزمني المحدد.'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
