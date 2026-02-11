
import React, { useState } from 'react';
import { Message } from '../types';
import { Volume2, ChevronDown, ChevronUp, Star, Type, Mic, Info, AlertCircle, Sparkles } from 'lucide-react';
import { speakText } from '../services/tts';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const hasAssessment = !!message.assessment;
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePlayAudio = () => {
    speakText(message.text);
  };

  const getScoreColor = (score: number) => {
    if (score === 10) return 'text-primary border-primary/20 bg-primary/5';
    if (score >= 7) return 'text-accent border-accent/20 bg-accent/5';
    return 'text-red-500 border-red-500/20 bg-red-500/5';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex flex-col max-w-[90%] md:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Sender Name/Avatar Placeholder */}
        <span className={`text-[10px] font-bold uppercase tracking-widest mb-2 px-2 text-neutral-light`}>
          {isUser ? 'You' : 'LingoFlow AI'}
        </span>

        {/* The Smart Bubble */}
        <div className="relative group">
          <div 
            className={`
              relative px-6 py-4 rounded-2xl shadow-glass backdrop-blur-md border border-glass-border text-neutral-body leading-relaxed
              ${isUser 
                ? 'bg-gradient-to-br from-[#F0FDF4] to-[#E0F2FE] rounded-tr-sm' 
                : 'bg-glass rounded-tl-sm border-l-4 border-l-primary'
              }
            `}
          >
            {message.text}
            
            {/* Audio Action */}
            {!isUser && (
              <button 
                onClick={handlePlayAudio}
                className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 text-neutral-light hover:text-primary p-2"
                aria-label="Play audio"
              >
                <Volume2 size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Assessment Card (Attached below Assistant Bubble) */}
        {hasAssessment && message.assessment && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 w-full max-w-md"
          >
            <div className="bg-white/60 backdrop-blur-sm border border-white/60 rounded-xl p-3 shadow-sm">
              
              {/* Mini Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                   {/* Score Badge */}
                   <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold ${getScoreColor(message.assessment.finalScore)}`}>
                     <Star size={12} fill="currentColor" className="opacity-50" />
                     <span>{message.assessment.finalScore}</span>
                   </div>
                   
                   {/* Compact Stats */}
                   <div className="flex items-center gap-2 text-xs text-neutral-light font-medium">
                      <span className="flex items-center gap-1"><Type size={10}/> {message.assessment.grammarScore}</span>
                      <span className="w-px h-3 bg-neutral-light/20"></span>
                      <span className="flex items-center gap-1"><Mic size={10}/> {message.assessment.phoneticsScore}</span>
                   </div>
                </div>

                {/* XP Gain */}
                {message.xpGained !== undefined && message.xpGained > 0 && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-accent px-2 py-0.5 bg-accent/10 rounded-full border border-accent/20">
                    <Sparkles size={10} /> +{message.xpGained} XP
                  </div>
                )}
              </div>

              {/* Feedback Toggle */}
              {!message.assessment.isPerfect && (
                <div className="mt-2">
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1 text-[10px] font-bold text-neutral-light hover:text-primary transition-colors uppercase tracking-wider"
                  >
                    Feedback {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  </button>

                  <AnimatePresence>
                    {(isExpanded || message.assessment.finalScore < 7) && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 mt-1 border-t border-neutral-light/10 flex flex-col gap-2">
                          {message.assessment.correction && (
                            <div className="bg-red-50/80 p-2.5 rounded-lg border border-red-100 flex gap-2">
                              <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                              <div className="text-xs text-red-700">
                                <span className="font-bold block text-[10px] opacity-70 uppercase mb-0.5">Correction</span>
                                {message.assessment.correction}
                              </div>
                            </div>
                          )}
                          {message.assessment.explanation && (
                            <div className="bg-secondary/5 p-2.5 rounded-lg border border-secondary/10 flex gap-2">
                              <Info size={14} className="text-secondary shrink-0 mt-0.5" />
                              <div className="text-xs text-neutral-body">
                                <span className="font-bold block text-[10px] opacity-70 uppercase mb-0.5">Tip</span>
                                {message.assessment.explanation}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
