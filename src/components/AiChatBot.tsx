import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  MapPin,
  GraduationCap,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  askGemini,
  getGeminiApiKey,
  GeminiActionItem,
} from '@/lib/gemini';

interface ActionItem {
  type: 'route' | 'scroll' | 'modal' | 'external';
  label: string;
  payload: string;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  actions?: ActionItem[];
  suggestions?: string[];
}

const INITIAL_SUGGESTIONS = [
  '🏸 Find Academies Near Me',
  '🎓 How do I join as a Coach?',
  '🎟️ How do Free Trials work?',
  '📲 Live WhatsApp Attendance',
  '💳 How do Fees & Receipts work?',
  '📍 What cities are available?',
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome-1',
    sender: 'bot',
    text: "Hi there! 👋 I'm **TruCoach**, your sports academy and coaching assistant. Ask me anything or pick a quick topic below!",
    time: 'Just now',
    suggestions: INITIAL_SUGGESTIONS,
  },
];

/**
 * Parses markdown text to eliminate raw asterisks and render bold text cleanly.
 */
function FormattedMessageText({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed text-sm">
      {lines.map((line, lineIdx) => {
        if (!line.trim()) {
          return <div key={lineIdx} className="h-1" />;
        }

        // Handle bullet points
        const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
        const cleanLine = isBullet ? line.trim().replace(/^[-•]\s*/, '') : line;

        // Split by **bold** markdown tokens
        const parts = cleanLine.split(/(\*\*[^*]+?\*\*)/g);

        const renderedContent = parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2);
            return (
              <strong key={partIdx} className="font-bold text-ink-950">
                {boldText}
              </strong>
            );
          }
          // Clean any stray asterisks
          const sanitized = part.replace(/\*/g, '');
          return <span key={partIdx}>{sanitized}</span>;
        });

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-1.5 pl-1 text-[13px]">
              <span className="text-orange-500 font-bold shrink-0 mt-0.5">•</span>
              <div>{renderedContent}</div>
            </div>
          );
        }

        return <p key={lineIdx}>{renderedContent}</p>;
      })}
    </div>
  );
}

