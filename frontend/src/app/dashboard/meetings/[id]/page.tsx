'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useToastStore } from '@/hooks/useToastStore';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Loader2,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Download,
  Send,
  X,
  User,
  LogOut,
  PhoneOff,
  MessageSquare,
  Users,
  Sun,
  Moon,
} from 'lucide-react';
import Link from 'next/link';

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { t, lang } = useTranslation();
  const meetingId = params.id as string;

  // Local media stream states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingActive, setIsRecordingActive] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(false);

  // Chat states & UI configurations
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'participants'>('chat');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Real call participants list
  const [activeParticipants, setActiveParticipants] = useState<any[]>([]);

  // Detect and set active layout theme
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof document !== 'undefined') {
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // 1. Fetch Meeting Details
  const { data: meeting, isLoading: isMeetingLoading } = useQuery({
    queryKey: ['meetingDetails', meetingId],
    queryFn: async () => {
      const response = await api.get(`/meetings/${meetingId}`);
      return response.data;
    },
    enabled: !!meetingId,
  });

  // End Meeting Mutation (Host Only)
  const endMeetingMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/meetings/${meetingId}/end`);
    },
    onSuccess: () => {
      addToast('Meeting ended successfully', 'success');
      router.replace('/dashboard/meetings');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to end meeting', 'error');
    },
  });

  // Post Message Mutation
  const postMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await api.post(`/meetings/${meetingId}/messages`, { message: messageText });
      return response.data;
    },
    onSuccess: () => {
      setChatInput('');
      refetchMessages();
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    postMessageMutation.mutate(chatInput.trim());
  };

  // Fetch active call participants
  const fetchParticipants = async () => {
    try {
      const response = await api.get(`/meetings/${meetingId}/participants`);
      setActiveParticipants(response.data);
    } catch (e) {
      console.error('Failed to fetch participants:', e);
    }
  };

  // Polling chat messages
  const fetchMessages = async () => {
    try {
      const response = await api.get(`/meetings/${meetingId}/messages`);
      setMessages(response.data);
    } catch (e) {
      console.error('Failed to poll messages:', e);
    }
  };

  const refetchMessages = () => {
    fetchMessages();
  };

  // Poll messages every 3 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [meetingId]);

  // Poll meeting status every 4 seconds to check if host ended it
  useEffect(() => {
    const checkMeetingActive = async () => {
      try {
        const response = await api.get(`/meetings/${meetingId}`);
        if (!response.data.isActive) {
          addToast('This meeting has been ended by the host.', 'error');
          cleanupStream();
          router.replace('/dashboard/meetings');
        }
      } catch (e) {
        // Ignored or handles deletion
      }
    };
    const interval = setInterval(checkMeetingActive, 4000);
    return () => clearInterval(interval);
  }, [meetingId, router]);

  const updateMediaStatus = async (newMic: boolean, newCam: boolean) => {
    try {
      await api.post(`/meetings/${meetingId}/update-media`, { micOn: newMic, cameraOn: newCam });
      fetchParticipants();
    } catch (e) {
      console.error('Failed to update media status:', e);
    }
  };

  // Sync join/leave state with backend activeAttendee registry
  useEffect(() => {
    isMountedRef.current = true;
    const joinCall = async () => {
      try {
        await api.post(`/meetings/${meetingId}/join`);
        await api.post(`/meetings/${meetingId}/update-media`, { micOn, cameraOn });
        fetchParticipants();
      } catch (err) {
        console.error('Failed to join call attendee registry:', err);
      }
    };
    joinCall();

    const interval = setInterval(fetchParticipants, 3500);

    return () => {
      clearInterval(interval);
      isMountedRef.current = false;
      setTimeout(() => {
        if (!isMountedRef.current) {
          api.post(`/meetings/${meetingId}/leave`).catch(console.error);
        }
      }, 1000);
    };
  }, [meetingId]);

  // Request user camera/mic stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    async function initMedia() {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(activeStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = activeStream;
        }
      } catch (err) {
        console.warn('Media devices access denied or unavailable:', err);
      }
    }
    initMedia();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, sidebarTab]);

  const cleanupStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    let nextState = !cameraOn;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        nextState = videoTrack.enabled;
      }
    }
    setCameraOn(nextState);
    updateMediaStatus(micOn, nextState);
  };

  // Toggle Microphone
  const toggleMic = () => {
    let nextState = !micOn;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        nextState = audioTrack.enabled;
      }
    }
    setMicOn(nextState);
    updateMediaStatus(nextState, cameraOn);
  };

  // Toggle Screen Sharing Real
  const toggleScreenSharing = async () => {
    // Check if mobile device
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
    if (isMobile) {
      addToast(lang === 'en' ? 'Screen sharing is only supported on Desktop browsers.' : 'مشاركة الشاشة مدعومة فقط على متصفحات الكمبيوتر.', 'error');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      addToast(lang === 'en' ? 'Screen sharing is not supported by your browser.' : 'متصفحك لا يدعم مشاركة الشاشة.', 'error');
      return;
    }

    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      
      // Re-enable camera stream
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: micOn,
        });
        setStream(camStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = camStream;
        }
      } catch (e) {
        console.error(e);
      }
      addToast('Screen sharing stopped', 'success');
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        // Listen for stop sharing from native window bar
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
          // Re-enable camera
          navigator.mediaDevices.getUserMedia({ video: true, audio: micOn }).then((camStream) => {
            setStream(camStream);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = camStream;
            }
          });
        };
        addToast('Sharing screen to classroom...', 'success');
      } catch (err) {
        console.warn('Screen sharing denied:', err);
        addToast('Screen sharing canceled or unsupported', 'error');
      }
    }
  };

  // Recording State Switcher (blinking recording dot + compiler download)
  const handleToggleRecording = () => {
    if (isRecordingActive) {
      // Stop recording and download file
      setIsRecording(true);
      addToast('Saving meeting recording...', 'success');
      setTimeout(() => {
        const recordingData = `LMS Live Classroom Session Recording
Meeting ID: ${meetingId}
Meeting Title: ${meeting?.title}
Host: ${meeting?.hostName}
Date: ${new Date().toLocaleDateString()}
Duration: Mock 45 minutes
Status: Successfully Recorded and Compiled.`;

        const blob = new Blob([recordingData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `meeting_recording_${meetingId}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setIsRecordingActive(false);
        setIsRecording(false);
        addToast('Recording downloaded successfully!', 'success');
      }, 2000);
    } else {
      // Start recording session
      setIsRecordingActive(true);
      addToast('Recording live classroom session...', 'success');
    }
  };

  const handleLeave = async () => {
    cleanupStream();
    try {
      await api.post(`/meetings/${meetingId}/leave`);
    } catch (err) {
      console.error(err);
    }
    router.replace('/dashboard/meetings');
  };

  if (isMeetingLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-mint-500 animate-spin" />
        <p className="text-xs text-text-secondary mt-2">Connecting to classroom...</p>
      </div>
    );
  }

  if (!meeting || !meeting.isActive) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-beige-200">
        <p className="text-sm font-semibold text-text-secondary">Meeting is not active or has been ended.</p>
        <Link
          href="/dashboard/meetings"
          className="inline-block mt-4 px-4 py-2 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl"
        >
          Back to Meetings Overview
        </Link>
      </div>
    );
  }

  const isHost = meeting.hostId === user?.id || user?.role === 'ADMIN';

  // Mic/Video control buttons styling map (removes raw black color attributes in light mode)
  const micBtnClasses = micOn
    ? theme === 'dark'
      ? 'bg-neutral-800 border-neutral-700 text-neutral-100 hover:bg-neutral-750'
      : 'bg-mint-100 border-mint-200 text-mint-600 hover:bg-mint-200'
    : 'bg-rose-600 border-rose-500 text-white hover:bg-rose-500';

  const camBtnClasses = cameraOn
    ? theme === 'dark'
      ? 'bg-neutral-800 border-neutral-700 text-neutral-100 hover:bg-neutral-750'
      : 'bg-mint-100 border-mint-200 text-mint-600 hover:bg-mint-200'
    : 'bg-rose-600 border-rose-500 text-white hover:bg-rose-500';

  const screenBtnClasses = isScreenSharing
    ? 'bg-mint-500 border-mint-500 text-white hover:bg-mint-400'
    : theme === 'dark'
      ? 'bg-neutral-800 border-neutral-700 text-neutral-100 hover:bg-neutral-750'
      : 'bg-mint-100 border-mint-200 text-mint-600 hover:bg-mint-200';

  return (
    <div className={`fixed inset-0 z-40 flex flex-col justify-between select-none animate-fade-in ${
      theme === 'dark' ? 'bg-neutral-950 text-neutral-100' : 'bg-beige-50 text-text-primary'
    }`}>
      
      {/* Top Header bar */}
      <header className={`h-16 border-b px-6 flex items-center justify-between flex-shrink-0 ${
        theme === 'dark' ? 'bg-neutral-900 border-neutral-850 text-white' : 'bg-white border-beige-200 text-text-primary'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-mint-400 px-2 py-0.5 bg-mint-950/50 rounded border border-mint-900">
              {meeting.course?.code || 'LMS'}
            </span>
            <span className="flex items-center gap-1 text-[9px] font-extrabold text-rose-500 uppercase tracking-widest bg-rose-950/20 border border-rose-900 px-2 py-0.5 rounded">
              <span className="w-1 h-1 rounded-full bg-rose-500 animate-ping" /> {lang === 'en' ? 'Live' : 'مباشر'}
            </span>
          </div>
          <h2 className="text-sm font-black mt-0.5">{meeting.title}</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all ${
              theme === 'dark'
                ? 'bg-neutral-800 border-neutral-700 text-yellow-400 hover:bg-neutral-750'
                : 'bg-mint-50 border-mint-200 text-mint-500 hover:bg-mint-100'
            }`}
            title={lang === 'en' ? 'Toggle light/dark room' : 'تبديل وضع الغرفة'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <span className="hidden md:inline text-xs text-text-secondary font-semibold">
            {lang === 'en' ? 'Host' : 'المضيف'}: <strong className="text-text-primary font-bold">{meeting.hostName} ({meeting.hostRole})</strong>
          </span>

        </div>
      </header>

      {/* Main Room Body Grid */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Side: Video Feeds Workspace */}
        <div className={`flex-shrink-0 h-[30vh] lg:h-auto lg:flex-1 p-3 lg:p-6 overflow-y-auto flex items-center justify-center ${
          theme === 'dark' ? 'bg-neutral-950' : 'bg-beige-50/30'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-6 w-full max-w-4xl">
            
            {/* Local User Preview Frame */}
            <div className={`aspect-video border rounded-2xl relative overflow-hidden flex items-center justify-center shadow-lg ${
              theme === 'dark' ? 'bg-neutral-900 border-neutral-850' : 'bg-white border-beige-200'
            }`}>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover rounded-2xl scale-x-[-1] ${cameraOn ? 'block' : 'hidden'}`}
              />
              
              {!cameraOn && (
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center border font-extrabold text-xl animate-pulse ${
                    theme === 'dark'
                      ? 'bg-neutral-800 border-neutral-700 text-neutral-400'
                      : 'bg-beige-100 border-beige-200 text-text-secondary'
                  }`}>
                    {(user?.name || 'M').charAt(0)}
                  </div>
                  <span className="text-[10px] text-text-secondary uppercase tracking-widest font-extrabold">{(user?.name || 'Mariam Gamal')} ({lang === 'en' ? 'You' : 'أنت'})</span>
                </div>
              )}

              {/* Status Indicators overlays */}
              <div className="absolute bottom-3 left-3 bg-neutral-950/60 backdrop-blur-md px-3 py-1 rounded-lg border border-neutral-800 flex items-center gap-2 text-[10px] font-semibold text-white">
                <span className="font-bold">{user?.name}</span>
                <div className="flex items-center gap-1">
                  {micOn ? <Mic className="w-3 h-3 text-mint-400" /> : <MicOff className="w-3 h-3 text-rose-500" />}
                </div>
              </div>
            </div>

            {/* Host Preview Frame */}
            <div className={`aspect-video border rounded-2xl relative overflow-hidden flex items-center justify-center shadow-lg ${
              theme === 'dark' ? 'bg-neutral-900 border-neutral-850' : 'bg-white border-beige-200'
            }`}>
              {isScreenSharing ? (
                /* Screen sharing mockup view */
                <div className="w-full h-full bg-neutral-850 flex flex-col justify-between p-4 text-center">
                  <div className="flex justify-between items-center text-[10px] text-text-secondary border-b border-beige-100/10 pb-2 font-bold">
                    <span>{lang === 'en' ? 'LOCAL SCREEN PRESENTATION' : 'عرض مشاركة الشاشة الخاص بك'}</span>
                    <span className="text-mint-400 font-bold animate-pulse">{lang === 'en' ? 'ACTIVE STREAM' : 'البث نشط'}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center gap-2">
                    <Monitor className="w-12 h-12 text-mint-400 animate-bounce" />
                    <p className="text-xs font-bold text-text-primary">{lang === 'en' ? 'Sharing desktop source content...' : 'مشاركة محتويات شاشة الحاسوب...'}</p>
                    <span className="text-[10px] text-text-secondary">Resolving at 1080p 30fps</span>
                  </div>
                </div>
              ) : (
                /* Mock host video */
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-mint-950 border border-mint-800 text-mint-400 rounded-full flex items-center justify-center font-extrabold text-xl relative">
                    {meeting.hostName.charAt(0)}
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-mint-500 border-2 border-neutral-900 rounded-full" />
                  </div>
                  <span className="text-[10px] text-text-secondary uppercase tracking-widest font-extrabold">
                    {meeting.hostName} ({lang === 'en' ? 'Host' : 'المضيف'})
                  </span>
                  <span className="text-[9px] text-mint-400 font-bold uppercase bg-mint-950/50 border border-mint-900 px-2 py-0.5 rounded leading-none">
                    {lang === 'en' ? 'Speaking' : 'يتحدث'}
                  </span>
                </div>
              )}

              {/* Status Indicators overlays */}
              <div className="absolute bottom-3 left-3 bg-neutral-950/60 backdrop-blur-md px-3 py-1 rounded-lg border border-neutral-800 flex items-center gap-2 text-[10px] font-semibold text-white">
                <span className="font-bold">{meeting.hostName}</span>
                <Mic className="w-3 h-3 text-mint-400" />
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Sidebar Panel (Chat / Participants tabs) */}
        <aside className={`w-full lg:w-80 flex-1 lg:flex-none border-t lg:border-t-0 lg:border-l flex flex-col justify-between overflow-hidden ${
          theme === 'dark' ? 'border-neutral-800 bg-neutral-900' : 'border-beige-200 bg-white'
        }`}>
          
          {/* Tabs bar */}
          <div className={`flex border-b flex-shrink-0 ${
            theme === 'dark' ? 'border-neutral-800 bg-neutral-950/40' : 'border-beige-200 bg-beige-50/50'
          }`}>
            <button
              onClick={() => setSidebarTab('chat')}
              className={`flex-1 py-3.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-b-2 ${
                sidebarTab === 'chat'
                  ? 'border-b-mint-500 text-mint-500 font-black'
                  : `border-b-transparent ${theme === 'dark' ? 'text-neutral-400 hover:text-neutral-100' : 'text-text-secondary hover:text-text-primary'}`
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              {lang === 'en' ? 'Chat' : 'المحادثة'} ({messages.length})
            </button>
            <button
              onClick={() => setSidebarTab('participants')}
              className={`flex-1 py-3.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-b-2 ${
                sidebarTab === 'participants'
                  ? 'border-b-mint-500 text-mint-500 font-black'
                  : `border-b-transparent ${theme === 'dark' ? 'text-neutral-400 hover:text-neutral-100' : 'text-text-secondary hover:text-text-primary'}`
              }`}
            >
              <Users className="w-4 h-4" />
              {lang === 'en' ? 'Participants' : 'المشاركون'} ({activeParticipants.length})
            </button>
          </div>

          {/* CHAT TAB PANEL */}
          {sidebarTab === 'chat' && (
            <>
              <div ref={chatScrollRef} className={`flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar ${
                theme === 'dark' ? 'bg-neutral-900/40' : 'bg-beige-50/10'
              }`}>
                {messages.length === 0 ? (
                  <div className="text-center py-10 text-neutral-500 space-y-2">
                    <p className="text-[11px] italic font-semibold">{lang === 'en' ? 'Chat is empty.' : 'المحادثة فارغة.'}</p>
                    <p className="text-[9px] max-w-[150px] mx-auto leading-normal">{lang === 'en' ? 'Send a message to start discussion.' : 'أرسل رسالة لبدء النقاش مع الحضور.'}</p>
                  </div>
                ) : (
                  messages.map((msg: any) => {
                    const isMsgMine = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMsgMine ? 'items-end' : 'items-start'} space-y-1`}>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-text-secondary uppercase">
                          <span>{msg.senderName}</span>
                          <span className="text-text-secondary/70">({msg.senderRole})</span>
                        </div>
                        <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed font-semibold break-words ${
                          isMsgMine
                            ? 'bg-mint-600 text-white rounded-tr-none'
                            : theme === 'dark'
                              ? 'bg-neutral-800 text-neutral-100 rounded-tl-none border border-neutral-700/60'
                              : 'bg-beige-100 text-text-primary rounded-tl-none border border-beige-200'
                        }`}>
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className={`p-3 border-t flex-shrink-0 ${
                theme === 'dark' ? 'border-neutral-850 bg-neutral-900' : 'border-beige-200 bg-white'
              }`}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={lang === 'en' ? 'Type your message...' : 'اكتب رسالتك هنا...'}
                    className={`flex-1 px-3 py-2 border rounded-xl text-xs outline-none transition-all font-semibold ${
                      theme === 'dark'
                        ? 'bg-neutral-950 border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:border-mint-500'
                        : 'bg-beige-50 border-beige-200 text-text-primary placeholder-text-secondary focus:border-mint-500'
                    }`}
                    required
                  />
                  <button
                    type="submit"
                    disabled={postMessageMutation.isPending || !chatInput.trim()}
                    className="p-2.5 bg-mint-500 hover:bg-mint-400 active:scale-95 disabled:opacity-50 text-white rounded-xl transition-all shadow-md flex items-center justify-center flex-shrink-0"
                  >
                    <Send className="w-4 h-4 animate-flip-on-rtl" />
                  </button>
                </div>
              </form>
            </>
          )}

          {/* PARTICIPANTS TAB PANEL - REAL TIME ATTENDEES */}
          {sidebarTab === 'participants' && (
            <div className={`flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar ${
              theme === 'dark' ? 'bg-neutral-900/40' : 'bg-beige-50/10'
            }`}>
              {activeParticipants.map((p, idx) => {
                const isUserHost = p.id === meeting.hostId || p.role === 'ADMIN' || p.role === 'DOCTOR';
                const isMe = p.id === user?.id;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between shadow-soft ${
                      theme === 'dark'
                        ? 'bg-neutral-800/80 border-neutral-750 text-neutral-100'
                        : 'bg-white border-beige-200 text-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isUserHost ? 'bg-mint-500 text-white' : 'bg-beige-250 text-text-secondary'
                      }`}>
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold block truncate max-w-[130px]">
                          {p.name} {isMe && `(${lang === 'en' ? 'You' : 'أنت'})`}
                        </span>
                        <span className="text-[8px] font-bold text-text-secondary uppercase">
                          {p.role} {isUserHost && `• ${lang === 'en' ? 'Host' : 'المضيف'}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMe ? (
                        <>
                          {cameraOn ? <Video className="w-4 h-4 text-mint-500" /> : <VideoOff className="w-4 h-4 text-rose-500" />}
                          {micOn ? <Mic className="w-4 h-4 text-mint-500" /> : <MicOff className="w-4 h-4 text-rose-500" />}
                        </>
                      ) : (
                        <>
                          {(p.cameraOn ?? true) ? <Video className="w-4 h-4 text-mint-500" /> : <VideoOff className="w-4 h-4 text-rose-500" />}
                          {(p.micOn ?? true) ? <Mic className="w-4 h-4 text-mint-500" /> : <MicOff className="w-4 h-4 text-rose-500" />}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </aside>
      </div>

      {/* Bottom Controls Bar */}
      <footer className={`h-16 lg:h-20 border-t px-4 lg:px-6 flex items-center justify-between flex-shrink-0 ${
        theme === 'dark' ? 'bg-neutral-900/90 border-neutral-850 text-white' : 'bg-white border-beige-200 text-text-primary'
      }`}>
        
        {/* Left: Indicator details */}
        <div className="hidden md:block text-[10px] font-bold text-text-secondary uppercase tracking-wider">
          {lang === 'en' ? 'Status' : 'الحالة'}: <span className="text-mint-500 font-black animate-pulse">{lang === 'en' ? 'SANDBOX RTC SIMULATOR (LOCAL ONLY)' : 'محاكي اتصال محلي'}</span>
        </div>

        {/* Center: Device controls */}
        <div className="flex items-center gap-2 md:gap-3 mx-auto md:mx-0">
          {/* Mute button */}
          <button
            onClick={toggleMic}
            className={`p-2.5 md:p-3 rounded-xl border transition-all active:scale-[0.96] shadow-md ${micBtnClasses}`}
            title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {micOn ? <Mic className="w-4 h-4 md:w-4.5 md:h-4.5" /> : <MicOff className="w-4 h-4 md:w-4.5 md:h-4.5" />}
          </button>

          {/* Camera button */}
          <button
            onClick={toggleCamera}
            className={`p-2.5 md:p-3 rounded-xl border transition-all active:scale-[0.96] shadow-md ${camBtnClasses}`}
            title={cameraOn ? 'Disable Video' : 'Enable Video'}
          >
            {cameraOn ? <Video className="w-4 h-4 md:w-4.5 md:h-4.5" /> : <VideoOff className="w-4 h-4 md:w-4.5 md:h-4.5" />}
          </button>

          {/* Screen Share button - Hidden on Mobile, only visible on Desktop */}
          <button
            onClick={toggleScreenSharing}
            className={`hidden md:flex p-3 rounded-xl border transition-all active:scale-[0.96] shadow-md ${screenBtnClasses}`}
            title={lang === 'en' ? 'Share Screen' : 'مشاركة الشاشة'}
          >
            <Monitor className="w-4.5 h-4.5" />
          </button>

          {/* End/Leave Call Button (footer red call trigger) */}
          <button
            onClick={() => {
              if (isHost) {
                if (confirm(lang === 'en' ? 'End meeting for all participants? (Press Cancel to just leave the room yourself)' : 'إنهاء الاجتماع لجميع الحاضرين؟ (اضغط إلغاء لمغادرة الغرفة بمفردك فقط)')) {
                  endMeetingMutation.mutate();
                } else {
                  handleLeave();
                }
              } else {
                handleLeave();
              }
            }}
            className="p-2.5 md:p-3 rounded-xl bg-rose-600 border border-rose-500 text-white hover:bg-rose-500 hover:scale-105 active:scale-[0.96] shadow-md transition-all flex items-center justify-center"
            title={isHost ? 'End Meeting for All / Leave Meeting' : 'Leave Call'}
          >
            <PhoneOff className="w-4 h-4 md:w-4.5 md:h-4.5 fill-white" />
          </button>
        </div>

        {/* Right: Recording toggle button */}
        <div>
          <button
            onClick={handleToggleRecording}
            disabled={isRecording}
            className={`px-3 py-2 md:px-4 md:py-2.5 border text-[10px] md:text-xs font-bold transition-all shadow-md active:scale-[0.98] flex items-center gap-1.5 md:gap-2 rounded-xl ${
              isRecordingActive
                ? 'bg-rose-600 border-rose-500 text-white hover:bg-rose-500'
                : theme === 'dark'
                  ? 'bg-neutral-800 border-neutral-700 text-neutral-100 hover:bg-neutral-750'
                  : 'bg-mint-50 border-mint-200 text-mint-500 hover:bg-mint-100'
            }`}
          >
            {isRecording ? (
              <Loader2 className="w-3 h-3 md:w-3.5 md:h-3.5 animate-spin" />
            ) : (
              <span className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-rose-500 ${isRecordingActive ? 'animate-ping' : ''}`} />
            )}
            {isRecording ? (
              lang === 'en' ? 'Saving...' : 'جاري الحفظ...'
            ) : isRecordingActive ? (
              lang === 'en' ? 'Recording' : 'جاري التسجيل'
            ) : (
              lang === 'en' ? 'Record' : 'تسجيل'
            )}
          </button>
        </div>

      </footer>
    </div>
  );
}
