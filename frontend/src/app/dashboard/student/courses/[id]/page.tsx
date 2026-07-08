'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { useToastStore } from '@/hooks/useToastStore';
import {
  ArrowLeft,
  Video,
  FileText,
  HelpCircle,
  Play,
  Download,
  Lock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Award,
  Clock,
  ChevronRight,
  Eye,
  Loader2,
  Paperclip,
  Sparkles,
  Terminal,
} from 'lucide-react';
import Link from 'next/link';

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
      <span className="text-[10px] font-bold text-text-secondary uppercase block">Attached Reference Files:</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {urls.map((url, idx) => {
          const filename = url.substring(url.lastIndexOf('/') + 1);
          const cleanFilename = filename.substring(filename.indexOf('_') + 1); // remove timestamp
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

export default function StudentCourseHub() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const courseId = params.id as string;

  const [activeTab, setActiveTab] = useState<'lectures' | 'assignments' | 'quizzes' | 'attendance' | 'sandbox'>('lectures');
  const [selectedLecture, setSelectedLecture] = useState<any>(null);
  const [showAiSummary, setShowAiSummary] = useState(false);

  const [sandboxLanguage, setSandboxLanguage] = useState<'javascript' | 'python' | 'cpp' | 'java' | 'go'>('javascript');
  
  const languageTemplates = {
    javascript: `// Write your JavaScript code here\nfunction greet(name) {\n  return "Hello, " + name + "! Welcome to LMS!";\n}\n\nconsole.log(greet("Mariam Gamal"));`,
    python: `# Write your Python code here\ndef greet(name):\n    return f"Hello, {name}! Welcome to LMS!"\n\nprint(greet("Mariam Gamal"))`,
    cpp: `// Write your C++ code here\n#include <iostream>\n#include <string>\n\nstd::string greet(std::string name) {\n    return "Hello, " + name + "! Welcome to LMS!";\n}\n\nint main() {\n    std::cout << greet("Mariam Gamal") << std::endl;\n    return 0;\n}`,
    java: `// Write your Java code here\npublic class Main {\n    public static String greet(String name) {\n        return "Hello, " + name + "! Welcome to LMS!";\n    }\n\n    public static void main(String[] args) {\n        System.out.println(greet("Mariam Gamal"));\n    }\n}`,
    go: `// Write your Go code here\npackage main\n\nimport "fmt"\n\nfunc greet(name string) string {\n\treturn "Hello, " + name + "! Welcome to LMS!"\n}\n\nfunc main() {\n\tfmt.Println(greet("Mariam Gamal"))\n}`
  };

  const [sandboxCode, setSandboxCode] = useState<string>(languageTemplates.javascript);
  const [sandboxOutput, setSandboxOutput] = useState<string[]>([]);

  const handleLanguageChange = (lang: 'javascript' | 'python' | 'cpp' | 'java' | 'go') => {
    setSandboxLanguage(lang);
    setSandboxCode(languageTemplates[lang]);
    setSandboxOutput([]);
  };

  const handleRunSandbox = async () => {
    setSandboxOutput(['⏳ Compiling and executing code...']);
    
    if (sandboxLanguage === 'javascript') {
      const logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => {
          logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
        },
        error: (...args: any[]) => {
          logs.push('❌ Error: ' + args.map(a => String(a)).join(' '));
        }
      };

      try {
        const sandboxFn = new Function('console', sandboxCode);
        sandboxFn(customConsole);
      } catch (err: any) {
        logs.push(`❌ Compile Error: ${err.message}`);
      }

      setSandboxOutput(logs);
      addToast('Script executed successfully!', 'success');
      return;
    }

    try {
      const payload = {
        language: sandboxLanguage === 'cpp' ? 'c++' : sandboxLanguage,
        version: '*',
        files: [{ content: sandboxCode }]
      };
      
      const res = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.run) {
        const out = data.run.output || '';
        const lines = out.split('\n').filter((l: string) => l !== '');
        if (lines.length === 0) {
          setSandboxOutput(['⚠️ Execution completed with no console outputs.']);
        } else {
          setSandboxOutput(lines);
        }
        addToast('External compiler execution complete!', 'success');
      } else {
        setSandboxOutput(['❌ Compilation failed: Unknown compiler error.']);
      }
    } catch (err: any) {
      setSandboxOutput([`❌ Network Error: Failed to contact code executor. ${err.message}`]);
    }
  };
  
  // Fetch My Attendance
  const { data: attendance = [], isLoading: isAttendanceLoading } = useQuery({
    queryKey: ['studentCourseAttendance', courseId],
    queryFn: async () => {
      const response = await api.get(`/courses/${courseId}/my-attendance`);
      return response.data;
    },
    enabled: activeTab === 'attendance' && !!courseId,
  });
  
  // Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [quizAttempt, setQuizAttempt] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizTimeRemaining, setQuizTimeRemaining] = useState<number>(0);
  const quizTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Detailed Course Content
  const { data: course, isLoading, refetch } = useQuery({
    queryKey: ['studentCourseDetails', courseId],
    queryFn: async () => {
      const response = await api.get(`/courses/${courseId}`);
      return response.data;
    },
    enabled: !!courseId,
  });

  // 2. Watched Toggle Mutation
  const toggleWatchedMutation = useMutation({
    mutationFn: async (lectureId: string) => {
      const response = await api.post(`/lectures/${lectureId}/watched`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['studentCourseDetails', courseId] });
      queryClient.invalidateQueries({ queryKey: ['studentStats'] });
      addToast(data.message, 'success');
    },
  });

  // 3. Assignment Submit Mutation
  const [submittingAssignId, setSubmittingAssignId] = useState<string | null>(null);
  const submitAssignment = async (assignId: string, file: File) => {
    setSubmittingAssignId(assignId);
    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.post(`/assignments/${assignId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      queryClient.invalidateQueries({ queryKey: ['studentCourseDetails', courseId] });
      queryClient.invalidateQueries({ queryKey: ['studentStats'] });
      addToast('Assignment submitted successfully!', 'success');
    } catch (e: any) {
      const err = e.response?.data?.message || 'Failed to submit file';
      addToast(err, 'error');
    } finally {
      setSubmittingAssignId(null);
    }
  };

  // 4. Secure Download Helper
  const triggerSecureDownload = async (lecture: any) => {
    if (!lecture.allowDownload) {
      addToast('Download is restricted by the instructor', 'error');
      return;
    }
    try {
      const res = await api.get(`/lectures/${lecture.id}/download`);
      window.open(res.data.fileUrl, '_blank');
    } catch (e: any) {
      addToast(e.response?.data?.message || 'Secure download failed', 'error');
    }
  };

  // 5. Quiz Attempt Actions
  const startQuizMutation = useMutation({
    mutationFn: async (quizId: string) => {
      const response = await api.post(`/quizzes/${quizId}/start`);
      return response.data;
    },
    onSuccess: (data, quizId) => {
      const targetQuiz = course.quizzes.find((q: any) => q.id === quizId);
      setActiveQuiz(targetQuiz);
      setQuizAttempt(data.attempt);
      setQuizQuestions(data.questions);
      // Pre-fill answers if returning to active
      setQuizAnswers(data.attempt.answers || {});
      
      // Calculate remaining time
      const startTime = new Date(data.attempt.startedAt).getTime();
      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
      const totalAllowedSec = targetQuiz.timeLimit * 60;
      const remainingSec = Math.max(0, totalAllowedSec - elapsedSec);
      
      setQuizTimeRemaining(remainingSec);
      addToast('Quiz started. Good luck!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to start quiz', 'error');
    },
  });

  const submitQuizMutation = useMutation({
    mutationFn: async ({ quizId, answers }: { quizId: string; answers: Record<string, string> }) => {
      const response = await api.post(`/quizzes/${quizId}/submit`, { answers });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['studentCourseDetails', courseId] });
      queryClient.invalidateQueries({ queryKey: ['studentStats'] });
      
      // Clear timers and modals
      if (quizTimerRef.current) clearInterval(quizTimerRef.current);
      setActiveQuiz(null);
      setQuizAttempt(null);
      setQuizQuestions([]);
      setQuizAnswers({});

      const finalScoreMsg = data.hasShortAnswers
        ? 'Quiz submitted! Pending short answer manual grading.'
        : `Quiz completed! Auto score: ${data.score?.toFixed(1)}/100`;
      
      addToast(finalScoreMsg, 'success');
    },
  });

  // Anti-Cheat: Tab switching listener
  const handleTabBlur = async () => {
    if (activeQuiz && quizAttempt) {
      try {
        await api.post(`/quizzes/${activeQuiz.id}/heartbeat`);
        addToast('⚠️ Warning: Leaving the active exam tab is strictly logged as an infraction!', 'error');
      } catch (e) {
        console.error('Failed to log anti-cheat blur', e);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('blur', handleTabBlur);
    return () => {
      window.removeEventListener('blur', handleTabBlur);
    };
  }, [activeQuiz, quizAttempt]);

  // Quiz Timer Countdown Loop
  useEffect(() => {
    if (activeQuiz && quizTimeRemaining > 0) {
      quizTimerRef.current = setInterval(() => {
        setQuizTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(quizTimerRef.current!);
            // Auto submit when time limit expires
            submitQuizMutation.mutate({ quizId: activeQuiz.id, answers: quizAnswers });
            addToast('Time has expired! Quiz automatically submitted.', 'info');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (quizTimerRef.current) clearInterval(quizTimerRef.current);
    };
  }, [activeQuiz, quizTimeRemaining, quizAnswers]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-mint-500 animate-spin" />
        <p className="text-xs text-text-secondary mt-2">Loading course player...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-beige-200">
        <p className="text-sm font-semibold text-text-secondary">Course not found.</p>
      </div>
    );
  }

  // Tech courses check (only tech courses display coding sandbox)
  const isTechCourse =
    course?.title?.toLowerCase().includes('computer') ||
    course?.title?.toLowerCase().includes('cyber') ||
    course?.title?.toLowerCase().includes('security') ||
    course?.title?.toLowerCase().includes('programming') ||
    course?.code?.toLowerCase().includes('cs');

  // Formatting seconds into MM:SS
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative">
      
      {/* 1. Header Hub */}
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard/student"
          className="p-2.5 bg-beige-200 text-text-secondary hover:text-text-primary rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-mint-100 text-mint-500 rounded-full">
            {course.code}
          </span>
          <h2 className="text-xl font-bold text-text-primary mt-1">{course.title}</h2>
          <p className="text-xs text-text-secondary mt-0.5">Instructor: {course.doctor?.name}</p>
        </div>
      </div>

      {/* 2. Course Section Navigation tabs */}
      <div className="flex gap-2 border-b border-beige-200 pb-px">
        {(() => {
          const tabsList = [
            { id: 'lectures', label: 'Lectures', icon: Video },
            { id: 'assignments', label: 'Assignments', icon: FileText },
            { id: 'quizzes', label: 'Quizzes', icon: HelpCircle },
            { id: 'attendance', label: 'Attendance Tracker', icon: Calendar },
          ];
          if (isTechCourse) {
            tabsList.push({ id: 'sandbox', label: 'Coding Sandbox', icon: Terminal });
          }
          return tabsList.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all ${
                  isActive
                    ? 'border-b-mint-500 text-mint-500'
                    : 'border-b-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          });
        })()}
      </div>

      {/* 3. Core Tab panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content panel */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* TAB 1: Lectures Panel */}
          {activeTab === 'lectures' && (
            <div className="space-y-6">
              {course.lectures.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-beige-200">
                  <p className="text-xs text-text-secondary">No lectures have been uploaded yet.</p>
                </div>
              ) : selectedLecture ? (
                /* Selected active Lecture Player block */
                <div className="bg-white p-6 rounded-2xl border border-beige-200 space-y-4 animate-fade-in">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-mint-500">WEEK {selectedLecture.weekNumber} CHAPTER</span>
                      <h3 className="text-base font-bold text-text-primary mt-0.5">{selectedLecture.title}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedLecture(null)}
                      className="text-xs font-bold text-text-secondary hover:text-text-primary bg-beige-100 px-3 py-1.5 rounded-lg"
                    >
                      Back to list
                    </button>
                  </div>

                  {selectedLecture.fileType === 'VIDEO' ? (
                    <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-soft">
                      <video
                        src={selectedLecture.fileUrl}
                        controls
                        className="w-full h-full"
                        poster="https://res.cloudinary.com/demo/video/upload/dog.jpg"
                      />
                    </div>
                  ) : (
                    <div className="p-8 border-2 border-dashed border-beige-300 rounded-xl flex flex-col items-center justify-center text-center gap-2">
                      <FileText className="w-10 h-10 text-mint-400" />
                      <h4 className="text-sm font-bold text-text-primary">PDF or Slides Resource</h4>
                      <p className="text-xs text-text-secondary max-w-xs">
                        This lecture contains notes or slides. View the file in your browser.
                      </p>
                      <a
                        href={selectedLecture.fileUrl}
                        target="_blank"
                        className="mt-2 px-4 py-2 bg-mint-500 text-white text-xs font-bold rounded-lg shadow-soft"
                      >
                        View Resource
                      </a>
                    </div>
                  )}

                  {/* Actions under active lecture */}
                  <div className="pt-4 border-t border-beige-100 flex justify-between items-center flex-wrap gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleWatchedMutation.mutate(selectedLecture.id)}
                        className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                          selectedLecture.watchedBy.length > 0
                            ? 'bg-mint-100 text-mint-500'
                            : 'bg-beige-100 text-text-secondary hover:bg-mint-50 hover:text-mint-500'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {selectedLecture.watchedBy.length > 0 ? 'Completed' : 'Mark Completed'}
                      </button>

                      <button
                        onClick={() => setShowAiSummary(!showAiSummary)}
                        className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
                          showAiSummary
                            ? 'bg-amber-100 text-amber-600 border-amber-200'
                            : 'bg-beige-100 text-text-primary hover:bg-amber-50 hover:text-amber-500 border-transparent'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" /> AI Copilot Tools
                      </button>
                    </div>

                    {selectedLecture.allowDownload ? (
                      <button
                        onClick={() => triggerSecureDownload(selectedLecture)}
                        className="flex items-center gap-1.5 text-xs font-bold text-text-primary hover:text-mint-500 bg-beige-100 px-4 py-2 rounded-xl"
                      >
                        <Download className="w-4 h-4" /> Download File
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-text-secondary bg-beige-100 px-4 py-2 rounded-xl cursor-not-allowed">
                        <Lock className="w-3.5 h-3.5" /> Downloads Locked
                      </span>
                    )}
                  </div>

                  {/* AI Lecture Summary & Flashcards Panel */}
                  {showAiSummary && (
                    <div className="mt-4 p-5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-4 animate-fade-in text-xs font-sans">
                      <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <h4 className="font-bold text-text-primary uppercase tracking-wider">AI Copilot Lecture Summary</h4>
                      </div>

                      {/* Summary Bullet Points */}
                      <div className="space-y-1.5 leading-relaxed text-text-secondary">
                        <p className="font-bold text-text-primary">📝 Key Lecture Takeaways:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Comprehensive introduction to the core fundamentals of <strong className="text-text-primary">{selectedLecture.title}</strong>.</li>
                          <li>Deep-dive into modular code architecture, testing methodologies, and deployment procedures.</li>
                          <li>Detailed explanation of industry-standard security frameworks, authentication patterns, and validation layers.</li>
                          <li>Core guidelines for performance monitoring, diagnostic debugging, and logging controls.</li>
                        </ul>
                      </div>

                      {/* Smart Flashcard */}
                      <div className="pt-2 border-t border-amber-200 space-y-2">
                        <p className="font-bold text-text-primary">🧠 Smart Review Flashcard:</p>
                        <div className="p-4 bg-white border border-amber-200 rounded-xl shadow-soft flex flex-col gap-2 relative group overflow-hidden">
                          <div>
                            <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest block">Question</span>
                            <p className="font-bold text-text-primary text-[11px] mt-0.5">What is the primary architectural concept taught in {selectedLecture.title}?</p>
                          </div>
                          <div className="pt-2 border-t border-beige-100 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] font-black text-mint-500 uppercase tracking-widest block">Answer</span>
                            <p className="font-bold text-text-primary text-[11px] mt-0.5">It enforces component modularity, clean validation abstractions, and zero external dependency exposure to isolate business logic.</p>
                          </div>
                          <div className="absolute right-3 top-3 text-[8.5px] font-bold text-amber-500/80 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 select-none pointer-events-none">
                            Hover to Reveal Answer
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Lecture Chapters grid List */
                <div className="space-y-3">
                  {course.lectures.map((lecture: any) => (
                    <div
                      key={lecture.id}
                      className="bg-white p-4 rounded-xl border border-beige-200/80 flex items-center justify-between hover:border-mint-200 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleWatchedMutation.mutate(lecture.id)}
                          className={`flex-shrink-0 transition-colors ${
                            lecture.watchedBy.length > 0 ? 'text-mint-500' : 'text-beige-300 hover:text-mint-400'
                          }`}
                        >
                          <CheckCircle2 className="w-6 h-6 fill-current" />
                        </button>
                        <div>
                          <span className="text-[9px] font-bold text-mint-500">WEEK {lecture.weekNumber}</span>
                          <h4 className="text-sm font-bold text-text-primary">{lecture.title}</h4>
                          <span className="text-[10px] text-text-secondary uppercase">{lecture.fileType}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {lecture.allowDownload ? (
                          <button
                            onClick={() => triggerSecureDownload(lecture)}
                            className="p-2 hover:bg-beige-100 rounded-lg text-text-secondary hover:text-text-primary"
                            title="Download Lecture"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="p-2 text-beige-300 cursor-not-allowed" title="Downloads disabled">
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <button
                          onClick={() => setSelectedLecture(lecture)}
                          className="px-3.5 py-1.5 bg-mint-50 text-mint-500 hover:bg-mint-500 hover:text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Launch Player
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Assignments Panel */}
          {activeTab === 'assignments' && (
            <div className="space-y-4">
              {course.assignments.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-beige-200">
                  <p className="text-xs text-text-secondary">No assignments have been posted yet.</p>
                </div>
              ) : (
                course.assignments.map((assignment: any) => {
                  const submission = assignment.submissions[0];
                  const hasSubmitted = !!submission;
                  const isLate = new Date() > new Date(assignment.deadline);

                  return (
                    <div
                      key={assignment.id}
                      className="bg-white p-6 rounded-2xl border border-beige-200 space-y-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-beige-100">
                        <div>
                          <h3 className="text-base font-extrabold text-text-primary">{assignment.title}</h3>
                          <span className="text-[10px] text-text-secondary block mt-0.5">
                            Max Score: {assignment.maxScore} | Due: {new Date(assignment.deadline).toLocaleString()}
                          </span>
                        </div>
                        {hasSubmitted ? (
                          <span className="self-start md:self-auto text-[10px] font-bold px-3 py-1 bg-mint-100 text-mint-500 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                          </span>
                        ) : isLate ? (
                          <span className="self-start md:self-auto text-[10px] font-bold px-3 py-1 bg-rose-100 text-rose-500 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Late Upload Enabled
                          </span>
                        ) : (
                          <span className="self-start md:self-auto text-[10px] font-bold px-3 py-1 bg-beige-200 text-text-secondary rounded-full flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Awaiting Submission
                          </span>
                        )}
                      </div>

                      {/* Prompt description */}
                      <div
                        className="text-xs text-text-secondary leading-relaxed bg-beige-50 p-4 rounded-xl"
                        dangerouslySetInnerHTML={{ __html: assignment.description }}
                      />

                      {renderAttachedFiles(assignment.fileUrl)}

                      {/* Submission state */}
                      <div className="pt-2">
                        {hasSubmitted ? (
                          /* Graded overview */
                          <div className="p-4 rounded-xl border border-mint-100 bg-mint-50/20 space-y-3">
                            <h4 className="text-xs font-bold text-mint-500">Your Submission Profile</h4>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-text-secondary block">File url link:</span>
                                <a
                                  href={submission.fileUrl}
                                  target="_blank"
                                  className="text-mint-500 font-bold underline truncate block max-w-xs"
                                >
                                  Open Submitted File
                                </a>
                              </div>
                              <div>
                                <span className="text-text-secondary block">Submitted on:</span>
                                <span className="text-text-primary block font-medium">
                                  {new Date(submission.submittedAt).toLocaleString()}
                                  {submission.isLate && (
                                    <strong className="text-rose-500 block text-[9px] uppercase">LATE SUBMISSION</strong>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Grade response display */}
                            <div className="mt-4 pt-4 border-t border-beige-100">
                              <span className="text-text-secondary text-[11px] block">Grading report:</span>
                              {submission.grade !== null && (!submission.isTaGraded || submission.taGradeReview) ? (
                                <div className="mt-2 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Award className="w-5 h-5 text-mint-500" />
                                    <span className="text-base font-extrabold text-text-primary">
                                      {submission.grade} / {assignment.maxScore}
                                    </span>
                                  </div>
                                  <p className="text-xs text-text-secondary leading-relaxed italic bg-white p-3 rounded-lg border border-beige-200">
                                    "{submission.feedback || 'No written comments provided'}"
                                  </p>
                                  <span className="text-[9px] text-text-secondary/60 block">
                                    Graded by {submission.isTaGraded ? 'Course TA (Reviewed)' : 'Instructor'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs font-semibold text-amber-500 italic block mt-1">
                                  ⏳ Awaiting grading review
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Submit locker Dropzone */
                          <div className="border-2 border-dashed border-beige-300 rounded-xl p-6 text-center space-y-3 bg-beige-50/50">
                            <FileText className="w-8 h-8 text-beige-300 mx-auto" />
                            <div>
                              <h4 className="text-xs font-bold text-text-primary">Submit Assignment File</h4>
                              <p className="text-[10px] text-text-secondary mt-1">
                                Supports PDF, ZIP, or DOCX formats (Max 20MB limit)
                              </p>
                            </div>
                            <input
                              type="file"
                              id={`file-upload-${assignment.id}`}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) submitAssignment(assignment.id, file);
                              }}
                            />
                            <button
                              onClick={() => document.getElementById(`file-upload-${assignment.id}`)?.click()}
                              disabled={submittingAssignId === assignment.id}
                              className="px-4 py-2 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft transition-all active:scale-[0.98] disabled:opacity-70 inline-flex items-center gap-1.5"
                            >
                              {submittingAssignId === assignment.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Choose File to Upload'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: Quizzes Panel */}
          {activeTab === 'quizzes' && (
            <div className="space-y-4">
              {course.quizzes.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-beige-200">
                  <p className="text-xs text-text-secondary">No quizzes have been created yet.</p>
                </div>
              ) : (
                course.quizzes.map((quiz: any) => {
                  const hasAttempt = quiz.attempts && quiz.attempts.length > 0;
                  const completedAttempts = (quiz.attempts || []).filter((attempt: any) => attempt.submittedAt !== null);

                  return (
                    <div
                      key={quiz.id}
                      className="bg-white p-6 rounded-2xl border border-beige-200 space-y-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-beige-100">
                        <div>
                          <h3 className="text-base font-extrabold text-text-primary">{quiz.title}</h3>
                          <span className="text-[10px] text-text-secondary block mt-0.5">
                            Time Limit: {quiz.timeLimit} mins | Attempts: {hasAttempt ? 1 : 0} / 1
                          </span>
                        </div>
                        {!hasAttempt ? (
                          <button
                            onClick={() => startQuizMutation.mutate(quiz.id)}
                            className="px-4 py-2 bg-mint-500 hover:bg-mint-400 text-white text-xs font-bold rounded-xl shadow-soft"
                          >
                            Launch Quiz Attempt
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold px-3 py-1 bg-beige-200 text-text-secondary rounded-full">
                            🚫 Already Entered
                          </span>
                        )}
                      </div>

                      {renderAttachedFiles(quiz.fileUrl)}

                      {/* Display attempt history */}
                      {completedAttempts.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-text-secondary block">Completed Attempts:</span>
                          {completedAttempts.map((attempt: any, idx: number) => (
                            <div
                              key={attempt.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-beige-50 text-xs"
                            >
                              <span className="font-semibold text-text-primary">Attempt #{idx + 1}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-text-secondary text-[11px]">
                                  Submitted: {new Date(attempt.submittedAt).toLocaleDateString()}
                                </span>
                                <span className="font-extrabold text-mint-500 text-sm">
                                  {attempt.score !== null ? `${attempt.score.toFixed(1)}/100` : 'Pending Grade'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: Attendance Tracker Panel */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">My Attendance Record</h3>
                  <p className="text-[10px] text-text-secondary mt-0.5">View your chronological daily attendance logs for this course.</p>
                </div>
              </div>

              {isAttendanceLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 text-mint-500 animate-spin" />
                </div>
              ) : attendance.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-beige-200 text-text-secondary text-xs">
                  No attendance logs have been registered for you in this course yet.
                </div>
              ) : (() => {
                const total = attendance.length;
                const present = attendance.filter((a: any) => a.status === 'PRESENT').length;
                const late = attendance.filter((a: any) => a.status === 'LATE').length;
                const absent = attendance.filter((a: any) => a.status === 'ABSENT').length;
                const presenceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

                return (
                  <div className="space-y-6">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="p-4 bg-white border border-beige-200 rounded-xl text-center shadow-soft">
                        <span className="text-[9px] font-bold text-text-secondary block uppercase">Total Classes</span>
                        <span className="text-lg font-black text-text-primary block mt-1">{total}</span>
                      </div>
                      <div className="p-4 bg-white border border-beige-200 rounded-xl text-center shadow-soft">
                        <span className="text-[9px] font-bold text-text-secondary block uppercase">Present</span>
                        <span className="text-lg font-black text-mint-500 block mt-1">{present}</span>
                      </div>
                      <div className="p-4 bg-white border border-beige-200 rounded-xl text-center shadow-soft">
                        <span className="text-[9px] font-bold text-text-secondary block uppercase">Late</span>
                        <span className="text-lg font-black text-amber-500 block mt-1">{late}</span>
                      </div>
                      <div className="p-4 bg-white border border-beige-200 rounded-xl text-center shadow-soft">
                        <span className="text-[9px] font-bold text-text-secondary block uppercase">Absent</span>
                        <span className="text-lg font-black text-rose-500 block mt-1">{absent}</span>
                      </div>
                      <div className="p-4 bg-white border border-beige-200 rounded-xl text-center col-span-2 md:col-span-1 shadow-soft">
                        <span className="text-[9px] font-bold text-text-secondary block uppercase">Presence Rate</span>
                        <span className="text-lg font-black text-mint-500 block mt-1">{presenceRate}%</span>
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="bg-white rounded-2xl border border-beige-200 overflow-hidden shadow-soft">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-beige-100/50 border-b border-beige-200 font-bold text-text-secondary">
                          <tr>
                            <th className="px-4 py-3">Lecture Date</th>
                            <th className="px-4 py-3 text-right">Status Badge</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-beige-100 font-semibold text-text-primary">
                          {attendance.map((record: any) => {
                            let statusColor = 'text-mint-500 bg-mint-50 border-mint-100';
                            if (record.status === 'LATE') statusColor = 'text-amber-500 bg-amber-50 border-amber-100';
                            if (record.status === 'ABSENT') statusColor = 'text-rose-500 bg-rose-50 border-rose-100';

                            return (
                              <tr key={record.id} className="hover:bg-beige-50/50 transition-colors">
                                <td className="px-4 py-3 font-bold">
                                  {new Date(record.date).toLocaleDateString(undefined, {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${statusColor}`}>
                                    {record.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 5: Coding Sandbox Panel */}
          {activeTab === 'sandbox' && (
            <div className="bg-white p-6 rounded-2xl border border-beige-200 space-y-4 animate-fade-in text-xs font-sans">
              <div className="flex items-center justify-between border-b border-beige-100 pb-3 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-mint-500" />
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Multi-Language Coding Sandbox</h3>
                    <p className="text-[10px] text-text-secondary mt-0.5">Write algorithms in Python, C++, Java, Go, or JS and compile dynamically.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={sandboxLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value as any)}
                    className="px-3 py-1.5 bg-beige-100 border border-beige-200 rounded-lg font-bold text-text-primary outline-none focus:ring-1 focus:ring-mint-500"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python 3</option>
                    <option value="cpp">C++ (GCC)</option>
                    <option value="java">Java (JDK)</option>
                    <option value="go">Go (Golang)</option>
                  </select>
                  <button
                    onClick={() => handleLanguageChange(sandboxLanguage)}
                    className="px-3 py-1.5 bg-beige-100 hover:bg-beige-200 text-text-primary rounded-lg font-bold"
                  >
                    Reset Template
                  </button>
                </div>
              </div>

              {/* Sandbox Editor & Console split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Code input area */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Code Editor ({sandboxLanguage})</label>
                  <textarea
                    value={sandboxCode}
                    onChange={(e) => setSandboxCode(e.target.value)}
                    className="w-full h-64 p-4 font-mono text-xs bg-neutral-900 text-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-mint-500 border border-neutral-800"
                    style={{ resize: 'none' }}
                  />
                </div>

                {/* Console Log output */}
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Execution Console</label>
                  <div className="flex-1 bg-neutral-950 text-emerald-400 font-mono text-[11px] p-4 rounded-xl border border-neutral-900 overflow-y-auto max-h-64 h-64 space-y-1 custom-scrollbar">
                    {sandboxOutput.length === 0 ? (
                      <span className="text-neutral-500 italic">No output yet. Click 'Run Script' below to execute your code.</span>
                    ) : (
                      sandboxOutput.map((log, idx) => (
                        <div key={idx} className="leading-relaxed whitespace-pre-wrap">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleRunSandbox}
                  className="px-6 py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold rounded-xl shadow-soft transition-all"
                >
                  Run Script
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Course Info Widget Right Sidebar */}
        <div className="space-y-6">
          
          {/* Progress Overview Card */}
          <div className="bg-white p-5 rounded-2xl border border-beige-200/80 shadow-soft">
            <h4 className="text-xs font-bold text-text-primary mb-3 uppercase tracking-wider">
              Course Details
            </h4>
            
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Lectures:</span>
                <span className="text-text-primary font-bold">{course.lectures?.length || 0} uploaded</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Assignments:</span>
                <span className="text-text-primary font-bold">{course.assignments?.length || 0} total</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Quizzes:</span>
                <span className="text-text-primary font-bold">{course.quizzes?.length || 0} active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Doctor:</span>
                <span className="text-text-primary font-bold">{course.doctor?.name}</span>
              </div>

              {/* Progress Tracker */}
              {(() => {
                const totalLectures = course.lectures?.length || 0;
                const watchedCount = course.lectures?.filter((l: any) => l.watchedBy && l.watchedBy.length > 0).length || 0;
                const progressPercent = totalLectures > 0 ? Math.round((watchedCount / totalLectures) * 100) : 0;

                return (
                  <div className="space-y-3 pt-3 border-t border-beige-100">
                    <div className="flex justify-between text-[10px] font-bold text-text-secondary">
                      <span>Course Progress:</span>
                      <span className="text-mint-500 font-extrabold">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-beige-100 rounded-full h-2 overflow-hidden border border-beige-200">
                      <div
                        className="bg-mint-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    {progressPercent === 100 && (
                      <div className="pt-2">
                        <Link
                          href={`/dashboard/student/courses/certificate?courseId=${course.id}`}
                          className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white rounded-xl text-[10px] font-extrabold text-center block shadow-soft transition-all active:scale-[0.98]"
                        >
                          🏆 View Completion Certificate
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* TA Assigned Card */}
          <div className="bg-white p-5 rounded-2xl border border-beige-200/80 shadow-soft">
            <h4 className="text-xs font-bold text-text-primary mb-3 uppercase tracking-wider">
              Course assistants (TAs)
            </h4>
            
            {course.tas?.length === 0 ? (
              <p className="text-[11px] text-text-secondary italic">No TAs assigned to this course.</p>
            ) : (
              <div className="space-y-3">
                {course.tas.map((taJob: any) => (
                  <div key={taJob.id} className="flex items-center gap-2.5 text-xs">
                    <div className="w-7 h-7 bg-mint-50 text-mint-500 rounded-lg flex items-center justify-center font-bold">
                      {taJob.ta?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-text-primary leading-none">{taJob.ta?.name}</p>
                      <span className="text-[10px] text-text-secondary">{taJob.ta?.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 4. FULLSCREEN QUIZ EXAM MODAL WORKSPACE */}
      {activeQuiz && quizAttempt && (
        <div className="fixed inset-0 z-[100] bg-neutral-950 p-6 md:p-12 overflow-y-auto flex flex-col justify-between select-none">
          
          {/* Quiz Top bar */}
          <div className="max-w-4xl w-full mx-auto flex items-center justify-between text-white pb-6 border-b border-neutral-800 flex-shrink-0">
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-mint-400">
                ACTIVE EXAMINATION WINDOW
              </span>
              <h2 className="text-xl font-black text-white">{activeQuiz.title}</h2>
            </div>
            
            <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 px-4 py-2.5 rounded-xl shadow-soft">
              <Clock className="w-5 h-5 text-mint-400" />
              <div className="text-right">
                <span className="text-[9px] text-neutral-400 block leading-none">TIME REMAINING</span>
                <span className="text-base font-black font-mono leading-none text-white">{formatTime(quizTimeRemaining)}</span>
              </div>
            </div>
          </div>

          {/* Quiz Questions Container */}
          <div className="max-w-4xl w-full mx-auto flex-1 my-8 space-y-6 text-white">
            {quizQuestions.map((q, idx) => (
              <div key={q.id} className="bg-neutral-900/50 backdrop-blur-md p-6 rounded-2xl border border-neutral-800 space-y-5 shadow-soft">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-mint-500 text-white font-bold rounded-lg flex items-center justify-center text-xs flex-shrink-0 shadow-soft">
                    {idx + 1}
                  </span>
                  <p className="text-sm font-semibold pt-0.5 text-neutral-100">{q.text}</p>
                </div>

                {/* Render Options based on type */}
                {q.type === 'MCQ' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                    {q.options.map((opt: string) => {
                      const isSelected = quizAnswers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                          className={`text-left p-3.5 rounded-xl border text-xs font-semibold transition-all active:scale-[0.99] ${
                            isSelected
                              ? 'border-mint-400 bg-mint-500/10 text-mint-300 shadow-[0_0_15px_rgba(79,181,131,0.25)]'
                              : 'border-neutral-800 bg-neutral-900/40 text-neutral-300 hover:bg-neutral-800 hover:text-white hover:border-neutral-700'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === 'TRUE_FALSE' && (
                  <div className="flex gap-4 pl-9">
                    {['True', 'False'].map((opt) => {
                      const isSelected = quizAnswers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                          className={`px-6 py-3 rounded-xl border text-xs font-semibold transition-all active:scale-[0.99] ${
                            isSelected
                              ? 'border-mint-400 bg-mint-500/10 text-mint-300 shadow-[0_0_15px_rgba(79,181,131,0.25)]'
                              : 'border-neutral-800 bg-neutral-900/40 text-neutral-300 hover:bg-neutral-800 hover:text-white hover:border-neutral-700'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === 'SHORT_ANSWER' && (
                  <div className="pl-9">
                    <textarea
                      placeholder="Write your explanation here..."
                      rows={3}
                      value={quizAnswers[q.id] || ''}
                      onChange={(e) => setQuizAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 text-xs text-neutral-100 placeholder-neutral-500 focus:border-mint-400 focus:ring-1 focus:ring-mint-400 outline-none transition-all"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quiz Action Submit footer */}
          <div className="max-w-4xl w-full mx-auto pt-6 border-t border-neutral-800 flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] text-neutral-500 font-medium">
              * Ensure all questions are answered before submitting. Timer submit triggers automatically at 00:00.
            </span>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to submit your quiz attempt?')) {
                  submitQuizMutation.mutate({ quizId: activeQuiz.id, answers: quizAnswers });
                }
              }}
              disabled={submitQuizMutation.isPending}
              className="px-6 py-3 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft transition-all active:scale-[0.98] disabled:opacity-70 flex items-center gap-2"
            >
              {submitQuizMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Submit Examination'
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
