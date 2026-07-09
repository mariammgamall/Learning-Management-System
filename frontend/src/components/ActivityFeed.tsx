'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useToastStore } from '@/hooks/useToastStore';
import { useTranslation } from '@/hooks/useTranslation';
import {
  ThumbsUp,
  MessageCircle,
  Send,
  Loader2,
  Image as ImageIcon,
  Calendar,
  Compass,
  CornerDownRight,
  MoreHorizontal,
  Share2,
  X,
  Video as VideoIcon,
  Bookmark,
  Repeat,
  Pencil,
  Trash2,
  User,
  Languages,
} from 'lucide-react';

interface Author {
  id: string;
  name: string;
  role: string;
  profilePhoto: string | null;
}

interface Reply {
  id: string;
  content: string;
  createdAt: string;
  user: Author;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: Author;
  replies: Reply[];
}

interface PostMedia {
  id: string;
  url: string;
  type: 'PHOTO' | 'VIDEO';
}

interface Post {
  id: string;
  content: string;
  imageUrl?: string | null;
  eventTitle?: string | null;
  eventDate?: string | null;
  createdAt: string;
  author: Author;
  likes: { id: string }[];
  comments: Comment[];
  media?: PostMedia[];
  repostOfId?: string | null;
  repostOf?: Post | null;
  savedBy?: { id: string }[];
}

