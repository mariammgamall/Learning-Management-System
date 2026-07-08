'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Loader2, ArrowLeft, Printer, Award, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/hooks/useAuthStore';

// Scalloped seal path generator function to draw high-fidelity serrated badges
const getScallopedPath = (cx: number, cy: number, r: number, points: number, depth: number) => {
  const path = [];
  for (let i = 0; i < points; i++) {
    const angle1 = (i * 2 * Math.PI) / points;
    const angle2 = ((i + 0.5) * 2 * Math.PI) / points;
    const angle3 = ((i + 1) * 2 * Math.PI) / points;
    
    const x1 = cx + (r - depth) * Math.cos(angle1);
    const y1 = cy + (r - depth) * Math.sin(angle1);
    const x2 = cx + r * Math.cos(angle2);
    const y2 = cy + r * Math.sin(angle2);
    const x3 = cx + (r - depth) * Math.cos(angle3);
    const y3 = cy + (r - depth) * Math.sin(angle3);
    
    if (i === 0) {
      path.push(`M ${x1} ${y1}`);
    }
    path.push(`Q ${x2} ${y2} ${x3} ${y3}`);
  }
  return path.join(' ') + ' Z';
};

export default function CourseCertificatePage() {
  const { user } = useAuthStore();
  const [courseId, setCourseId] = useState('');

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
    queryKey: ['certificateCourseDetails', courseId],
    queryFn: async () => {
      const response = await api.get(`/courses/${courseId}`);
      return response.data;
    },
    enabled: !!courseId,
  });

  if (isCourseLoading || !course) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-mint-500 animate-spin" />
        <p className="text-xs text-text-secondary mt-2">Retrieving completion records...</p>
      </div>
    );
  }

  // Calculate lecture watch completion progress
  const totalLectures = course.lectures?.length || 0;
  const watchedCount = course.lectures?.filter((l: any) => l.watchedBy && l.watchedBy.length > 0).length || 0;
  const progressPercent = totalLectures > 0 ? Math.round((watchedCount / totalLectures) * 100) : 0;

  // Enforce 100% completion requirement
  if (progressPercent < 100) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 animate-fade-in">
        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-100">
          <Award className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-text-primary">Certificate Locked</h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          You must complete 100% of this course's content to unlock your official stamped completion certificate. Current progress: **{progressPercent}%**.
        </p>
        <Link
          href={`/dashboard/student/courses/${courseId}`}
          className="px-5 py-2 bg-mint-500 hover:bg-mint-400 text-white rounded-xl text-xs font-bold inline-block shadow-soft mt-2"
        >
          Return to Course
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const certificateId = `LMS-${course.code}-${courseId.substring(0, 8).toUpperCase()}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Dynamic CSS Print Overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }
          body {
            margin: 0;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Hide all page content except certificate workspace */
          body * {
            visibility: hidden;
          }
          .printable-cert-area, .printable-cert-area * {
            visibility: visible;
          }
          .printable-cert-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            margin: 0 !important;
            padding: 2.5rem !important;
            border: 18px double #ea580c !important;
            border-radius: 0px !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background: white !important;
          }
        }
      `}} />

      {/* Header controls (Hidden during print) */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/student/courses/${courseId}`}
            className="p-2.5 bg-beige-200 text-text-secondary hover:text-text-primary rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Course Certificate</h2>
            <p className="text-xs text-text-secondary">Official stamped completion credential</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-mint-500 hover:bg-mint-400 text-white text-xs font-bold rounded-xl shadow-soft flex items-center gap-1.5 transition-all"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      {/* Scrollable container to maintain desktop certificate proportions on mobile screens */}
      <div className="w-full overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 print:overflow-visible print:p-0 print:m-0">
        <div className="printable-cert-area min-w-[768px] md:min-w-0 relative bg-white border-[16px] border-double border-orange-600/60 p-8 md:p-12 rounded-3xl shadow-premium text-center font-serif text-text-primary print:border-orange-600 print:shadow-none overflow-hidden max-w-4xl mx-auto aspect-[1.414] flex flex-col justify-between">
          
          {/* Decorative corner brackets */}
          <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-orange-600/40" />
          <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-orange-600/40" />
          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-orange-600/40" />
          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-orange-600/40" />

          {/* Top Logo Shield Crest */}
          <div className="pt-2">
            <svg className="w-14 h-14 text-orange-600 mx-auto" viewBox="0 0 64 64" fill="none" stroke="currentColor">
              <path d="M12 8 C12 8, 32 4, 32 4 C32 4, 52 8, 52 8 C52 24, 46 44, 32 58 C18 44, 12 24, 12 8 Z" fill="#FFFBEB" strokeWidth="2.5" />
              <path d="M16 11 C16 11, 32 7.5, 32 7.5 C32 7.5, 48 11, 48 11 C48 24, 43 40, 32 52.5 C21 40, 16 24, 16 11 Z" strokeWidth="1" strokeDasharray="2,2" />
              <path d="M24 28 L29 25 L32 28 L35 25 L40 28 L40 36 L32 39 L24 36 Z" fill="#FEF3C7" strokeWidth="1.5" />
              <path d="M32 28 L32 39" strokeWidth="1.5" stroke="currentColor" />
              <polygon points="32,13 34,17 38,17 35,19 36,23 32,21 28,23 29,19 26,17 30,17" fill="currentColor" />
            </svg>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto flex-1 flex flex-col justify-center">
            {/* Top Logo / Label */}
            <div className="space-y-1">
              <span className="text-[9px] font-sans font-black tracking-widest text-orange-600 uppercase">
                Official Academic Credential
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-800 tracking-wide mt-1.5">
                Certificate of Completion
              </h1>
            </div>

            <div className="text-[11px] md:text-xs font-sans font-medium text-text-secondary">
              This is proudly awarded to
            </div>

            {/* Student Name */}
            <div className="py-1 border-b border-beige-200 inline-block px-10 mx-auto">
              <span className="text-xl md:text-2xl font-black text-neutral-900 tracking-wide">
                {user?.name || 'Mariam Gamal Elsayed Khamiss Yassin'}
              </span>
            </div>

            <div className="text-[10px] md:text-[11px] font-sans font-medium text-text-secondary leading-relaxed max-w-lg mx-auto">
              for successfully satisfying all course syllabus guidelines, assignments, and examination benchmarks required to pass the academic curriculum program of:
            </div>

            {/* Course Details */}
            <div className="space-y-1">
              <h2 className="text-base md:text-lg font-extrabold text-orange-700">
                {course.title}
              </h2>
              <span className="text-[9px] font-sans font-bold text-text-secondary tracking-wider block">
                COURSE CODE: {course.code}
              </span>
              <div className="flex justify-center gap-6 text-[9px] font-sans font-bold text-text-secondary tracking-wide mt-2 bg-beige-50/50 py-1.5 px-4 rounded-lg max-w-xs mx-auto border border-beige-200">
                <div>
                  <span className="block text-[7px] uppercase text-text-secondary/70">Duration</span>
                  <span className="text-neutral-800">12 Weeks (Full Semester)</span>
                </div>
                <div className="border-r border-beige-200" />
                <div>
                  <span className="block text-[7px] uppercase text-text-secondary/70">Working Hours</span>
                  <span className="text-neutral-800">60 Effort Hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Signature & Official Stamp Row */}
          <div className="grid grid-cols-3 gap-4 items-end pt-4 border-t border-beige-100 font-sans text-xs">
            {/* Signature */}
            <div className="space-y-1.5 text-left">
              <div className="font-serif italic text-base text-neutral-800 select-none pb-1 border-b border-beige-200 pl-2">
                Ahmed Hagag
              </div>
              <span className="text-[8px] font-bold text-text-secondary uppercase tracking-wider block pl-2">
                Lead Program Instructor
              </span>
            </div>

            {/* Official Stamp - Matches Scalloped Verified Seal from User but in Orange & Stamping LMS */}
            <div className="flex justify-center select-none pb-1">
              <svg className="w-20 h-20 text-orange-600 drop-shadow-md rotate-[8deg]" viewBox="0 0 120 120">
                {/* Scalloped outer background */}
                <path
                  d={getScallopedPath(60, 60, 56, 36, 4)}
                  fill="currentColor"
                />
                
                {/* White double circular rings */}
                <circle cx="60" cy="60" r="48" fill="none" stroke="white" strokeWidth="2" />
                <circle cx="60" cy="60" r="44" fill="none" stroke="white" strokeWidth="1" />
                
                {/* Curved Text Path definitions */}
                <path id="stamp-text-path-top" d="M 22,60 A 38,38 0 1,1 98,60" fill="none" stroke="none" />
                <text className="font-sans text-[7.5px] font-black tracking-[1.5px] fill-white">
                  <textPath href="#stamp-text-path-top" startOffset="50%" textAnchor="middle">
                    LMS CERTIFIED
                  </textPath>
                </text>
                
                <path id="stamp-text-path-bottom" d="M 98,60 A 38,38 0 0,1 22,60" fill="none" stroke="none" />
                <text className="font-sans text-[7.5px] font-black tracking-[1.5px] fill-white">
                  <textPath href="#stamp-text-path-bottom" startOffset="50%" textAnchor="middle">
                    LMS CERTIFIED
                  </textPath>
                </text>
                
                {/* Inner checkmark background circle */}
                <circle cx="60" cy="60" r="28" fill="currentColor" stroke="white" strokeWidth="1.5" />
                
                {/* Certified Checkmark */}
                <path
                  d="M 49,58 L 56,65 L 70,51 L 74,55 L 56,73 L 45,62 Z"
                  fill="white"
                />
              </svg>
            </div>

            {/* Verification Detail */}
            <div className="space-y-1.5 text-right pr-2">
              <div className="font-bold text-neutral-800 text-[9px] pb-1 border-b border-beige-200">
                {certificateId}
              </div>
              <span className="text-[8px] font-bold text-text-secondary uppercase tracking-wider block">
                Verification Serial ID
              </span>
            </div>
          </div>

          {/* Verification Footer Disclaimer (Print friendly) */}
          <div className="flex items-center justify-center gap-1 text-[8px] font-sans font-semibold text-text-secondary/60 pt-2 print:pt-0">
            <ShieldCheck className="w-3 h-3 text-mint-500" />
            <span>Officially verified by the Learning Management System registry board</span>
          </div>

        </div>
      </div>
    </div>
  );
}
