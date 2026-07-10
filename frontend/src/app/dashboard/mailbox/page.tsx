'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '../../../hooks/useAuthStore';
import { useToastStore } from '../../../hooks/useToastStore';
import { useTranslation } from '../../../hooks/useTranslation';
import { api } from '../../../utils/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Send,
  Inbox,
  HelpCircle,
  Plus,
  Trash2,
  Paperclip,
  CheckCircle,
  X,
  Search,
  User,
  Clock,
  Download,
  Loader2,
  ChevronRight
} from 'lucide-react';

export default function MailboxPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initial tab based on role and query param
  const paramView = searchParams.get('view');
  const defaultTab = paramView === 'support' && (user?.role === 'SUPPORT' || user?.role === 'ADMIN')
    ? 'support'
    : 'inbox';

  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'support' | 'tickets'>(defaultTab as any);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Compose email state
  const [replyMessage, setReplyMessage] = useState('');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [receiverId, setReceiverId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [contactSearch, setContactSearch] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Sync tab if search parameter changes
  useEffect(() => {
    if (paramView === 'support' && (user?.role === 'SUPPORT' || user?.role === 'ADMIN')) {
      setActiveTab('support');
    }
  }, [paramView, user]);

  // Fetch emails
  const { data: emails = [], isLoading: isLoadingEmails } = useQuery({
    queryKey: ['emails', activeTab],
    queryFn: async () => {
      if (activeTab === 'tickets') {
        const response = await api.get('/support/tickets/my');
        return response.data.map((t: any) => ({
          ...t,
          sender: { name: t.assignedTo?.name || 'Help Centre Support', email: 'support@lms.com' },
          receiver: { name: user?.name, email: user?.email },
          isRead: true,
        }));
      }
      const response = await api.get(`/emails?type=${activeTab}`);
      return response.data;
    },
    enabled: !!user,
  });

  // Fetch detailed ticket conversations (if viewing a ticket)
  const isSelectedTicket = selectedEmail && !!selectedEmail.ticketNumber;
  const { data: ticketDetails = null, isLoading: isLoadingTicketDetails } = useQuery({
    queryKey: ['mailbox-ticket-details', selectedEmail?.id],
    queryFn: async () => {
      const response = await api.get(`/support/tickets/${selectedEmail.id}`);
      return response.data;
    },
    enabled: isSelectedTicket,
  });

  const sendTicketReplyMutation = useMutation({
    mutationFn: async ({ ticketId, msgText }: { ticketId: string; msgText: string }) => {
      await api.post(`/support/tickets/${ticketId}/messages`, { message: msgText });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailbox-ticket-details', selectedEmail?.id] });
      addToast(lang === 'en' ? 'Reply sent successfully!' : 'تم إرسال الرد بنجاح!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to send reply', 'error');
    },
  });

  // Fetch contact list
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await api.get('/users/contacts');
      return response.data;
    },
    enabled: !!user,
  });

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/emails/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });

  const deleteEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/emails/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      addToast(lang === 'en' ? 'Email deleted successfully' : 'تم حذف البريد بنجاح', 'success');
      setSelectedEmail(null);
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to delete email', 'error');
    },
  });

  const handleSelectEmail = (email: any) => {
    setSelectedEmail(email);
    if (!email.isRead && email.receiverId === user?.id) {
      markReadMutation.mutate(email.id);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId || !subject.trim() || !message.trim()) {
      addToast(lang === 'en' ? 'Please fill out all fields' : 'يرجى ملء جميع الحقول', 'error');
      return;
    }

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('receiverId', receiverId);
      formData.append('subject', subject);
      formData.append('message', message);
      if (attachment) {
        formData.append('attachment', attachment);
      }

      await api.post('/emails', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      addToast(lang === 'en' ? 'Email sent successfully!' : 'تم إرسال البريد بنجاح!', 'success');
      
      // Reset compose form
      setReceiverId('');
      setSubject('');
      setMessage('');
      setAttachment(null);
      setContactSearch('');
      setIsComposeOpen(false);
      
      // Refresh sent box
      queryClient.invalidateQueries({ queryKey: ['emails', 'sent'] });
      if (activeTab === 'sent') {
        setActiveTab('sent');
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to send email', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Filter emails by search query
  const filteredEmails = emails.filter((email: any) => {
    const term = searchQuery.toLowerCase();
    const subMatch = email.subject.toLowerCase().includes(term);
    const msgMatch = email.message.toLowerCase().includes(term);
    const senderName = email.sender?.name.toLowerCase().includes(term);
    const receiverName = email.receiver?.name.toLowerCase().includes(term);
    return subMatch || msgMatch || senderName || receiverName;
  });

  // Filter contacts by search query inside composer
  const filteredContacts = contacts.filter((c: any) => {
    const term = contactSearch.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-beige-200 dark:border-neutral-800 shadow-soft gap-4">
        <div>
          <h2 className="text-xl font-black text-text-primary dark:text-neutral-100 flex items-center gap-2">
            <Mail className="w-6 h-6 text-mint-500" />
            {lang === 'en' ? 'Internal Mailbox' : 'البريد الداخلي'}
          </h2>
          <p className="text-xs font-semibold text-text-secondary dark:text-neutral-400 mt-1">
            {lang === 'en'
              ? 'Send internal messages and attachments to doctors, TAs, support or colleagues.'
              : 'أرسل رسائل وملفات مرفقة للدكاترة، المعيدين، الدعم أو زملائك.'}
          </p>
        </div>

        <button
          onClick={() => setIsComposeOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft self-start sm:self-center transition-transform hover:scale-103"
        >
          <Plus className="w-4 h-4" />
          {lang === 'en' ? 'Compose Mail' : 'إنشاء رسالة'}
        </button>
      </div>

      {/* Tabs Selection Bar */}
      <div className="flex gap-2 border-b border-beige-200 dark:border-neutral-800 pb-2">
        <button
          onClick={() => {
            setActiveTab('inbox');
            setSelectedEmail(null);
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'inbox'
              ? 'bg-mint-500 text-white shadow-soft'
              : 'text-text-secondary hover:bg-beige-100 dark:hover:bg-neutral-850'
          }`}
        >
          <Inbox className="w-4 h-4" />
          {lang === 'en' ? 'Inbox' : 'البريد الوارد'}
        </button>

        <button
          onClick={() => {
            setActiveTab('sent');
            setSelectedEmail(null);
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'sent'
              ? 'bg-mint-500 text-white shadow-soft'
              : 'text-text-secondary hover:bg-beige-100 dark:hover:bg-neutral-850'
          }`}
        >
          <Send className="w-4 h-4" />
          {lang === 'en' ? 'Sent' : 'المرسل'}
        </button>

        <button
          onClick={() => {
            setActiveTab('tickets');
            setSelectedEmail(null);
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'tickets'
              ? 'bg-mint-500 text-white shadow-soft'
              : 'text-text-secondary hover:bg-beige-100 dark:hover:bg-neutral-850'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          {lang === 'en' ? 'My Support Tickets' : 'تذاكر الدعم الخاصة بي'}
        </button>

        {(user?.role === 'SUPPORT' || user?.role === 'ADMIN') && (
          <button
            onClick={() => {
              setActiveTab('support');
              setSelectedEmail(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'support'
                ? 'bg-amber-500 text-white shadow-soft'
                : 'text-text-secondary hover:bg-beige-100 dark:hover:bg-neutral-850'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            {lang === 'en' ? 'Support Tickets' : 'تذاكر الدعم'}
          </button>
        )}
      </div>

      {/* Main Mailbox Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-soft min-h-[550px]">
        {/* Left Side: Email List (4 Cols) */}
        <div className="lg:col-span-5 border-r border-beige-200 dark:border-neutral-800 flex flex-col min-w-0">
          {/* Email List Search bar */}
          <div className="p-4 border-b border-beige-200 dark:border-neutral-800 flex items-center gap-2">
            <Search className="w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder={lang === 'en' ? 'Search subject, author...' : 'ابحث في الموضوع أو المرسل...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-semibold outline-none border-none dark:bg-transparent dark:text-neutral-100"
            />
          </div>

          {/* List Loader / Listing */}
          <div className="flex-1 overflow-y-auto max-h-[500px]">
            {isLoadingEmails ? (
              <div className="p-8 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-6 h-6 text-mint-500 animate-spin" />
                <span className="text-[10px] text-text-secondary font-bold">
                  {lang === 'en' ? 'Loading mailbox...' : 'جاري تحميل البريد...'}
                </span>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="p-12 text-center text-text-secondary">
                <Mail className="w-8 h-8 text-beige-300 mx-auto mb-2" />
                <p className="text-xs font-bold">{lang === 'en' ? 'No messages found' : 'لا توجد رسائل'}</p>
              </div>
            ) : (
              <div className="divide-y divide-beige-100 dark:divide-neutral-800">
                {filteredEmails.map((email: any) => {
                  const partner = activeTab === 'sent' ? email.receiver : email.sender;
                  const isUnread = !email.isRead && email.receiverId === user?.id;
                  
                  return (
                    <div
                      key={email.id}
                      onClick={() => handleSelectEmail(email)}
                      className={`p-4 hover:bg-beige-50/50 dark:hover:bg-neutral-850 cursor-pointer transition-colors relative flex items-start gap-3 ${
                        selectedEmail?.id === email.id ? 'bg-beige-50 dark:bg-neutral-850/80' : ''
                      } ${isUnread ? 'bg-mint-50/20 dark:bg-mint-950/10' : ''}`}
                    >
                      {/* Read / Unread Indicator */}
                      {isUnread && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-mint-500" />
                      )}

                      {/* Partner Avatar */}
                      <div className="flex-shrink-0">
                        {partner?.profilePhoto ? (
                          <img
                            src={partner.profilePhoto}
                            alt={partner.name}
                            className="w-9 h-9 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 bg-beige-200 dark:bg-neutral-800 text-text-secondary dark:text-neutral-300 flex items-center justify-center font-bold text-xs rounded-xl">
                            {partner?.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>

                      {/* Content details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <span className={`text-xs truncate block ${isUnread ? 'font-black text-text-primary dark:text-neutral-100' : 'font-bold text-text-secondary dark:text-neutral-300'}`}>
                            {partner?.name || 'LMS User'}
                          </span>
                          <span className="text-[8px] font-bold text-text-secondary/70 flex-shrink-0">
                            {new Date(email.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${isUnread ? 'font-bold text-text-primary dark:text-neutral-100' : 'font-semibold text-text-secondary dark:text-neutral-400'}`}>
                          {email.subject}
                        </p>
                        <p className="text-[10px] text-text-secondary/70 truncate mt-0.5">
                          {email.message}
                        </p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-text-secondary/50 self-center" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Email Content View (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col min-w-0 bg-beige-50/20 dark:bg-neutral-900">
          {selectedEmail ? (
            <div className="p-6 flex flex-col h-full space-y-6">
              {/* Top Controls: Subject & Delete */}
              <div className="flex justify-between items-start border-b border-beige-200 dark:border-neutral-800 pb-4 gap-4">
                <div>
                  <h3 className="text-base font-black text-text-primary dark:text-neutral-100">
                    {selectedEmail.subject}
                  </h3>
                  {selectedEmail.isSupport && (
                    <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-500 text-[8px] font-black uppercase rounded mt-1.5 tracking-wider">
                      Help Centre Ticket
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (confirm(lang === 'en' ? 'Are you sure you want to delete this email?' : 'هل أنت متأكد من حذف هذه الرسالة؟')) {
                      deleteEmailMutation.mutate(selectedEmail.id);
                    }
                  }}
                  className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/50 rounded-xl transition-colors flex-shrink-0"
                  title="Delete email"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {isSelectedTicket ? (
                <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                  <div className="p-4 bg-beige-50 dark:bg-neutral-850 rounded-2xl border border-beige-200 dark:border-neutral-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-mint-500">{ticketDetails?.ticketNumber}</span>
                      <span className="px-2 py-0.5 bg-mint-50 text-mint-600 dark:bg-mint-950/20 dark:text-mint-400 text-[8px] font-black uppercase rounded">
                        Status: {ticketDetails?.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-text-primary dark:text-neutral-200 leading-relaxed bg-white dark:bg-neutral-900 p-3 rounded-xl border border-beige-100 dark:border-neutral-800">
                      {ticketDetails?.description}
                    </p>
                  </div>

                  {/* Message History Chat */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-1">
                    {ticketDetails?.messages?.map((msg: any) => {
                      const isSelf = msg.senderId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[85%] ${isSelf ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                        >
                          <span className="text-[7.5px] font-bold text-text-secondary mb-0.5">
                            {msg.sender?.name} {msg.sender?.role === 'SUPPORT' ? '(Support Agent)' : ''}
                          </span>
                          <div className={`p-2.5 rounded-xl text-xs font-semibold leading-relaxed ${
                            isSelf
                              ? 'bg-mint-500 text-white'
                              : 'bg-beige-100 dark:bg-neutral-805 text-text-primary dark:text-neutral-200'
                          }`}>
                            {msg.message}
                          </div>
                          <span className="text-[6.5px] text-text-secondary/70 mt-0.5">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Send reply form */}
                  {ticketDetails?.status !== 'Closed' && ticketDetails?.status !== 'Resolved' && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!replyMessage.trim()) return;
                        sendTicketReplyMutation.mutate({ ticketId: ticketDetails.id, msgText: replyMessage });
                        setReplyMessage('');
                      }}
                      className="flex gap-2 border-t border-beige-100 dark:border-neutral-850 pt-3"
                    >
                      <input
                        type="text"
                        placeholder={lang === 'en' ? 'Type response to support agent...' : 'اكتب ردك لوكيل الدعم الفني...'}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-semibold border border-beige-200 dark:border-neutral-700 dark:bg-neutral-900 rounded-lg outline-none bg-white dark:text-neutral-200"
                      />
                      <button
                        type="submit"
                        className="p-2 bg-mint-500 hover:bg-mint-400 text-white rounded-lg flex items-center justify-center flex-shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <>
                  {/* Sender Details */}
                  <div className="flex items-center gap-3">
                    {selectedEmail.sender?.profilePhoto ? (
                      <img
                        src={selectedEmail.sender.profilePhoto}
                        alt={selectedEmail.sender.name}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-beige-200 dark:bg-neutral-800 text-text-secondary dark:text-neutral-300 flex items-center justify-center font-bold text-sm rounded-xl">
                        {selectedEmail.sender?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                        <span className="text-xs font-black text-text-primary dark:text-neutral-100">
                          {selectedEmail.sender?.name}
                        </span>
                        <span className="text-[9px] font-semibold text-text-secondary flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(selectedEmail.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] text-text-secondary/70 truncate block">
                        {lang === 'en' ? 'From:' : 'من:'} {selectedEmail.sender?.email} | {lang === 'en' ? 'To:' : 'إلى:'} {selectedEmail.receiver?.name}
                      </span>
                    </div>
                  </div>

                  {/* Message Content Body */}
                  <div className="flex-1 text-xs text-text-primary dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 p-6 rounded-2xl font-semibold leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[300px]">
                    {selectedEmail.message}
                  </div>

                  {/* Attachment Download Container */}
                  {selectedEmail.attachment && (
                    <div className="p-4 bg-beige-50 dark:bg-neutral-850 rounded-2xl border border-beige-200 dark:border-neutral-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Paperclip className="w-4 h-4 text-mint-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-text-secondary block">
                            {lang === 'en' ? 'Attachment File:' : 'الملف المرفق:'}
                          </span>
                          <span className="text-[11px] font-black text-text-primary dark:text-neutral-200 truncate block">
                            {selectedEmail.attachment.split('/').pop() || 'screenshot.jpg'}
                          </span>
                        </div>
                      </div>
                      <a
                        href={selectedEmail.attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-mint-500 hover:bg-mint-400 text-white rounded-xl shadow-soft flex items-center justify-center"
                        title="Download attachment"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-text-secondary">
              <Mail className="w-12 h-12 text-beige-300 mb-3" />
              <p className="text-xs font-extrabold">
                {lang === 'en' ? 'Select an email to read its details' : 'اختر رسالة لقراءة تفاصيلها'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* COMPOSE NEW EMAIL MODAL WINDOW */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[5px] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-premium border border-beige-200 dark:border-neutral-800 space-y-4 text-xs font-semibold animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-beige-100 dark:border-neutral-850 pb-2">
              <h3 className="text-sm font-bold text-text-primary dark:text-neutral-100 flex items-center gap-2">
                <Send className="w-4 h-4 text-mint-500" />
                {lang === 'en' ? 'New Internal Message' : 'رسالة جديدة'}
              </h3>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="text-text-secondary hover:text-text-primary dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
              {/* Recipient Selector with search filter */}
              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold text-text-primary dark:text-neutral-300 block">
                  {lang === 'en' ? 'Select Recipient *' : 'اختر المستلم *'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'en' ? 'Type recipient name/email to search...' : 'اكتب اسم أو بريد المستلم للبحث...'}
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg outline-none focus:ring-1 focus:ring-mint-500 bg-white"
                />

                {/* Recipient list dropdown */}
                {contactSearch.trim() && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-neutral-850 border border-beige-200 dark:border-neutral-700 rounded-xl shadow-premium divide-y divide-beige-100 dark:divide-neutral-800">
                    {filteredContacts.length === 0 ? (
                      <p className="p-3 text-center text-text-secondary text-[10px]">
                        {lang === 'en' ? 'No users found matching search' : 'لا يوجد مستخدم مطابق للبحث'}
                      </p>
                    ) : (
                      filteredContacts.map((contact: any) => (
                        <div
                          key={contact.id}
                          onClick={() => {
                            setReceiverId(contact.id);
                            setContactSearch(`${contact.name} (${contact.email})`);
                          }}
                          className={`p-2.5 hover:bg-beige-50 dark:hover:bg-neutral-800 cursor-pointer flex items-center justify-between gap-3 text-left ${
                            receiverId === contact.id ? 'bg-mint-50/50 dark:bg-mint-950/20' : ''
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-text-primary dark:text-neutral-100 block">
                              {contact.name}
                            </span>
                            <span className="text-[9px] text-text-secondary block">
                              {contact.email}
                            </span>
                          </div>
                          <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase bg-beige-100 text-text-secondary dark:bg-neutral-800 flex-shrink-0">
                            {contact.role}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Subject Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-primary dark:text-neutral-300 block">
                  {lang === 'en' ? 'Subject *' : 'الموضوع *'}
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg outline-none focus:ring-1 focus:ring-mint-500 bg-white"
                  placeholder={lang === 'en' ? 'Message subject...' : 'موضوع الرسالة...'}
                />
              </div>

              {/* Message Textarea */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-primary dark:text-neutral-300 block">
                  {lang === 'en' ? 'Message Body *' : 'نص الرسالة *'}
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg outline-none focus:ring-1 focus:ring-mint-500 bg-white"
                  placeholder={lang === 'en' ? 'Write your message details here...' : 'اكتب تفاصيل رسالتك هنا...'}
                />
              </div>

              {/* Attachment Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-primary dark:text-neutral-300 block">
                  {lang === 'en' ? 'Attachment File (Optional)' : 'ملف مرفق (اختياري)'}
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setAttachment(e.target.files[0]);
                    } else {
                      setAttachment(null);
                    }
                  }}
                  className="w-full text-xs text-text-secondary file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-beige-100 file:text-text-primary hover:file:bg-beige-200 cursor-pointer"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {lang === 'en' ? 'Sending Message...' : 'جاري إرسال الرسالة...'}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {lang === 'en' ? 'Send Message' : 'إرسال الرسالة'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
