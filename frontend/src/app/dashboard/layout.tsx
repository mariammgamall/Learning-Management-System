'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useToastStore } from '../../hooks/useToastStore';
import { useTranslation } from '../../hooks/useTranslation';
import CommandPalette from '../../components/CommandPalette';
import AIChatbot from '../../components/AIChatbot';
import { api } from '../../utils/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModalPortal from '../../components/ModalPortal';
import {
  GraduationCap,
  Users,
  BookOpen,
  LayoutDashboard,
  Bell,
  LogOut,
  Menu,
  X,
  Loader2,
  Check,
  Award,
  Video,
  FileText,
  HelpCircle,
  Sun,
  Moon,
  User,
  Compass,
  Mail,
  Briefcase,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang, setLang, t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const { isAuthenticated, user, isLoading, logout, checkAuth } = useAuthStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Help Centre Support States
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportFile, setSupportFile] = useState<File | null>(null);
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) {
      addToast(lang === 'en' ? 'Please fill all required fields' : 'يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }
    
    setIsSubmittingSupport(true);
    try {
      const formData = new FormData();
      formData.append('subject', supportSubject);
      formData.append('message', supportMessage);
      if (supportFile) {
        formData.append('attachment', supportFile);
      }
      
      await api.post('/emails/support', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      addToast(lang === 'en' ? 'Support ticket submitted successfully!' : 'تم إرسال تذكرة الدعم بنجاح!', 'success');
      setSupportSubject('');
      setSupportMessage('');
      setSupportFile(null);
      setIsSupportOpen(false);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to submit support request', 'error');
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      } else {
        setDarkMode(false);
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  // Authenticate session on load
  useEffect(() => {
    if (!isAuthenticated) {
      checkAuth();
    }
  }, [isAuthenticated, checkAuth]);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Fetch Notifications
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data;
    },
    enabled: isAuthenticated,
    refetchInterval: 15000, // Poll notifications every 15s
  });

  // Mark all notifications as read
  const markReadMutation = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      addToast('All notifications marked as read', 'success');
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  if (isLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-beige-50">
        <Loader2 className="w-10 h-10 text-mint-500 animate-spin" />
        <p className="mt-4 text-sm font-semibold text-text-primary">Securing connection...</p>
      </div>
    );
  }

  // Sidebar Links config based on role
  const getSidebarLinks = (role: string) => {
    const commonLinks = [
      { label: lang === 'en' ? 'Social Feed' : 'ساحة التفاعل', href: '/dashboard/feed', icon: Compass },
      { label: lang === 'en' ? 'Mailbox' : 'صندوق البريد', href: '/dashboard/mailbox', icon: Mail },
      { label: t('meetings'), href: '/dashboard/meetings', icon: Video },
      { label: t('profile'), href: '/dashboard/profile', icon: User },
      { label: lang === 'en' ? 'About LMS' : 'عن النظام', href: '/dashboard/about', icon: GraduationCap },
    ];

    switch (role) {
      case 'ADMIN':
        return [
          { label: t('dashboard'), href: '/dashboard/admin', icon: LayoutDashboard },
          { label: t('admin_users'), href: '/dashboard/admin/users', icon: Users },
          { label: t('admin_courses'), href: '/dashboard/admin/courses', icon: BookOpen },
          { label: lang === 'en' ? 'Internships' : 'فرص التدريب', href: '/dashboard/admin/internships', icon: Briefcase },
          ...commonLinks,
        ];
      case 'DOCTOR':
        return [
          { label: t('doctor_courses'), href: '/dashboard/doctor', icon: BookOpen },
          { label: t('doctor_lectures'), href: '/dashboard/doctor/lectures', icon: Video },
          ...commonLinks,
        ];
      case 'TA':
        return [
          { label: t('dashboard'), href: '/dashboard/ta', icon: LayoutDashboard },
          { label: t('courses'), href: '/dashboard/ta/courses', icon: BookOpen },
          ...commonLinks,
        ];
      case 'STUDENT':
        return [
          { label: t('dashboard'), href: '/dashboard/student', icon: LayoutDashboard },
          { label: lang === 'en' ? 'My Workspace' : 'مساحة العمل الخاصة بي', href: '/dashboard/student/workspace', icon: Briefcase },
          { label: t('catalog'), href: '/dashboard/student/catalog', icon: BookOpen },
          { label: t('courses'), href: '/dashboard/student/courses', icon: Award },
          ...commonLinks,
        ];
      case 'SUPPORT':
        return [
          { label: lang === 'en' ? 'Support Dashboard' : 'لوحة تحكم الدعم', href: '/dashboard/support', icon: LayoutDashboard },
          { label: lang === 'en' ? 'Tickets Manager' : 'إدارة التذاكر', href: '/dashboard/support/tickets', icon: FileText },
          { label: lang === 'en' ? 'Knowledge Base' : 'قاعدة المعرفة', href: '/dashboard/support/kb', icon: BookOpen },
          { label: lang === 'en' ? 'Student Lookup' : 'البحث عن الطلاب', href: '/dashboard/support/students', icon: Users },
          { label: lang === 'en' ? 'Reports & Analytics' : 'التقارير والتحليلات', href: '/dashboard/support/reports', icon: Award },
          { label: lang === 'en' ? 'Profile Settings' : 'إعدادات الحساب', href: '/dashboard/support/settings', icon: User },
        ];
      default:
        return [];
    }
  };

  const links = getSidebarLinks(user.role);

  const handleLogout = async () => {
    await logout();
    addToast('Logged out successfully', 'success');
  };

  const isMeetingPage = pathname.includes('/meetings/');

  if (isMeetingPage) {
    return (
      <div className="flex min-h-screen bg-beige-50">
        <main className="flex-1 w-full min-h-screen relative z-30">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-beige-50">
      <CommandPalette />
      <AIChatbot />
      
      {/* 1. Left Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden lg:flex flex-col w-64 bg-beige-200 border-r border-beige-300">
        {/* Brand */}
        <div className="flex items-center gap-2 p-6 border-b border-beige-300">
          <div className="flex items-center justify-center w-10 h-10 bg-mint-500 text-white rounded-xl shadow-soft">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary leading-tight">LMS</h2>
            <span className="text-[10px] font-bold text-mint-500 tracking-wider">PORTAL CONTROL</span>
          </div>
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                  isActive
                    ? 'bg-mint-500 text-white shadow-soft'
                    : 'text-text-secondary hover:bg-beige-300 hover:text-text-primary'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-beige-300 bg-beige-300/40">
          <div className="flex items-center gap-3">
            {user.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={user.name}
                className="w-10 h-10 rounded-xl object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-10 h-10 bg-mint-100 text-mint-500 rounded-xl font-bold">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-text-primary truncate">{user.name}</p>
              <p className="text-[10px] font-semibold text-text-secondary truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-text-secondary hover:text-rose-500 rounded-lg hover:bg-beige-300 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Body Shell */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0 relative z-30">
        
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 md:px-8 bg-white/80 backdrop-blur-md border-b border-beige-200">
          
          {/* Left: Mobile Sidebar Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-beige-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Page Role Title */}
            <div>
              <span className="text-[10px] font-extrabold text-mint-500 tracking-widest block uppercase">
                {user.role} workspace
              </span>
              <h1 className="text-sm md:text-base font-bold text-text-primary">Welcome, {user.name}</h1>
            </div>
          </div>

          {/* Right: Notifications & Settings */}
          <div className="flex items-center gap-3">
            
            {/* Language Switcher Toggle Button */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="px-2.5 py-1.5 bg-beige-100 hover:bg-beige-200 text-text-secondary hover:text-text-primary rounded-xl transition-colors font-sans text-[10px] font-black tracking-wider uppercase border border-beige-200"
              title="Toggle Language / تغيير اللغة"
            >
              {lang === 'en' ? 'العربية' : 'English'}
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-beige-100 transition-colors"
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Help Centre Support Button */}
            <button
              onClick={() => setIsSupportOpen(true)}
              className="p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-beige-100 transition-colors"
              title={lang === 'en' ? 'Help Centre Support' : 'مركز الدعم والمساعدة'}
            >
              <HelpCircle className="w-5 h-5 text-mint-500 hover:scale-110 transition-transform" />
            </button>
            
            {/* Notification Ring bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-beige-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Overlay Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-premium border border-beige-200 py-3 z-50 animate-fade-in">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-beige-100">
                    <span className="text-xs font-bold text-text-primary">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markReadMutation.mutate()}
                        className="text-[10px] font-bold text-mint-500 hover:text-mint-400 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <p className="text-center text-xs text-text-secondary py-6">No notifications yet</p>
                    ) : (
                      notifications.map((n: any) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 text-xs leading-relaxed border-b border-beige-50 ${
                            !n.isRead ? 'bg-mint-50/50 font-medium' : 'text-text-secondary'
                          }`}
                        >
                          <p>{n.message}</p>
                          <span className="text-[9px] text-text-secondary/60 block mt-1">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout button (Mobile view helper) */}
            <button
              onClick={handleLogout}
              className="lg:hidden p-2 text-text-secondary hover:text-rose-500 rounded-xl hover:bg-beige-100 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Dynamic Inner Page Dashboard View */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto animate-fade-in">
          {children}
        </main>
      </div>

      {/* 3. Mobile Sidebar Drawer Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/40 backdrop-blur-[5px]">
          <div className="relative flex flex-col w-64 max-w-xs bg-beige-200 p-6 animate-fade-in">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 text-text-secondary hover:text-text-primary rounded-xl"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 mb-8 mt-2">
              <div className="flex items-center justify-center w-8 h-8 bg-mint-500 text-white rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-xs font-bold text-text-primary">LMS</h2>
            </div>
            <nav className="flex-1 space-y-2">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                      isActive
                        ? 'bg-mint-500 text-white shadow-soft'
                        : 'text-text-secondary hover:bg-beige-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-beige-300 pt-4 flex items-center gap-3">
              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.name}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-8 h-8 bg-mint-100 text-mint-500 rounded-lg font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-text-primary truncate">{user.name}</p>
                <p className="text-[9px] text-text-secondary truncate">{user.email}</p>
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}
      {/* Help Centre Support Modal — rendered via Portal to cover entire viewport */}
      <ModalPortal>
      {isSupportOpen && (
        <div className="fixed inset-0 z-[9999] bg-neutral-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-premium border border-beige-200 dark:border-neutral-800 space-y-4 text-xs font-semibold animate-scale-up">
            <div className="flex justify-between items-center border-b border-beige-100 dark:border-neutral-850 pb-2">
              <h3 className="text-sm font-bold text-text-primary dark:text-neutral-100 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-mint-500" />
                {lang === 'en' ? 'LMS Help Centre Support' : 'مركز الدعم والمساعدة LMS'}
              </h3>
              <button 
                onClick={() => setIsSupportOpen(false)} 
                className="text-text-secondary hover:text-text-primary dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSupportSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-primary dark:text-neutral-300 block">
                  {lang === 'en' ? 'Subject *' : 'الموضوع *'}
                </label>
                <input
                  type="text"
                  required
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg outline-none focus:ring-1 focus:ring-mint-500 bg-white dark:bg-neutral-900 dark:text-neutral-200 font-semibold"
                  placeholder={lang === 'en' ? 'e.g. Cannot submit assignment' : 'مثال: لا يمكنني رفع الواجب'}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-primary dark:text-neutral-300 block">
                  {lang === 'en' ? 'Description / Message *' : 'وصف المشكلة / الرسالة *'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg outline-none focus:ring-1 focus:ring-mint-500 bg-white dark:bg-neutral-900 dark:text-neutral-200 font-semibold"
                  placeholder={lang === 'en' ? 'Provide details about the issue...' : 'اكتب تفاصيل المشكلة التي تواجهها...'}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-primary dark:text-neutral-300 block">
                  {lang === 'en' ? 'Attach Screenshot (Optional)' : 'إرفاق لقطة شاشة (اختياري)'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setSupportFile(e.target.files[0]);
                    } else {
                      setSupportFile(null);
                    }
                  }}
                  className="w-full text-xs text-text-secondary file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-beige-100 dark:file:bg-neutral-800 file:text-text-primary dark:file:text-neutral-200 hover:file:bg-beige-200 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingSupport}
                className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft flex items-center justify-center gap-2"
              >
                {isSubmittingSupport ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {lang === 'en' ? 'Sending Ticket...' : 'جاري الإرسال...'}
                  </>
                ) : (
                  lang === 'en' ? 'Send Ticket' : 'إرسال تذكرة الدعم'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
      </ModalPortal>
    </div>
  );
}
