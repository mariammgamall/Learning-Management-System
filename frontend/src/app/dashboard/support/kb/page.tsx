'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../../../hooks/useTranslation';
import { useToastStore } from '../../../../hooks/useToastStore';
import { api } from '../../../../utils/api';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  X,
  FileText,
  Search,
  Loader2,
  Bookmark
} from 'lucide-react';

const CATEGORIES = [
  'Account',
  'Login & Security',
  'Courses',
  'Assignments',
  'Quizzes',
  'Certificates',
  'Attendance',
  'Technical Issues',
];

export default function SupportKBPage() {
  const { lang } = useTranslation();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch articles
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['kb', activeCategory],
    queryFn: async () => {
      const url = activeCategory ? `/kb?category=${activeCategory}` : '/kb';
      const response = await api.get(url);
      return response.data;
    },
  });

  // Delete article mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/kb/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb'] });
      addToast(lang === 'en' ? 'Article deleted successfully' : 'تم حذف المقالة بنجاح', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to delete article', 'error');
    },
  });

  const handleEditClick = (article: any) => {
    setEditingId(article.id);
    setTitle(article.title);
    setCategory(article.category);
    setDescription(article.description);
    setContent(article.content);
    setIsEditorOpen(true);
  };

  const handleCreateClick = () => {
    setEditingId(null);
    setTitle('');
    setCategory(CATEGORIES[0]);
    setDescription('');
    setContent('');
    setIsEditorOpen(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !content.trim()) {
      addToast(lang === 'en' ? 'Please fill all required fields' : 'يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        // Update
        await api.put(`/kb/${editingId}`, { title, category, description, content });
        addToast(lang === 'en' ? 'Article updated successfully!' : 'تم تحديث المقالة بنجاح!', 'success');
      } else {
        // Create
        await api.post('/kb', { title, category, description, content });
        addToast(lang === 'en' ? 'Article created successfully!' : 'تم إضافة المقالة بنجاح!', 'success');
      }

      setIsEditorOpen(false);
      queryClient.invalidateQueries({ queryKey: ['kb'] });
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to save article', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter local search list
  const filteredArticles = articles.filter((a: any) => {
    const term = searchQuery.toLowerCase();
    return a.title.toLowerCase().includes(term) || a.content.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-beige-200 dark:border-neutral-800 shadow-soft gap-4">
        <div>
          <h2 className="text-xl font-black text-text-primary dark:text-neutral-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-mint-500" />
            {lang === 'en' ? 'Knowledge Base Help Articles' : 'مقالات قاعدة المعرفة والمساعدة'}
          </h2>
          <p className="text-xs font-semibold text-text-secondary dark:text-neutral-400 mt-1">
            {lang === 'en' ? 'Create, edit and manage educational articles for student and instructor assistance.' : 'إضافة وتعديل مقالات تعليمية لمساعدة الطلاب والدكاترة.'}
          </p>
        </div>

        <button
          onClick={handleCreateClick}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft transition-transform hover:scale-103 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          {lang === 'en' ? 'Create Article' : 'إنشاء مقالة جديدة'}
        </button>
      </div>

      {/* Category selector slider */}
      <div className="flex gap-2 border-b border-beige-200 dark:border-neutral-800 pb-3 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveCategory('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeCategory === ''
              ? 'bg-mint-500 text-white'
              : 'text-text-secondary hover:bg-beige-100 dark:hover:bg-neutral-850'
          }`}
        >
          {lang === 'en' ? 'All Categories' : 'جميع الفئات'}
        </button>

        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-mint-500 text-white'
                : 'text-text-secondary hover:bg-beige-100 dark:hover:bg-neutral-850'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Input bar */}
      <div className="p-4 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl flex items-center gap-2">
        <Search className="w-4 h-4 text-text-secondary" />
        <input
          type="text"
          placeholder={lang === 'en' ? 'Search articles by keywords...' : 'ابحث في العناوين والكلمات الدلالية...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs font-semibold outline-none border-none dark:bg-transparent dark:text-neutral-100"
        />
      </div>

      {/* Grid listing */}
      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 text-mint-500 animate-spin" />
          <span className="text-[10px] text-text-secondary font-bold">
            {lang === 'en' ? 'Loading help articles...' : 'جاري تحميل مقالات المساعدة...'}
          </span>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="p-12 text-center text-text-secondary bg-white dark:bg-neutral-900 rounded-2xl border border-beige-200 dark:border-neutral-800">
          <FileText className="w-8 h-8 text-beige-300 mx-auto mb-2" />
          <p className="text-xs font-bold">{lang === 'en' ? 'No articles found in this category' : 'لا توجد مقالات مسجلة في هذه الفئة'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArticles.map((article: any) => (
            <div
              key={article.id}
              className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-4 hover:border-mint-200 dark:hover:border-neutral-700 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-3">
                  <span className="px-2 py-0.5 bg-beige-100 dark:bg-neutral-800 text-text-secondary dark:text-neutral-300 text-[8px] font-black uppercase rounded">
                    {article.category}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(article)}
                      className="p-1.5 text-text-secondary hover:text-mint-500 transition-colors"
                      title="Edit article"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(lang === 'en' ? 'Are you sure you want to delete this article?' : 'هل أنت متأكد من حذف هذه المقالة؟')) {
                          deleteMutation.mutate(article.id);
                        }
                      }}
                      className="p-1.5 text-text-secondary hover:text-rose-500 transition-colors"
                      title="Delete article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-text-primary dark:text-neutral-100">
                  {article.title}
                </h3>
                <p className="text-xs text-text-secondary dark:text-neutral-400 font-semibold line-clamp-3">
                  {article.description}
                </p>
              </div>

              <div className="border-t border-beige-50 dark:border-neutral-850 pt-3 mt-2 flex items-center justify-between text-[9px] text-text-secondary">
                <span className="flex items-center gap-1 font-bold">
                  <Bookmark className="w-3.5 h-3.5 text-mint-500" />
                  {lang === 'en' ? 'Last updated:' : 'تاريخ التحديث:'}
                </span>
                <span className="font-bold">
                  {new Date(article.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal Drawer */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[5px] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-premium border border-beige-200 dark:border-neutral-850 space-y-4 text-xs font-semibold animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-beige-100 dark:border-neutral-850 pb-2">
              <h3 className="text-sm font-bold text-text-primary dark:text-neutral-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-mint-500" />
                {editingId ? (lang === 'en' ? 'Edit Help Article' : 'تعديل المقالة') : (lang === 'en' ? 'New Help Article' : 'مقالة مساعدة جديدة')}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-text-secondary hover:text-text-primary dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-4">
              {/* Category */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-primary dark:text-neutral-300 block">
                  {lang === 'en' ? 'Category *' : 'الفئة *'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg outline-none focus:ring-1 focus:ring-mint-500 bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-primary dark:text-neutral-300 block">
                  {lang === 'en' ? 'Article Title *' : 'عنوان المقالة *'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg outline-none focus:ring-1 focus:ring-mint-500 bg-white dark:text-neutral-200"
                  placeholder={lang === 'en' ? 'e.g. How to recover login details' : 'مثال: كيفية استعادة اسم المستخدم'}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-primary dark:text-neutral-300 block">
                  {lang === 'en' ? 'Short Summary / Description *' : 'وصف مختصر *'}
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg outline-none focus:ring-1 focus:ring-mint-500 bg-white dark:text-neutral-200"
                  placeholder={lang === 'en' ? 'Provide a brief summary of what this article guides.' : 'اكتب وصفاً مختصراً جداً لمحتوى هذه الإرشادات.'}
                />
              </div>

              {/* Content */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-primary dark:text-neutral-300 block">
                  {lang === 'en' ? 'Article Body Content *' : 'محتوى المقالة التفصيلي *'}
                </label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg outline-none focus:ring-1 focus:ring-mint-500 bg-white dark:text-neutral-200"
                  placeholder={lang === 'en' ? 'Write full step-by-step guides here...' : 'اكتب تفاصيل الخطوات والإرشادات الكاملة...'}
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {lang === 'en' ? 'Saving Article...' : 'جاري الحفظ...'}
                  </>
                ) : (
                  lang === 'en' ? 'Save Article' : 'حفظ المقالة'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
