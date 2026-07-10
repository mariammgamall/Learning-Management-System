'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../../../../hooks/useTranslation';
import { api } from '../../../../utils/api';
import {
  Users,
  Search,
  BookOpen,
  Mail,
  Shield,
  Loader2,
  Calendar,
  ChevronRight,
  FileText,
  Award,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function SupportStudentsPage() {
  const { lang } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Fetch student list
  const { data: students = [], isLoading: isLoadingList } = useQuery({
    queryKey: ['support-students', searchQuery],
    queryFn: async () => {
      const response = await api.get(`/support/students?search=${searchQuery}`);
      return response.data;
    },
  });

  // Fetch selected student details
  const { data: student = null, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['support-student-details', selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return null;
      const response = await api.get(`/support/students/${selectedStudentId}`);
      return response.data;
    },
    enabled: !!selectedStudentId,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-text-primary dark:text-neutral-100 flex items-center gap-2">
          <Users className="w-6 h-6 text-mint-500" />
          {lang === 'en' ? 'Student Workspace Lookup' : 'البحث عن الطلاب ومعلوماتهم'}
        </h2>
        <p className="text-xs font-semibold text-text-secondary dark:text-neutral-400 mt-1">
          {lang === 'en' ? 'Search student profiles, view registered courses, grading logs, and ticket history.' : 'البحث في ملفات الطلاب، والمقررات المسجلة، وسجل الدرجات والدعم.'}
        </p>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Left column: Student search listing (4 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl flex flex-col min-w-0 overflow-hidden shadow-soft">
          <div className="p-4 border-b border-beige-100 dark:border-neutral-850 flex items-center gap-2">
            <Search className="w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder={lang === 'en' ? 'Search by student name or email...' : 'ابحث باسم الطالب أو بريده...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-semibold outline-none border-none dark:bg-transparent dark:text-neutral-100"
            />
          </div>

          <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-beige-50 dark:divide-neutral-850">
            {isLoadingList ? (
              <div className="p-8 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-6 h-6 text-mint-500 animate-spin" />
                <span className="text-[10px] text-text-secondary font-bold">
                  {lang === 'en' ? 'Searching students...' : 'جاري البحث...'}
                </span>
              </div>
            ) : students.length === 0 ? (
              <p className="p-8 text-center text-xs text-text-secondary font-bold">
                {lang === 'en' ? 'No students found' : 'لا يوجد طلاب مطابوق للبحث'}
              </p>
            ) : (
              students.map((stud: any) => (
                <div
                  key={stud.id}
                  onClick={() => setSelectedStudentId(stud.id)}
                  className={`p-4 hover:bg-beige-50/50 dark:hover:bg-neutral-850 cursor-pointer flex items-center gap-3 transition-colors ${
                    selectedStudentId === stud.id ? 'bg-beige-50 dark:bg-neutral-850/80' : ''
                  }`}
                >
                  {stud.profilePhoto ? (
                    <img src={stud.profilePhoto} alt={stud.name} className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-beige-200 dark:bg-neutral-800 text-text-secondary dark:text-neutral-300 flex items-center justify-center font-bold text-xs rounded-xl">
                      {stud.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-text-primary dark:text-neutral-200 truncate">{stud.name}</p>
                    <p className="text-[10px] text-text-secondary truncate mt-0.5">{stud.email}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-secondary/50" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Selected student detailed view (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl p-6 shadow-soft flex flex-col justify-start">
          {isLoadingDetails ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-2">
              <Loader2 className="w-8 h-8 text-mint-500 animate-spin" />
              <span className="text-xs text-text-secondary font-bold">
                {lang === 'en' ? 'Loading student overview profile...' : 'جاري تحميل ملف الطالب...'}
              </span>
            </div>
          ) : student ? (
            <div className="space-y-6">
              {/* Header profile info */}
              <div className="flex items-center gap-4 border-b border-beige-100 dark:border-neutral-850 pb-4">
                {student.profilePhoto ? (
                  <img src={student.profilePhoto} alt={student.name} className="w-14 h-14 rounded-2xl object-cover border border-beige-200" />
                ) : (
                  <div className="w-14 h-14 bg-beige-200 dark:bg-neutral-850 text-text-secondary dark:text-neutral-300 flex items-center justify-center font-black text-lg rounded-2xl">
                    {student.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-black text-text-primary dark:text-neutral-100">{student.name}</h3>
                  <p className="text-xs text-text-secondary mt-0.5">{student.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="px-2 py-0.5 bg-mint-50 text-mint-600 dark:bg-mint-950/30 dark:text-mint-400 text-[8px] font-black uppercase rounded">
                      Student
                    </span>
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                      student.isActive ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {student.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Registered Courses section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text-primary dark:text-neutral-200 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-mint-500" />
                  {lang === 'en' ? 'Registered Courses & Academics' : 'المقررات الأكاديمية المسجلة'}
                </h4>
                {student.enrollments.length === 0 ? (
                  <p className="text-[10px] text-text-secondary">{lang === 'en' ? 'No courses registered yet.' : 'لا توجد مقررات مسجلة حالياً.'}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
                    {student.enrollments.map((enr: any) => {
                      const totalQuizzes = enr.course.quizzes.length;
                      const completedQuizzes = enr.course.quizzes.filter((q: any) => q.attempts.length > 0).length;
                      return (
                        <div key={enr.id} className="p-3 bg-beige-50/50 dark:bg-neutral-850 rounded-xl border border-beige-100 dark:border-neutral-800 space-y-1">
                          <p className="font-bold text-text-primary dark:text-neutral-200 truncate">{enr.course.title}</p>
                          <p className="text-[9px] text-text-secondary">
                            {lang === 'en' ? `Quizzes: ${completedQuizzes}/${totalQuizzes} completed` : `الاختبارات: تم تسليم ${completedQuizzes} من ${totalQuizzes}`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Previous Support Tickets History */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text-primary dark:text-neutral-200 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-mint-500" />
                  {lang === 'en' ? 'Support Ticket History' : 'سجل تذاكر الدعم السابقة'}
                </h4>
                {student.studentTickets.length === 0 ? (
                  <p className="text-[10px] text-text-secondary">{lang === 'en' ? 'No tickets submitted by this student.' : 'لا توجد تذاكر دعم سابقة.'}</p>
                ) : (
                  <div className="divide-y divide-beige-100 dark:divide-neutral-850 border border-beige-100 dark:border-neutral-800 rounded-xl overflow-hidden text-xs font-semibold bg-beige-50/20 dark:bg-neutral-850/20">
                    {student.studentTickets.map((t: any) => (
                      <div key={t.id} className="p-3 flex justify-between items-center gap-4 hover:bg-beige-50/40">
                        <div className="min-w-0">
                          <span className="text-[9px] font-black text-text-secondary block">{t.ticketNumber}</span>
                          <span className="font-bold text-text-primary dark:text-neutral-200 truncate block mt-0.5">{t.subject}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                            t.priority === 'Urgent' || t.priority === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-beige-100 text-text-secondary'
                          }`}>
                            {t.priority}
                          </span>
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                            t.status === 'Resolved' || t.status === 'Closed' ? 'bg-mint-50 text-mint-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-secondary">
              <Users className="w-12 h-12 text-beige-300 mb-3" />
              <p className="text-xs font-extrabold">
                {lang === 'en' ? 'Select a student from the sidebar list to view details.' : 'اختر طالباً من القائمة الجانبية لعرض بياناته.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
