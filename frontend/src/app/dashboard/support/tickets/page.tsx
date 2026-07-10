'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../../../hooks/useTranslation';
import { useToastStore } from '../../../../hooks/useToastStore';
import { api } from '../../../../utils/api';
import {
  FileText,
  Search,
  Filter,
  Paperclip,
  Send,
  X,
  Loader2,
  Clock,
  Download,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  EyeOff,
  User,
  ChevronRight,
  HelpCircle,
  BookOpen
} from 'lucide-react';

export default function SupportTicketsPage() {
  const { lang } = useTranslation();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  // Compose reply state
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [replyAttachment, setReplyAttachment] = useState<File | null>(null);
  const [isReplying, setIsReplying] = useState(false);

  // Fetch all tickets
  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ['support-tickets', statusFilter, priorityFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await api.get(`/support/tickets?${params.toString()}`);
      return response.data;
    },
  });

  // Fetch current ticket details
  const { data: ticket = null, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['support-ticket-details', selectedTicketId],
    queryFn: async () => {
      if (!selectedTicketId) return null;
      const response = await api.get(`/support/support/tickets/${selectedTicketId}`);
      return response.data;
    },
    enabled: !!selectedTicketId,
  });

  // Fetch support agents (for assignment)
  const { data: agents = [] } = useQuery({
    queryKey: ['support-agents'],
    queryFn: async () => {
      const response = await api.get('/support/agents');
      return response.data;
    },
  });

  // Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.put(`/support/tickets/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket-details', selectedTicketId] });
      addToast(lang === 'en' ? 'Ticket status updated' : 'تم تحديث حالة التذكرة', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to update status', 'error');
    },
  });

  // Priority mutation
  const updatePriorityMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: string }) => {
      await api.put(`/support/tickets/${id}/priority`, { priority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket-details', selectedTicketId] });
      addToast(lang === 'en' ? 'Ticket priority updated' : 'تم تحديث أهمية التذكرة', 'success');
    },
  });

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: async ({ id, assignedToId }: { id: string; assignedToId: string }) => {
      await api.put(`/support/tickets/${id}/assign`, { assignedToId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket-details', selectedTicketId] });
      addToast(lang === 'en' ? 'Ticket assigned successfully' : 'تم تعيين التذكرة للوكيل بنجاح', 'success');
    },
  });

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setIsReplying(true);
    try {
      const formData = new FormData();
      formData.append('message', replyMessage);
      formData.append('isInternal', String(isInternal));
      if (replyAttachment) {
        formData.append('attachment', replyAttachment);
      }

      await api.post(`/support/tickets/${selectedTicketId}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setReplyMessage('');
      setIsInternal(false);
      setReplyAttachment(null);
      addToast(lang === 'en' ? 'Message sent successfully' : 'تم إرسال الرد بنجاح', 'success');
      
      // Refresh details
      queryClient.invalidateQueries({ queryKey: ['support-ticket-details', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to send reply', 'error');
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-text-primary dark:text-neutral-100 flex items-center gap-2">
          <FileText className="w-6 h-6 text-mint-500" />
          {lang === 'en' ? 'Tickets Workspace' : 'إدارة تذاكر الدعم الفني'}
        </h2>
        <p className="text-xs font-semibold text-text-secondary dark:text-neutral-400 mt-1">
          {lang === 'en' ? 'Manage, assign, reply to student queries, and record internal staff notes.' : 'إدارة وتعيين الرد على استفسارات الطلاب، وتسجيل الملاحظات الداخلية.'}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder={lang === 'en' ? 'Search ticket number, subject, student...' : 'ابحث برقم التذكرة أو الموضوع أو اسم الطالب...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg outline-none focus:ring-1 focus:ring-mint-500 bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg outline-none cursor-pointer bg-white"
        >
          <option value="">{lang === 'en' ? 'All Statuses' : 'جميع الحالات'}</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Waiting for Student">Waiting for Student</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg outline-none cursor-pointer bg-white"
        >
          <option value="">{lang === 'en' ? 'All Priorities' : 'جميع درجات الأهمية'}</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>
      </div>

      {/* Workspace Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Left Column: Tickets list (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-soft flex flex-col min-w-0">
          <div className="p-4 border-b border-beige-100 dark:border-neutral-850 bg-beige-50/20">
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">
              {lang === 'en' ? 'Support Ticket Stream' : 'تدفق تذاكر الدعم'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[550px] divide-y divide-beige-50 dark:divide-neutral-850">
            {isLoadingTickets ? (
              <div className="p-8 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-6 h-6 text-mint-500 animate-spin" />
                <span className="text-[10px] text-text-secondary font-bold">
                  {lang === 'en' ? 'Loading tickets...' : 'جاري تحميل التذاكر...'}
                </span>
              </div>
            ) : tickets.length === 0 ? (
              <p className="p-8 text-center text-xs text-text-secondary font-bold">
                {lang === 'en' ? 'No tickets found match filters' : 'لا توجد تذاكر مطابقة للفلاتر'}
              </p>
            ) : (
              tickets.map((t: any) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-4 hover:bg-beige-50/50 dark:hover:bg-neutral-850 cursor-pointer transition-colors relative flex items-start gap-3 ${
                    selectedTicketId === t.id ? 'bg-beige-50 dark:bg-neutral-850/80' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-xs font-black text-text-primary dark:text-neutral-200 truncate">
                        {t.student?.name}
                      </span>
                      <span className="text-[8px] font-bold text-text-secondary/70">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[10px] font-black text-mint-500 mt-0.5">{t.ticketNumber} | {t.category}</p>
                    <p className="text-xs font-bold text-text-secondary dark:text-neutral-300 truncate mt-0.5">
                      {t.subject}
                    </p>
                    
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                        t.priority === 'Urgent' || t.priority === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-beige-100 text-text-secondary'
                      }`}>
                        {t.priority}
                      </span>
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                        t.status === 'Resolved' || t.status === 'Closed' ? 'bg-mint-50 text-mint-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-secondary/50 self-center" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Detailed Workspace & Chat (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft flex flex-col overflow-hidden min-h-[550px]">
          {isLoadingDetails ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-2">
              <Loader2 className="w-8 h-8 text-mint-500 animate-spin" />
              <span className="text-xs text-text-secondary font-bold">
                {lang === 'en' ? 'Loading ticket workspace details...' : 'جاري تحميل تفاصيل تذكرة الدعم...'}
              </span>
            </div>
          ) : ticket ? (
            <div className="flex flex-col h-full flex-1">
              {/* Header Details with Action selectors */}
              <div className="p-4 border-b border-beige-100 dark:border-neutral-850 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-beige-50/10 gap-3">
                <div>
                  <h3 className="text-xs font-black text-text-primary dark:text-neutral-100 flex items-center gap-1.5">
                    <span className="text-mint-500">{ticket.ticketNumber}</span>
                    <span>{ticket.subject}</span>
                  </h3>
                  <p className="text-[10px] text-text-secondary font-bold mt-1">
                    Category: {ticket.category}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Status update */}
                  <select
                    value={ticket.status}
                    onChange={(e) => updateStatusMutation.mutate({ id: ticket.id, status: e.target.value })}
                    className="px-2 py-1 text-[10px] font-black border border-beige-200 dark:border-neutral-700 dark:bg-neutral-800 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Waiting for Student">Waiting for Student</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>

                  {/* Priority update */}
                  <select
                    value={ticket.priority}
                    onChange={(e) => updatePriorityMutation.mutate({ id: ticket.id, priority: e.target.value })}
                    className="px-2 py-1 text-[10px] font-black border border-beige-200 dark:border-neutral-700 dark:bg-neutral-800 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>

                  {/* Assignee update */}
                  <select
                    value={ticket.assignedToId || ''}
                    onChange={(e) => assignMutation.mutate({ id: ticket.id, assignedToId: e.target.value })}
                    className="px-2 py-1 text-[10px] font-black border border-beige-200 dark:border-neutral-700 dark:bg-neutral-800 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="">{lang === 'en' ? 'Unassigned' : 'غير معينة'}</option>
                    {agents.map((agent: any) => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid content inside Ticket detail: Student Info (left-ish tab or top header collapse) */}
              <div className="p-4 border-b border-beige-100 dark:border-neutral-850 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-text-primary dark:text-neutral-200">
                {/* Student Overview */}
                <div className="md:col-span-2 space-y-1.5">
                  <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider block">Student profile</span>
                  <div className="flex items-center gap-2">
                    {ticket.student?.profilePhoto ? (
                      <img src={ticket.student.profilePhoto} alt={ticket.student.name} className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-beige-200 dark:bg-neutral-800 text-text-secondary dark:text-neutral-300 flex items-center justify-center font-bold text-xs rounded-lg">
                        {ticket.student?.name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-text-primary dark:text-neutral-100">{ticket.student?.name}</p>
                      <p className="text-[10px] text-text-secondary truncate">{ticket.student?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Academic enrollments count */}
                <div className="border-l border-beige-100 dark:border-neutral-850 pl-4 space-y-1">
                  <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider block">Academics</span>
                  <p className="text-[10px] font-bold">
                    {lang === 'en'
                      ? `${ticket.student?.enrollments?.length || 0} Registered Courses`
                      : `${ticket.student?.enrollments?.length || 0} مقررات مسجلة`}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 bg-beige-50/30 dark:bg-neutral-850/20 border-b border-beige-100 dark:border-neutral-850 text-xs font-semibold text-text-primary dark:text-neutral-350">
                <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider block mb-1">Issue Description</span>
                <p className="leading-relaxed bg-white dark:bg-neutral-900 border border-beige-100 dark:border-neutral-800 p-3 rounded-xl">
                  {ticket.description}
                </p>

                {ticket.attachment && (
                  <div className="mt-4 space-y-2 max-w-sm">
                    <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider block">Attachment / Screenshot</span>
                    {ticket.attachment.match(/\.(jpeg|jpg|gif|png|webp)$/i) || ticket.attachment.includes('cloudinary') ? (
                      <div className="relative group rounded-xl overflow-hidden border border-beige-250 dark:border-neutral-800 bg-beige-50 dark:bg-neutral-950 p-1 flex justify-center">
                        <img
                          src={ticket.attachment}
                          alt="Screenshot Attachment"
                          className="max-h-48 object-contain rounded-lg hover:scale-[1.02] transition-transform cursor-pointer"
                          onClick={() => window.open(ticket.attachment, '_blank')}
                        />
                      </div>
                    ) : (
                      <div className="p-2 bg-white dark:bg-neutral-900 border border-beige-100 dark:border-neutral-800 rounded-lg flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="w-3.5 h-3.5 text-mint-500 flex-shrink-0" />
                          <span className="text-[10px] font-bold truncate block dark:text-neutral-300">
                            {ticket.attachment.split('/').pop() || 'attachment.png'}
                          </span>
                        </div>
                        <a
                          href={ticket.attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-beige-100 dark:bg-neutral-800 hover:bg-beige-200 rounded-lg flex items-center justify-center flex-shrink-0"
                        >
                          <Download className="w-3.5 h-3.5 text-text-secondary" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto max-h-[300px] p-4 space-y-4">
                {ticket.messages.length === 0 ? (
                  <p className="text-center text-[10px] text-text-secondary py-8">{lang === 'en' ? 'No replies in this ticket conversation thread yet.' : 'لا توجد ردود في محادثة التذكرة بعد.'}</p>
                ) : (
                  ticket.messages.map((msg: any) => {
                    const isSelf = msg.senderId === reqUser()?.id;
                    const senderRole = msg.sender?.role;
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[80%] ${isSelf ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        {/* Sender Label */}
                        <span className="text-[8px] font-bold text-text-secondary mb-1">
                          {msg.sender?.name} {senderRole === 'SUPPORT' ? '(Support Agent)' : ''} {msg.isInternal ? '[INTERNAL NOTE]' : ''}
                        </span>

                        <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed whitespace-pre-wrap ${
                          msg.isInternal
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : isSelf
                              ? 'bg-mint-500 text-white'
                              : 'bg-beige-100 dark:bg-neutral-800 text-text-primary dark:text-neutral-100'
                        }`}>
                          <p>{msg.message}</p>
                          {msg.attachment && (
                            <div className="mt-2 space-y-1">
                              {msg.attachment.match(/\.(jpeg|jpg|gif|png|webp)$/i) || msg.attachment.includes('cloudinary') ? (
                                <img
                                  src={msg.attachment}
                                  alt="Attached Screenshot"
                                  className="max-h-32 object-contain rounded-lg border border-beige-200/50 cursor-pointer hover:opacity-90"
                                  onClick={() => window.open(msg.attachment, '_blank')}
                                />
                              ) : (
                                <a
                                  href={msg.attachment}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[9px] underline font-black"
                                >
                                  <Paperclip className="w-3.5 h-3.5" />
                                  View Attachment
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        <span className="text-[7px] text-text-secondary/70 mt-0.5">
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handlePostReply} className="p-4 border-t border-beige-100 dark:border-neutral-850 space-y-3 bg-beige-50/10">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder={lang === 'en' ? 'Type response reply here...' : 'اكتب ردك ومساعدتك هنا...'}
                  rows={3}
                  className="w-full px-3 py-2 text-xs font-semibold border border-beige-200 dark:border-neutral-700 dark:bg-neutral-900 rounded-lg outline-none focus:ring-1 focus:ring-mint-500 bg-white"
                />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  {/* File attachment upload & Internal note toggle */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setReplyAttachment(e.target.files[0]);
                        } else {
                          setReplyAttachment(null);
                        }
                      }}
                      className="text-xs text-text-secondary file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[9px] file:font-black file:bg-beige-100 dark:file:bg-neutral-800 file:text-text-primary dark:file:text-neutral-200 hover:file:bg-beige-200 cursor-pointer max-w-[180px]"
                    />

                    <label className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="w-3.5 h-3.5 border-beige-200 rounded outline-none"
                      />
                      <EyeOff className="w-3.5 h-3.5" />
                      {lang === 'en' ? 'Internal Note' : 'ملاحظة سرية للموظفين'}
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isReplying}
                    className="px-4 py-2 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft flex items-center gap-1.5 self-end transition-transform hover:scale-102"
                  >
                    {isReplying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {lang === 'en' ? 'Sending...' : 'جاري الإرسال...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        {lang === 'en' ? 'Send Response' : 'إرسال الرد'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-secondary">
              <FileText className="w-12 h-12 text-beige-300 mb-3" />
              <p className="text-xs font-extrabold">
                {lang === 'en' ? 'Select a support ticket from the stream sidebar.' : 'اختر تذكرة دعم فني للعمل عليها.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Local helper to fetch current user id
function reqUser() {
  if (typeof window !== 'undefined') {
    const store = localStorage.getItem('auth-storage');
    if (store) {
      try {
        const parsed = JSON.parse(store);
        return parsed.state?.user;
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}
