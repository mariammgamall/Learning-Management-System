'use client';

import React, { useState } from 'react';
import { useAuthStore } from '../../../../hooks/useAuthStore';
import { useToastStore } from '../../../../hooks/useToastStore';
import { useTranslation } from '../../../../hooks/useTranslation';
import { api } from '../../../../utils/api';
import { User, Mail, Shield, Bell, Globe, Sun, Moon, Loader2 } from 'lucide-react';

export default function SupportSettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { addToast } = useToastStore();
  const { lang, setLang } = useTranslation();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Preference switches
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [desktopAlerts, setDesktopAlerts] = useState(true);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      addToast(lang === 'en' ? 'Name and Email are required' : 'الاسم والبريد الإلكتروني مطلوبان', 'error');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      if (profilePhoto) {
        formData.append('profilePhoto', profilePhoto);
      }

      const response = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      updateUser(response.data.user);
      addToast(lang === 'en' ? 'Profile updated successfully!' : 'تم تحديث الملف الشخصي بنجاح!', 'success');
      setProfilePhoto(null);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast(lang === 'en' ? 'Please fill all password fields' : 'يرجى ملء جميع حقول كلمة المرور', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast(lang === 'en' ? 'New passwords do not match' : 'كلمات المرور الجديدة غير متطابقة', 'error');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      addToast(lang === 'en' ? 'Password changed successfully!' : 'تم تغيير كلمة المرور بنجاح!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-black text-text-primary dark:text-neutral-100 flex items-center gap-2">
          <Shield className="w-6 h-6 text-mint-500" />
          {lang === 'en' ? 'Support Portal Settings' : 'إعدادات بوابة الدعم'}
        </h2>
        <p className="text-xs font-semibold text-text-secondary dark:text-neutral-400 mt-1">
          {lang === 'en' ? 'Manage your credentials, preferences, and notifications settings.' : 'إدارة بيانات الاعتماد والتفضيلات والتحذيرات.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Account Settings */}
        <div className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-text-primary dark:text-neutral-100 flex items-center gap-2 border-b border-beige-100 dark:border-neutral-850 pb-2">
            <User className="w-4 h-4 text-mint-500" />
            {lang === 'en' ? 'Agent Profile Info' : 'بيانات الوكيل'}
          </h3>

          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs font-semibold">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-primary dark:text-neutral-300 block">
                {lang === 'en' ? 'Full Name *' : 'الاسم الكامل *'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg outline-none focus:ring-1 focus:ring-mint-500 bg-white dark:text-neutral-200"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-primary dark:text-neutral-300 block">
                {lang === 'en' ? 'Email Address *' : 'البريد الإلكتروني *'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg outline-none focus:ring-1 focus:ring-mint-500 bg-white dark:text-neutral-200"
              />
            </div>

            {/* Profile Photo */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-primary dark:text-neutral-300 block">
                {lang === 'en' ? 'Upload Avatar' : 'تغيير الصورة الشخصية'}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setProfilePhoto(e.target.files[0]);
                  }
                }}
                className="w-full text-xs text-text-secondary cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-beige-100 dark:file:bg-neutral-800 file:text-text-primary dark:file:text-neutral-200 hover:file:bg-beige-200"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft flex items-center justify-center gap-2 transition-transform hover:scale-102"
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {lang === 'en' ? 'Saving Changes...' : 'جاري حفظ التغييرات...'}
                </>
              ) : (
                lang === 'en' ? 'Save Profile' : 'حفظ الملف الشخصي'
              )}
            </button>
          </form>
        </div>

        {/* Right Card: Security Settings */}
        <div className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-text-primary dark:text-neutral-100 flex items-center gap-2 border-b border-beige-100 dark:border-neutral-850 pb-2">
            <Mail className="w-4 h-4 text-mint-500" />
            {lang === 'en' ? 'Update Credentials' : 'تحديث كلمة المرور'}
          </h3>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs font-semibold">
            {/* Current Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-primary dark:text-neutral-300 block">
                {lang === 'en' ? 'Current Password *' : 'كلمة المرور الحالية *'}
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg outline-none focus:ring-1 focus:ring-mint-500 bg-white dark:text-neutral-200"
              />
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-primary dark:text-neutral-300 block">
                {lang === 'en' ? 'New Password *' : 'كلمة المرور الجديدة *'}
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg outline-none focus:ring-1 focus:ring-mint-500 bg-white dark:text-neutral-200"
              />
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-primary dark:text-neutral-300 block">
                {lang === 'en' ? 'Confirm New Password *' : 'تأكيد كلمة المرور الجديدة *'}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg outline-none focus:ring-1 focus:ring-mint-500 bg-white dark:text-neutral-200"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft flex items-center justify-center gap-2 transition-transform hover:scale-102"
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {lang === 'en' ? 'Updating Password...' : 'جاري التحديث...'}
                </>
              ) : (
                lang === 'en' ? 'Update Password' : 'تحديث كلمة المرور'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* System Preferences Card */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-4">
        <h3 className="text-sm font-bold text-text-primary dark:text-neutral-100 flex items-center gap-2 border-b border-beige-100 dark:border-neutral-850 pb-2">
          <Bell className="w-4 h-4 text-mint-500" />
          {lang === 'en' ? 'Portal Alert Preferences' : 'تفضيلات التنبيهات والبوابة'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-text-primary dark:text-neutral-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-beige-50/50 dark:bg-neutral-850 rounded-xl">
              <div>
                <p className="font-bold">{lang === 'en' ? 'Email Notifications' : 'التنبيهات البريدية'}</p>
                <p className="text-[10px] text-text-secondary">{lang === 'en' ? 'Receive copy of incoming support tickets' : 'استلام نسخة بريدية من تذاكر الدعم الواردة'}</p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-4 h-4 text-mint-500 border-beige-200 rounded outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-beige-50/50 dark:bg-neutral-850 rounded-xl">
              <div>
                <p className="font-bold">{lang === 'en' ? 'Desktop Alerts' : 'تنبيهات سطح المكتب'}</p>
                <p className="text-[10px] text-text-secondary">{lang === 'en' ? 'Enable real-time push alerts' : 'تفعيل التنبيهات اللحظية المنبثقة'}</p>
              </div>
              <input
                type="checkbox"
                checked={desktopAlerts}
                onChange={(e) => setDesktopAlerts(e.target.checked)}
                className="w-4 h-4 text-mint-500 border-beige-200 rounded outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-beige-50/50 dark:bg-neutral-850 rounded-xl">
              <div>
                <p className="font-bold flex items-center gap-1">
                  <Globe className="w-4 h-4 text-mint-500" />
                  {lang === 'en' ? 'Interface Language' : 'لغة الواجهة'}
                </p>
                <p className="text-[10px] text-text-secondary">{lang === 'en' ? 'Select default language' : 'اختر لغة النظام الافتراضية'}</p>
              </div>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as any)}
                className="px-2.5 py-1 bg-white dark:bg-neutral-800 border border-beige-200 rounded-lg outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