export function AiChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [isGeminiConnected, setIsGeminiConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsGeminiConnected(!!getGeminiApiKey());
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      scrollToBottom();
    }
  }, [isOpen, messages, isTyping]);

  const handleAction = (action: ActionItem) => {
    if (action.type === 'route') {
      navigate(action.payload);
      if (window.innerWidth < 768) setIsOpen(false);
    } else if (action.type === 'scroll') {
      if (location.pathname === '/') {
        const el = document.getElementById(action.payload);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate(`/#${action.payload}`);
        setTimeout(() => {
          const el = document.getElementById(action.payload);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
      if (window.innerWidth < 768) setIsOpen(false);
    } else if (action.type === 'modal') {
      if (location.pathname === '/') {
        const el = document.getElementById('join');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        window.dispatchEvent(new CustomEvent('open-tutor-modal'));
      } else {
        sessionStorage.setItem('trucoach_open_tutor_modal', '1');
        navigate('/#join');
        setTimeout(() => {
          const el = document.getElementById('join');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
          window.dispatchEvent(new CustomEvent('open-tutor-modal'));
        }, 300);
      }
      if (window.innerWidth < 768) setIsOpen(false);
    } else if (action.type === 'external') {
      if (action.payload.startsWith('mailto:')) {
        window.location.href = action.payload;
      } else {
        window.open(action.payload, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const processLocalQuery = (rawQuery: string): { text: string; actions?: ActionItem[]; suggestions?: string[] } => {
    const q = rawQuery.toLowerCase().trim();

    // 1. Coach / Tutor Application intent
    if (
      q.includes('coach') ||
      q.includes('tutor') ||
      q.includes('join') ||
      q.includes('teach') ||
      q.includes('trainer') ||
      q.includes('register') ||
      q.includes('apply') ||
      q.includes('onboard')
    ) {
      return {
        text: "Coaches and Tutors can join the **TruCoach Ecosystem** to automate attendance, digital fees, and WhatsApp alerts while getting discovered by local parents seeking verified training.",
        actions: [
          { type: 'modal', label: 'Join as a Tutor (Application Form)', payload: 'join' },
          { type: 'scroll', label: 'Learn more for Coaches', payload: 'coaches' },
        ],
        suggestions: ['How does Live WhatsApp Attendance work?', 'How do fees work?', 'Find Academies Near Me'],
      };
    }

    // 2. Discover Academies / Search intent
    if (
      q.includes('find') ||
      q.includes('search') ||
      q.includes('discover') ||
      q.includes('academy') ||
      q.includes('academies') ||
      q.includes('near me') ||
      q.includes('directory')
    ) {
      return {
        text: "We are mapping every local academy so no talent goes unnoticed! You can browse and filter verified sports academies and private tutors by sport, city, or locality.",
        actions: [
          { type: 'route', label: 'Explore Academies Directory', payload: '/academies' },
          { type: 'scroll', label: 'View Community Section', payload: 'community' },
        ],
        suggestions: ['Badminton academies', 'Football academies', 'Cricket academies', 'How to book a free trial?'],
      };
    }

    // 3. Specific Sports Queries
    if (q.includes('badminton') || q.includes('tennis')) {
      return {
        text: "We have verified racquet sports academies with certified coaches, synthetic & clay courts, and beginner to advanced batches.",
        actions: [
          { type: 'route', label: 'Search Badminton Academies', payload: '/academies?sport=Badminton' },
          { type: 'route', label: 'Search Tennis Academies', payload: '/academies?sport=Tennis' },
        ],
        suggestions: ['How do Free Trials work?', 'What cities are available?'],
      };
    }

    if (q.includes('football') || q.includes('soccer')) {
      return {
        text: "Explore premier football academies with FIFA-standard turf, licensed coaches, and competitive league training for all age categories.",
        actions: [
          { type: 'route', label: 'Browse Football Academies', payload: '/academies?sport=Football' },
        ],
        suggestions: ['How do Free Trials work?', 'Join as a Football Coach'],
      };
    }

    if (q.includes('cricket')) {
      return {
        text: "Discover top cricket academies featuring turf pitches, bowling machines, net practice batches, and experienced BCCI/state coaches.",
        actions: [
          { type: 'route', label: 'Browse Cricket Academies', payload: '/academies?sport=Cricket' },
        ],
        suggestions: ['How do Free Trials work?', 'What cities are available?'],
      };
    }

    if (q.includes('swimming')) {
      return {
        text: "Find verified swimming academies with certified lifeguards, heated pool facilities, and specialized batches for beginners and advanced swimmers.",
        actions: [
          { type: 'route', label: 'Browse Swimming Academies', payload: '/academies?sport=Swimming' },
        ],
        suggestions: ['How do Free Trials work?', 'Find Academies Near Me'],
      };
    }

    if (q.includes('karate') || q.includes('martial') || q.includes('taekwondo') || q.includes('boxing')) {
      return {
        text: "Explore verified Karate, Boxing, and Martial Arts dojos with certified black-belt instructors focused on fitness, self-defense, and tournament prep.",
        actions: [
          { type: 'route', label: 'Browse Martial Arts Academies', payload: '/academies?sport=Karate' },
        ],
        suggestions: ['How do Free Trials work?', 'How do fees work?'],
      };
    }

    if (q.includes('dance') || q.includes('music') || q.includes('piano') || q.includes('chess')) {
      return {
        text: "TruCoach is multi-disciplinary! In addition to sports, we support music, dance, chess, and creative arts academies with the same automated attendance and fee management.",
        actions: [
          { type: 'route', label: 'Browse All Disciplines', payload: '/academies' },
        ],
        suggestions: ['Join as a Tutor', 'How does Live Attendance work?'],
      };
    }

    // 3b. Events (Public & Private)
    if (q.includes('event') || q.includes('events') || q.includes('tournament') || q.includes('camp') || q.includes('match') || q.includes('bootcamp')) {
      return {
        text: "Yes! Coaches and academies can publish both **Public Events** (open tournaments, summer camps, friendly matches, and open trials discoverable by all parents in the community) and **Private Events** (batch-scoped internal tournaments, belt grading, and parent meetings).",
        actions: [
          { type: 'scroll', label: 'Learn more for Coaches', payload: 'coaches' },
          { type: 'route', label: 'Explore Community', payload: '/academies' },
        ],
        suggestions: ['How do Free Trials work?', 'Join as a Tutor (Application Form)', 'How does Live WhatsApp Attendance work?'],
      };
    }

    // 4. Free Trial intent
    if (q.includes('trial') || q.includes('free') || q.includes('book') || q.includes('demo')) {
      return {
        text: "Free trial sessions can be booked directly through the official **TruCoach Mobile App**! You can view coach profiles, check batch timings, and reserve a trial session for your child.",
        actions: [
          { type: 'external', label: 'Get on Google Play', payload: 'https://play.google.com/store/apps/details?id=com.trucoach.app&pcampaignid=web_share' },
          { type: 'external', label: 'Get on App Store', payload: 'https://apps.apple.com/in/app/trucoach/id6808904997' },
          { type: 'route', label: 'Browse Academies First', payload: '/academies' },
        ],
        suggestions: ['How does Live WhatsApp Attendance work?', 'What cities are available?'],
      };
    }

    // 5. Attendance & WhatsApp Alerts
    if (q.includes('attendance') || q.includes('whatsapp') || q.includes('track') || q.includes('absent') || q.includes('present')) {
      return {
        text: "When your child reaches the ground, the coach marks attendance in 1-tap via the TruCoach App. You instantly receive an automated **WhatsApp alert** confirming their safe arrival and batch presence.",
        actions: [
          { type: 'scroll', label: 'Explore Parent Experience', payload: 'parents' },
        ],
        suggestions: ['How do Fees & Receipts work?', 'How do Free Trials work?'],
      };
    }

    // 6. Fees & Payments
    if (q.includes('fee') || q.includes('pay') || q.includes('receipt') || q.includes('cost') || q.includes('price') || q.includes('upi')) {
      return {
        text: "TruCoach eliminates fee follow-ups with our **Zero-Touch Fee Engine**. Secure UPI/Card payment links powered by Easebuzz are delivered via WhatsApp, and instant digital receipts are auto-generated.",
        actions: [
          { type: 'scroll', label: 'See Smart Fee Management', payload: 'coaches' },
        ],
        suggestions: ['How do Free Trials work?', 'Join as a Coach'],
      };
    }

    // 7. City / Location Availability
    if (q.includes('city') || q.includes('hyderabad') || q.includes('location') || q.includes('where') || q.includes('bangalore') || q.includes('mumbai')) {
      return {
        text: "TruCoach is actively live in **Hyderabad, India** (including Kompally, Madhapur, Gachibowli, Kukatpally, Secunderabad, and surrounding areas) with expansion rolling out nationwide!",
        actions: [
          { type: 'route', label: 'Explore Hyderabad Academies', payload: '/academies' },
        ],
        suggestions: ['Find Academies Near Me', 'Join as a Tutor'],
      };
    }

    // 8. Human Support / Contact
    if (q.includes('contact') || q.includes('support') || q.includes('help') || q.includes('email') || q.includes('phone') || q.includes('human')) {
      return {
        text: "Our dedicated support and academy onboarding team is here to assist you! You can reach us directly anytime at **support@trucoach.co.in**.",
        actions: [
          { type: 'external', label: 'Email support@trucoach.co.in', payload: 'mailto:support@trucoach.co.in' },
          { type: 'modal', label: 'Submit Onboarding Request', payload: 'join' },
        ],
        suggestions: ['Find Academies Near Me', 'How do Free Trials work?'],
      };
    }

    // 9. Greeting / General
    if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q.includes('what is trucoach')) {
      return {
        text: "Hello! **TruCoach** is the premier real-time sports community and operating system connecting verified coaches, academies, and parents. How can I assist you today?",
        actions: [
          { type: 'route', label: 'Discover Academies', payload: '/academies' },
          { type: 'modal', label: 'Join as a Tutor', payload: 'join' },
        ],
        suggestions: INITIAL_SUGGESTIONS,
      };
    }

    // Fallback response
    return {
      text: "I would love to help you with that! You can explore verified local academies, learn about our coach management platform, or connect directly with our support team.",
      actions: [
        { type: 'route', label: 'Explore All Academies', payload: '/academies' },
        { type: 'external', label: 'Contact Support via Email', payload: 'mailto:support@trucoach.co.in' },
      ],
      suggestions: [
        '🏸 Find Academies Near Me',
        '🎓 How do I join as a Coach?',
        '🎟️ How do Free Trials work?',
        '📲 Live WhatsApp Attendance',
      ],
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // 1. If Gemini is connected, query Gemini LLM
      if (getGeminiApiKey()) {
        const geminiRes = await askGemini(text, messages);
        if (geminiRes && geminiRes.text) {
          const botMsg: Message = {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: geminiRes.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actions: geminiRes.actions as ActionItem[],
            suggestions: geminiRes.suggestions,
          };
          setMessages((prev) => [...prev, botMsg]);
          setIsTyping(false);
          return;
        }
      }

      // 2. Fallback to Local Engine
      setTimeout(() => {
        const response = processLocalQuery(text);
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: response.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: response.actions,
          suggestions: response.suggestions,
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
      }, 450);
    } catch (_) {
      const response = processLocalQuery(text);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: response.actions,
        suggestions: response.suggestions,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }
  };

  const resetChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && hasUnread && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="pointer-events-none absolute right-[calc(100%+12px)] top-1/2 -translate-y-1/2 hidden whitespace-nowrap rounded-full bg-ink-950 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xl ring-1 ring-white/10 sm:flex items-center gap-1.5"
          >
            <Sparkles className="h-3 w-3 text-orange-400 shrink-0" />
            <span>Ask TruCoach ✨</span>
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? 'Close TruCoach Chat' : 'Open TruCoach Chat'}
          className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-tr from-orange-600 via-orange-500 to-yellow-500 text-white shadow-[0_8px_28px_-6px_rgba(251,90,12,0.65)] ring-2 ring-white/30 transition-all"
        >
          {/* Animated pulsing outer aura */}
          <span className="absolute -inset-1 rounded-full bg-orange-500 opacity-30 blur-sm animate-pulse" />

          {isOpen ? (
            <X className="relative h-6 w-6 transition-transform" />
          ) : (
            <>
              <MessageSquare className="relative h-6 w-6" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-green-500 border-2 border-white" />
                </span>
              )}
            </>
          )}
        </motion.button>
      </div>

      {/* Chat Window Modal / Sheet */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed bottom-24 right-4 z-50 flex h-[580px] max-h-[85vh] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[2rem] border border-ink-100 bg-white shadow-[0_24px_64px_-16px_rgba(15,18,25,0.35)] sm:right-6 sm:w-[410px]"
          >
            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-ink-100 bg-ink-950 px-5 py-4 text-white">
              {/* Ambient header glow */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-orange-600/20 via-transparent to-blue-600/20" />

              <div className="relative flex items-center gap-3">
                <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-orange-500 to-orange-400 text-white shadow-md">
                  <Bot className="h-5 w-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-950 bg-green-500" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-display text-sm font-bold text-white">
                    <span>TruCoach</span>
                    {isGeminiConnected ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-semibold text-green-300">
                        <Sparkles className="h-2.5 w-2.5 text-green-400" /> Gemini Pro
                      </span>
                    ) : (
                      <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-semibold text-orange-300">
                        Assistant
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-ink-300">Instant Guidance &amp; Navigation</div>
                </div>
              </div>

              <div className="relative flex items-center gap-1">
                <button
                  type="button"
                  onClick={resetChat}
                  title="Reset Conversation"
                  aria-label="Reset Conversation"
                  className="rounded-xl p-2 text-ink-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Minimize Chat"
                  aria-label="Close Chat"
                  className="rounded-xl p-2 text-ink-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 bg-ink-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-br-xs'
                        : 'border border-ink-100 bg-white text-ink-800 rounded-bl-xs'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <p className="whitespace-pre-line">{msg.text}</p>
                    ) : (
                      <FormattedMessageText text={msg.text} />
                    )}

                    {/* Navigation Action Buttons embedded in bot reply */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 flex flex-col gap-1.5 pt-2 border-t border-ink-100/80">
                        {msg.actions.map((act, idx) => {
                          const isExternal = act.type === 'external';

                          if (isExternal) {
                            return (
                              <a
                                key={idx}
                                href={act.payload}
                                target={act.payload.startsWith('mailto:') ? '_self' : '_blank'}
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-between gap-2 rounded-xl bg-ink-50 px-3 py-2 text-xs font-semibold text-ink-900 transition-all hover:bg-orange-50 hover:text-orange-600 hover:scale-[1.01] active:scale-98 text-left"
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <ExternalLink className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                  <span className="truncate">{act.label}</span>
                                </span>
                                <ChevronRight className="h-3 w-3 text-ink-400 shrink-0" />
                              </a>
                            );
                          }

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleAction(act)}
                              className="inline-flex items-center justify-between gap-2 rounded-xl bg-ink-50 px-3 py-2 text-xs font-semibold text-ink-900 transition-all hover:bg-orange-50 hover:text-orange-600 hover:scale-[1.01] active:scale-98 text-left"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                {act.type === 'route' && <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                                {act.type === 'modal' && <GraduationCap className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                                {act.type === 'scroll' && <HelpCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                                <span className="truncate">{act.label}</span>
                              </span>
                              <ChevronRight className="h-3 w-3 text-ink-400 shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <span className="mt-1 px-1 text-[10px] text-ink-400">{msg.time}</span>

                  {/* Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {msg.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(sug)}
                          className="rounded-full border border-ink-200 bg-white px-3 py-1 text-[11px] font-medium text-ink-700 shadow-2xs transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 active:scale-95"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-1.5 rounded-2xl border border-ink-100 bg-white px-4 py-3 shadow-xs w-20">
                  <span className="h-2 w-2 rounded-full bg-orange-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 rounded-full bg-orange-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 rounded-full bg-orange-400 animate-bounce" />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 border-t border-ink-100 bg-white p-3 sm:px-4"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about academies, trials, coaches..."
                className="flex-1 rounded-full border border-ink-200 bg-ink-50/70 px-4 py-2.5 text-xs sm:text-sm text-ink-900 outline-none transition-all placeholder:text-ink-400 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                aria-label="Send message"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-500 text-white shadow-sm transition-all hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-orange-500 active:scale-95"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
