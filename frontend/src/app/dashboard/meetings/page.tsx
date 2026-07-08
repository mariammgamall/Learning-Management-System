'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useToastStore } from '@/hooks/useToastStore';
import { Loader2, Video, Plus, Check, Play, User, Users, Calendar, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ModalPortal from '@/components/ModalPortal';
import { useTranslation } from '@/hooks/useTranslation';

export default function MeetingsOverviewPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, lang } = useTranslation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');

  // 1. Fetch Active Meetings
  const { data: meetings = [], isLoading: isMeetingsLoading } = useQuery({
    queryKey: ['activeMeetings'],
    queryFn: async () => {
      const response = await api.get('/meetings');
      return response.data;
    },
    refetchInterval: 10000, // Refetch every 10s
  });

  // 2. Fetch User's Courses (only for Doctors/TAs to select when creating a meeting)
  const isHostRole = user?.role === 'DOCTOR' || user?.role === 'TA' || user?.role === 'ADMIN';
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['meetingsUserCourses'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data;
    },
    enabled: isHostRole,
  });

  // 3. Create Meeting Mutation
  const createMeetingMutation = useMutation({
    mutationFn: async (payload: { title: string; courseId: string }) => {
      const response = await api.post('/meetings', payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activeMeetings'] });
      setIsCreateOpen(false);
      setMeetingTitle('');
      setSelectedCourseId('');
      addToast('Online meeting started successfully!', 'success');
      // Redirect to the virtual room
      router.push(`/dashboard/meetings/${data.id}`);
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to start meeting', 'error');
    },
  });

  const handleStartMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle || !selectedCourseId) {
      return addToast('Please fill out all fields', 'error');
    }
    createMeetingMutation.mutate({
      title: meetingTitle.trim(),
      courseId: selectedCourseId,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in text-xs font-semibold">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">{t('meetings_title')}</h2>
          <p className="text-xs text-text-secondary mt-1">
            {t('meetings_subtitle')}
          </p>
        </div>

        {isHostRole && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-mint-500 hover:bg-mint-400 text-white rounded-xl text-xs font-bold shadow-soft transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 animate-flip-on-rtl" /> {lang === 'en' ? 'Start Live Meeting' : 'ابدأ اجتماعاً حياً'}
          </button>
        )}
      </div>

      {isMeetingsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-mint-500 animate-spin" />
        </div>
      ) : meetings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-beige-200 shadow-soft space-y-4">
          <div className="w-12 h-12 bg-beige-100 rounded-full flex items-center justify-center mx-auto text-text-secondary">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">{t('active_meetings')}</h3>
            <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto">
              {lang === 'en'
                ? 'There are no live meetings running at the moment. Keep this page open to auto-refresh when hosts go online.'
                : 'لا توجد اجتماعات حية جارية حالياً. اترك هذه الصفحة مفتوحة للتحديث التلقائي فور بدء المضيف.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map((meeting: any) => (
            <div
              key={meeting.id}
              className="bg-white p-5 rounded-2xl border border-beige-200/80 shadow-soft hover:shadow-premium transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[9px] font-bold px-2 py-0.5 bg-mint-100 text-mint-500 rounded-full">
                    {meeting.course?.code || 'LMS'}
                  </span>
                  <span className="flex items-center gap-1 text-[9px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" /> {lang === 'en' ? 'Live' : 'مباشر'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-text-primary mt-3 line-clamp-1">{meeting.title}</h4>
                <p className="text-xs text-text-secondary mt-1 font-semibold truncate">{lang === 'en' ? 'Course' : 'المقرر'}: {meeting.course?.title}</p>
                
                <div className="flex items-center gap-2 mt-4 text-[11px] font-semibold text-text-secondary">
                  <div className="w-6 h-6 bg-beige-100 text-text-secondary rounded-full flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-text-primary font-bold">{meeting.hostName}</span>
                    <span className="text-[9px] block text-text-secondary uppercase">{meeting.hostRole}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-beige-100 flex items-center justify-between">
                <span className="text-[9px] text-text-secondary">
                  {lang === 'en' ? 'Started:' : 'بدأ:'} {new Date(meeting.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
                <Link
                  href={`/dashboard/meetings/${meeting.id}`}
                  className="px-4 py-2 bg-mint-500 hover:bg-mint-400 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-soft active:scale-[0.98]"
                >
                  {t('join_room')} <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MEETING MODAL */}
      {isCreateOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[5px] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-premium border border-beige-200 space-y-4 animate-slide-up">
              <div className="flex justify-between items-center border-b border-beige-100 pb-2">
                <h3 className="text-sm font-bold text-text-primary">{lang === 'en' ? 'Start Live Virtual Meeting' : 'بدء اجتماع افتراضي مباشر'}</h3>
                <button onClick={() => setIsCreateOpen(false)} className="text-text-secondary hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleStartMeeting} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">{lang === 'en' ? 'Meeting Title' : 'عنوان الاجتماع'}</label>
                  <input
                    type="text"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-beige-200 rounded-lg focus:border-mint-500 outline-none"
                    placeholder={lang === 'en' ? 'Class discussion, Q&A session...' : 'مناقشة المحاضرة، جلسة أسئلة وأجوبة...'}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">{lang === 'en' ? 'Select Target Course' : 'اختر المقرر الدراسي المستهدف'}</label>
                  {isCoursesLoading ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-mint-500" />
                      <span className="text-[11px] text-text-secondary">Loading courses...</span>
                    </div>
                  ) : courses.length === 0 ? (
                    <p className="text-[11px] text-rose-500">You are not associated with any courses to host meetings.</p>
                  ) : (
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-beige-200 rounded-lg outline-none focus:border-mint-500"
                      required
                    >
                      <option value="">{lang === 'en' ? '-- Choose Course --' : '-- اختر المقرر --'}</option>
                      {courses.map((course: any) => (
                        <option key={course.id} value={course.id}>
                          [{course.code}] {course.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={createMeetingMutation.isPending || courses.length === 0}
                  className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft"
                >
                  {createMeetingMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    lang === 'en' ? 'Launch Classroom' : 'إطلاق قاعة المحاضرة'
                  )}
                </button>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
