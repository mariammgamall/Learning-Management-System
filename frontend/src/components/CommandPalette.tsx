'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Layout, Book, Award, User, Languages, LogOut } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useToastStore } from '@/hooks/useToastStore';

export default function CommandPalette() {
  const router = useRouter();
  const { lang, setLang, t } = useTranslation();
  const { logout } = useAuthStore();
  const { addToast } = useToastStore();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const items = [
    { label: t('dashboard'), subtitle: 'Go to your home dashboard', href: '/dashboard/student', icon: Layout },
    { label: t('catalog'), subtitle: 'Browse available courses', href: '/dashboard/student/catalog', icon: Book },
    { label: t('courses'), subtitle: 'View your enrolled classes', href: '/dashboard/student/courses', icon: Award },
    { label: t('profile'), subtitle: 'Edit name, email, and photo', href: '/dashboard/profile', icon: User },
    {
      label: lang === 'en' ? 'Switch to Arabic (تغيير للعربية)' : 'Switch to English (تغيير للإنجليزية)',
      subtitle: 'Change interface language & layout',
      action: () => {
        setLang(lang === 'en' ? 'ar' : 'en');
        addToast('Language updated!', 'success');
      },
      icon: Languages,
    },
    {
      label: t('logout'),
      subtitle: 'End your session securely',
      action: () => {
        logout();
        addToast('Logged out successfully', 'success');
      },
      icon: LogOut,
    },
  ];

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    (item.subtitle && item.subtitle.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (item: typeof items[0]) => {
    setIsOpen(false);
    if (item.href) {
      router.push(item.href);
    } else if (item.action) {
      item.action();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-neutral-950/45 backdrop-blur-[4px] animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-white border border-beige-200 rounded-3xl shadow-premium overflow-hidden flex flex-col text-xs font-semibold"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search header bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-beige-100 bg-beige-50/50">
          <Search className="w-4 h-4 text-text-secondary/60" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={lang === 'en' ? 'Type a command or search...' : 'اكتب أمراً أو ابحث...'}
            className="flex-1 bg-transparent text-text-primary text-xs font-bold outline-none placeholder:text-text-secondary/50 placeholder:font-semibold"
          />
          <span className="px-2 py-0.5 bg-beige-200 border border-beige-300 text-text-secondary rounded-md text-[9px] font-black uppercase shadow-sm">
            ESC
          </span>
        </div>

        {/* Results list */}
        <div className="max-h-64 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
          {filtered.length === 0 ? (
            <p className="text-center py-6 text-text-secondary">No matching commands found</p>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition-all ${
                    isSelected
                      ? 'bg-mint-500 text-white shadow-soft'
                      : 'hover:bg-beige-50 text-text-primary'
                  }`}
                >
                  <div className={`p-2 rounded-xl flex-shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-beige-100 text-text-secondary'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold">{item.label}</h4>
                    {item.subtitle && (
                      <p className={`text-[10px] mt-0.5 font-medium leading-none ${isSelected ? 'text-white/70' : 'text-text-secondary/60'}`}>
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex justify-between items-center px-4 py-2 border-t border-beige-100 bg-beige-50/50 text-[9px] text-text-secondary/70 font-bold uppercase tracking-wider">
          <div className="flex gap-2">
            <span>↑↓ Navigate</span>
            <span>↵ Enter</span>
          </div>
          <span>Command Palette</span>
        </div>
      </div>
    </div>
  );
}
