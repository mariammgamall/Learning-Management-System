'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useToastStore } from '@/hooks/useToastStore';
import { api } from '@/utils/api';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Camera, Trash2, Eye, ArrowLeft, User, Mail, Shield, Calendar } from 'lucide-react';
import Link from 'next/link';
import ModalPortal from '@/components/ModalPortal';
import { useTranslation } from '@/hooks/useTranslation';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { addToast } = useToastStore();
  const { t, lang } = useTranslation();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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
