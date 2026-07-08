'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import { Users, BookOpen, GraduationCap, School, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
  });

  const metrics = statsData?.metrics || {
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    doctors: 0,
    tas: 0,
    students: 0,
    activeUsers: 0,
  };

  const cards = [
    { label: 'Total Registrations', value: metrics.totalUsers, icon: Users, color: 'bg-indigo-50 text-indigo-500 border-indigo-100' },
    { label: 'Courses Created', value: metrics.totalCourses, icon: BookOpen, color: 'bg-mint-50 text-mint-500 border-mint-100' },
    { label: 'Active Students', value: metrics.students, icon: GraduationCap, color: 'bg-teal-50 text-teal-500 border-teal-100' },
    { label: 'Total Enrollments', value: metrics.totalEnrollments, icon: School, color: 'bg-amber-50 text-amber-500 border-amber-100' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Hero Panel */}
      <div className="p-6 md:p-8 bg-beige-200 border border-beige-300 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[160px]">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-mint-500">
            System Administration
          </span>
          <h2 className="text-xl md:text-2xl font-black text-text-primary">LMS Platform Hub Control</h2>
          <p className="text-xs text-text-secondary max-w-md leading-relaxed">
            Manage instructors, assistants, students, and course registries. View system-wide analytics.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 bg-white rounded-2xl shadow-soft border flex items-center gap-4 ${card.color}`}
            >
              <div className="p-3 rounded-xl bg-white shadow-sm">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">
                  {card.label}
                </span>
                <span className="text-lg font-black block mt-0.5">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Platform breakdowns and shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* User Role break-down */}
        <div className="p-6 bg-white rounded-2xl border border-beige-200 shadow-soft space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest border-b border-beige-100 pb-2">
            User Demographics
          </h3>
          
          <div className="space-y-3 text-xs font-medium">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Doctors / Instructors:</span>
              <span className="text-text-primary font-bold bg-mint-50 text-mint-500 px-2 py-0.5 rounded-md">
                {metrics.doctors}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Teaching Assistants (TAs):</span>
              <span className="text-text-primary font-bold bg-teal-50 text-teal-500 px-2 py-0.5 rounded-md">
                {metrics.tas}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Active Students:</span>
              <span className="text-text-primary font-bold bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-md">
                {metrics.students}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-beige-100">
              <span className="text-text-secondary">Active Users:</span>
              <span className="text-text-primary font-extrabold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-mint-400" /> {metrics.activeUsers}
              </span>
            </div>
          </div>
        </div>

        {/* Admin operations quick panel */}
        <div className="md:col-span-2 p-6 bg-white rounded-2xl border border-beige-200 shadow-soft space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest border-b border-beige-100 pb-2">
            Administrative Shortcuts
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/dashboard/admin/users"
              className="p-4 rounded-xl border border-beige-200 hover:border-mint-200 hover:shadow-premium transition-all block group"
            >
              <h4 className="text-xs font-bold text-text-primary group-hover:text-mint-500">
                User Management Registry
              </h4>
              <p className="text-[10px] text-text-secondary mt-1">
                Register new accounts, assign roles, deactivate/reactivate student or instructor profiles.
              </p>
            </Link>

            <Link
              href="/dashboard/admin/courses"
              className="p-4 rounded-xl border border-beige-200 hover:border-mint-200 hover:shadow-premium transition-all block group"
            >
              <h4 className="text-xs font-bold text-text-primary group-hover:text-mint-500">
                Course Registry Control
              </h4>
              <p className="text-[10px] text-text-secondary mt-1">
                Create academic courses, assign head Doctors, and register teaching assistants (TAs).
              </p>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
