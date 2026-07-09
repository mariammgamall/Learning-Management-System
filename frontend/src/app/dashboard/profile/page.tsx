'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useToastStore } from '@/hooks/useToastStore';
import { api } from '@/utils/api';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Loader2,
  Camera,
  Trash2,
  Eye,
  ArrowLeft,
  User,
  Mail,
  Shield,
  Calendar,
  BookOpen,
  Award,
  Sparkles,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import ModalPortal from '@/components/ModalPortal';
import { useTranslation } from '@/hooks/useTranslation';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { addToast } = useToastStore();
  const { t, lang } = useTranslation();

  const [activeTab, setActiveTab] = useState<'info' | 'transcript' | 'career'>('info');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [interests, setInterests] = useState(user?.interests || '');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // 1. Fetch Academic Report (if student)
  const { data: reportData = [], isLoading: isReportLoading } = useQuery({
    queryKey: ['studentReport'],
    queryFn: async () => {
      const response = await api.get('/users/student-report');
      return response.data;
    },
    enabled: user?.role === 'STUDENT',
  });

  const getEnrollmentYear = (enrolledAt: string) => {
    const date = new Date(enrolledAt);
    return date.getFullYear();
  };

  const coursesByYear: { [key: number]: any[] } = {};
  if (user?.role === 'STUDENT' && Array.isArray(reportData)) {
    reportData.forEach((item: any) => {
      if (item && item.course) {
        const year = getEnrollmentYear(item.enrolledAt);
        if (!coursesByYear[year]) {
          coursesByYear[year] = [];
        }
        coursesByYear[year].push(item);
      }
    });
  }

  const calculateOverallCourseGrade = (assignments: any[] = [], quizzes: any[] = []) => {
    let totalGrade = 0;
    let count = 0;
    
    assignments.forEach((a: any) => {
      const sub = a.submissions?.[0];
      if (sub && sub.grade !== null) {
        totalGrade += (sub.grade / a.maxScore) * 100;
        count++;
      }
    });
    
    quizzes.forEach((q: any) => {
      const attempt = q.attempts?.[0];
      if (attempt && attempt.score !== null) {
        totalGrade += attempt.score;
        count++;
      }
    });
    
    return count > 0 ? Math.round(totalGrade / count) : null;
  };

  const generateDevPlan = (interestsString: string) => {
    const interests = (interestsString || '').toLowerCase();
    
    let pathTitle = '';
    let description = '';
    let skills = [] as string[];
    let resources = [] as string[];
    let projects = [] as string[];
    let coursesList = [] as string[];

    if (interests.includes('web') || interests.includes('frontend') || interests.includes('react') || interests.includes('next') || interests.includes('html') || interests.includes('javascript')) {
      pathTitle = lang === 'en' ? 'Frontend & Modern Web Engineering' : 'هندسة الويب والواجهات الأمامية الحديثة';
      description = lang === 'en'
        ? 'A structured pathway for mastering responsive user interfaces, client-side state management, and production-ready applications.'
        : 'مسار منظم لإتقان واجهات المستخدم المتجاوبة، وإدارة الحالة في المتصفح، وبناء تطبيقات جاهزة للإنتاج.';
      skills = ['HTML5 & CSS3', 'JavaScript (ES6+)', 'TypeScript', 'React.js & Next.js Frameworks', 'Tailwind CSS', 'RESTful APIs & GraphQL Development', 'Git & GitHub'];
      coursesList = ['Advanced JavaScript & Web APIs', 'React - The Complete Guide', 'Next.js App Router Architecture', 'Responsive Web Design & Tailwind CSS'];
      projects = [
        lang === 'en' ? 'Portfolio Website: Create a premium glassmorphic portfolio displaying your certificates.' : 'موقع معرض الأعمال: تصميم موقع مميز يعرض شهاداتك وإنجازاتك.',
        lang === 'en' ? 'E-Commerce Platform: Build a full storefront with cart state management and filter queries.' : 'منصة تجارة إلكترونية: بناء متجر متكامل مع إدارة حالة السلة واستعلامات التصفية.',
        lang === 'en' ? 'LMS Student Portal Dashboard: Build a replica of your favorite dashboard using mock data.' : 'لوحة تحكم طالب LMS: محاكاة لوحة التحكم المفضلة لديك باستخدام بيانات وهمية.'
      ];
      resources = [
        'MDN Web Docs (Mozilla Developer Network)',
        'React Official Documentation (react.dev)',
        'Next.js Learn Path (nextjs.org/learn)',
        'Frontend Masters / freeCodeCamp tutorials'
      ];
    } else if (interests.includes('ai') || interests.includes('ml') || interests.includes('data') || interests.includes('machine') || interests.includes('python') || interests.includes('deep')) {
      pathTitle = lang === 'en' ? 'Artificial Intelligence & Data Science Specialist' : 'أخصائي الذكاء الاصطناعي وعلوم البيانات';
      description = lang === 'en'
        ? 'A mathematically-grounded route covering statistical analysis, supervised learning algorithms, neural network design, and data science workflows.'
        : 'مسار مبني على أسس رياضية يغطي التحليل الإحصائي، وخوارزميات التعلم الخاضع للإشراف، وتصميم الشبكات العصبية، ومراحل العمل في علوم البيانات.';
      skills = ['Python (NumPy, Pandas, Matplotlib)', 'SQL & Database Design', 'Scikit-Learn (Supervised/Unsupervised)', 'TensorFlow or PyTorch', 'Data Preprocessing', 'Linear Algebra & Calculus'];
      coursesList = ['Python Programming for Data Science', 'Machine Learning Core Concepts', 'Deep Learning & Neural Networks', 'Practical Database Administration & SQL'];
      projects = [
        lang === 'en' ? 'House Price Predictor: Build a multivariate linear regression model utilizing Scikit-learn.' : 'متنبئ أسعار العقارات: بناء نموذج انحدار خطي متعدد المتغيرات باستخدام Scikit-learn.',
        lang === 'en' ? 'Customer Segmentation: Apply K-means clustering to analyze retail customer behavior.' : 'تصنيف العملاء: تطبيق خوارزمية K-means لتحليل سلوكيات عملاء التجزئة.',
        lang === 'en' ? 'Image Classifier: Train a Convolutional Neural Network (CNN) to categorize handwritten digits.' : 'مصنف الصور: تدريب شبكة عصبية تلافيفية (CNN) لتصنيف الأرقام المكتوبة بخط اليد.'
      ];
      resources = [
        'Kaggle Datasets & Jupyter Notebooks',
        'Scikit-Learn Documentation (scikit-learn.org)',
        '3Blue1Brown Deep Learning Series (YouTube)',
        'Fast.ai Practical Deep Learning for Coders'
      ];
    } else if (interests.includes('cyber') || interests.includes('security') || interests.includes('network') || interests.includes('penetration') || interests.includes('linux')) {
      pathTitle = lang === 'en' ? 'Cybersecurity Analyst & Penetration Tester' : 'محلل الأمن السيبراني واختبار الاختراق';
      description = lang === 'en'
        ? 'A route focused on threat mitigation, cryptography, defensive architecture, and systematic vulnerability assessments.'
        : 'مسار يركز على الحد من التهديدات، علم التشفير، تصميم البنية الدفاعية، والتقييم المنظم للثغرات الأمنية.';
      skills = ['Linux Administration (Bash scripting)', 'Networking Fundamentals (TCP/IP, DNS, Routing)', 'Cryptography Foundations', 'OWASP Top 10 Vulnerabilities', 'Wireshark & Network Traffic Analysis', 'Metasploit & Nmap Essentials'];
      coursesList = ['Introduction to Computer Networks', 'Applied Cryptography & Security Protocols', 'Ethical Hacking & Vulnerability Assessment', 'Linux System Administration'];
      projects = [
        lang === 'en' ? 'Network Scanner Tool: Build a custom Python script to scan network ports safely.' : 'أداة مسح الشبكات: بناء سكربت بايثون مخصص لمسح منافذ الشبكة بشكل آمن.',
        lang === 'en' ? 'Vulnerable VM Exploitation: Set up a sandbox VM and perform documented penetration testing.' : 'اختراق جهاز افتراضي ضعيف: إعداد بيئة معزولة وإجراء اختبار اختراق موثق.',
        lang === 'en' ? 'Secure Login Module: Implement a registration screen using bcrypt hashing and JWT tokens.' : 'وحدة تسجيل دخول آمنة: تنفيذ شاشة تسجيل مستخدم باستخدام تشفير bcrypt ورموز JWT.'
      ];
      resources = [
        'OWASP Foundation Documentation (owasp.org)',
        'TryHackMe & Hack The Box Laboratories',
        'PortSwigger Web Security Academy',
        'Linux Command Line Bible / OverTheWire Wargames'
      ];
    } else if (interests.includes('mobile') || interests.includes('android') || interests.includes('ios') || interests.includes('flutter') || interests.includes('native')) {
      pathTitle = lang === 'en' ? 'Cross-Platform Mobile Developer' : 'مطور تطبيقات الهاتف المحمول';
      description = lang === 'en'
        ? 'A comprehensive roadmap for designing native-feeling mobile applications running on iOS and Android devices.'
        : 'خارطة طريق شاملة لتصميم تطبيقات الهاتف المحمول ذات الطابع الأصلي التي تعمل على أجهزة iOS و Android.';
      skills = ['Dart & Flutter Framework', 'React Native & Expo', 'Mobile UI/UX Layout Rules', 'State Management (Provider, Bloc, Redux)', 'Device API Integration (GPS, Camera)', 'App Store & Google Play Deployment'];
      coursesList = ['Flutter for Beginners', 'React Native Core Architecture', 'Mobile UX Best Practices', 'Deploying and Monetizing Mobile Apps'];
      projects = [
        lang === 'en' ? 'Weather App: Build a mobile app utilizing GPS location APIs to show weather forecasts.' : 'تطبيق الطقس: بناء تطبيق هاتف يعتمد على نظام تحديد المواقع الجغرافي لعرض توقعات الطقس.',
        lang === 'en' ? 'Notes App with SQLite: Create a locally stored note-taking application.' : 'تطبيق ملاحظات بقاعدة بيانات SQLite: إنشاء تطبيق لتدوين الملاحظات مع حفظ محلي.',
        lang === 'en' ? 'Social Chat App: Build a mobile client using WebSocket connections for instant messages.' : 'تطبيق محادثة اجتماعي: بناء تطبيق جوال يستخدم اتصالات WebSocket للرسائل الفورية.'
      ];
      resources = [
        'Flutter Official Docs (flutter.dev)',
        'React Native Official Docs (reactnative.dev)',
        'Reso Coder Flutter Tutorials (YouTube)',
        'Google Codelabs for Android / Apple Developer Docs'
      ];
    } else {
      pathTitle = lang === 'en' ? 'Software Engineer & Computer Science Core' : 'مهندس برمجيات وتخصص علوم الحاسب';
      description = lang === 'en'
        ? 'A robust software engineering track focusing on data structures, algorithmic efficiency, clean code, and database modeling.'
        : 'مسار قوي في هندسة البرمجيات يركز على هياكل البيانات، كفاءة الخوارزميات، كتابة الكود النظيف، ونمذجة قواعد البيانات.';
      skills = ['Object-Oriented Programming (Java/C++)', 'Data Structures (Lists, Trees, Graphs)', 'Sorting & Searching Algorithms', 'System Architecture & Design Patterns', 'SQL Database Modeling', 'Unit Testing & CI/CD Pipelines'];
      coursesList = ['Introduction to Algorithms & Complexities', 'Object-Oriented Design Patterns', 'Relational Database Systems', 'Software Engineering Lifecycle & Testing'];
      projects = [
        lang === 'en' ? 'Task Manager CLI: Build a command-line tool with sorting algorithms to schedule events.' : 'أداة إدارة المهام CLI: بناء أداة سطر أوامر مع خوارزميات ترتيب لجدولة المواعيد.',
        lang === 'en' ? 'Library DBMS: Model and build a functional relational database for library items.' : 'نظام إدارة قواعد بيانات المكتبة: نمذجة وبناء قاعدة بيانات علائقية لإعارة الكتب.',
        lang === 'en' ? 'Compiler Parser: Build a simple lexical analyzer to parse arithmetic equations.' : 'محلل برمجي معادلات: بناء محلل معجمي بسيط لتحليل المعادلات الحسابية.'
      ];
      resources = [
        'LeetCode & HackerRank Problems',
        'Clean Code by Robert C. Martin (Book)',
        'GeeksforGeeks Computer Science Portal',
        'MIT OpenCourseWare - Introduction to Algorithms'
      ];
    }

    return { pathTitle, description, skills, resources, projects, coursesList };
  };

  // Profile Update Mutation (handles name change and photo upload)
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (data) => {
      updateUser(data.user);
      addToast('Profile updated successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    },
  });

  // Photo Delete Mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/users/profile/photo');
      return response.data;
    },
    onSuccess: () => {
      updateUser({ profilePhoto: null });
      addToast('Profile photo removed successfully', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to delete profile photo', 'error');
    },
  });

  if (!user) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-8 h-8 text-mint-500 animate-spin" />
      </div>
    );
  }

  const handleDownloadTranscript = () => {
    // Generate printable HTML content
    let yearsHtml = '';
    
    Object.keys(coursesByYear).sort((a, b) => Number(b) - Number(a)).forEach((yearStr) => {
      const year = Number(yearStr);
      const enrollments = coursesByYear[year];
      
      let rowsHtml = '';
      enrollments.forEach((enr: any) => {
        const course = enr.course;
        const overall = calculateOverallCourseGrade(course.assignments, course.quizzes);
        const presentCount = course.attendances.filter((att: any) => att.status === 'PRESENT').length;
        const totalAtt = course.attendances.length;
        const attendanceRate = totalAtt > 0 ? `${Math.round((presentCount / totalAtt) * 100)}%` : 'N/A';
        
        rowsHtml += `
          <tr>
            <td style="font-weight: bold; border: 1px solid #cbd5e1; padding: 10px;">${course.code}</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px;">${course.title}</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px;">${course.doctor?.name || 'N/A'}</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px;">${attendanceRate}</td>
            <td style="text-align: right; font-weight: bold; color: #0f766e; border: 1px solid #cbd5e1; padding: 10px;">${overall !== null ? `${overall}%` : 'N/A'}</td>
          </tr>
        `;
      });

      yearsHtml += `
        <div class="year-title" style="font-size: 14px; font-weight: bold; color: #0f766e; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin: 25px 0 10px 0; text-transform: uppercase;">${lang === 'en' ? `Academic Year ${year}` : `العام الدراسي ${year}`}</div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
          <thead>
            <tr>
              <th style="background: #f1f5f9; color: #334155; text-align: ${lang === 'ar' ? 'right' : 'left'}; padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; width: 15%;">${lang === 'en' ? 'Course Code' : 'رمز المقرر'}</th>
              <th style="background: #f1f5f9; color: #334155; text-align: ${lang === 'ar' ? 'right' : 'left'}; padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; width: 40%;">${lang === 'en' ? 'Course Title' : 'اسم المقرر'}</th>
              <th style="background: #f1f5f9; color: #334155; text-align: ${lang === 'ar' ? 'right' : 'left'}; padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; width: 25%;">${lang === 'en' ? 'Instructor' : 'المحاضر'}</th>
              <th style="background: #f1f5f9; color: #334155; text-align: ${lang === 'ar' ? 'right' : 'left'}; padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; width: 10%;">${lang === 'en' ? 'Attendance' : 'الحضور'}</th>
              <th style="background: #f1f5f9; color: #334155; text-align: ${lang === 'ar' ? 'left' : 'right'}; padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; width: 10%;">${lang === 'en' ? 'Score' : 'الدرجة'}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return addToast('Failed to open print window. Please allow popups.', 'error');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Academic Transcript - ${user.name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; }
          .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; font-size: 24px; color: #0f766e; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 5px 0 0 0; font-size: 12px; color: #64748b; }
          .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; }
          .student-info div { margin-bottom: 5px; }
          .student-info span { font-weight: bold; color: #475569; }
          .footer-note { margin-top: 50px; font-size: 10px; text-align: center; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
          .signature-block { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; }
          .signature { border-top: 1px solid #94a3b8; width: 200px; text-align: center; padding-top: 5px; margin-top: 40px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${lang === 'en' ? 'Official Academic Transcript' : 'بيان الدرجات الأكاديمي الرسمي'}</h1>
          <p>${lang === 'en' ? 'Learning Management System - Academy Registrar' : 'نظام إدارة التعلم - مسجل الأكاديمية الرسمي'}</p>
        </div>
        
        <div class="student-info">
          <div><span>${lang === 'en' ? 'Student Name: ' : 'اسم الطالب: '}</span>${user.name}</div>
          <div><span>${lang === 'en' ? 'Email Address: ' : 'البريد الإلكتروني: '}</span>${user.email}</div>
          <div><span>${lang === 'en' ? 'Student ID: ' : 'رقم الطالب: '}</span>${user.id.substring(0, 8).toUpperCase()}</div>
          <div><span>${lang === 'en' ? 'Date Issued: ' : 'تاريخ الإصدار: '}</span>${new Date().toLocaleDateString()}</div>
        </div>

        ${yearsHtml}

        <div class="signature-block">
          <div>
            <p>${lang === 'en' ? 'Registrar Department' : 'إدارة شؤون الطلاب'}</p>
            <div class="signature"></div>
          </div>
          <div>
            <p>${lang === 'en' ? 'Dean of Academic Affairs' : 'عميد الشؤون الأكاديمية'}</p>
            <div class="signature"></div>
          </div>
        </div>

        <div class="footer-note">
          ${lang === 'en' 
            ? 'This document is an official academic transcript generated automatically by the Learning Management System.' 
            : 'هذه الوثيقة عبارة عن بيان درجات أكاديمي رسمي تم إنشاؤه تلقائياً بواسطة نظام إدارة التعلم.'}
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      return addToast('Name must be at least 2 characters long', 'error');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return addToast('Please enter a valid email address', 'error');
    }
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('email', email.trim().toLowerCase());
    formData.append('interests', interests.trim());
    updateProfileMutation.mutate(formData);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return addToast('File size must be less than 5MB', 'error');
    }

    const formData = new FormData();
    formData.append('profilePhoto', file);
    updateProfileMutation.mutate(formData);
  };

  const handleDeletePhoto = () => {
    if (confirm(lang === 'en' ? 'Are you sure you want to remove your profile photo?' : 'هل أنت متأكد من رغبتك في حذف صورتك الشخصية؟')) {
      deletePhotoMutation.mutate();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in text-xs font-semibold">
      {/* Header back link */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/${user.role.toLowerCase()}`}
          className="p-2.5 bg-beige-200 text-text-secondary hover:text-text-primary rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4 animate-flip-on-rtl" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-text-primary">{t('profile_title')}</h2>
          <p className="text-xs text-text-secondary">{t('profile_subtitle')}</p>
        </div>
      </div>

      {user.role === 'STUDENT' && (
        <div className="flex gap-2 border-b border-beige-200 pb-px overflow-x-auto whitespace-nowrap scrollbar-none">
          {[
            { id: 'info', label: lang === 'en' ? 'Profile Details' : 'بيانات الحساب', icon: User },
            { id: 'transcript', label: lang === 'en' ? 'Academic Transcript' : 'السجل الأكاديمي', icon: Award },
            { id: 'career', label: lang === 'en' ? 'Development Plan' : 'خطة التطوير الشخصية', icon: Sparkles },
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
      )}

      {activeTab === 'info' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-beige-200/80 shadow-premium space-y-8">
        {/* Avatar Area */}
        <div className="flex flex-col items-center sm:flex-row gap-6 pb-6 border-b border-beige-100">
          <div className="relative group">
            {user.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={user.name}
                className="w-28 h-28 rounded-2xl object-cover border-2 border-mint-500 shadow-soft"
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-mint-50 border border-mint-100 text-mint-500 font-extrabold text-3xl flex items-center justify-center shadow-soft">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Hover Actions overlay */}
            <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {user.profilePhoto && (
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="p-2 bg-white/20 text-white hover:bg-white/40 rounded-lg transition-colors"
                  title={lang === 'en' ? 'View full photo' : 'عرض الصورة كاملة'}
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
              <label
                className="p-2 bg-white/20 text-white hover:bg-white/40 rounded-lg cursor-pointer transition-colors"
                title={lang === 'en' ? 'Change photo' : 'تغيير الصورة'}
              >
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {user.profilePhoto && (
                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  className="p-2 bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 rounded-lg transition-colors"
                  title={lang === 'en' ? 'Delete photo' : 'حذف الصورة'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <h3 className="text-base font-bold text-text-primary">{user.name}</h3>
            <p className="text-xs text-text-secondary">{user.email}</p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
              <span className="px-2.5 py-0.5 bg-mint-50 border border-mint-100 text-mint-500 rounded-md text-[10px] font-bold uppercase tracking-wider">
                {user.role}
              </span>
            </div>
            <p className="text-[10px] text-text-secondary pt-1">
              {lang === 'en'
                ? '* Hover over the avatar frame to upload, preview, or delete your photo.'
                : '* ضع مؤشر الفأرة فوق إطار الصورة الشخصية للرفع أو المعاينة أو الحذف.'}
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSaveInfo} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase">{t('full_name')}</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-text-secondary animate-flip-icon-on-rtl" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-beige-50/50 border border-beige-200 rounded-xl text-xs font-semibold text-text-primary focus:border-mint-500 focus:ring-1 focus:ring-mint-500 outline-none transition-all rtl:pl-4 rtl:pr-10"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase">{t('email_address')}</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-text-secondary animate-flip-icon-on-rtl" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-beige-50/50 border border-beige-200 rounded-xl text-xs font-semibold text-text-primary focus:border-mint-500 focus:ring-1 focus:ring-mint-500 outline-none transition-all rtl:pl-4 rtl:pr-10"
                required
              />
            </div>
          </div>

          {user.role === 'STUDENT' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase">
                {lang === 'en' ? 'Interests / Career Focus' : 'الاهتمامات / التركيز المهني'}
              </label>
              <textarea
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                rows={3}
                placeholder={
                  lang === 'en'
                    ? "e.g., Web Development, Machine Learning, iOS apps, Cybersecurity..."
                    : "مثال: تطوير الويب، التعلم الآلي، تطبيقات آيفون، الأمن السيبراني..."
                }
                className="w-full px-4 py-3 bg-beige-50/50 border border-beige-200 rounded-xl text-xs font-semibold text-text-primary focus:border-mint-500 focus:ring-1 focus:ring-mint-500 outline-none transition-all"
              />
              <p className="text-[10px] text-text-secondary font-medium mt-1">
                {lang === 'en'
                  ? '* Interests are used to automatically generate your suggested Personal Development Plan.'
                  : '* تُستخدم الاهتمامات لإنشاء خطة التطوير الشخصية المقترحة لك تلقائياً.'}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-6 py-3 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft transition-all active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none flex items-center gap-1.5"
            >
              {updateProfileMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('save_changes')}
            </button>
          </div>
        </form>
      </div>
      )}

      {activeTab === 'transcript' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-beige-200/80 shadow-soft flex-wrap gap-4">
            <div>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                {lang === 'en' ? 'Official Academic Transcript' : 'بيان الدرجات الأكاديمي الرسمي'}
              </h3>
              <p className="text-[10px] text-text-secondary mt-0.5">
                {lang === 'en' ? 'View and download your official academic records and grade matrices.' : 'عرض وتحميل سجلاتك الأكاديمية الرسمية ونقاط الدرجات.'}
              </p>
              
              {/* Year Filtering Select Button */}
              {reportData && reportData.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[10px] font-bold text-text-secondary uppercase">
                    {lang === 'en' ? 'Select Academic Year:' : 'اختر العام الأكاديمي:'}
                  </span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="px-3 py-1.5 bg-beige-50 border border-beige-200 rounded-xl text-[10px] font-extrabold text-text-primary focus:outline-none focus:ring-1 focus:ring-mint-500 cursor-pointer shadow-soft"
                  >
                    <option value="all">{lang === 'en' ? 'All Registered Years' : 'جميع الأعوام المسجلة'}</option>
                    {Object.keys(coursesByYear)
                      .map(Number)
                      .sort((a, b) => b - a)
                      .map((y) => (
                        <option key={y} value={y}>
                          {lang === 'en' ? `Academic Year ${y}` : `العام الدراسي ${y}`}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
            {reportData && reportData.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadTranscript}
                className="flex items-center gap-1.5 px-4 py-2 bg-mint-500 hover:bg-mint-400 text-white rounded-xl text-xs font-bold shadow-soft transition-all active:scale-[0.98]"
              >
                <FileText className="w-4 h-4" />
                <span>{lang === 'en' ? 'Download PDF' : 'تحميل PDF'}</span>
              </button>
            )}
          </div>

          {isReportLoading ? (
            <div className="bg-white p-12 rounded-3xl border border-beige-200/80 shadow-premium flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-mint-500 animate-spin" />
            </div>
          ) : reportData.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-beige-200/80 shadow-premium text-center text-text-secondary">
              {lang === 'en' ? 'You are not enrolled in any courses yet.' : 'لم تقم بالتسجيل في أي مقررات بعد.'}
            </div>
          ) : (
            <div className="space-y-8">
              {Object.keys(coursesByYear)
                .map(Number)
                .sort((a, b) => b - a)
                .filter((y) => selectedYear === 'all' || y === selectedYear)
                .map((year) => {
                  const enrollments = coursesByYear[year];
                  return (
                  <div key={year} className="bg-white p-6 rounded-3xl border border-beige-200/80 shadow-premium space-y-4">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider border-b border-beige-100 pb-2 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-mint-500" /> {lang === 'en' ? `Academic Year ${year}` : `العام الدراسي ${year}`}
                    </h3>

                    <div className="space-y-4">
                      {enrollments.map((enr: any) => {
                        const course = enr.course;
                        const overall = calculateOverallCourseGrade(course.assignments, course.quizzes);
                        const presentCount = course.attendances.filter((att: any) => att.status === 'PRESENT').length;
                        const totalAtt = course.attendances.length;
                        const attendanceRate = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : null;

                        return (
                          <div key={enr.id} className="p-4 bg-beige-50/50 border border-beige-200 rounded-2xl space-y-3">
                            <div className="flex justify-between items-start flex-wrap gap-2">
                              <div>
                                <span className="text-[9px] font-black px-2 py-0.5 bg-mint-100 text-mint-500 rounded-md">
                                  {course.code}
                                </span>
                                <h4 className="font-extrabold text-xs text-text-primary mt-1">{course.title}</h4>
                                <span className="text-[10px] text-text-secondary leading-none">
                                  {lang === 'en' ? `Instructor: ${course.doctor?.name}` : `المحاضر: ${course.doctor?.name}`}
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="text-[9px] text-text-secondary block font-bold uppercase tracking-wider">
                                  {lang === 'en' ? 'Course Score' : 'مجموع الدرجات'}
                                </span>
                                <span className={`text-sm font-black ${
                                  overall !== null 
                                    ? overall >= 85 ? 'text-mint-500' : overall >= 60 ? 'text-indigo-500' : 'text-rose-500'
                                    : 'text-text-secondary'
                                }`}>
                                  {overall !== null ? `${overall}%` : 'N/A'}
                                </span>
                              </div>
                            </div>

                            {/* Details Accordion style */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-beige-100 text-[11px] font-medium text-text-primary">
                              {/* Assignments List */}
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">
                                  {lang === 'en' ? 'Assignments' : 'التكليفات'}
                                </span>
                                {course.assignments.length === 0 ? (
                                  <p className="text-[10px] text-text-secondary italic">No assignments.</p>
                                ) : (
                                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                                    {course.assignments.map((a: any) => {
                                      const sub = a.submissions?.[0];
                                      return (
                                        <div key={a.id} className="flex justify-between items-center text-[10px]">
                                          <span className="truncate max-w-[150px]">{a.title}</span>
                                          <span className="font-bold text-text-secondary">
                                            {sub ? `${sub.grade || 0}/${a.maxScore}` : 'Unsubmitted'}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Quizzes List */}
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">
                                  {lang === 'en' ? 'Quizzes' : 'الاختبارات'}
                                </span>
                                {course.quizzes.length === 0 ? (
                                  <p className="text-[10px] text-text-secondary italic">No quizzes.</p>
                                ) : (
                                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                                    {course.quizzes.map((q: any) => {
                                      const attempt = q.attempts?.[0];
                                      return (
                                        <div key={q.id} className="flex justify-between items-center text-[10px]">
                                          <span className="truncate max-w-[150px]">{q.title}</span>
                                          <span className="font-bold text-text-secondary">
                                            {attempt ? `${attempt.score || 0}%` : 'Unattempted'}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Additional metadata info */}
                            <div className="pt-2 border-t border-beige-100/50 flex justify-between items-center text-[9.5px] text-text-secondary">
                              <span>
                                {lang === 'en' ? 'Enrolled: ' : 'تاريخ التسجيل: '}
                                {new Date(enr.enrolledAt).toLocaleDateString()}
                              </span>
                              <span>
                                {lang === 'en' ? `Attendance: ` : `نسبة الحضور: `}
                                <strong className="text-text-primary">
                                  {attendanceRate !== null ? `${attendanceRate}% (${presentCount}/${totalAtt})` : 'N/A'}
                                </strong>
                              </span>
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'career' && (
        <div className="space-y-6 animate-fade-in">
          {(!user.interests || !user.interests.trim()) ? (
            <div className="bg-white p-8 rounded-3xl border border-beige-200/80 shadow-premium text-center text-text-secondary space-y-3">
              <p className="text-xs font-medium">
                {lang === 'en'
                  ? 'Please specify your tech interests or career goals in the "Profile Details" tab first to generate your custom Personal Development Plan.'
                  : 'يرجى تحديد اهتماماتك التقنية أو أهدافك المهنية في علامة تبويب "بيانات الحساب" أولاً لإنشاء خطة التطوير الشخصية المخصصة لك.'}
              </p>
              <button
                onClick={() => setActiveTab('info')}
                className="px-4 py-2 bg-mint-500 hover:bg-mint-400 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all"
              >
                {lang === 'en' ? 'Go to Profile Details' : 'اذهب إلى بيانات الحساب'}
              </button>
            </div>
          ) : (
            (() => {
              const plan = generateDevPlan(user.interests);
              return (
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-beige-200/80 shadow-premium space-y-6 text-text-primary">
                  <div className="border-b border-beige-100 pb-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-mint-500">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Suggested Development Pathway</span>
                    </div>
                    <h3 className="text-base font-black text-text-primary">{plan.pathTitle}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed font-medium">{plan.description}</p>
                  </div>

                  {/* Skills Section */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Recommended Skills to Master</h4>
                    <div className="flex flex-wrap gap-2">
                      {plan.skills.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-mint-50 text-mint-600 rounded-lg text-[10px] font-extrabold border border-mint-100">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Projects */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Suggested Practical Projects</h4>
                    <div className="space-y-2">
                      {plan.projects.map((proj, idx) => (
                        <div key={idx} className="p-3 bg-beige-50/50 rounded-xl border border-beige-200 flex items-start gap-2 text-xs font-semibold">
                          <CheckCircle className="w-4 h-4 text-mint-500 mt-0.5 flex-shrink-0" />
                          <span className="leading-relaxed">{proj}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* recommended internal courses */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Recommended Academy Curriculum Courses</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {plan.coursesList.map((course, idx) => (
                        <div key={idx} className="p-3 border border-beige-100 rounded-xl flex items-center justify-between text-xs font-extrabold bg-white">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center font-bold text-[10px]">
                              {idx + 1}
                            </div>
                            <span>{course}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* External Resources */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Top External References & Guides</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-semibold text-text-secondary">
                      {plan.resources.map((res, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 hover:text-mint-500 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5 text-beige-400" />
                          <span>{res}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              );
            })()
          )}
        </div>
      )}

      {/* Lightbox Portal */}
      {isLightboxOpen && user.profilePhoto && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative max-w-3xl w-full flex items-center justify-center">
              <img
                src={user.profilePhoto}
                alt={user.name}
                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
              />
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-[-40px] right-0 md:right-[-40px] p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors animate-flip-on-rtl"
                title={lang === 'en' ? 'Close overlay' : 'إغلاق المعاينة'}
              >
                <ArrowLeft className="w-5 h-5 rotate-90" />
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
