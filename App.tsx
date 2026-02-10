import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from './store';
import { sendMessageToGemini } from './services/gemini';
import { speakText } from './services/tts';
import { GameStatus } from './types';
import { ChatBubble } from './components/ChatBubble';
import { MicrophoneButton } from './components/MicrophoneButton';
import { ProgressBar } from './components/ProgressBar';
import { Trophy, Zap, Crown, Menu } from 'lucide-react';

// --- Type definitions for Web Speech API ---
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionError extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionError) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: { new(): SpeechRecognition };
    webkitSpeechRecognition?: { new(): SpeechRecognition };
  }
}
// --------------------------------

const DAILY_LIMIT_FREE = 5;

const App: React.FC = () => {
  const { messages, user, status, addMessage, updateUserXP, incrementDailyMessages, setStatus, togglePro } = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';
        
        rec.onstart = () => setStatus(GameStatus.LISTENING);
        
        rec.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          handleUserMessage(transcript);
        };

        rec.onerror = (event: SpeechRecognitionError) => {
          console.error("Speech Error", event);
          setStatus(GameStatus.IDLE);
        };

        rec.onend = () => {
          // If we didn't get a result and are still "listening", reset to idle.
          // We use a functional update to ensure we have the latest state.
          setStatus((prev) => prev === GameStatus.LISTENING ? GameStatus.IDLE : prev);
        };

        setRecognition(rec);
      }
    } else {
      console.warn("Web Speech API is not supported in this browser.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUserMessage = async (text: string) => {
    if (!text.trim()) {
      setStatus(GameStatus.IDLE);
      return;
    }

    // Check Limits
    if (!user.isPro && user.dailyMessages >= DAILY_LIMIT_FREE) {
      alert("Daily limit reached! Upgrade to Pro for unlimited practice.");
      setStatus(GameStatus.IDLE);
      return;
    }

    setStatus(GameStatus.PROCESSING);

    // Add User Message
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    });

    try {
      // Call Gemini
      const data = await sendMessageToGemini(text);

      // Add Assistant Message
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.reply,
        correction: data.correction || undefined,
        xpGained: data.xp,
        timestamp: Date.now()
      });

      // Update User Stats
      updateUserXP(data.xp);
      incrementDailyMessages();

      // Speak Response
      setStatus(GameStatus.SPEAKING);
      speakText(data.reply, () => {
        setStatus(GameStatus.IDLE);
      });

    } catch (error) {
      console.error("Interaction failed", error);
      setStatus(GameStatus.IDLE);
    }
  };

  const startListening = () => {
    if (recognition && status === GameStatus.IDLE) {
      try {
        recognition.start();
      } catch (e) {
        console.error("Recognition start failed", e);
        setStatus(GameStatus.IDLE);
      }
    }
  };

  const remainingMessages = user.isPro ? '∞' : Math.max(0, DAILY_LIMIT_FREE - user.dailyMessages);

  return (
    <div className="flex flex-col h-screen bg-surface text-slate-800 overflow-hidden font-sans">
      
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
            L
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-700">Lingo<span className="text-primary">Flow</span></h1>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={togglePro}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${user.isPro ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
           >
             <Crown size={14} className={user.isPro ? "fill-yellow-600 text-yellow-600" : ""} />
             {user.isPro ? 'PRO ACTIVE' : 'UPGRADE'}
           </button>
           <button className="md:hidden">
             <Menu size={24} className="text-slate-600"/>
           </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:flex w-80 bg-white border-r border-gray-100 flex-col p-6 z-10">
          <div className="mb-8">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Your Progress</h2>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-sm font-semibold text-slate-600">Level {user.level}</span>
                 <span className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                   <Trophy size={14} className="fill-current" />
                   {user.xp} XP
                 </span>
               </div>
               <ProgressBar current={user.xp % 100} max={100} />
               <p className="text-xs text-gray-400 mt-2 text-center">{(100 - (user.xp % 100))} XP to Level {user.level + 1}</p>
            </div>
          </div>

          <div className="mb-8">
             <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Daily Goals</h2>
             <div className="space-y-3">
               <div className="flex items-center justify-between p-3 rounded-xl bg-pink-50 border border-pink-100 text-pink-900">
                 <div className="flex items-center gap-3">
                   <Zap size={18} className="fill-pink-200 text-pink-500"/>
                   <span className="text-sm font-semibold">Streak</span>
                 </div>
                 <span className="font-bold">{user.streak} Days</span>
               </div>
               <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100 text-green-900">
                 <div className="flex items-center gap-3">
                   <div className="w-4 h-4 rounded-full border-2 border-green-500"></div>
                   <span className="text-sm font-semibold">Messages</span>
                 </div>
                 <span className="font-bold">{user.dailyMessages}/{user.isPro ? '∞' : DAILY_LIMIT_FREE}</span>
               </div>
             </div>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col relative max-w-4xl mx-auto w-full">
          
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 no-scrollbar">
            <div className="flex flex-col justify-end min-h-full pb-4">
               {messages.map((msg) => (
                 <ChatBubble key={msg.id} message={msg} />
               ))}
               
               {status === GameStatus.PROCESSING && (
                 <div className="flex items-center gap-2 text-gray-400 text-sm ml-4 animate-pulse">
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                   <span>Lingo is thinking...</span>
                 </div>
               )}
               <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Controls Area */}
          <div className="h-40 shrink-0 bg-gradient-to-t from-surface via-surface to-transparent flex flex-col items-center justify-center pb-6 z-10">
            <MicrophoneButton 
              status={status} 
              onClick={startListening} 
              disabled={!user.isPro && user.dailyMessages >= DAILY_LIMIT_FREE} 
            />
            
            {!user.isPro && user.dailyMessages >= DAILY_LIMIT_FREE && (
              <p className="text-red-500 text-sm font-semibold mt-4 bg-white/80 px-4 py-1 rounded-full shadow-sm">
                Daily limit reached. Come back tomorrow!
              </p>
            )}
             {!user.isPro && user.dailyMessages < DAILY_LIMIT_FREE && (
               <p className="text-gray-400 text-xs mt-4 font-medium">
                 {remainingMessages} free messages left today
               </p>
             )}
          </div>

        </main>
      </div>
    </div>
  );
};

export default App;