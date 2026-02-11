
import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from './store';
import { AppStatus } from './types';
import { ChatBubble } from './components/ChatBubble';
import { ProgressBar } from './components/ProgressBar';
import { VoiceVisualizer } from './components/VoiceVisualizer';
import { VoiceSettings } from './components/VoiceSettings';
import { ProfileSettings } from './components/ProfileSettings';
import { ProgressDashboard } from './components/ProgressDashboard';
import { LandingPage } from './components/LandingPage';
import { Trophy, Lock, ChevronLeft, AlertTriangle, Mail, Key, Loader2, ArrowRight, Settings, User, LayoutDashboard, ChevronRight, BarChart3 } from 'lucide-react';
import { supabase, signInWithEmail, signUpWithEmail } from './services/supabase';
import { useConversation } from './hooks/useConversation';
import { SpeedInsights } from '@vercel/speed-insights/react';

const App: React.FC = () => {
  const store = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Router State: 'landing' | 'auth' | 'app'
  const [view, setView] = useState<'landing' | 'auth' | 'app'>('landing');

  // Login State
  const [email, setEmail] = useState('angel.s.aguiar@gmail.com');
  const [password, setPassword] = useState('Thor@123');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // Use the new Robust Controller
  const { 
    status: conversationStatus, 
    transcript, 
    toggleSession, 
    speakAndListen,
    isSessionActive,
    error: conversationError
  } = useConversation();
  
  // Init User & Auth
  useEffect(() => {
    const init = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error && error.message.includes('API key')) {
        store.setStatus(AppStatus.CONFIG_ERROR);
        return;
      }

      if (session) {
        store.initUser(session.user.id);
        setView('app'); // Automatically go to app if logged in
      } else {
        // If no session, stay on landing (default)
        // If we want to persist "landing seen" state, we could use localStorage here
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        store.initUser(session.user.id);
        setView('app');
      } else if (event === 'SIGNED_OUT') {
        setView('landing'); // Go back to landing on sign out
        store.setStatus(AppStatus.LOGIN);
      }
    });

    init();
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.messages, conversationStatus]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      let result;
      if (authMode === 'signin') {
        result = await signInWithEmail(email, password);
      } else {
        result = await signUpWithEmail(email, password);
      }
      if (result.error) {
        const isRateLimit = result.error.message.toLowerCase().includes('rate limit');
        if (!isRateLimit) {
          setAuthError(result.error.message);
        } else {
          if (authMode === 'signup') {
             const loginResult = await signInWithEmail(email, password);
             if (loginResult.session) store.initUser(loginResult.session.user.id);
          }
        }
      } else {
        if (result.session) {
          store.initUser(result.session.user.id);
          setView('app');
        } else if (result.user && !result.session) {
          const loginResult = await signInWithEmail(email, password);
          if (loginResult.session) {
             store.initUser(loginResult.session.user.id);
             setView('app');
          } else {
             setAuthError("Account created. Please try signing in.");
             setAuthMode('signin');
          }
        }
      }
    } catch (err) {
      setAuthError("An unexpected error occurred.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleTopicSelect = async (topic: string) => {
    const level = store.user?.currentLevel || 'A1';
    await store.startSession(topic, level);
    const greeting = `Welcome to your ${level} session about "${topic}". Let's start!`;
    speakAndListen(greeting);
  };

  const handleExitSession = () => {
    // Stop speaking/listening if active
    if (isSessionActive) {
      toggleSession();
    }
    // Return to Setup Screen (Progress Dashboard)
    store.setStatus(AppStatus.SETUP);
  };

  // --- VIEW ROUTING ---

  // 1. Landing View
  if (view === 'landing') {
    return (
      <>
        <LandingPage 
          onGetStarted={() => {
             setAuthMode('signup');
             setView('auth');
          }}
          onLogin={() => {
             setAuthMode('signin');
             setView('auth');
          }}
        />
        <SpeedInsights />
      </>
    );
  }

  // 2. Auth View (Sign In / Sign Up)
  if (view === 'auth' || (view === 'app' && store.status === AppStatus.LOGIN)) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-hero p-6 font-sans relative overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        
        {/* Back Button */}
        <button 
           onClick={() => setView('landing')} 
           className="absolute top-6 left-6 text-neutral-light hover:text-neutral-title font-bold text-sm z-20 flex items-center gap-1"
        >
          <ChevronLeft size={20} /> Back
        </button>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-10">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow-green transform rotate-3 hover:rotate-6 transition-transform">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-neutral-title tracking-tight mb-2">LingoFlow</h1>
            <p className="text-neutral-body font-medium">Your AI Fluency Coach</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2rem] shadow-glass border border-white/50">
            <div className="flex gap-2 mb-8 bg-neutral-offWhite/50 p-1.5 rounded-2xl">
              <button onClick={() => setAuthMode('signin')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${authMode === 'signin' ? 'bg-white text-neutral-title shadow-sm' : 'text-neutral-light hover:text-neutral-body'}`}>Sign In</button>
              <button onClick={() => setAuthMode('signup')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${authMode === 'signup' ? 'bg-white text-neutral-title shadow-sm' : 'text-neutral-light hover:text-neutral-body'}`}>Sign Up</button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-light uppercase ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-light" size={20} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white/60 border border-transparent focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl outline-none transition-all font-semibold text-neutral-title placeholder:text-neutral-light/50" placeholder="hello@example.com" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-light uppercase ml-1">Password</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-light" size={20} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white/60 border border-transparent focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl outline-none transition-all font-semibold text-neutral-title placeholder:text-neutral-light/50" placeholder="••••••••" required />
                </div>
              </div>
              {authError && <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-center gap-2 animate-fade-in"><AlertTriangle size={16} />{authError}</div>}
              <button type="submit" disabled={authLoading} className="w-full bg-cta text-white font-bold py-4 rounded-2xl shadow-glow-green hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4">
                {authLoading ? <Loader2 className="animate-spin" /> : <>{authMode === 'signin' ? 'Enter LingoFlow' : 'Create & Enter'} <ArrowRight size={20} className="opacity-80" /></>}
              </button>
            </form>
          </div>
        </div>
        <SpeedInsights />
      </div>
    );
  }

  // 3. Main App Views (Setup or Conversation)

  if (store.status === AppStatus.CONFIG_ERROR && !conversationError) {
     return (
      <div className="h-screen flex flex-col items-center justify-center bg-red-50 p-8 text-center font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full border border-red-100">
           <AlertTriangle size={32} className="text-red-500 mx-auto mb-4" />
           <h2 className="text-2xl font-black text-slate-800 mb-2">Supabase Setup Required</h2>
           <p className="text-gray-600 mb-6">See previous instructions to fix API Key.</p>
           <button onClick={() => window.location.reload()} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl">Refresh</button>
        </div>
        <SpeedInsights />
      </div>
    );
  }

  if (store.status === AppStatus.SETUP) {
    return (
      <div className="h-screen flex flex-col bg-hero p-6 max-w-md mx-auto items-center justify-center relative">
        <div className="w-full max-w-sm">
           <h2 className="text-3xl font-extrabold text-neutral-title mb-8 text-center">Pick a Topic</h2>
           
           <div className="mb-10 flex justify-center">
             <div className="relative group cursor-pointer" onClick={() => setShowProgress(true)}>
               <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-glass border-4 border-white group-hover:scale-105 transition-transform">
                 <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary">{store.user?.currentLevel}</span>
               </div>
               <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-neutral-title text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-1">
                  Level <BarChart3 size={10} className="opacity-70" />
               </div>
             </div>
           </div>
           
           <div className="grid grid-cols-1 gap-4">
               {['Travel & Tourism', 'Business English', 'Casual Conversation', 'Tech & Science'].map(topic => (
                 <button key={topic} onClick={() => handleTopicSelect(topic)} className="p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-white hover:border-primary hover:shadow-glow-green text-left transition-all flex items-center justify-between group">
                   <span className="font-bold text-neutral-title group-hover:text-primary transition-colors">{topic}</span>
                   <div className="w-8 h-8 rounded-full bg-neutral-offWhite flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                     <ChevronRight size={18} />
                   </div>
                 </button>
               ))}
           </div>
           
           <div className="flex justify-center gap-4 mt-8">
              <button onClick={() => setShowProfile(true)} className="flex items-center gap-2 text-neutral-light font-bold hover:text-neutral-title transition-colors text-sm">
                  <User size={16} /> Edit Profile
              </button>
              <button onClick={() => setShowProgress(true)} className="flex items-center gap-2 text-neutral-light font-bold hover:text-primary transition-colors text-sm">
                  <BarChart3 size={16} /> View Progress
              </button>
           </div>
           
           {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}
           {showProgress && <ProgressDashboard onClose={() => setShowProgress(false)} />}
        </div>
        <SpeedInsights />
      </div>
    );
  }

  const isLocked = store.status === AppStatus.DRILL_LOCKED;

  return (
    <div className="flex flex-col h-screen bg-hero text-neutral-body font-sans relative overflow-hidden">
      
      {/* 3D Human Avatar (Centered Top) */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-32 h-32 z-0 opacity-10 pointer-events-none">
         {/* Placeholder for 3D Illustration */}
         <div className="w-full h-full rounded-full bg-gradient-to-b from-primary/20 to-secondary/20 blur-xl"></div>
      </div>

      {/* Glass Header */}
      <header className="absolute top-0 left-0 right-0 h-20 px-6 flex items-center justify-between z-30">
        
        {/* Left: Back Button or Level Badge */}
        <div className="flex items-center gap-3">
          <button 
             onClick={handleExitSession}
             className="w-10 h-10 bg-white/80 backdrop-blur rounded-xl shadow-sm flex items-center justify-center text-neutral-light hover:text-primary transition-all border border-white hover:scale-105"
             title="Back to Progress"
          >
             <LayoutDashboard size={20} />
          </button>
          <div className="w-10 h-10 bg-white/50 backdrop-blur rounded-xl shadow-sm flex items-center justify-center text-primary font-black text-lg border border-white/40">
            {store.user?.currentLevel}
          </div>
        </div>
        
        {/* Right: Progress & Settings */}
        <div className="flex items-center gap-4">
          <div className="w-32 hidden sm:block">
            <ProgressBar current={store.user?.totalUniqueWords || 0} max={store.user?.wordsRequiredForNextLevel || 100} label="XP" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowProfile(true)} className="p-2.5 bg-white/50 hover:bg-white rounded-full text-neutral-light hover:text-neutral-title transition-all border border-transparent hover:border-white/60">
              <User size={20} />
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2.5 bg-white/50 hover:bg-white rounded-full text-neutral-light hover:text-neutral-title transition-all border border-transparent hover:border-white/60">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Messages Area (Scrollable) */}
      <main className="flex-1 overflow-y-auto px-4 pt-24 pb-8 no-scrollbar z-10 relative">
        <div className="flex flex-col justify-end min-h-full max-w-2xl mx-auto">
           {store.messages.map((msg) => (
             <ChatBubble key={msg.id} message={msg} />
           ))}
           <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Drill Mode Overlay */}
      {isLocked && (
        <div className="absolute inset-x-0 bottom-[180px] z-30 flex justify-center px-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-red-500/90 backdrop-blur text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 max-w-xs w-full border border-red-400">
            <div className="p-2 bg-white/20 rounded-full shrink-0"><Lock size={20} /></div>
            <div className="flex-1"><p className="font-bold text-sm">Strict Mode</p><p className="text-xs text-white/90">Perfect pronunciation required.</p></div>
          </div>
        </div>
      )}

      {/* Footer / The Voice Orb */}
      <div className="shrink-0 z-40 bg-white/30 backdrop-blur-lg border-t border-white/40 pb-safe-area">
        <div className="max-w-md mx-auto">
          <VoiceVisualizer 
            status={store.status} 
            isLocked={isLocked}
            isSessionActive={isSessionActive}
            onToggleSession={toggleSession}
            transcript={transcript}
            error={conversationError}
          />
        </div>
      </div>

      {/* Modals */}
      {showSettings && <VoiceSettings onClose={() => setShowSettings(false)} />}
      {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}
      {showProgress && <ProgressDashboard onClose={() => setShowProgress(false)} />}
      <SpeedInsights />
    </div>
  );
};

export default App;
