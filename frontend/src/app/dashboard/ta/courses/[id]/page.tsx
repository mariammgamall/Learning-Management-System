'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { useToastStore } from '@/hooks/useToastStore';
import {
  ArrowLeft,
  Video,
  FileText,
  Plus,
  Loader2,
  Lock,
  Unlock,
  CheckCircle,
  X,
  Upload,
  Users,
  Calendar,
  CalendarCheck,
  Check,
  AlertCircle,
  Paperclip,
  HelpCircle,
  Award,
  Trash2,
  Eye,
  Bell,
  MessageSquare,
  Send,
  CornerDownRight,
} from 'lucide-react';
import Link from 'next/link';
import ModalPortal from '@/components/ModalPortal';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/hooks/useAuthStore';
import TiptapEditor from '@/components/TiptapEditor';

// CommentsThread component for rendering discussions
const CommentsThread = ({
  comments = [],
  onAddComment,
  currentUser,
  placeholder = "Add a comment...",
  showPrivateOption = false,
}: {
  comments: any[];
  onAddComment: (content: string, isPrivate: boolean, parentId?: string) => void;
  currentUser: any;
  placeholder?: string;
  showPrivateOption?: boolean;
}) => {
  const [newComment, setNewComment] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const { lang } = useTranslation();

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(newComment, isPrivate);
    setNewComment('');
    setIsPrivate(false);
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    onAddComment(replyContent, false, parentId);
    setReplyContent('');
    setReplyingToId(null);
  };

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-beige-100">
      <h5 className="text-[11px] font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5" /> {lang === 'en' ? 'Comments' : 'التعليقات'} ({comments.length})
      </h5>

      {/* Comment Input */}
      <form onSubmit={handleSubmitComment} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={placeholder}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-beige-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-mint-500 bg-beige-50/50 text-text-primary font-medium"
          />
          <button
            type="submit"
            className="p-2 bg-mint-500 hover:bg-mint-400 text-white rounded-xl transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        {showPrivateOption && currentUser?.role === 'STUDENT' && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="private-comment-checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-3.5 h-3.5 text-mint-500 border-beige-300 rounded focus:ring-mint-500"
            />
            <label htmlFor="private-comment-checkbox" className="text-[10px] text-text-secondary font-semibold cursor-pointer flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-500" /> {lang === 'en' ? 'Post comment privately to instructors' : 'نشر التعليق بشكل خاص للمحاضرين'}
            </label>
          </div>
        )}
      </form>

      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {comments.map((comment) => (
          <div key={comment.id} className="p-3 bg-beige-50/50 rounded-xl border border-beige-200 space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-mint-100 text-mint-500 rounded-lg flex items-center justify-center font-bold text-[10px]">
                  {comment.user?.name?.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-text-primary">{comment.user?.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                      comment.user?.role === 'DOCTOR' ? 'bg-indigo-100 text-indigo-600' :
                      comment.user?.role === 'TA' ? 'bg-mint-100 text-mint-600' :
                      'bg-beige-200 text-text-secondary'
                    }`}>
                      {comment.user?.role}
                    </span>
                  </div>
                  <span className="text-[9px] text-text-secondary/80">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              {comment.isPrivate && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-600 rounded-md text-[8.5px] font-black uppercase tracking-wider">
                  <Lock className="w-2.5 h-2.5" /> {lang === 'en' ? 'Private' : 'خاص'}
                </span>
              )}
            </div>

            <p className="text-xs text-text-primary pl-8 leading-relaxed whitespace-pre-wrap font-medium">{comment.content}</p>

            {/* Replies List */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="pl-8 pt-2 space-y-2 border-t border-beige-100/50">
                {comment.replies.map((reply: any) => (
                  <div key={reply.id} className="flex gap-2 items-start text-xs bg-white p-2 rounded-lg border border-beige-100">
                    <CornerDownRight className="w-3.5 h-3.5 text-beige-300 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[11px] text-text-primary">{reply.user?.name}</span>
                        <span className={`px-1 py-0.2 rounded text-[7.5px] font-black uppercase tracking-wider ${
                          reply.user?.role === 'DOCTOR' ? 'bg-indigo-100 text-indigo-600' :
                          reply.user?.role === 'TA' ? 'bg-mint-100 text-mint-600' :
                          'bg-beige-200 text-text-secondary'
                        }`}>
                          {reply.user?.role}
                        </span>
                        <span className="text-[8px] text-text-secondary/60">
                          {new Date(reply.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-text-primary text-xs mt-1 leading-relaxed whitespace-pre-wrap font-medium">{reply.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Input */}
            <div className="pl-8 flex justify-end">
              {replyingToId === comment.id ? (
                <div className="flex-1 flex gap-2 items-center mt-2 animate-fade-in">
                  <input
                    type="text"
                    placeholder={lang === 'en' ? "Write a reply..." : "اكتب رداً..."}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs border border-beige-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-mint-500 bg-white text-text-primary"
                  />
                  <button
                    onClick={() => handleSubmitReply(comment.id)}
                    className="px-2.5 py-1 bg-mint-500 text-white rounded-lg text-xs font-bold"
                  >
                    {lang === 'en' ? 'Reply' : 'رد'}
                  </button>
                  <button
                    onClick={() => { setReplyingToId(null); setReplyContent(''); }}
                    className="text-[10px] text-text-secondary font-bold hover:underline"
                  >
                    {lang === 'en' ? 'Cancel' : 'إلغاء'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setReplyingToId(comment.id)}
                  className="text-[10px] font-bold text-mint-500 hover:text-mint-400 flex items-center gap-1"
                >
                  <CornerDownRight className="w-3 h-3" /> {lang === 'en' ? 'Reply' : 'رد'}
                </button>
              )}
            </div>

          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-[10px] text-text-secondary italic text-center py-2">{lang === 'en' ? 'No comments posted yet.' : 'لا توجد تعليقات منشورة بعد.'}</p>
        )}
      </div>
    </div>
  );
};

export default function TACourseWorkspace() {
  const params = useParams();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const { t, lang } = useTranslation();
  const { user } = useAuthStore();
  const courseId = params.id as string;

  const dxt = (key: string) => {
    const dict: Record<string, string> = {
      'Chapter Lectures': 'محاضرات الفصول',
      'Upload Chapter': 'رفع فصل جديد',
      'No lectures uploaded yet.': 'لم يتم رفع أي محاضرات بعد.',
      'WEEK': 'الأسبوع',
      'View File': 'عرض الملف',
      'Assignments Locker': 'خزانة التكليفات',
      'Quizzes Builder': 'منشئ الاختبارات',
      'Student Matrix': 'سجل الطلاب',
      'Attendance Tracker': 'متابعة الحضور',
      'Active QR / Code Check-in Session': 'جلسة تسجيل حضور نشطة',
      'Generate QR Check-in Code': 'إنشاء رمز الحضور (QR)',
      'Date:': 'التاريخ:',
      'Student Name': 'اسم الطالب',
      'Email Address': 'البريد الإلكتروني',
      'Attendance Status': 'حالة الحضور',
      'Dismiss': 'إلغاء',
      'Copy Link': 'نسخ الرابط',
      'Present': 'حاضر',
      'Absent': 'غائب',
      'Late': 'متأخر',
      'Enrolled Student Progress': 'تقدم الطلاب المسجلين',
      'Lectures Viewed': 'المحاضرات المشاهدة',
      'Completion Status': 'حالة الإكمال',
      'No students registered.': 'لا يوجد طلاب مسجلون.',
      'No quizzes published yet.': 'لا توجد اختبارات منشورة بعد.',
      'Attempts': 'المحاولات',
      'Duration': 'المدة',
      'Grade Attempt': 'تقييم المحاولة',
      'Pending Grade': 'في انتظار التقييم',
      'Tab switches': 'تبديل التبويب',
      'Grade Quiz Attempt': 'تقييم محاولة الاختبار',
      'Quiz Questions Solution': 'حلول أسئلة الاختبار',
      'Score (out of 100)': 'الدرجة (من 100)',
      'Apply Quiz Score': 'تطبيق درجة الاختبار',
      'Construct Quiz': 'إنشاء اختبار جديد',
      'Publish Quiz': 'نشر الاختبار',
      'Quiz Title': 'عنوان الاختبار',
      'Time Limit (minutes)': 'الحد الزمني (بالدقائق)',
      'Max Attempts': 'الحد الأقصى للمحاولات',
      'Shuffle Questions': 'ترتيب عشوائي للأسئلة',
      'Show Results': 'عرض النتائج',
      'Add Question': 'إضافة سؤال',
      'Correct Answer': 'الإجابة الصحيحة',
      'Option': 'الخيار',
      'No assignments created yet.': 'لم يتم إنشاء تكليفات بعد.',
      'Create Assignment': 'إنشاء تكليف جديد',
      'Assignment Title': 'عنوان التكليف',
      'Maximum Score': 'الدرجة القصوى',
      'Deadline': 'تاريخ الانتهاء',
      'Submit Assignment': 'تقديم التكليف',
      'Grade Submission': 'تقييم التسليم',
      'No submissions logged.': 'لا توجد تسليمات مسجلة.',
      'Upload Lecture Chapter': 'رفع فصل المحاضرة',
      'Chapter Title': 'عنوان الفصل',
      'Course Week': 'أسبوع المقرر',
      'Chapter Format Type': 'نوع الملف',
      'Select File (Max 50MB)': 'اختر الملف (الحد الأقصى 50 ميجابايت)',
      'Choose file to upload': 'اختر ملفاً لرفعه',
      'Allow students to download resources': 'السماح للطلاب بتحميل الموارد',
    };
    if (lang === 'ar') {
      return dict[key] || key;
    }
    return key;
  };

  const [activeTab, setActiveTab] = useState<'announcements' | 'lectures' | 'assignments' | 'students' | 'attendance' | 'quizzes'>('lectures');
  const [viewingLectureComments, setViewingLectureComments] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab === 'lectures' || tab === 'assignments' || tab === 'students' || tab === 'attendance' || tab === 'quizzes') {
        setActiveTab(tab as any);
      }
    }
  }, []);
  
  // Modal states
  const [isAddLectureOpen, setIsAddLectureOpen] = useState(false);
  const [isAddQuizOpen, setIsAddQuizOpen] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<any>(null);
  const [viewingQuizAttempt, setViewingQuizAttempt] = useState<any>(null);

  // Forms state
  const [lectureFile, setLectureFile] = useState<File | null>(null);
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureWeek, setLectureWeek] = useState('1');
  const [lectureFileType, setLectureFileType] = useState('VIDEO');
  const [lectureAllowDownload, setLectureAllowDownload] = useState(true);

  const [gradeValue, setGradeValue] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  // TA Quiz Construction State
  const [quizTitle, setQuizTitle] = useState('');
  const [quizTimeLimit, setQuizTimeLimit] = useState('15');
  const [quizShuffle, setQuizShuffle] = useState(false);
  const [quizShowResults, setQuizShowResults] = useState('IMMEDIATE');
  const [quizFiles, setQuizFiles] = useState<File[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([
    { text: '', type: 'MCQ', options: ['', ''], correctAnswer: '' }
  ]);
  const [manualQuizScore, setManualQuizScore] = useState('');
  const [announceHtml, setAnnounceHtml] = useState('');

  const [activeSession, setActiveSession] = useState<any>(null);
  const [fullscreenQrUrl, setFullscreenQrUrl] = useState<string | null>(null);

  const generateSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/courses/attendance/session', {
        courseId,
        date: attendanceDate,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setActiveSession(data);
      addToast('Attendance code session activated!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to generate code', 'error');
    },
  });

  // 1. Fetch Course details
  const { data: course, isLoading: isCourseLoading } = useQuery({
    queryKey: ['taCourseDetails', courseId],
    queryFn: async () => {
      const response = await api.get(`/courses/${courseId}`);
      return response.data;
    },
    enabled: !!courseId,
  });

  // 2. Fetch Course Students Progress
  const { data: students = [], isLoading: isStudentsLoading } = useQuery({
    queryKey: ['taCourseStudents', courseId],
    queryFn: async () => {
      const response = await api.get(`/courses/${courseId}/students`);
      return response.data;
    },
    enabled: !!courseId,
  });

  const [attendanceDate, setAttendanceDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const { data: attendanceData = [], isLoading: isAttendanceLoading, refetch: refetchAttendance } = useQuery({
    queryKey: ['courseAttendance', courseId, attendanceDate],
    queryFn: async () => {
      const response = await api.get(`/courses/${courseId}/attendance?date=${attendanceDate}`);
      return response.data;
    },
    enabled: activeTab === 'attendance' && !!courseId,
  });

  const [localAttendance, setLocalAttendance] = useState<any[]>([]);
  const lastLoadedRef = useRef<string | null>(null);

  useEffect(() => {
    const cacheKey = `${attendanceDate}-${attendanceData.length}-${students.length}-${activeTab}`;
    if (lastLoadedRef.current === cacheKey) {
      return;
    }

    if (activeTab !== 'attendance') return;

    if (attendanceData && attendanceData.length > 0) {
      setLocalAttendance(attendanceData.map((student: any) => ({
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        status: student.status || 'PRESENT',
      })));
      lastLoadedRef.current = cacheKey;
    } else if (students && students.length > 0) {
      setLocalAttendance(students.map((student: any) => ({
        studentId: student.id,
        name: student.name,
        email: student.email,
        status: 'PRESENT',
      })));
      lastLoadedRef.current = cacheKey;
    } else {
      setLocalAttendance([]);
    }
  }, [attendanceData, students, activeTab, attendanceDate]);

  const saveAttendanceMutation = useMutation({
    mutationFn: async (records: { studentId: string; status: string }[]) => {
      const response = await api.post(`/courses/${courseId}/attendance`, {
        date: attendanceDate,
        records,
      });
      return response.data;
    },
    onSuccess: () => {
      refetchAttendance();
      addToast('Attendance updated successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to update attendance', 'error');
    },
  });

  // 2. Upload Lecture Mutation
  const uploadLectureMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/lectures', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taCourseDetails', courseId] });
      setIsAddLectureOpen(false);
      setLectureFile(null);
      setLectureTitle('');
      addToast('Supplementary material uploaded successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to upload material', 'error');
    },
  });

  // 3. Grade Submission Mutation
  const gradeSubmissionMutation = useMutation({
    mutationFn: async ({ subId, payload }: { subId: string; payload: any }) => {
      const response = await api.put(`/assignments/submissions/${subId}/grade`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taCourseDetails', courseId] });
      setGradingSubmission(null);
      setGradeValue('');
      setGradeFeedback('');
      addToast('Evaluation submitted! Marked for Instructor review.', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to evaluate submission', 'error');
    },
  });

  // 4. Create Quiz Mutation (TA authorization)
  const createQuizMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      const response = await api.post('/quizzes', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taCourseDetails', courseId] });
      setIsAddQuizOpen(false);
      setQuizTitle('');
      setQuizFiles([]);
      setQuizQuestions([{ text: '', type: 'MCQ', options: ['', ''], correctAnswer: '' }]);
      addToast('Quiz published successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to create quiz', 'error');
    },
  });

  // 5. Grade Quiz Attempt
  const gradeQuizAttemptMutation = useMutation({
    mutationFn: async ({ attemptId, score }: { attemptId: string; score: number }) => {
      const response = await api.put(`/quizzes/attempts/${attemptId}/grade`, { score });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taCourseDetails', courseId] });
      setViewingQuizAttempt(null);
      setManualQuizScore('');
      addToast('Quiz attempt graded successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to grade quiz attempt', 'error');
    },
  });

  // Comment posting mutation
  const createCommentMutation = useMutation({
    mutationFn: async ({ content, isPrivate, parentId, lectureId, announcementId }: {
      content: string;
      isPrivate: boolean;
      parentId?: string;
      lectureId?: string;
      announcementId?: string;
    }) => {
      const response = await api.post(`/courses/${courseId}/comments`, {
        content,
        isPrivate,
        parentId,
        lectureId,
        announcementId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taCourseDetails', courseId] });
      addToast(lang === 'en' ? 'Comment posted successfully!' : 'تم نشر التعليق بنجاح!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to post comment', 'error');
    }
  });

  // Announcement posting mutation
  const postAnnouncementMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post(`/courses/${courseId}/announcements`, { content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taCourseDetails', courseId] });
      addToast(lang === 'en' ? 'Announcement posted successfully!' : 'تم نشر الإعلان بنجاح!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to post announcement', 'error');
    }
  });

  if (isCourseLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-mint-500 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return <div className="p-8 text-center">Course not found.</div>;
  }

  // Handle supplementary lecture upload
  const handleLectureUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lectureFile) return addToast('Please pick a file to upload', 'error');
    if (!lectureTitle) return addToast('Please enter a title', 'error');

    const formData = new FormData();
    formData.append('file', lectureFile);
    formData.append('title', lectureTitle);
    formData.append('weekNumber', lectureWeek);
    formData.append('fileType', lectureFileType);
    formData.append('allowDownload', String(lectureAllowDownload));
    formData.append('courseId', courseId);

    uploadLectureMutation.mutate(formData);
  };

  // Handle quiz construction submit
  const handleQuizPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle || quizQuestions.some((q) => !q.text || !q.correctAnswer)) {
      return addToast('Please complete all questions and correct answers', 'error');
    }

    const formData = new FormData();
    formData.append('title', quizTitle);
    formData.append('timeLimit', quizTimeLimit);
    formData.append('maxAttempts', '1');
    formData.append('shuffleQuestions', String(quizShuffle));
    formData.append('showResultsAfter', quizShowResults);
    formData.append('questions', JSON.stringify(quizQuestions));
    formData.append('courseId', courseId);
    quizFiles.forEach((file) => {
      formData.append('files', file);
    });

    createQuizMutation.mutate(formData);
  };

  const renderAttachedFiles = (fileUrlString: string | null) => {
    if (!fileUrlString) return null;
    let urls: string[] = [];
    try {
      if (fileUrlString.startsWith('[') && fileUrlString.endsWith(']')) {
        urls = JSON.parse(fileUrlString);
      } else {
        urls = [fileUrlString];
      }
    } catch (e) {
      urls = [fileUrlString];
    }

    if (urls.length === 0) return null;

    return (
      <div className="space-y-1.5 mt-2">
        <span className="text-[9px] font-bold text-text-secondary uppercase block">Attached Reference Files:</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {urls.map((url, idx) => {
            const filename = url.substring(url.lastIndexOf('/') + 1);
            const cleanFilename = filename.substring(filename.indexOf('_') + 1);
            return (
              <div key={idx} className="flex items-center gap-2 bg-mint-50/50 p-2.5 rounded-xl border border-mint-100 text-xs">
                <Paperclip className="w-4 h-4 text-mint-500 flex-shrink-0" />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mint-500 font-bold hover:underline truncate block max-w-[200px]"
                  title={cleanFilename}
                >
                  {cleanFilename || `Resource File ${idx + 1}`}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      
      {/* Course Heading */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/ta"
          className="p-2 bg-beige-200 text-text-secondary hover:text-text-primary rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-mint-100 text-mint-500 rounded-full">
            {course.code}
          </span>
          <h2 className="text-xl font-bold text-text-primary mt-1">{course.title}</h2>
          <p className="text-xs text-text-secondary mt-0.5">Lead Instructor: {course.doctor?.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-beige-200 pb-px overflow-x-auto whitespace-nowrap scrollbar-none md:flex-wrap md:overflow-x-visible">
        {[
          { id: 'announcements', label: lang === 'en' ? 'Announcements' : 'الإعلانات', icon: Bell },
          { id: 'lectures', label: lang === 'en' ? 'Supplementary Materials' : 'المواد الإضافية', icon: Video },
          { id: 'assignments', label: lang === 'en' ? 'Grading Locker' : 'خزانة التقييم', icon: FileText },
          { id: 'quizzes', label: lang === 'en' ? 'Quizzes Builder' : 'منشئ الاختبارات', icon: HelpCircle },
          { id: 'students', label: lang === 'en' ? 'Student Matrix' : 'سجل الطلاب', icon: Users },
          { id: 'attendance', label: lang === 'en' ? 'Attendance Tracker' : 'متابعة الحضور', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all ${
                isActive
                  ? 'border-b-mint-500 text-mint-500'
                  : 'border-b-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Panel Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TAB: Announcements Management */}
          {activeTab === 'announcements' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-5 rounded-2xl border border-beige-200 shadow-soft space-y-4">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest border-b border-beige-100 pb-2 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-mint-500" /> {lang === 'en' ? 'Post New Course Announcement' : 'نشر إعلان جديد للمقرر'}
                </h3>
                
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!announceHtml || !announceHtml.trim()) return addToast('Announcement content cannot be empty', 'error');
                    postAnnouncementMutation.mutate(announceHtml, {
                      onSuccess: () => {
                        setAnnounceHtml('');
                      }
                    });
                  }}
                  className="space-y-3"
                >
                  <TiptapEditor value={announceHtml} onChange={setAnnounceHtml} />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={postAnnouncementMutation.isPending}
                      className="px-5 py-2 bg-mint-500 hover:bg-mint-400 text-white rounded-xl text-xs font-bold shadow-soft transition-all disabled:opacity-75"
                    >
                      {postAnnouncementMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (lang === 'en' ? 'Post Announcement' : 'نشر الإعلان')}
                    </button>
                  </div>
                </form>
              </div>

              {(!course.announcements || course.announcements.length === 0) ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-beige-200 text-text-secondary text-xs">
                  {lang === 'en' ? 'No announcements have been posted yet.' : 'لم يتم نشر إعلانات بعد.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {course.announcements.map((ann: any) => (
                    <div key={ann.id} className="bg-white p-5 rounded-2xl border border-beige-200 space-y-4 shadow-soft">
                      <div className="flex justify-between items-center border-b border-beige-100 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-mint-500 text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-soft">
                            {ann.publisher?.name?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-xs text-text-primary">{ann.publisher?.name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                ann.publisher?.role === 'DOCTOR' ? 'bg-indigo-100 text-indigo-600' :
                                ann.publisher?.role === 'TA' ? 'bg-mint-100 text-mint-600' :
                                'bg-beige-200 text-text-secondary'
                              }`}>
                                {ann.publisher?.role}
                              </span>
                            </div>
                            <span className="text-[9px] text-text-secondary">
                              {new Date(ann.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-text-primary leading-relaxed font-medium tiptap" dangerouslySetInnerHTML={{ __html: ann.content }} />

                      <CommentsThread
                        comments={ann.comments || []}
                        onAddComment={(content, isPrivate, parentId) => {
                          createCommentMutation.mutate({
                            content,
                            isPrivate,
                            parentId,
                            announcementId: ann.id,
                          });
                        }}
                        currentUser={user}
                        placeholder={lang === 'en' ? "Write a comment..." : "اكتب تعليقاً..."}
                        showPrivateOption={false}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 1: Supplemental materials upload */}
          {activeTab === 'lectures' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-text-primary">Supplementary Materials</h3>
                <button
                  onClick={() => setIsAddLectureOpen(true)}
                  className="flex items-center gap-1 px-3 py-2 bg-mint-500 hover:bg-mint-400 text-white rounded-xl text-xs font-bold shadow-soft"
                >
                  <Plus className="w-3.5 h-3.5" /> Upload Material
                </button>
              </div>

              {course.lectures.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-beige-200 text-text-secondary text-xs">
                  No materials posted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {course.lectures.map((lecture: any) => (
                    <div
                      key={lecture.id}
                      className="bg-white p-4 rounded-xl border border-beige-200/80 flex items-center justify-between hover:border-mint-200 transition-colors"
                    >
                      <div>
                        <span className="text-[9px] font-bold text-mint-500">WEEK {lecture.weekNumber}</span>
                        <h4 className="font-bold text-text-primary text-xs">{lecture.title}</h4>
                        <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-text-secondary uppercase">
                          <span>{lecture.fileType}</span>
                          <span>•</span>
                          <span>
                            {lang === 'en' ? 'Uploaded by: ' : 'تم الرفع بواسطة: '}
                            <strong>{lecture.publisher?.name || course.doctor?.name || 'Dr. Ahmed Hagag'}</strong>
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingLectureComments(lecture)}
                          className="p-2 rounded-lg border border-beige-200 text-text-secondary hover:bg-beige-100 hover:text-mint-500 flex items-center gap-1 text-[11px] font-bold transition-all"
                          title={lang === 'en' ? "View Discussions" : "عرض المناقشات"}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>({lecture.comments?.length || 0})</span>
                        </button>

                        <span className="text-[9px] px-2 py-0.5 bg-beige-200 rounded text-text-secondary">
                          {lecture.allowDownload ? 'Downloadable' : 'Protected'}
                        </span>
                        <a
                          href={lecture.fileUrl}
                          target="_blank"
                          className="px-3.5 py-1.5 bg-beige-100 text-text-primary hover:bg-beige-200 rounded-lg text-xs font-bold transition-all"
                        >
                          {lang === 'en' ? 'View File' : 'عرض الملف'}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Grading Queue Locker */}
          {activeTab === 'assignments' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-text-primary">Grading Locker</h3>

              {course.assignments.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-beige-200 text-text-secondary text-xs">
                  No assignments posted in course.
                </div>
              ) : (
                <div className="space-y-6">
                  {course.assignments.map((assign: any) => (
                    <div key={assign.id} className="bg-white p-5 rounded-xl border border-beige-200 space-y-4">
                      <div className="border-b border-beige-100 pb-3 flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-text-primary text-xs">{assign.title}</h4>
                          <span className="text-[10px] text-text-secondary block mt-0.5">
                            Due: {new Date(assign.deadline).toLocaleString()} | Max: {assign.maxScore}
                          </span>
                        </div>
                      </div>

                      {assign.submissions?.length > 0 ? (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-text-secondary block">Student Submissions:</span>
                          <div className="divide-y divide-beige-100 border border-beige-200 rounded-xl overflow-hidden text-xs">
                            {assign.submissions.map((sub: any) => (
                              <div key={sub.id} className="p-3 bg-beige-50/50 hover:bg-beige-50 flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-bold text-text-primary">{sub.student?.name}</p>
                                  <span className="text-[9px] text-text-secondary">
                                    Submitted: {new Date(sub.submittedAt).toLocaleString()}
                                    {sub.isLate && <strong className="text-rose-500 block">LATE</strong>}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <a
                                    href={sub.fileUrl}
                                    target="_blank"
                                    className="text-mint-500 font-bold underline"
                                  >
                                    View Submission
                                  </a>

                                  {sub.grade !== null ? (
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-mint-500 text-sm">
                                        {sub.grade} / {assign.maxScore}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                                        sub.taGradeReview
                                          ? 'bg-mint-100 text-mint-500'
                                          : 'bg-amber-100 text-amber-500'
                                      }`}>
                                        {sub.taGradeReview ? 'Approved' : 'Instructor Review'}
                                      </span>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setGradingSubmission({ ...sub, maxScore: assign.maxScore })}
                                      className="px-3.5 py-1.5 bg-mint-500 hover:bg-mint-400 text-white font-bold rounded-lg text-[10px]"
                                    >
                                      Grade Submission
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-text-secondary italic">No submissions for this assignment.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Quizzes Builder */}
          {activeTab === 'quizzes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-text-primary">Curriculum Quizzes</h3>
                <button
                  onClick={() => setIsAddQuizOpen(true)}
                  className="flex items-center gap-1 px-3 py-2 bg-mint-500 hover:bg-mint-400 text-white rounded-xl text-xs font-bold shadow-soft"
                >
                  <Plus className="w-3.5 h-3.5" /> Construct Quiz
                </button>
              </div>

              {course.quizzes.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-beige-200 text-text-secondary text-xs">
                  No quizzes published yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {course.quizzes.map((quiz: any) => (
                    <div key={quiz.id} className="bg-white p-5 rounded-xl border border-beige-200 space-y-4">
                      <div className="border-b border-beige-100 pb-3 flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-text-primary text-xs">{quiz.title}</h4>
                          <span className="text-[10px] text-text-secondary block mt-0.5">
                            Duration: {quiz.timeLimit} mins | Attempts limit: {quiz.maxAttempts}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 bg-teal-50 text-teal-500 text-[10px] font-bold rounded-lg">
                          Attempts: {quiz.attempts?.length || 0}
                        </span>
                      </div>

                      {renderAttachedFiles(quiz.fileUrl)}

                      {/* Display quiz attempts with manual grading and anti-cheat logger */}
                      {quiz.attempts?.length > 0 ? (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-text-secondary block">Completed Attempts Log:</span>
                          <div className="divide-y divide-beige-100 border border-beige-200 rounded-xl overflow-hidden text-xs">
                            {quiz.attempts.map((attempt: any) => (
                              <div key={attempt.id} className="p-3 bg-beige-50/50 hover:bg-beige-50 flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-bold text-text-primary">{attempt.student?.name}</p>
                                  <span className="text-[9px] text-text-secondary flex items-center gap-1.5 mt-0.5">
                                    Tab switches: <strong className={attempt.tabSwitches > 0 ? 'text-rose-500 animate-pulse' : 'text-mint-500'}>{attempt.tabSwitches} switches</strong>
                                  </span>
                                </div>

                                <div className="flex items-center gap-3">
                                  {attempt.score !== null ? (
                                    <span className="font-extrabold text-mint-500 text-sm">
                                      {attempt.score.toFixed(1)} / 100
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 bg-amber-100 text-amber-500 text-[9px] font-bold rounded-md">
                                        Pending Grade
                                      </span>
                                      <button
                                        onClick={() => setViewingQuizAttempt(attempt)}
                                        className="px-2.5 py-1 bg-mint-500 hover:bg-mint-400 text-white rounded text-[10px] font-bold"
                                      >
                                        Grade Attempt
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-text-secondary italic">No attempts logged for this quiz.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Enrolled Students Matrix */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-text-primary">Enrolled Student Progress</h3>
              {isStudentsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-mint-500 animate-spin" />
                </div>
              ) : students.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-beige-200 text-text-secondary text-xs">
                  No students registered.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-beige-200 overflow-hidden shadow-soft w-full overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                    <thead className="bg-beige-100/50 border-b border-beige-200 font-bold text-text-secondary">
                      <tr>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Email Address</th>
                        <th className="px-4 py-3">Lectures Viewed</th>
                        <th className="px-4 py-3 text-right">Completion Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-beige-100 font-semibold text-text-primary">
                      {students.map((student: any) => (
                        <tr key={student.id} className="hover:bg-beige-50/50 transition-colors">
                          <td className="px-4 py-3 flex items-center gap-2">
                            <div className="w-6 h-6 bg-mint-50 text-mint-500 rounded-lg flex items-center justify-center font-bold text-[10px]">
                              {student.name.charAt(0)}
                            </div>
                            <span className="font-bold">{student.name}</span>
                          </td>
                          <td className="px-4 py-3 text-text-secondary">{student.email}</td>
                          <td className="px-4 py-3">
                            {student.watchedCount} / {student.totalLectures}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-extrabold text-mint-500 bg-mint-50 px-2 py-0.5 rounded-md text-[10px]">
                              {student.progressPercent}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Attendance Tracker */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Attendance Logs</h3>
                  <p className="text-[10px] text-text-secondary">Select a date and record/track student attendance (Manual or QR Code check-in).</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => generateSessionMutation.mutate()}
                    disabled={generateSessionMutation.isPending}
                    className="px-4 py-2 bg-beige-200 hover:bg-beige-300 text-text-primary font-bold text-xs rounded-xl shadow-soft flex items-center gap-1.5 transition-all"
                  >
                    {generateSessionMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Generate QR Check-in Code
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary">Date:</span>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => {
                        setAttendanceDate(e.target.value);
                        setActiveSession(null);
                      }}
                      className="px-3 py-2 text-xs border border-beige-200 rounded-lg text-text-primary font-bold bg-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Display Generated QR / Code details */}
              {activeSession && activeSession.isActive && (() => {
                const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                const checkInLink = `${origin}/dashboard/student/attendance/checkin?code=${activeSession.code}`;

                return (
                  <div className="p-5 bg-white border border-beige-200 rounded-2xl shadow-soft flex flex-col md:flex-row items-center gap-6 animate-slide-up">
                    {/* Real QR Code container */}
                    <div className="w-28 h-28 bg-white rounded-xl p-2.5 flex items-center justify-center shadow-md relative group border border-beige-200 flex-shrink-0">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(checkInLink)}`}
                        alt="Check-in QR Code"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-neutral-900/60 rounded-xl flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setFullscreenQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(checkInLink)}`)}
                          className="p-1.5 bg-mint-500 hover:bg-mint-400 text-white rounded-full transition-all shadow hover:scale-105 active:scale-95"
                          title="View Fullscreen"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                        <span className="text-[6px] text-white font-bold tracking-widest bg-mint-500/80 px-1 py-0.5 rounded animate-pulse">LIVE</span>
                      </div>
                    </div>

                    <div className="flex-1 text-xs space-y-2">
                      <h4 className="font-bold text-text-primary">Active QR / Code Check-in Session</h4>
                      <p className="text-[10px] text-text-secondary leading-normal">
                        Students can scan this QR or go to the check-in page and enter the code below to register their attendance as **PRESENT** automatically.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <div className="px-4 py-2.5 bg-beige-100 border border-beige-200 text-text-primary rounded-xl font-black text-sm tracking-wider shadow-inner">
                          CODE: {activeSession.code}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(checkInLink);
                            addToast('Check-in link copied to clipboard!', 'success');
                          }}
                          className="px-3.5 py-2 bg-mint-50 text-mint-500 hover:bg-mint-500 hover:text-white rounded-lg font-bold transition-all border border-mint-200"
                        >
                          Copy Link
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSession(null)}
                          className="px-3 py-2 text-text-secondary hover:text-rose-500 rounded-lg transition-colors font-semibold"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {isAttendanceLoading || isStudentsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-mint-500 animate-spin" />
                </div>
              ) : localAttendance.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-beige-200 text-text-secondary text-xs">
                  No enrolled students to register attendance for.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-beige-200 overflow-hidden shadow-soft w-full overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                      <thead className="bg-beige-100/50 border-b border-beige-200 font-bold text-text-secondary">
                        <tr>
                          <th className="px-4 py-3">Student Name</th>
                          <th className="px-4 py-3">Email Address</th>
                          <th className="px-4 py-3 text-right">Attendance Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-beige-100 font-semibold text-text-primary">
                        {localAttendance.map((record: any, idx: number) => (
                          <tr key={record.studentId} className="hover:bg-beige-50/50 transition-colors">
                            <td className="px-4 py-3 flex items-center gap-2">
                              <div className="w-6 h-6 bg-mint-50 text-mint-500 rounded-lg flex items-center justify-center font-bold text-[10px]">
                                {record.name.charAt(0)}
                              </div>
                              <span className="font-bold">{record.name}</span>
                            </td>
                            <td className="px-4 py-3 text-text-secondary">{record.email}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex rounded-lg border border-beige-200 p-0.5 bg-beige-50">
                                {[
                                  { value: 'PRESENT', label: 'Present', color: 'text-mint-500 bg-mint-50 border-mint-100' },
                                  { value: 'ABSENT', label: 'Absent', color: 'text-rose-500 bg-rose-50 border-rose-100' },
                                  { value: 'LATE', label: 'Late', color: 'text-amber-500 bg-amber-50 border-amber-100' },
                                ].map((opt) => {
                                  const isSelected = record.status === opt.value;
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => {
                                        const updated = [...localAttendance];
                                        updated[idx].status = opt.value;
                                        setLocalAttendance(updated);
                                      }}
                                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all border ${
                                        isSelected
                                          ? `${opt.color} shadow-sm`
                                          : 'border-transparent text-text-secondary hover:text-text-primary'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={saveAttendanceMutation.isPending}
                      onClick={() => saveAttendanceMutation.mutate(localAttendance.map(a => ({ studentId: a.studentId, status: a.status })))}
                      className="px-6 py-2.5 bg-mint-500 hover:bg-mint-400 text-white rounded-xl text-xs font-bold shadow-soft flex items-center gap-1.5"
                    >
                      {saveAttendanceMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CalendarCheck className="w-4 h-4" /> Save Daily Logs
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Statistics panel */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-beige-200 shadow-soft space-y-4">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest border-b border-beige-100 pb-2">
              Assigned Course Info
            </h4>
            
            <div className="space-y-3 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-text-secondary">Course Code:</span>
                <span className="text-text-primary font-bold">{course.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Lead Doctor:</span>
                <span className="text-text-primary font-bold">{course.doctor?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Lectures chapters:</span>
                <span className="text-text-primary font-bold">{course.lectures?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Assignments:</span>
                <span className="text-text-primary font-bold">{course.assignments?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Quizzes:</span>
                <span className="text-text-primary font-bold">{course.quizzes?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* EVALUATE GRADE MODAL */}
      {gradingSubmission && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[5px] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-premium border border-beige-200 animate-slide-up space-y-4">
              <div className="flex justify-between items-center border-b border-beige-100 pb-2">
                <h3 className="text-sm font-bold text-text-primary">TA Evaluation Desk</h3>
                <button onClick={() => setGradingSubmission(null)} className="text-text-secondary hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-semibold">
                <div>
                  <span className="text-text-secondary block">Student Name:</span>
                  <span className="text-text-primary block">{gradingSubmission.student?.name}</span>
                </div>

                <div>
                  <span className="text-text-secondary block">Submission File URL:</span>
                  <a href={gradingSubmission.fileUrl} target="_blank" className="text-mint-500 font-bold underline">
                    Open Student File
                  </a>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Score Evaluation (Max {gradingSubmission.maxScore})</label>
                  <input
                    type="number"
                    min="0"
                    value={gradeValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== '' && parseFloat(val) < 0) {
                        setGradeValue('0');
                      } else {
                        setGradeValue(val);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border border-beige-200 rounded-lg"
                    placeholder="Enter grade integer..."
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Feedback / Remarks</label>
                  <textarea
                    value={gradeFeedback}
                    onChange={(e) => setGradeFeedback(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-beige-200 rounded-lg outline-none"
                    placeholder="Provide comments for student review..."
                    rows={4}
                  />
                </div>

                <button
                  onClick={() => {
                    if (!gradeValue) return addToast('Please enter a grade score', 'error');
                    gradeSubmissionMutation.mutate({
                      subId: gradingSubmission.id,
                      payload: {
                        grade: parseFloat(gradeValue),
                        feedback: gradeFeedback,
                      },
                    });
                  }}
                  disabled={gradeSubmissionMutation.isPending}
                  className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft"
                >
                  {gradeSubmissionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit Score for Review'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* UPLOAD MATERIAL MODAL */}
      {isAddLectureOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[5px] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-premium border border-beige-200 space-y-4 animate-slide-up">
              <div className="flex justify-between items-center border-b border-beige-100 pb-2">
                <h3 className="text-sm font-bold text-text-primary">Upload Supplemental Material</h3>
                <button onClick={() => setIsAddLectureOpen(false)} className="text-text-secondary hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleLectureUpload} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Material Title</label>
                  <input
                    type="text"
                    value={lectureTitle}
                    onChange={(e) => setLectureTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-beige-200 rounded-lg"
                    placeholder="Introduction, handbook chapter, etc..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-primary block">Week Reference</label>
                    <input
                      type="number"
                      min="1"
                      value={lectureWeek}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setLectureWeek(isNaN(val) || val < 1 ? '1' : String(val));
                      }}
                      className="w-full px-3 py-2 text-xs border border-beige-200 rounded-lg"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-primary block">Material Type</label>
                    <select
                      value={lectureFileType}
                      onChange={(e) => setLectureFileType(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-beige-200 rounded-lg"
                    >
                      <option value="VIDEO">VIDEO (MP4)</option>
                      <option value="SLIDES">SLIDES (PDF)</option>
                      <option value="NOTES">NOTES (DOCX/TXT)</option>
                    </select>
                  </div>
                </div>

                {/* Custom Material File Input showing filenames only */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-primary block">Select File (Max 50MB)</label>
                  <input
                    type="file"
                    id="ta-file-picker"
                    className="hidden"
                    onChange={(e) => setLectureFile(e.target.files?.[0] || null)}
                    required
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => document.getElementById('ta-file-picker')?.click()}
                      className="px-4 py-2 bg-beige-200 hover:bg-beige-300 text-text-primary font-bold text-xs rounded-xl shadow-soft"
                    >
                      Select File
                    </button>
                    {lectureFile && (
                      <div className="flex items-center gap-2 bg-beige-50 border border-beige-200 px-3 py-1.5 rounded-xl text-xs">
                        <span className="font-semibold text-text-primary truncate max-w-[200px]">{lectureFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setLectureFile(null)}
                          className="p-1 text-text-secondary hover:text-rose-500 rounded-lg hover:bg-beige-200 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploadLectureMutation.isPending}
                  className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft"
                >
                  {uploadLectureMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Upload material'}
                </button>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* TA CONSTRUCT QUIZ MODAL */}
      {isAddQuizOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[5px] flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-white p-6 rounded-2xl shadow-premium border border-beige-200 my-8 space-y-4">
              <div className="flex justify-between items-center border-b border-beige-100 pb-2">
                <h3 className="text-sm font-bold text-text-primary">Construct Quiz (TA Desk)</h3>
                <button onClick={() => setIsAddQuizOpen(false)} className="text-text-secondary hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuizPost} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Quiz Title</label>
                  <input
                    type="text"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-beige-200 rounded-lg"
                    placeholder="Chapter 1 evaluation, Midterm prep, etc..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-primary block">Duration Time Limit (Minutes)</label>
                    <input
                      type="number"
                      min="1"
                      value={quizTimeLimit}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setQuizTimeLimit(isNaN(val) || val < 1 ? '1' : String(val));
                      }}
                      className="w-full px-3 py-2 text-xs border border-beige-200 rounded-lg"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-primary block">Results visibility</label>
                    <select
                      value={quizShowResults}
                      onChange={(e) => setQuizShowResults(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-beige-200 rounded-lg"
                    >
                      <option value="IMMEDIATE">IMMEDIATE (Instantly on submit)</option>
                      <option value="AFTER_DEADLINE">AFTER DEADLINE (Requires manual release)</option>
                    </select>
                  </div>
                </div>

                {/* Custom files picker showing filenames list with delete button */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-primary block">Attach Reference/Resource Files (Optional)</label>
                  <input
                    type="file"
                    id="ta-quiz-files-picker"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        const newFiles = Array.from(e.target.files);
                        setQuizFiles((prev) => [...prev, ...newFiles]);
                      }
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('ta-quiz-files-picker')?.click()}
                    className="px-4 py-2 bg-beige-200 hover:bg-beige-300 text-text-primary font-bold text-xs rounded-xl shadow-soft"
                  >
                    Select Files
                  </button>
                  {quizFiles.length > 0 && (
                    <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                      {quizFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-beige-50 border border-beige-200 text-xs">
                          <span className="truncate font-semibold text-text-primary pr-2">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setQuizFiles((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-1 text-text-secondary hover:text-rose-500 rounded-lg hover:bg-beige-200 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-beige-100">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-text-secondary uppercase">Questions</span>
                    <button
                      type="button"
                      onClick={() => setQuizQuestions([...quizQuestions, { text: '', type: 'MCQ', options: ['', ''], correctAnswer: '' }])}
                      className="text-[10px] font-bold text-mint-500"
                    >
                      + Add Question
                    </button>
                  </div>

                  {quizQuestions.map((q, idx) => (
                    <div key={idx} className="p-4 bg-beige-50 rounded-xl border border-beige-200 space-y-3 relative text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setQuizQuestions(quizQuestions.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 text-text-secondary hover:text-rose-500"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1 col-span-2">
                          <label className="text-[9px] font-bold text-text-primary block">Question Prompt</label>
                          <input
                            type="text"
                            value={q.text}
                            onChange={(e) => {
                              const list = [...quizQuestions];
                              list[idx].text = e.target.value;
                              setQuizQuestions(list);
                            }}
                            className="w-full px-3 py-2 text-xs border border-beige-200 rounded-lg"
                            placeholder="Enter question text..."
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-text-primary block">Question Type</label>
                          <select
                            value={q.type}
                            onChange={(e) => {
                              const list = [...quizQuestions];
                              list[idx].type = e.target.value;
                              if (e.target.value === 'TRUE_FALSE') {
                                list[idx].options = ['True', 'False'];
                              } else if (e.target.value === 'SHORT_ANSWER') {
                                list[idx].options = [];
                              } else {
                                list[idx].options = ['', ''];
                              }
                              setQuizQuestions(list);
                            }}
                            className="w-full px-3 py-2 text-xs border border-beige-200 rounded-lg font-bold"
                          >
                            <option value="MCQ">MCQ</option>
                            <option value="TRUE_FALSE">TRUE / FALSE</option>
                            <option value="SHORT_ANSWER">SHORT ANSWER</option>
                          </select>
                        </div>
                      </div>

                      {q.type === 'MCQ' && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold text-text-primary block">Options Choices</label>
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...quizQuestions];
                                list[idx].options.push('');
                                setQuizQuestions(list);
                              }}
                              className="text-[9px] text-mint-500 font-bold"
                            >
                              + Add Option
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt: string, optIdx: number) => (
                              <input
                                key={optIdx}
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const list = [...quizQuestions];
                                  list[idx].options[optIdx] = e.target.value;
                                  setQuizQuestions(list);
                                }}
                                className="px-2 py-1 text-xs border border-beige-200 rounded-md"
                                placeholder={`Option ${optIdx + 1}`}
                                required
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-text-primary block">Correct Answer</label>
                        {q.type === 'TRUE_FALSE' ? (
                          <select
                            value={q.correctAnswer}
                            onChange={(e) => {
                              const list = [...quizQuestions];
                              list[idx].correctAnswer = e.target.value;
                              setQuizQuestions(list);
                            }}
                            className="w-full px-3 py-2 text-xs border border-beige-200 rounded-lg font-bold bg-white"
                          >
                            <option value="">Select Option</option>
                            <option value="True">True</option>
                            <option value="False">False</option>
                          </select>
                        ) : q.type === 'SHORT_ANSWER' ? (
                          <textarea
                            value={q.correctAnswer}
                            onChange={(e) => {
                              const list = [...quizQuestions];
                              list[idx].correctAnswer = e.target.value;
                              setQuizQuestions(list);
                            }}
                            rows={3}
                            className="w-full px-3 py-2 text-xs border border-beige-200 rounded-lg font-semibold"
                            placeholder="Provide reference grading criteria or expected key concepts..."
                          />
                        ) : (
                          <input
                            type="text"
                            value={q.correctAnswer}
                            onChange={(e) => {
                              const list = [...quizQuestions];
                              list[idx].correctAnswer = e.target.value;
                              setQuizQuestions(list);
                            }}
                            className="w-full px-3 py-2 text-xs border border-beige-200 rounded-lg"
                            placeholder="e.g. Correct Option"
                            required
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={createQuizMutation.isPending}
                  className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft"
                >
                  {createQuizMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Publish Quiz'}
                </button>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* TA GRADE QUIZ ATTEMPT MODAL */}
      {viewingQuizAttempt && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[5px] flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-lg bg-white p-6 rounded-2xl shadow-premium border border-beige-200 my-8 space-y-4 text-xs font-semibold">
              <div className="flex justify-between items-center border-b border-beige-100 pb-2">
                <h3 className="text-sm font-bold text-text-primary">Grade Quiz Attempt (TA Desk)</h3>
                <button onClick={() => setViewingQuizAttempt(null)} className="text-text-secondary hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-text-secondary block">Student Name:</span>
                  <span className="text-text-primary block">{viewingQuizAttempt.student?.name}</span>
                </div>

                <div className="p-3 bg-beige-50 border border-beige-200 rounded-xl space-y-3">
                  <span className="text-[10px] font-bold text-text-secondary block">Autograded System Score:</span>
                  <span className="text-lg font-black text-text-primary">
                    {viewingQuizAttempt.score} / 100
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Overwrite Score Input</label>
                  <input
                    type="number"
                    min="0"
                    value={manualQuizScore}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== '' && parseFloat(val) < 0) {
                        setManualQuizScore('0');
                      } else {
                        setManualQuizScore(val);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border border-beige-200 rounded-lg"
                    placeholder="Enter manual override score..."
                  />
                </div>

                <button
                  onClick={() => {
                    if (!manualQuizScore) return addToast('Please enter a score', 'error');
                    gradeQuizAttemptMutation.mutate({
                      attemptId: viewingQuizAttempt.id,
                      score: parseFloat(manualQuizScore)
                    });
                  }}
                  disabled={gradeQuizAttemptMutation.isPending}
                  className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft"
                >
                  {gradeQuizAttemptMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply Quiz Score'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Fullscreen QR Code Lightbox */}
      {fullscreenQrUrl && (
        <ModalPortal>
          <div className="fixed inset-0 z-55 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white p-8 rounded-3xl border border-beige-200 max-w-sm w-full flex flex-col items-center gap-5 relative shadow-premium animate-scale-up text-text-primary">
              <button
                type="button"
                onClick={() => setFullscreenQrUrl(null)}
                className="absolute top-4 right-4 p-2 text-text-secondary hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all outline-none"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xs font-black text-text-primary uppercase tracking-wider text-center">
                Scan to Register Attendance
              </h3>
              
              <div className="w-64 h-64 bg-white p-3 rounded-2xl shadow-md border border-beige-200 flex items-center justify-center">
                <img
                  src={fullscreenQrUrl}
                  alt="Fullscreen Attendance QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              
              <p className="text-[9px] text-text-secondary text-center leading-normal max-w-xs font-semibold">
                Display this page on the projector. Students can scan this QR code with their mobile devices to check-in automatically.
              </p>
              
              <div className="px-4 py-2 bg-beige-100 border border-beige-200 text-text-primary rounded-xl font-black text-xs tracking-wider shadow-inner">
                CODE: {activeSession?.code}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* DISCUSSION BOARD MODAL */}
      {viewingLectureComments && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[5px] flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white p-6 rounded-2xl shadow-premium border border-beige-200 animate-slide-up space-y-4 text-text-primary">
              <div className="flex justify-between items-center border-b border-beige-100 pb-2">
                <div>
                  <span className="text-[9px] font-bold text-mint-500 uppercase">{lang === 'en' ? 'Lecture Discussion Board' : 'لوحة مناقشة المحاضرة'}</span>
                  <h3 className="text-xs font-bold text-text-primary">{viewingLectureComments.title}</h3>
                </div>
                <button
                  onClick={() => setViewingLectureComments(null)}
                  className="text-text-secondary hover:text-text-primary p-1 bg-beige-100 hover:bg-beige-200 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-1">
                <CommentsThread
                  comments={course.lectures.find((l: any) => l.id === viewingLectureComments.id)?.comments || []}
                  onAddComment={(content, isPrivate, parentId) => {
                    createCommentMutation.mutate({
                      content,
                      isPrivate,
                      parentId,
                      lectureId: viewingLectureComments.id,
                    });
                  }}
                  currentUser={user}
                  placeholder={lang === 'en' ? "Write a response or feedback..." : "اكتب رداً أو تعليقاً..."}
                  showPrivateOption={false}
                />
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
