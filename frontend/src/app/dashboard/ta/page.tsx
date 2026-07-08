'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import { BookOpen, Users, FileText, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TADashboard() {
  // 1. Fetch TA Stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['taStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
  });

  // 2. Fetch Assigned Courses
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['taCoursesList'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data;
    },
  });

  const metrics = statsData?.metrics || {
    assignedCourses: 0,
    totalStudents: 0,
    pendingGrading: 0,
    lecturesUploaded: 0,
  };

  const statCards = [
    { label: 'Assigned Courses', value: metrics.assignedCourses, icon: BookOpen, color: 'bg-indigo-50 text-indigo-500 border-indigo-100' },
    { label: 'Enrolled Students', value: metrics.totalStudents, icon: Users, color: 'bg-mint-50 text-mint-500 border-mint-100' },
    { label: 'Grading Queue', value: metrics.pendingGrading, icon: FileText, color: metrics.pendingGrading > 0 ? 'bg-amber-50 text-amber-500 border-amber-200 shadow-sm animate-pulse' : 'bg-beige-100 text-text-secondary border-beige-200' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in">
      
      {/* Hero Panel */}
      <div className="p-6 md:p-8 bg-gradient-to-tr from-teal-600 to-teal-500 text-white rounded-3xl shadow-premium relative overflow-hidden flex flex-col justify-between">
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] font-bold tracking-widest bg-white/20 px-3 py-1 rounded-full uppercase">
            Assistant Portal
          </span>
          <h2 className="text-xl md:text-3xl font-extrabold">Teaching Assistant Workspace</h2>
          <p className="text-xs md:text-sm text-teal-100 max-w-md leading-relaxed">
            Grade assignment submissions (flagged for Head Instructor review) and upload supplemental learning materials.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 bg-white rounded-2xl shadow-soft border flex items-center gap-4 ${card.color}`}
            >
              <div className="p-3 rounded-xl bg-white shadow-sm flex-shrink-0">
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

      {/* Course List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-text-primary">My Assigned Courses</h3>

        {isCoursesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-beige-200 text-text-secondary text-xs">
            You are not currently assigned to any courses as a TA.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course: any) => (
              <div
                key={course.id}
                className="bg-white p-5 rounded-2xl shadow-soft border border-beige-200/80 hover:shadow-premium transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold px-2.5 py-0.5 bg-mint-100 text-mint-500 rounded-full">
                      {course.code}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-beige-200 text-text-primary rounded-full">
                      Instructor: {course.doctor?.name}
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-bold text-text-primary mt-3 line-clamp-1">{course.title}</h4>
                </div>

                <div className="mt-6 pt-4 border-t border-beige-100">
                  <Link
                    href={`/dashboard/ta/courses/${course.id}`}
                    className="w-full py-2 bg-mint-50 hover:bg-mint-500 text-mint-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    Enter TA Workspace <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
