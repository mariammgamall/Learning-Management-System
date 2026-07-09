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

  // Photo upload and Event state
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [showEventInputs, setShowEventInputs] = useState(false);

  // Fetch Feed
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['feedPosts'],
    queryFn: async () => {
      const response = await api.get('/posts');
      return response.data;
    },
  });

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
      setSelectedPhoto(null);
      setPhotoPreviewUrl(null);
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
    if (!postContent.trim() && !selectedPhoto && !eventTitle) return;

    const formData = new FormData();
    formData.append('content', postContent.trim());
    if (selectedPhoto) {
      formData.append('photo', selectedPhoto);
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
      {/* 1. Create Post Card */}
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

          {/* Image Upload Preview */}
          {photoPreviewUrl && (
            <div className="relative w-full border border-beige-200 rounded-2xl my-2 bg-beige-50 overflow-hidden">
              <img src={photoPreviewUrl} alt="Upload preview" className="w-full h-auto max-h-60 object-contain mx-auto" />
              <button
                type="button"
                onClick={() => {
                  setSelectedPhoto(null);
                  setPhotoPreviewUrl(null);
                }}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
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
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedPhoto(file);
                    setPhotoPreviewUrl(URL.createObjectURL(file));
                  }
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                  photoPreviewUrl ? 'text-indigo-500 bg-indigo-50/50' : 'text-text-secondary hover:bg-beige-50'
                }`}
                onClick={() => document.getElementById('post-photo-input')?.click()}
              >
                <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>{lang === 'en' ? 'Photo' : 'صورة'}</span>
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
              disabled={createPostMutation.isPending || (!postContent.trim() && !selectedPhoto && !eventTitle)}
              className="px-5 py-2 bg-mint-500 hover:bg-mint-400 text-white rounded-xl text-xs font-bold shadow-soft transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
            >
              {createPostMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{lang === 'en' ? 'Post' : 'نشر'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-white rounded-3xl animate-pulse border border-beige-200/80 shadow-soft" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-3xl border border-beige-200/80 shadow-soft text-text-secondary">
          <Compass className="w-8 h-8 text-beige-300 mx-auto mb-2" />
          <p className="text-xs font-semibold">
            {lang === 'en' ? 'No recent activities. Be the first to share a post!' : 'لا توجد أنشطة مؤخراً. كن أول من يشارك منشوراً!'}
          </p>
        </div>
      ) : (
        /* 3. Feed List */
        <div className="space-y-4">
          {posts.map((post) => {
            const hasLiked = post.likes.some((l) => l.id === user?.id);
            const showComments = activeCommentPostId === post.id;

            return (
              <div key={post.id} className="bg-white p-5 rounded-3xl border border-beige-200/80 shadow-soft space-y-4 animate-fade-in">
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

                  <button className="text-text-secondary hover:text-text-primary p-1.5 rounded-lg transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* Post Content */}
                {post.content && (
                  <p className="text-xs font-medium text-text-primary leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                )}

                {/* Render Post Image */}
                {post.imageUrl && (
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

                {/* Likes / Comments Counts */}
                <div className="flex justify-between items-center text-[10px] text-text-secondary border-b border-beige-100/60 pb-3 font-semibold">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 text-mint-500 fill-mint-100" />
                    {post.likes.length} {lang === 'en' ? 'likes' : 'إعجاب'}
                  </span>
                  <span>
                    {post.comments.length} {lang === 'en' ? 'comments' : 'تعليق'}
                  </span>
                </div>

                {/* Like / Comment / Share Action buttons */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold border-b border-beige-100/40 pb-1">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
                      hasLiked 
                        ? 'text-mint-500 bg-mint-50/50' 
                        : 'text-text-secondary hover:bg-beige-50'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
                    <span>{lang === 'en' ? 'Like' : 'إعجاب'}</span>
                  </button>
                  <button
                    onClick={() => setActiveCommentPostId(showComments ? null : post.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
                      showComments 
                        ? 'text-indigo-500 bg-indigo-50/50' 
                        : 'text-text-secondary hover:bg-beige-50'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Comment' : 'تعليق'}</span>
                  </button>
                  <button
                    onClick={() => handleShare(post.id)}
                    className="flex items-center justify-center gap-1.5 py-2 text-text-secondary hover:bg-beige-50 rounded-xl transition-all"
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
    </div>
  );
}
