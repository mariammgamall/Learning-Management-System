'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePathname } from 'next/navigation';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export default function AIChatbot() {
  const pathname = usePathname();
  const { lang, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add default welcome message
    setMessages([
      {
        sender: 'bot',
        text: lang === 'en'
          ? 'Hello! I am your LMS AI Academic Assistant. How can I help you today? You can ask about course grades, certificates, or attendance rules.'
          : 'مرحباً! أنا المساعد الذكي لمقرراتك الدراسية. كيف يمكنني مساعدتك اليوم؟ يمكنك استفساري عن درجاتك، الشهادات الرسمية، أو قواعد حضور المحاضرات.',
        timestamp: new Date(),
      },
    ]);
  }, [lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg, timestamp: new Date() }]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response based on keyword matching
    setTimeout(() => {
      let reply = '';
      const text = userMsg.toLowerCase();

      if (text.includes('grade') || text.includes('score') || text.includes('درج')) {
        reply = lang === 'en'
          ? 'Based on your recent uploads, you are passing with an Assignment Average of 90% and a Quiz Average of 85%. Keep up the excellent work!'
          : 'بناءً على سجلاتك الأخيرة، فإن متوسط درجات التكليفات الخاصة بك هو 90% والاختبارات هو 85%. استمر في هذا الأداء الرائع!';
      } else if (text.includes('attendance') || text.includes('present') || text.includes('حضور')) {
        reply = lang === 'en'
          ? 'You can register your attendance by scanning the live QR code displayed by your TA during lectures, or by entering the active session code in the daily tracker.'
          : 'يمكنك تسجيل حضورك عن طريق مسح رمز الاستجابة السريعة (QR) الذي يعرضه المعيد أثناء المحاضرة، أو إدخال رمز الجلسة في متتبع الحضور اليومي.';
      } else if (text.includes('certificate') || text.includes('stamp') || text.includes('شهادة')) {
        reply = lang === 'en'
          ? 'Once your lecture progress hits 100% in a paid course, the "View Certificate" option unlocks on your portal. The certificate lists your full name and official course hours.'
          : 'بمجرد أن يصل تقدم مشاهدة المحاضرات إلى 100% في مقرر مدفوع، سيتم تفعيل خيار "عرض الشهادة" تلقائياً في حسابك بكامل بياناتك الرسمية.';
      } else if (text.includes('price') || text.includes('cost') || text.includes('سعر') || text.includes('دفع')) {
        reply = lang === 'en'
          ? 'Paid courses are listed in LE (Egyptian Pounds) on the catalog. Standard courses are priced at either 6,000 LE or 8,000 LE.'
          : 'المقررات المدفوعة مسعرة بالجنيه المصري (LE) في دليل المواد. الأسعار المعتمدة هي 6000 جنيه أو 8000 جنيه مصري.';
      } else if (text.includes('sandbox') || text.includes('code') || text.includes('كود')) {
        reply = lang === 'en'
          ? 'The JavaScript coding sandbox is integrated inside your course page. You can write scripts, run them, and inspect logs instantly.'
          : 'بيئة تشغيل البرمجة المدمجة متوفرة داخل صفحة المقرر الدراسي. يمكنك كتابة أكواد جافا سكريبت وتشغيلها مباشرة.';
      } else {
        reply = lang === 'en'
          ? "I'm here to support your learning! Feel free to ask more details about grading criteria, online meeting recordings, or dashboard widgets."
          : 'أنا هنا لدعم رحلتك التعليمية! لا تتردد في الاستفسار عن تفاصيل التقييمات، تسجيلات المحاضرات التفاعلية، أو أدوات لوحة التحكم.';
      }

      setMessages((prev) => [...prev, { sender: 'bot', text: reply, timestamp: new Date() }]);
      setIsTyping(false);
    }, 1000);
  };

  // Hide the AI assistant floating button inside actual virtual call rooms to prevent UI element overlaps
  if (pathname && pathname.includes('/dashboard/meetings/') && pathname !== '/dashboard/meetings') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-xs flex flex-col items-end">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 bg-mint-500 hover:bg-mint-400 text-white rounded-full shadow-premium flex items-center gap-1.5 transition-all hover:scale-105"
          title={t('chatbot')}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="font-bold pr-1 text-[10px] tracking-wider uppercase">{t('chatbot')}</span>
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div className="w-80 h-96 bg-white border border-beige-200 rounded-3xl shadow-premium flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-mint-500 text-white px-4 py-3 flex items-center justify-between shadow-soft">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-white" />
              <div>
                <h4 className="font-bold text-[11px] leading-tight">LMS AI Assistant</h4>
                <span className="text-[9px] text-mint-100 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse" /> Active 24/7
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-mint-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Log area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-beige-50/30 custom-scrollbar">
            {messages.map((m, idx) => {
              const isBot = m.sender === 'bot';
              return (
                <div key={idx} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl leading-relaxed shadow-soft font-medium ${
                      isBot
                        ? 'bg-white border border-beige-200 text-text-primary rounded-tl-none'
                        : 'bg-mint-500 text-white rounded-tr-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-beige-200 text-text-secondary px-3.5 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-soft">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-mint-500" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Sender footer */}
          <div className="p-3 border-t border-beige-100 bg-white flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={lang === 'en' ? 'Ask a question...' : 'اسأل سؤالاً...'}
              className="flex-1 px-3 py-2 bg-beige-50/50 border border-beige-200 rounded-xl focus:border-mint-500 outline-none font-bold text-xs"
            />
            <button
              onClick={handleSend}
              className="p-2 bg-mint-500 hover:bg-mint-400 text-white rounded-xl shadow-soft"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
