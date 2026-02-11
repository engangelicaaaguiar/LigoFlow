
import React, { useEffect } from 'react';
import { useAppStore } from '../store';
import { motion } from 'framer-motion';
import { X, TrendingUp, Book, Clock, Calendar, Star, Hash, LayoutDashboard } from 'lucide-react';

interface ProgressDashboardProps {
  onClose: () => void;
}

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ onClose }) => {
  const { user, recentSessions, recentVocabulary, fetchDashboardData } = useAppStore();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  const getLevelProgress = () => {
    if (!user) return 0;
    // Simple calculation relative to 10k words cap
    return Math.min(100, (user.totalUniqueWords / 10000) * 100);
  };

  return (
    <div className="fixed inset-0 bg-hero z-[60] overflow-y-auto animate-fade-in font-sans">
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 sticky top-0 bg-hero/90 backdrop-blur-xl z-10 py-4 border-b border-neutral-light/10">
          <div>
            <h1 className="text-3xl font-black text-neutral-title flex items-center gap-3">
              <LayoutDashboard className="text-primary" /> My Progress
            </h1>
            <p className="text-neutral-light font-medium">Your fluency journey at a glance.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white hover:bg-red-50 rounded-full shadow-sm hover:shadow-md transition-all text-neutral-light hover:text-red-500 border border-neutral-light/20"
          >
            <X size={24} />
          </button>
        </div>

        {/* --- 1. Hero Stats Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* Level Card */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/70 backdrop-blur-md rounded-3xl p-6 border border-white shadow-glass relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-primary/20 rounded-lg text-primary"><TrendingUp size={20} /></div>
                 <span className="text-xs font-bold uppercase tracking-wider text-neutral-light">Current Level</span>
              </div>
              <div className="text-5xl font-black text-neutral-title mb-1">{user?.currentLevel}</div>
              <div className="text-sm font-medium text-neutral-light">CEFR Standard</div>
            </div>
          </motion.div>

          {/* Vocabulary Card */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 backdrop-blur-md rounded-3xl p-6 border border-white shadow-glass relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl group-hover:bg-secondary/20 transition-all"></div>
             <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-secondary/20 rounded-lg text-secondary"><Book size={20} /></div>
                 <span className="text-xs font-bold uppercase tracking-wider text-neutral-light">Vocabulary</span>
              </div>
              <div className="text-5xl font-black text-neutral-title mb-1">{user?.totalUniqueWords}</div>
              <div className="text-sm font-medium text-neutral-light">Unique words learned</div>
            </div>
          </motion.div>

           {/* Sessions Card */}
           <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/70 backdrop-blur-md rounded-3xl p-6 border border-white shadow-glass relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/20 transition-all"></div>
             <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-accent/20 rounded-lg text-yellow-700"><Clock size={20} /></div>
                 <span className="text-xs font-bold uppercase tracking-wider text-neutral-light">Sessions</span>
              </div>
              <div className="text-5xl font-black text-neutral-title mb-1">{recentSessions.length > 9 ? '10+' : recentSessions.length}</div>
              <div className="text-sm font-medium text-neutral-light">Recent interactions</div>
            </div>
          </motion.div>
        </div>

        {/* --- 2. The Level Timeline --- */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.4 }}
           className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 mb-10 border border-white shadow-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-neutral-title">Fluency Timeline</h3>
            <span className="text-xs font-bold bg-white px-3 py-1 rounded-full text-neutral-light shadow-sm">
              Next Goal: {user?.wordsRequiredForNextLevel} words
            </span>
          </div>

          <div className="relative pt-6 pb-2">
            {/* Background Line */}
            <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-200 rounded-full -translate-y-1/2"></div>
            
            {/* Active Progress Line */}
            <div 
              className="absolute top-1/2 left-0 h-2 bg-gradient-to-r from-primary to-secondary rounded-full -translate-y-1/2 transition-all duration-1000 ease-out"
              style={{ width: `${getLevelProgress()}%` }}
            ></div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {levels.map((lvl) => {
                const isActive = user?.currentLevel === lvl;
                // Simple logic: levels before current are "done"
                const isPast = levels.indexOf(lvl) < levels.indexOf(user?.currentLevel || 'A1');
                
                return (
                  <div key={lvl} className="flex flex-col items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-all z-10
                      ${isActive 
                        ? 'bg-white border-primary text-primary shadow-glow-green scale-125' 
                        : isPast 
                          ? 'bg-primary border-primary text-white'
                          : 'bg-white border-gray-200 text-gray-400'
                      }
                    `}>
                      {isPast ? <Star size={14} fill="currentColor" /> : lvl}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* --- 3. Recent Vocabulary Cloud --- */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <h3 className="font-bold text-lg text-neutral-title flex items-center gap-2">
              <Hash size={18} className="text-secondary" /> Recently Learned Words
            </h3>
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-sm h-80 overflow-y-auto custom-scrollbar">
              <div className="flex flex-wrap gap-2">
                {recentVocabulary.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-light/50">
                    <Book size={40} className="mb-2 opacity-50" />
                    <p className="text-sm font-medium">Start talking to collect words!</p>
                  </div>
                ) : (
                  recentVocabulary.map((v, i) => (
                    <motion.div 
                      key={v.word}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="px-3 py-1.5 bg-white border border-secondary/20 text-secondary-dark rounded-xl text-sm font-bold shadow-sm hover:scale-110 transition-transform cursor-default"
                    >
                      {v.word}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* --- 4. Recent Sessions --- */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <h3 className="font-bold text-lg text-neutral-title flex items-center gap-2">
              <Calendar size={18} className="text-accent" /> Recent Sessions
            </h3>
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-sm h-80 overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                 {recentSessions.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-light/50 mt-10">
                      <Clock size={40} className="mb-2 opacity-50" />
                      <p className="text-sm font-medium">No sessions yet.</p>
                    </div>
                 ) : (
                   recentSessions.map((session, i) => (
                     <div key={session.id} className="bg-white/80 p-4 rounded-2xl flex items-center justify-between border border-transparent hover:border-primary/20 transition-colors shadow-sm">
                       <div>
                         <div className="font-bold text-neutral-title text-sm">{session.topic}</div>
                         <div className="text-xs text-neutral-light font-medium">{formatDate(session.created_at)}</div>
                       </div>
                       <div className="px-3 py-1 bg-neutral-offWhite rounded-lg text-xs font-bold text-neutral-body border border-gray-100">
                         {session.target_level}
                       </div>
                     </div>
                   ))
                 )}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
