import React from 'react';
import { Message } from '../types';
import { Bot, User, CheckCircle2, AlertCircle, Volume2 } from 'lucide-react';
import { speakText } from '../services/tts';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const handlePlayAudio = () => {
    speakText(message.text);
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1 ${isUser ? 'bg-secondary text-white' : 'bg-primary text-white'}`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Bubble Content */}
        <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
          <div 
            className={`px-5 py-3 rounded-2xl text-sm md:text-base shadow-sm relative group
              ${isUser 
                ? 'bg-white text-gray-800 rounded-br-none border border-secondary-light' 
                : 'bg-primary-dark text-white rounded-bl-none'
              }`}
          >
            {message.text}
            
            {/* Audio Replay Button */}
            {!isUser && (
              <button 
                onClick={handlePlayAudio}
                className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-primary"
                aria-label="Play audio"
              >
                <Volume2 size={16} />
              </button>
            )}
          </div>

          {/* Correction / XP Feedback */}
          {message.correction && (
             <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg flex items-start gap-2 max-w-full border border-red-100 mt-1">
               <AlertCircle size={14} className="mt-0.5 shrink-0" />
               <span>
                 <span className="font-bold">Correction:</span> {message.correction}
               </span>
             </div>
          )}
          
          {message.xpGained !== undefined && message.xpGained > 0 && (
            <div className="flex items-center gap-1 text-xs font-bold text-yellow-500 animate-pulse">
              <CheckCircle2 size={12} />
              +{message.xpGained} XP
            </div>
          )}
        </div>
      </div>
    </div>
  );
};