export default function ActivityFeed() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { lang } = useTranslation();
  const queryClient = useQueryClient();

  const [postContent, setPostContent] = useState('');
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [replyInputs, setReplyInputs] = useState<{ [commentId: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  // Media upload and Event state
  const [selectedMedia, setSelectedMedia] = useState<{ file: File; type: 'PHOTO' | 'VIDEO'; previewUrl: string }[]>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [showEventInputs, setShowEventInputs] = useState(false);

  // Saved Posts and Reposts active tabs
  const [activeFeedTab, setActiveFeedTab] = useState<'all' | 'saved' | 'reposts' | 'my-posts'>('all');
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);

  // Edit post and Quote repost states
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [repostModalPost, setRepostModalPost] = useState<Post | null>(null);
  const [repostCommentText, setRepostCommentText] = useState('');

  // Translation states
  const [translatedPosts, setTranslatedPosts] = useState<{ [postId: string]: string }>({});
  const [translatingPostId, setTranslatingPostId] = useState<string | null>(null);

  // Fetch Feed
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['feedPosts'],
    queryFn: async () => {
      const response = await api.get('/posts');
      return response.data;
    },
  });

  const filteredPosts = posts.filter((post) => {
    if (activeFeedTab === 'saved') {
      return post.savedBy?.some((u) => u.id === user?.id);
    }
    if (activeFeedTab === 'reposts') {
      return post.repostOfId !== null && post.author.id === user?.id;
    }
    if (activeFeedTab === 'my-posts') {
      return post.author.id === user?.id;
    }
    return true; // 'all'
  });

  const handleTranslate = async (postId: string, text: string) => {
    if (!text || !text.trim()) return;
    setTranslatingPostId(postId);
    try {
      const normalizedText = text.trim().replace(/\r\n/g, '\n');
      
      // Look up static translations first (for the 20 seed posts)
      const staticTranslation = SEED_POSTS_TRANSLATIONS[normalizedText];
      if (staticTranslation) {
        setTranslatedPosts((prev) => ({
          ...prev,
          [postId]: staticTranslation,
        }));
        return;
      }

      const isArabic = /[\u0600-\u06FF]/.test(text);
      const langpair = isArabic ? 'ar|en' : 'en|ar';
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`);
      const data = await response.json();
      let translatedText = data?.responseData?.translatedText;
      
      if (translatedText) {
        // Correct potential translation issue where "experiences" or "experience" turns into "سفر" in Arabic
        if (text.toLowerCase().includes('experience') && /سفر|السفر|أسفار/.test(translatedText)) {
          translatedText = translatedText
            .replace(/\bالسفر\b/g, 'التجارب')
            .replace(/\bسفر\b/g, 'تجارب')
            .replace(/\bأسفار\b/g, 'تجارب');
        }
        
        setTranslatedPosts((prev) => ({
          ...prev,
          [postId]: translatedText,
        }));
      } else {
        addToast(lang === 'en' ? 'Failed to translate' : 'فشلت الترجمة', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast(lang === 'en' ? 'Failed to translate' : 'فشلت الترجمة', 'error');
    } finally {
      setTranslatingPostId(null);
    }
  };

  const handleShowOriginal = (postId: string) => {
    setTranslatedPosts((prev) => {
      const updated = { ...prev };
      delete updated[postId];
      return updated;
    });
  };

  const renderPostContent = (postId: string, content: string, isQuote: boolean = false) => {
    if (!content) return null;
    const isTranslated = !!translatedPosts[postId];
    const isTranslating = translatingPostId === postId;
    const displayText = isTranslated ? translatedPosts[postId] : content;
    const isArabic = /[\u0600-\u06FF]/.test(content);

    return (
      <div className="space-y-1 text-left">
        <p className={`text-xs ${isQuote ? 'font-semibold mb-2' : 'font-medium'} text-text-primary leading-relaxed whitespace-pre-line`}>
          {displayText}
        </p>
        
        {/* Translation action */}
        <div className="flex items-center gap-1.5 mt-1 select-none">
          {isTranslating ? (
            <span className="text-[10px] text-text-secondary flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin text-mint-500" />
              <span>{lang === 'en' ? 'Translating...' : 'جاري الترجمة...'}</span>
            </span>
          ) : isTranslated ? (
            <button
              onClick={() => handleShowOriginal(postId)}
              className="text-mint-600 hover:text-mint-500 text-[10px] font-bold flex items-center gap-1 transition-all"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Show Original' : 'عرض الأصلي'}</span>
            </button>
          ) : (
            <button
              onClick={() => handleTranslate(postId, content)}
              className="text-text-secondary hover:text-mint-500 text-[10px] font-bold flex items-center gap-1 transition-all"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>
                {isArabic
                  ? (lang === 'en' ? 'Translate to English' : 'ترجم إلى الإنجليزية')
                  : (lang === 'en' ? 'Translate to Arabic' : 'ترجم إلى العربية')}
              </span>
            </button>
          )}
        </div>
      </div>
    );
  };

  // Create Post Mutation
  const createPostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      setPostContent('');
      selectedMedia.forEach((mediaItem) => {
        URL.revokeObjectURL(mediaItem.previewUrl);
      });
      setSelectedMedia([]);
      setEventTitle('');
      setEventDate('');
      setShowEventInputs(false);
      queryClient.invalidateQueries({ queryKey: ['feedPosts'] });
      addToast(lang === 'en' ? 'Post shared successfully!' : 'تم نشر مشاركتك بنجاح!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to create post', 'error');
    },
  });

  // Toggle Save Post Mutation
  const toggleSaveMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.post(`/posts/${postId}/save`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['feedPosts'] });
      addToast(
        data.saved
          ? (lang === 'en' ? 'Post saved to bookmarks!' : 'تم حفظ المنشور في العلامات المرجعية!')
          : (lang === 'en' ? 'Post unsaved!' : 'تم إلغاء حفظ المنشور!'),
        'success'
      );
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to save post', 'error');
    },
  });

  // Repost Mutation
  const repostMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content?: string }) => {
      const response = await api.post(`/posts/${postId}/repost`, { content });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['feedPosts'] });
      setRepostModalPost(null);
      setRepostCommentText('');
      addToast(
        data.reposted
          ? (lang === 'en' ? 'Reposted successfully!' : 'تم إعادة النشر بنجاح!')
          : (lang === 'en' ? 'Repost removed!' : 'تم إزالة إعادة النشر!'),
        'success'
      );
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to repost', 'error');
    },
  });

  // Edit Post Mutation
  const editPostMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const response = await api.put(`/posts/${postId}`, { content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedPosts'] });
      setEditingPostId(null);
      setEditContent('');
      addToast(lang === 'en' ? 'Post updated successfully!' : 'تم تحديث المنشور بنجاح!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to update post', 'error');
    },
  });

  // Delete Post Mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.delete(`/posts/${postId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedPosts'] });
      addToast(lang === 'en' ? 'Post deleted successfully!' : 'تم حذف المنشور بنجاح!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to delete post', 'error');
    },
  });

  // Toggle Like Mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.post(`/posts/${postId}/like`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedPosts'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Action failed', 'error');
    },
  });

  // Create Comment Mutation
  const commentMutation = useMutation({
    mutationFn: async ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) => {
      const response = await api.post(`/posts/${postId}/comment`, { content, parentId });
      return response.data;
    },
    onSuccess: (_, variables) => {
      if (variables.parentId) {
        setReplyInputs((prev) => ({ ...prev, [variables.parentId!]: '' }));
        setActiveReplyId(null);
      } else {
        setCommentInputs((prev) => ({ ...prev, [variables.postId]: '' }));
      }
      queryClient.invalidateQueries({ queryKey: ['feedPosts'] });
      addToast(lang === 'en' ? 'Comment added!' : 'تم إضافة التعليق!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to add comment', 'error');
    },
  });

  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now.getTime() - past.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffSec < 60) return lang === 'en' ? 'Just now' : 'الآن';
    if (diffMin < 60) return lang === 'en' ? `${diffMin}m ago` : `منذ ${diffMin} دقيقة`;
    if (diffHrs < 24) return lang === 'en' ? `${diffHrs}h ago` : `منذ ${diffHrs} ساعة`;
    return lang === 'en' ? `${diffDays}d ago` : `منذ ${diffDays} يوم`;
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && selectedMedia.length === 0 && !eventTitle) return;

    const formData = new FormData();
    formData.append('content', postContent.trim());
    if (selectedMedia.length > 0) {
      selectedMedia.forEach((item) => {
        formData.append('media', item.file);
      });
    }
    if (showEventInputs && eventTitle) {
      formData.append('eventTitle', eventTitle.trim());
      if (eventDate) {
        formData.append('eventDate', eventDate);
      }
    }
    createPostMutation.mutate(formData);
  };

  const handleLike = (postId: string) => {
    toggleLikeMutation.mutate(postId);
  };

  const handleCommentSubmit = (postId: string) => {
    const content = commentInputs[postId] || '';
    if (!content.trim()) return;
    commentMutation.mutate({ postId, content });
  };

  const handleReplySubmit = (postId: string, parentId: string) => {
    const content = replyInputs[parentId] || '';
    if (!content.trim()) return;
    commentMutation.mutate({ postId, content, parentId });
  };

  const handleShare = (postId: string) => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/dashboard/feed?post=${postId}`;
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          addToast(lang === 'en' ? 'Post link copied to clipboard!' : 'تم نسخ رابط المنشور إلى الحافظة!', 'success');
        })
        .catch(() => {
          addToast('Failed to copy link', 'error');
        });
    }
  };

  return (
    <div className="space-y-6">
      {/* Feed Tabs Selector */}
      <div className="flex gap-2 border-b border-beige-200 pb-px mb-4">
        {[
          { id: 'all', label: lang === 'en' ? 'All Feed' : 'الرئيسية', icon: Compass },
          { id: 'my-posts', label: lang === 'en' ? 'My Posts' : 'منشوراتي', icon: User },
          { id: 'saved', label: lang === 'en' ? 'Bookmarks' : 'المنشورات المحفوظة', icon: Bookmark },
          { id: 'reposts', label: lang === 'en' ? 'My Reposts' : 'إعادات النشر الخاصة بي', icon: Repeat },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFeedTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveFeedTab(tab.id as any);
                setActiveMenuPostId(null);
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 text-xs font-bold transition-all outline-none ${
                isActive
                  ? 'border-b-mint-500 text-mint-500'
                  : 'border-b-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Create Post Card */}
      {activeFeedTab === 'all' && (
        <div className="bg-white p-5 rounded-3xl border border-beige-200/80 shadow-soft">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="flex gap-3">
              {/* User Initials Circle */}
              <div className="w-10 h-10 rounded-full bg-mint-100 text-mint-600 font-extrabold flex items-center justify-center text-sm border border-mint-200 flex-shrink-0">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder={lang === 'en' ? "Share an academic achievement, study update or query..." : "شارك إنجازاً أكاديمياً، تحديث دراسي أو استفساراً..."}
                rows={2}
                className="w-full px-4 py-3 bg-beige-50/50 border border-beige-200 rounded-2xl text-xs font-semibold text-text-primary focus:border-mint-500 focus:ring-1 focus:ring-mint-500 outline-none transition-all resize-none"
              />
            </div>

            {/* Multiple Media Upload Preview Grid */}
            {selectedMedia.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-2 border border-beige-200 p-3 rounded-2xl bg-beige-50/50 max-h-80 overflow-y-auto">
                {selectedMedia.map((mediaItem, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-beige-200 bg-white h-24 flex items-center justify-center">
                    {mediaItem.type === 'VIDEO' ? (
                      <video src={mediaItem.previewUrl} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={mediaItem.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(mediaItem.previewUrl);
                        setSelectedMedia((prev) => prev.filter((_, i) => i !== idx));
                      }}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/50 text-[7px] text-white rounded font-bold uppercase tracking-wider">
                      {mediaItem.type}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Event Scheduler Form */}
            {showEventInputs && (
              <div className="bg-beige-50/50 p-4 border border-beige-200 rounded-2xl space-y-3 relative my-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEventInputs(false);
                    setEventTitle('');
                    setEventDate('');
                  }}
                  className="absolute top-2 right-2 text-text-secondary hover:text-rose-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                  {lang === 'en' ? 'Create Event' : 'إنشاء حدث'}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-text-primary block">
                      {lang === 'en' ? 'Event Title' : 'عنوان الحدث'}
                    </label>
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder={lang === 'en' ? 'Seminar, presentation, meeting...' : 'ندوة، عرض تقديمي، اجتماع...'}
                      className="w-full px-3 py-2 border border-beige-200 rounded-xl outline-none focus:ring-1 focus:ring-mint-500 bg-white font-semibold text-text-primary"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-text-primary block">
                      {lang === 'en' ? 'Event Date & Time' : 'تاريخ ووقت الحدث'}
                    </label>
                    <input
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3 py-2 border border-beige-200 rounded-xl outline-none focus:ring-1 focus:ring-mint-500 bg-white font-semibold text-text-primary"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-beige-100/60">
              <div className="flex gap-2">
                <input
                  type="file"
                  id="post-photo-input"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files) {
                      const newMedia = Array.from(files).map((file) => ({
                        file,
                        type: 'PHOTO' as const,
                        previewUrl: URL.createObjectURL(file),
                      }));
                      setSelectedMedia((prev) => [...prev, ...newMedia]);
                    }
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                    selectedMedia.some(m => m.type === 'PHOTO') ? 'text-indigo-500 bg-indigo-50/50' : 'text-text-secondary hover:bg-beige-50'
                  }`}
                  onClick={() => document.getElementById('post-photo-input')?.click()}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{lang === 'en' ? 'Photo' : 'صورة'}</span>
                </button>

                <input
                  type="file"
                  id="post-video-input"
                  accept="video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files) {
                      const newMedia = Array.from(files).map((file) => ({
                        file,
                        type: 'VIDEO' as const,
                        previewUrl: URL.createObjectURL(file),
                      }));
                      setSelectedMedia((prev) => [...prev, ...newMedia]);
                    }
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                    selectedMedia.some(m => m.type === 'VIDEO') ? 'text-purple-500 bg-purple-50/50' : 'text-text-secondary hover:bg-beige-50'
                  }`}
                  onClick={() => document.getElementById('post-video-input')?.click()}
                >
                  <VideoIcon className="w-3.5 h-3.5 text-purple-500" />
                  <span>{lang === 'en' ? 'Video' : 'فيديو'}</span>
                </button>

                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                    showEventInputs ? 'text-amber-500 bg-amber-50/50' : 'text-text-secondary hover:bg-beige-50'
                  }`}
                  onClick={() => setShowEventInputs(!showEventInputs)}
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>{lang === 'en' ? 'Event' : 'حدث'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={createPostMutation.isPending || (!postContent.trim() && selectedMedia.length === 0 && !eventTitle)}
                className="px-5 py-2 bg-mint-500 hover:bg-mint-400 text-white rounded-xl text-xs font-bold shadow-soft transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
              >
                {createPostMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{lang === 'en' ? 'Post' : 'نشر'}</span>
              </button>
            </div>
          </form>
        </div>
      )}



      {/* 2. Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-white rounded-3xl animate-pulse border border-beige-200/80 shadow-soft" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-3xl border border-beige-200/80 shadow-soft text-text-secondary">
          <Compass className="w-8 h-8 text-beige-300 mx-auto mb-2" />
          <p className="text-xs font-semibold">
            {activeFeedTab === 'saved'
              ? (lang === 'en' ? 'No bookmarked posts yet.' : 'لا توجد منشورات محفوظة بعد.')
              : activeFeedTab === 'reposts'
              ? (lang === 'en' ? 'You have not reposted anything yet.' : 'لم تقم بإعادة نشر أي شيء بعد.')
              : (lang === 'en' ? 'No recent activities. Be the first to share a post!' : 'لا توجد أنشطة مؤخراً. كن أول من يشارك منشوراً!')}
          </p>
        </div>
      ) : (
        /* 3. Feed List */
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const hasLiked = post.likes.some((l) => l.id === user?.id);
            const showComments = activeCommentPostId === post.id;
            const isSaved = post.savedBy?.some((u) => u.id === user?.id);
            const repostCount = posts.filter((p) => p.repostOfId === post.id).length;
            const hasReposted = posts.some((p) => p.repostOfId === post.id && p.author.id === user?.id);

            return (
              <div key={post.id} className="bg-white p-5 rounded-3xl border border-beige-200/80 shadow-soft space-y-4 animate-fade-in text-left">
                {/* Repost Header Info */}
                {post.repostOf && (
                  <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-bold mb-2">
                    <Repeat className="w-3.5 h-3.5 text-mint-500" />
                    <span>
                      {post.author.id === user?.id
                        ? (lang === 'en' ? 'You reposted' : 'قمت بإعادة النشر')
                        : `${post.author.name} ${lang === 'en' ? 'reposted' : 'قام بإعادة النشر'}`}
                    </span>
                  </div>
                )}

                {/* Post Author info */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600 text-sm flex-shrink-0">
                      {post.author.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-text-primary leading-tight">{post.author.name}</span>
                        <span className={`px-2 py-0.5 text-[8px] font-black rounded-md ${
                          post.author.role === 'DOCTOR' 
                            ? 'bg-rose-100 text-rose-500' 
                            : post.author.role === 'TA' 
                            ? 'bg-indigo-100 text-indigo-500' 
                            : 'bg-mint-100 text-mint-500'
                        }`}>
                          {post.author.role}
                        </span>
                      </div>
                      <span className="text-[9px] text-text-secondary block font-medium mt-0.5">
                        {getRelativeTime(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                      className="text-text-secondary hover:text-text-primary p-1.5 rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {activeMenuPostId === post.id && (
                      <div className="absolute right-0 mt-1 w-38 bg-white border border-beige-200 rounded-xl shadow-lg py-1 z-10 animate-fade-in text-[11px] font-bold text-text-primary">
                        <button
                          onClick={() => {
                            toggleSaveMutation.mutate(post.id);
                            setActiveMenuPostId(null);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-beige-50 flex items-center gap-2"
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'text-mint-500 fill-mint-100' : 'text-text-secondary'}`} />
                          <span>{isSaved ? (lang === 'en' ? 'Unsave Post' : 'إلغاء الحفظ') : (lang === 'en' ? 'Save Post' : 'حفظ المنشور')}</span>
                        </button>

                        {/* Edit post option (only if publisher and not a repost) */}
                        {post.author.id === user?.id && !post.repostOfId && (
                          <button
                            onClick={() => {
                              setEditingPostId(post.id);
                              setEditContent(post.content);
                              setActiveMenuPostId(null);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-beige-50 flex items-center gap-2 text-indigo-600"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>{lang === 'en' ? 'Edit Post' : 'تعديل المنشور'}</span>
                          </button>
                        )}

                        {/* Delete post option (if publisher or admin) */}
                        {(post.author.id === user?.id || user?.role === 'ADMIN') && (
                          <button
                            onClick={() => {
                              if (confirm(lang === 'en' ? 'Are you sure you want to delete this?' : 'هل أنت متأكد من حذف هذا؟')) {
                                deletePostMutation.mutate(post.id);
                              }
                              setActiveMenuPostId(null);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-beige-50 flex items-center gap-2 text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>
                              {post.repostOfId
                                ? (lang === 'en' ? 'Delete Repost' : 'حذف إعادة النشر')
                                : (lang === 'en' ? 'Delete Post' : 'حذف المنشور')}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                  {/* Post Content & Nested Repost */}
                  {editingPostId === post.id ? (
                    <div className="space-y-2 text-left">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 border border-beige-200 rounded-xl text-xs font-semibold focus:border-mint-500 focus:ring-1 focus:ring-mint-500 bg-beige-50/50 outline-none resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setEditingPostId(null);
                            setEditContent('');
                          }}
                          className="px-3 py-1.5 border border-beige-200 hover:bg-beige-50 rounded-lg text-[10px] font-bold text-text-secondary transition-all"
                        >
                          {lang === 'en' ? 'Cancel' : 'إلغاء'}
                        </button>
                        <button
                          onClick={() => {
                            if (editContent.trim()) {
                              editPostMutation.mutate({ postId: post.id, content: editContent });
                            }
                          }}
                          disabled={editPostMutation.isPending || !editContent.trim()}
                          className="px-3 py-1.5 bg-mint-500 hover:bg-mint-400 text-white rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                        >
                          {editPostMutation.isPending ? (lang === 'en' ? 'Saving...' : 'جاري الحفظ...') : (lang === 'en' ? 'Save' : 'حفظ')}
                        </button>
                      </div>
                    </div>
                  ) : post.repostOf ? (
                    <div className="space-y-2">
                      {renderPostContent(post.id, post.content, true)}
                      <div className="bg-beige-50/40 p-4 rounded-2xl border border-beige-200/80 space-y-3 text-left">
                        {/* Original Author */}
                        <div className="flex gap-2.5 items-center">
                          <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600 text-[10px] flex-shrink-0">
                            {post.repostOf.author.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-[11px] text-text-primary leading-tight">{post.repostOf.author.name}</span>
                              <span className="px-1.5 py-0.2 text-[7px] font-black rounded-md bg-beige-200 text-text-secondary">
                                {post.repostOf.author.role}
                              </span>
                            </div>
                            <span className="text-[8px] text-text-secondary block font-medium mt-0.5">
                              {getRelativeTime(post.repostOf.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Original Content */}
                        {renderPostContent(`${post.id}-repost`, post.repostOf.content, false)}

                        {/* Original Media Grid */}
                        {post.repostOf.media && post.repostOf.media.length > 0 && (
                          <div className={`grid gap-2 my-2 ${post.repostOf.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {post.repostOf.media.map((med) => (
                              <div
                                key={med.id}
                                className={`relative rounded-xl overflow-hidden border border-beige-200 bg-beige-50 flex items-center justify-center ${
                                  post.repostOf!.media!.length === 1 ? 'w-full' : 'h-36 w-full'
                                }`}
                              >
                                {med.type === 'VIDEO' ? (
                                  <video
                                    src={med.url}
                                    controls
                                    className={
                                      post.repostOf!.media!.length === 1
                                        ? 'w-full h-auto max-h-[400px] object-contain mx-auto'
                                        : 'w-full h-full object-contain mx-auto'
                                    }
                                  />
                                ) : (
                                  <img
                                    src={med.url}
                                    alt="Post Attachment"
                                    className={
                                      post.repostOf!.media!.length === 1
                                        ? 'w-full h-auto max-h-[400px] object-contain mx-auto'
                                        : 'w-full h-full object-contain mx-auto'
                                    }
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Original Event */}
                        {post.repostOf.eventTitle && (
                          <div className="p-3.5 bg-amber-50/30 border border-amber-200/60 rounded-xl flex items-center gap-3 my-1">
                            <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0 text-amber-500 border border-amber-200/50">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="text-[11px] font-extrabold text-text-primary truncate">{post.repostOf.eventTitle}</h4>
                              <p className="text-[9px] text-text-secondary font-bold mt-0.5">
                                {post.repostOf.eventDate ? new Date(post.repostOf.eventDate).toLocaleString() : ''}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Render regular post content (standard post render code) */}
                      {renderPostContent(post.id, post.content, false)}

                      {/* Render Post Media (Photos/Videos) Grid */}
                      {post.media && post.media.length > 0 && (
                        <div className={`grid gap-2 my-2 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                          {post.media.map((med) => (
                            <div
                              key={med.id}
                              className={`relative rounded-2xl overflow-hidden border border-beige-200 bg-beige-50 flex items-center justify-center ${
                                post.media!.length === 1 ? 'w-full' : 'h-48 w-full'
                              }`}
                            >
                              {med.type === 'VIDEO' ? (
                                <video
                                  src={med.url}
                                  controls
                                  className={
                                    post.media!.length === 1
                                      ? 'w-full h-auto max-h-[500px] object-contain mx-auto'
                                      : 'w-full h-full object-contain mx-auto'
                                  }
                                />
                              ) : (
                                <img
                                  src={med.url}
                                  alt="Post Attachment"
                                  className={
                                    post.media!.length === 1
                                      ? 'w-full h-auto max-h-[500px] object-contain mx-auto'
                                      : 'w-full h-full object-contain mx-auto'
                                  }
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Render Post Image Fallback (legacy single image posts) */}
                      {(!post.media || post.media.length === 0) && post.imageUrl && (
                        <div className="rounded-2xl overflow-hidden border border-beige-200 w-full bg-beige-50 my-2">
                          <img src={post.imageUrl} alt="Post Attachment" className="w-full h-auto max-h-[500px] object-contain mx-auto" />
                        </div>
                      )}

                      {/* Render Post Event */}
                      {post.eventTitle && (
                        <div className="p-4 bg-amber-50/30 border border-amber-200/60 rounded-2xl flex items-center gap-3.5 my-2">
                          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0 text-amber-500 border border-amber-200/50">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <h4 className="text-xs font-extrabold text-text-primary truncate">{post.eventTitle}</h4>
                            <p className="text-[10px] text-text-secondary font-bold mt-1">
                              {post.eventDate ? new Date(post.eventDate).toLocaleString() : ''}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                {/* Likes / Comments / Reposts Counts */}
                <div className="flex justify-between items-center text-[10px] text-text-secondary border-b border-beige-100/60 pb-3 font-semibold">
                  <div className="flex gap-3">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-mint-500 fill-mint-100" />
                      {post.likes.length} {lang === 'en' ? 'likes' : 'إعجاب'}
                    </span>
                    {repostCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Repeat className="w-3 h-3 text-indigo-500" />
                        {repostCount} {lang === 'en' ? 'reposts' : 'إعادات النشر'}
                      </span>
                    )}
                  </div>
                  <span>
                    {post.comments.length} {lang === 'en' ? 'comments' : 'تعليق'}
                  </span>
                </div>

                {/* Like / Comment / Repost / Share Action buttons */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold border-b border-beige-100/40 pb-1">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
                      hasLiked 
                        ? 'text-mint-500 bg-mint-500/10 dark:bg-mint-500/20' 
                        : 'text-text-secondary hover:bg-beige-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
                    <span>{lang === 'en' ? 'Like' : 'إعجاب'}</span>
                  </button>
                  <button
                    onClick={() => setActiveCommentPostId(showComments ? null : post.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
                      showComments 
                        ? 'text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20' 
                        : 'text-text-secondary hover:bg-beige-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Comment' : 'تعليق'}</span>
                  </button>
                  <button
                    onClick={() => setRepostModalPost(post)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
                      hasReposted 
                        ? 'text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20' 
                        : 'text-text-secondary hover:bg-beige-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Repost' : 'إعادة نشر'}</span>
                  </button>
                  <button
                    onClick={() => handleShare(post.id)}
                    className="flex items-center justify-center gap-1.5 py-2 text-text-secondary hover:bg-beige-50 dark:hover:bg-neutral-800 rounded-xl transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Share' : 'مشاركة'}</span>
                  </button>
                </div>

                {/* Comments Drawer */}
                {showComments && (
                  <div className="space-y-4 pt-2 animate-fade-in">
                    {/* Add Comment input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        placeholder={lang === 'en' ? 'Write a comment...' : 'اكتب تعليقاً...'}
                        className="w-full px-4 py-2.5 bg-beige-50/60 border border-beige-200 rounded-xl text-xs font-semibold focus:border-mint-500 focus:ring-1 focus:ring-mint-500 outline-none transition-all"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCommentSubmit(post.id);
                        }}
                      />
                      <button
                        onClick={() => handleCommentSubmit(post.id)}
                        disabled={commentMutation.isPending || !(commentInputs[post.id] || '').trim()}
                        className="p-2.5 bg-mint-500 hover:bg-mint-400 text-white rounded-xl shadow-soft transition-all disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Comments List */}
                    {post.comments.length > 0 && (
                      <div className="space-y-3 pt-2">
                        {post.comments.map((comm) => (
                          <div key={comm.id} className="space-y-2">
                            <div className="p-3 bg-beige-50/50 rounded-2xl border border-beige-100 flex gap-2.5 items-start">
                              <div className="w-7 h-7 rounded-full bg-beige-200 flex items-center justify-center font-bold text-text-primary text-[10px] flex-shrink-0">
                                {comm.user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="font-extrabold text-[10.5px] text-text-primary leading-none">{comm.user.name}</span>
                                  <span className="text-[7.5px] font-bold px-1 py-0.2 bg-beige-200 text-text-secondary rounded-sm">
                                    {comm.user.role}
                                  </span>
                                </div>
                                <p className="text-[11px] font-medium text-text-primary mt-1.5 leading-relaxed">
                                  {comm.content}
                                </p>
                                <div className="flex items-center gap-3 mt-1.5 text-[8.5px] text-text-secondary font-bold">
                                  <span>{getRelativeTime(comm.createdAt)}</span>
                                  <button
                                    onClick={() => setActiveReplyId(activeReplyId === comm.id ? null : comm.id)}
                                    className="hover:text-mint-500 transition-colors uppercase"
                                  >
                                    {lang === 'en' ? 'Reply' : 'رد'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Nested Replies */}
                            {comm.replies.map((rep) => (
                              <div key={rep.id} className="pl-6 flex gap-2 items-start rtl:pl-0 rtl:pr-6">
                                <CornerDownRight className="w-3.5 h-3.5 text-beige-300 mt-1 flex-shrink-0 rtl:scale-x-[-1]" />
                                <div className="p-2.5 bg-beige-50/20 border border-beige-100 rounded-2xl flex-1 flex gap-2 items-start">
                                  <div className="w-6 h-6 rounded-full bg-beige-100 flex items-center justify-center font-bold text-text-primary text-[9px] flex-shrink-0">
                                    {rep.user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <span className="font-bold text-[10px] text-text-primary leading-none">{rep.user.name}</span>
                                      <span className="text-[7px] font-bold px-1 py-0.2 bg-beige-100 text-text-secondary rounded-sm">
                                        {rep.user.role}
                                      </span>
                                    </div>
                                    <p className="text-[10px] font-medium text-text-primary mt-1 leading-normal">
                                      {rep.content}
                                    </p>
                                    <span className="text-[8px] text-text-secondary block mt-1 font-bold">
                                      {getRelativeTime(rep.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Write Reply inline box */}
                            {activeReplyId === comm.id && (
                              <div className="pl-6 flex gap-2 items-center rtl:pl-0 rtl:pr-6 animate-fade-in">
                                <CornerDownRight className="w-3.5 h-3.5 text-beige-300 rtl:scale-x-[-1]" />
                                <div className="flex gap-1.5 flex-1">
                                  <input
                                    type="text"
                                    value={replyInputs[comm.id] || ''}
                                    onChange={(e) => setReplyInputs({ ...replyInputs, [comm.id]: e.target.value })}
                                    placeholder={lang === 'en' ? 'Write a reply...' : 'اكتب رداً...'}
                                    className="w-full px-3 py-1.5 bg-beige-50/40 border border-beige-200 rounded-xl text-[10.5px] font-medium focus:border-mint-500 focus:ring-1 focus:ring-mint-500 outline-none transition-all"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleReplySubmit(post.id, comm.id);
                                    }}
                                  />
                                  <button
                                    onClick={() => handleReplySubmit(post.id, comm.id)}
                                    disabled={commentMutation.isPending || !(replyInputs[comm.id] || '').trim()}
                                    className="p-2 bg-mint-500 hover:bg-mint-400 text-white rounded-xl shadow-soft disabled:opacity-50"
                                  >
                                    <Send className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Repost Options Modal */}
      {repostModalPost && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in text-left">
          <div className="bg-white rounded-3xl border border-beige-200 max-w-lg w-full p-5 shadow-2xl relative space-y-4">
            <button
              onClick={() => {
                setRepostModalPost(null);
                setRepostCommentText('');
              }}
              className="absolute top-4 right-4 text-text-secondary hover:text-rose-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-extrabold text-text-primary">
              {lang === 'en' ? 'Repost Post' : 'إعادة نشر المشاركة'}
            </h3>

            {/* Comment Area */}
            <textarea
              value={repostCommentText}
              onChange={(e) => setRepostCommentText(e.target.value)}
              placeholder={lang === 'en' ? 'Add a comment / quote...' : 'أضف تعليقاً / اقتباساً...'}
              className="w-full px-4 py-3 bg-beige-50/50 border border-beige-200 rounded-2xl text-xs font-semibold text-text-primary focus:border-mint-500 focus:ring-1 focus:ring-mint-500 outline-none transition-all resize-none"
              rows={3}
            />

            {/* Nested Original Post Preview snippet */}
            <div className="bg-beige-100/60 p-4 rounded-2xl border border-beige-300/80 text-left text-xs text-text-secondary space-y-1.5 max-h-40 overflow-y-auto">
              <div className="font-extrabold text-text-primary text-[11px] flex items-center gap-1.5">
                <span>{repostModalPost.author.name}</span>
                <span className="px-1.5 py-0.5 text-[8px] font-black rounded bg-beige-300/80 text-text-secondary">{repostModalPost.author.role}</span>
              </div>
              <p className="line-clamp-3 font-medium text-[11px] leading-relaxed text-text-primary">
                {repostModalPost.content || (lang === 'en' ? '[Attachment]' : '[مرفق]')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  repostMutation.mutate({ postId: repostModalPost.id });
                }}
                disabled={repostMutation.isPending}
                className="px-4 py-2 border border-beige-200 hover:bg-beige-50 rounded-xl text-xs font-bold text-text-secondary transition-all"
              >
                {lang === 'en' ? 'Repost' : 'إعادة نشر'}
              </button>
              <button
                onClick={() => {
                  if (repostCommentText.trim()) {
                    repostMutation.mutate({ postId: repostModalPost.id, content: repostCommentText });
                  }
                }}
                disabled={repostMutation.isPending || !repostCommentText.trim()}
                className="px-4 py-2 bg-mint-500 hover:bg-mint-400 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-soft"
              >
                {repostMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{lang === 'en' ? 'Repost with comment' : 'إعادة نشر مع تعليق'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SEED_POSTS_TRANSLATIONS: { [englishText: string]: string } = {
  [`🚀 The Power of Consistency

Success isn’t about making one huge effort—it’s about showing up every single day. Whether you’re learning a new programming language, preparing for an exam, or building your first project, consistency beats intensity. Spending just one focused hour every day can be far more effective than studying for ten hours the night before a deadline.

💬 Question: What’s one small habit that has helped you stay productive?`]: `🚀 قوة الاستمرارية

النجاح لا يعتمد على القيام بمجهود ضخم مرة واحدة، بل على الالتزام والاستمرار كل يوم. سواء كنت تتعلم لغة برمجة جديدة، أو تستعد لامتحان، أو تبني أول مشروع لك، فإن الاستمرارية تتفوق دائمًا على العمل المكثف في وقت قصير. فالدراسة لمدة ساعة واحدة بتركيز كل يوم أكثر فاعلية من الدراسة لعشر ساعات متواصلة قبل موعد التسليم.

💬 سؤال للنقاش: ما هي العادة اليومية التي ساعدتك على أن تكون أكثر إنتاجية؟`,

  [`🤖 Artificial Intelligence is Changing Everything

Artificial Intelligence is no longer a technology of the future—it’s already part of our daily lives. From personalized recommendations on streaming platforms to medical diagnosis and self-driving vehicles, AI is transforming the way we work and solve problems.

💬 Question: If you could build one AI application to improve people’s lives, what would it be?`]: `🤖 الذكاء الاصطناعي يغيّر كل شيء

لم يعد الذكاء الاصطناعي تقنية تخص المستقبل فقط، بل أصبح جزءًا من حياتنا اليومية. فمن أنظمة التوصية في منصات البث، إلى التشخيص الطبي، والسيارات ذاتية القيادة، يساهم الذكاء الاصطناعي في تغيير طريقة عملنا وحلنا للمشكلات.

💬 سؤال للنقاش: إذا أتيحت لك الفرصة لتطوير تطبيق يعتمد على الذكاء الاصطناعي لتحسين حياة الناس، فما الفكرة التي ستختارها؟`,

  [`📚 Learning Never Stops

Graduation isn’t the finish line—it’s only the beginning. The most successful professionals are lifelong learners. Whether it’s reading books, taking online courses, earning certifications, or building personal projects, continuous learning keeps you ahead in an ever-changing world.

💬 Question: What’s the latest skill you’ve learned?`]: `📚 التعلم لا يتوقف أبدًا

التخرج ليس نهاية رحلة التعلم، بل بدايتها. فأنجح الأشخاص هم من يواصلون التعلم باستمرار من خلال قراءة الكتب، والالتحاق بالدورات التدريبية، والحصول على الشهادات، وتنفيذ المشاريع العملية. التعلم المستمر هو مفتاح النجاح في عالم سريع التغير.

💬 سؤال للنقاش: ما آخر مهارة تعلمتها وأحدثت فرقًا في حياتك؟`,

  [`💻 Coding is More Than Writing Code

Programming isn’t just about writing lines of code. It’s about solving real-world problems, thinking logically, and building products that improve people’s lives. Every bug teaches you something new, and every project strengthens your skills.

💬 Question: Which programming language would you recommend to beginners?`]: `💻 البرمجة أكثر من مجرد كتابة أكواد

البرمجة ليست مجرد كتابة تعليمات برمجية، بل هي القدرة على حل المشكلات والتفكير المنطقي وبناء حلول تساعد الآخرين. كل خطأ برمجي تتعلم منه، وكل مشروع تنجزه يجعلك مطورًا أفضل.

💬 سؤال للنقاش: ما أول لغة برمجة تعلمتها؟ وهل تنصح بها للمبتدئين؟`,

  [`🌍 Technology Connects the World

Technology has made global collaboration easier than ever. Students, developers, designers, and researchers can now work together from different countries on the same project. Innovation grows when ideas are shared.

💬 Question: Have you ever worked with someone from another country?`]: `🌍 التكنولوجيا تربط العالم

جعلت التكنولوجيا التعاون بين الأشخاص من مختلف دول العالم أسهل من أي وقت مضى. يستطيع الطلاب والمطورون والمصممون والباحثون العمل معًا على نفس المشروع مهما كانت المسافات بينهم، فالإبداع ينمو عندما تتشارك الأفكار.

💬 سؤال للنقاش: هل سبق لك أن عملت مع شخص من دولة أخرى؟`,

  [`🎯 Small Progress is Still Progress

Don’t underestimate the value of small daily improvements. Progress doesn’t have to be dramatic to be meaningful. Keep learning, stay patient, and remember that every expert started as a beginner.

💬 Question: What’s one achievement you’re proud of this month?`]: `🎯 التقدم البسيط يظل تقدمًا

لا تقلل أبدًا من قيمة التحسن اليومي، حتى وإن كان بسيطًا. ليس من الضروري أن يكون تقدمك كبيرًا حتى يكون مهمًا. استمر في التعلم وتحلَّ بالصبر، وتذكر أن كل خبير كان يومًا ما مبتدئًا.

💬 سؤال للنقاش: ما الإنجاز الذي تفخر بتحقيقه هذا الشهر؟`,

  [`📖 Your Favorite Learning Resource

Everyone has that one resource that completely changed how they learn—whether it’s a book, a YouTube channel, a website, or an online course. Sharing great resources helps everyone grow together.

💬 Question: What’s your favorite learning resource?`]: `📖 شاركنا أفضل مصادر التعلم لديك

لكل شخص مصدر تعلم مفضل غيّر طريقته في اكتساب المعرفة، سواء كان كتابًا، أو قناة على يوتيوب، أو موقعًا إلكترونيًا، أو دورة تدريبية عبر الإنترنت. مشاركة هذه المصادر تساعد الجميع على التطور.

💬 سؤال للنقاش: ما هو مصدر التعلم الذي تنصح به الجميع؟`,

  [`☕ Take a Break—Your Brain Will Thank You

Working without breaks can reduce your focus and creativity. A short walk, stretching, or simply stepping away from your screen for a few minutes can make a huge difference in your productivity.

💬 Question: What’s your favorite way to recharge during study sessions?`]: `☕ خذ استراحة… سيشكرك عقلك على ذلك

العمل المتواصل دون فترات راحة قد يقلل من التركيز والإبداع. لذلك، فإن المشي لبضع دقائق، أو ممارسة بعض التمارين الخفيفة، أو الابتعاد قليلًا عن الشاشة قد يساعدك على العودة بطاقة وتركيز أكبر.

💬 سؤال للنقاش: ما هي طريقتك المفضلة لاستعادة نشاطك أثناء الدراسة أو العمل؟`,

  [`🚀 Build Projects, Not Just Certificates

Certificates are valuable, but projects show what you can actually do. Building applications, websites, robots, or research projects demonstrates your creativity and practical skills far better than a certificate alone.

💬 Question: What project are you currently working on?`]: `🚀 ابنِ مشاريع، وليس شهادات فقط

الشهادات مهمة، لكنها لا تُظهر دائمًا ما تستطيع إنجازه عمليًا. أما المشاريع فهي دليل حقيقي على مهاراتك وقدرتك على الابتكار وحل المشكلات، سواء كانت تطبيقًا، أو موقعًا إلكترونيًا، أو روبوتًا، أو مشروعًا بحثيًا.

💬 سؤال للنقاش: ما المشروع الذي تعمل عليه حاليًا؟`,

  [`💡 Question of the Week

Imagine you could instantly master one skill today. Would you choose programming, public speaking, graphic design, cybersecurity, artificial intelligence, or something completely different?

Tell us why!`]: `💡 سؤال الأسبوع

تخيل أنك تستطيع إتقان مهارة واحدة فورًا. هل ستختار البرمجة، أم التصميم الجرافيكي، أم الأمن السيبراني، أم الذكاء الاصطناعي، أم التحدث أمام الجمهور، أم مجالًا آخر؟

شاركنا اختيارك وسبب اختيارك له.`,

  [`⚡ Powering the Future

Energy Resources Engineering focuses on developing efficient and sustainable ways to generate, store, and manage energy. From renewable energy systems like solar and wind to traditional power plants, engineers in this field help shape a cleaner and more reliable future.

💬 Discussion: Which renewable energy source do you believe has the greatest potential over the next decade?`]: `⚡ نحو مستقبل أكثر استدامة

يركز تخصص هندسة موارد الطاقة على تطوير طرق فعالة ومستدامة لإنتاج الطاقة وتخزينها وإدارتها. فمن الطاقة الشمسية وطاقة الرياح إلى محطات الطاقة التقليدية، يساهم مهندسو الطاقة في بناء مستقبل أكثر نظافة واعتمادية.

💬 سؤال للنقاش: في رأيك، أي مصدر للطاقة المتجددة يمتلك أكبر فرصة للانتشار خلال السنوات القادمة؟`,

  [`⚙️ Engineering in Motion

Mechanical Power Engineering combines mechanics, thermodynamics, fluid dynamics, and machine design to create systems that power industries and everyday life. From manufacturing plants to aircraft engines, mechanical engineers are behind countless innovations.

💬 Discussion: If you could design any machine, what would it be?`]: `⚙️ الهندسة التي تحرك العالم

يجمع تخصص هندسة القوى الميكانيكية بين الميكانيكا، والديناميكا الحرارية، وميكانيكا الموائع، وتصميم الآلات لإنشاء الأنظمة التي تشغل المصانع ووسائل النقل والعديد من الصناعات الحديثة.

💬 سؤال للنقاش: إذا أتيحت لك الفرصة لتصميم آلة جديدة، فما الذي ستقوم بتصميمه؟`,

  [`🏭 Making Systems Smarter

Industrial Engineering is all about improving efficiency. Engineers in this field optimize production lines, reduce waste, improve quality, and make organizations work more effectively through data-driven decisions.

💬 Discussion: Which is more important: speed or quality?`]: `🏭 أنظمة أكثر كفاءة

تركز الهندسة الصناعية على تحسين كفاءة العمليات داخل المؤسسات والمصانع من خلال تقليل الهدر، وتحسين الجودة، وزيادة الإنتاجية، واتخاذ القرارات اعتمادًا على البيانات.

💬 سؤال للنقاش: أيهما أهم في رأيك: السرعة أم الجودة؟`,

  [`🤖 Where Mechanics Meets Intelligence

Mechatronics combines mechanical engineering, electronics, computer science, and control systems to create smart machines and robots. It’s one of the fastest-growing engineering disciplines today.

💬 Discussion: What real-world problem would you solve using robotics?`]: `🤖 عندما تلتقي الميكانيكا بالذكاء

يجمع تخصص الميكاترونكس بين الهندسة الميكانيكية والإلكترونيات وعلوم الحاسب وأنظمة التحكم لتصميم الروبوتات والأنظمة الذكية، ويعد من أكثر التخصصات نموًا في الوقت الحالي.

💬 سؤال للنقاش: ما المشكلة التي تتمنى أن يتم حلها باستخدام الروبوتات؟`,

  [`💻 Building the Digital World

Computer Engineers design the hardware and software systems that power modern technology. Whether developing embedded systems, processors, AI applications, or cloud platforms, they play a key role in digital transformation.

💬 Discussion: Which emerging technology excites you the most?`]: `💻 بناء العالم الرقمي

يقوم مهندسو الحاسبات بتصميم وتطوير الأنظمة البرمجية والمكونات الإلكترونية التي تعتمد عليها التكنولوجيا الحديثة، بدايةً من الأنظمة المدمجة وحتى تطبيقات الذكاء الاصطناعي والحوسبة السحابية.

💬 سؤال للنقاش: ما أكثر تقنية حديثة تثير اهتمامك؟`,

  [`🔌 Innovation Through Electronics

Electronics Engineers design and develop circuits, communication systems, sensors, and embedded devices that make modern technology possible. Smartphones, satellites, and medical equipment all rely on electronics engineering.

💬 Discussion: Which electronic device has had the biggest impact on society?`]: `🔌 الابتكار يبدأ من الدوائر الإلكترونية

يقوم مهندسو الإلكترونيات بتطوير الدوائر الإلكترونية، وأنظمة الاتصالات، والمستشعرات، والأجهزة الذكية التي نعتمد عليها في حياتنا اليومية، مثل الهواتف الذكية والأقمار الصناعية والأجهزة الطبية.

💬 سؤال للنقاش: ما الجهاز الإلكتروني الذي تعتقد أنه غيّر حياة البشر أكثر من غيره؟`,

  [`🏗️ Designing the Cities of Tomorrow

Civil & Architectural Engineering work together to create buildings, bridges, highways, and sustainable urban spaces. Their work combines structural safety, functionality, and aesthetic design to improve how people live.

💬 Discussion: What’s your favorite modern building or architectural landmark?`]: `🏗️ تصميم مدن المستقبل

يعمل المهندسون المدنيون والمعماريون معًا لإنشاء المباني، والجسور، والطرق، والمدن المستدامة، مع تحقيق التوازن بين الأمان، والوظيفة، والجمال في التصميم.

💬 سؤال للنقاش: ما المبنى أو المعلم المعماري الذي يعجبك أكثر؟ ولماذا؟`,

  [`🩺 Engineering That Saves Lives

Biomedical Engineering combines medicine with engineering to develop technologies such as prosthetic limbs, medical imaging devices, wearable health monitors, and advanced diagnostic tools.

💬 Discussion: Which medical innovation has impressed you the most?`]: `🩺 الهندسة التي تنقذ الأرواح

يجمع تخصص الهندسة الطبية الحيوية بين الطب والهندسة لتطوير الأطراف الصناعية، وأجهزة التصوير الطبي، والأجهزة القابلة للارتداء، وتقنيات التشخيص والعلاج الحديثة.

💬 سؤال للنقاش: ما أكثر ابتكار طبي أثار إعجابك؟`,

  [`🎨 Design is Communication

Graphic Design is more than creating beautiful visuals—it’s about communicating ideas effectively. Every color, font, and layout influences how people perceive information and brands.

💬 Discussion: Which brand do you think has the best visual identity?`]: `🎨 التصميم هو لغة التواصل

التصميم الجرافيكي لا يقتصر على إنتاج أعمال جميلة بصريًا، بل يهدف إلى توصيل الأفكار والرسائل بطريقة واضحة ومؤثرة. فكل لون وخط وتنسيق يلعب دورًا في تشكيل تجربة المتلقي.

💬 سؤال للنقاش: ما العلامة التجارية التي تعتقد أنها تمتلك أفضل هوية بصرية؟`,

  [`✨ Creating Better Experiences

UI/UX Designers focus on making digital products intuitive, accessible, and enjoyable. Great design isn’t just about appearance—it’s about understanding users and solving their problems through thoughtful experiences.

💬 Discussion: Which app do you think has the best user experience, and why?`]: `✨ تصميم يصنع تجربة أفضل

يركز مصممو واجهات وتجربة المستخدم على إنشاء منتجات رقمية سهلة الاستخدام، وعملية، وممتعة للمستخدم. فالتصميم الجيد لا يتعلق بالشكل فقط، بل بفهم احتياجات المستخدم وتقديم أفضل تجربة ممكنة.`
};
