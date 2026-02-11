
import React from 'react';
import { Mic, Lock, Loader2, Play, AlertCircle, Sparkles, Pause, Power } from 'lucide-react';
import { AppStatus } from '../types';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceVisualizerProps {
  status: AppStatus;
  isLocked: boolean;
  isSessionActive: boolean;
  onToggleSession: () => void;
  transcript?: string;
  error?: string | null;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ 
  status, 
  isLocked, 
  isSessionActive,
  onToggleSession,
  transcript,
  error
}) => {
  
  const { flowState, setStatus } = useAppStore();
  const { currentMode } = flowState;

  const isAiSpeaking = status === AppStatus.SPEAKING;
  const isProcessing = status === AppStatus.PROCESSING;
  const isRecording = status === AppStatus.RECORDING;
  const isPaused = status === AppStatus.PAUSED;
  const isError = !!error;

  const handlePauseToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPaused) {
      // Resume
      setStatus(AppStatus.IDLE);
      // Optional: Auto-start recording if desired, but IDLE is safer to let user tap orb
    } else {
      // Pause
      if (isSessionActive) {
        onToggleSession(); // Stop recognition/TTS
      }
      setStatus(AppStatus.PAUSED);
    }
  };

  // --- Animation States for The Orb ---
  
  // 1. Idle / Start
  const idleVariant = {
    scale: 1,
    boxShadow: "0 0 0px rgba(34, 197, 94, 0)",
  };

  // 2. Listening (Breathing Green)
  const listeningVariant = {
    scale: [1, 1.15, 1],
    background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
    boxShadow: [
      "0 0 20px rgba(34, 197, 94, 0.3)",
      "0 0 50px rgba(34, 197, 94, 0.6)",
      "0 0 20px rgba(34, 197, 94, 0.3)"
    ],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  };

  // 3. Speaking (Pulse Blue/Pink based on mode)
  const speakingVariant = {
    scale: [1, 1.05, 1],
    background: currentMode === 'FIRE' 
      ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" // Fire
      : "linear-gradient(135deg, #38BDF8 0%, #22C55E 100%)", // Normal
    boxShadow: "0 0 40px rgba(56, 189, 248, 0.5)",
    transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
  };

  // 4. Processing (Spinning Gradient)
  const processingVariant = {
    rotate: 360,
    scale: 0.9,
    background: "conic-gradient(from 0deg, #38BDF8, #FACC15, #22C55E, #38BDF8)",
    boxShadow: "0 0 30px rgba(250, 204, 21, 0.4)",
    transition: { rotate: { duration: 2, repeat: Infinity, ease: "linear" } }
  };

  // 5. Error
  const errorVariant = {
    x: [0, -10, 10, -10, 10, 0],
    background: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)",
    boxShadow: "0 0 30px rgba(239, 68, 68, 0.5)",
  };

  // 6. Paused
  const pausedVariant = {
    scale: 0.95,
    background: "#CBD5E1", // Slate 300
    boxShadow: "inset 0 0 20px rgba(0,0,0,0.1)",
  };

  // --- Icon Logic ---
  let Icon = Play;
  if (isRecording) Icon = Mic;
  if (isLocked) Icon = Lock;
  if (isError) Icon = AlertCircle;
  if (isProcessing) Icon = Loader2;
  if (isAiSpeaking) Icon = Sparkles;
  if (isPaused) Icon = Pause;

  const getStatusText = () => {
    if (isError) return "Connection Error";
    if (isLocked) return "Strict Mode";
    if (isProcessing) return "Thinking...";
    if (isAiSpeaking) return "LingoFlow Speaking";
    if (isRecording) return "Listening...";
    if (isPaused) return "Session Paused";
    return "Tap to Start";
  };

  return (
    <div className="relative w-full flex flex-col items-center pb-8 pt-4">
      
      {/* Transcript Float (Glass) */}
      <AnimatePresence>
        {(transcript || isRecording) && isSessionActive && !isError && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-32 w-full max-w-lg px-6 z-10"
          >
            <div className="bg-white/80 backdrop-blur-md border border-white/50 shadow-glass rounded-2xl p-4 text-center">
              <p className={`text-lg font-medium leading-relaxed ${transcript ? 'text-neutral-title' : 'text-neutral-light animate-pulse'}`}>
                {transcript || "Go ahead, I'm listening..."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THE ORB CONTAINER */}
      <div className="relative z-20 flex flex-col items-center">
        
        {/* Outer Glow Ring (Static) */}
        {!isSessionActive && !isPaused && (
           <div className="absolute top-0 rounded-full border border-neutral-light/20 scale-125 w-24 h-24 pointer-events-none"></div>
        )}

        {/* The Orb */}
        <motion.button
          onClick={isPaused ? handlePauseToggle : onToggleSession}
          whileTap={{ scale: 0.95 }}
          animate={
            isError ? errorVariant :
            isPaused ? pausedVariant :
            isProcessing ? processingVariant :
            isAiSpeaking ? speakingVariant :
            isRecording ? listeningVariant :
            idleVariant
          }
          className={`
            w-24 h-24 rounded-full flex items-center justify-center
            text-white shadow-2xl relative overflow-hidden transition-colors duration-500
            ${!isSessionActive && !isPaused ? 'bg-neutral-title' : ''}
          `}
        >
          {/* Inner Gloss (3D Effect) */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none"></div>
          
          <motion.div
             animate={isProcessing ? { rotate: -360 } : { rotate: 0 }} // Counter-rotate icon if orb spins
             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
             <Icon size={32} strokeWidth={2.5} className="drop-shadow-md relative z-10" />
          </motion.div>
        </motion.button>

        {/* Pause/Resume Control Control Bar */}
        {!isError && status !== AppStatus.SETUP && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center gap-4"
          >
            <button
              onClick={handlePauseToggle}
              className="px-6 py-2 bg-white/50 hover:bg-white backdrop-blur-md border border-white/60 rounded-full text-neutral-body text-sm font-bold shadow-sm flex items-center gap-2 transition-all"
            >
              {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
              {isPaused ? "Resume" : "Pause"}
            </button>
          </motion.div>
        )}

        {/* Status Label */}
        <motion.div 
          className="mt-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3 className={`text-lg font-bold tracking-tight ${isError ? 'text-red-500' : 'text-neutral-title'}`}>
            {getStatusText()}
          </h3>
          {isSessionActive && !isError && (
             <p className="text-xs font-bold text-accent tracking-widest uppercase mt-1">
               {currentMode === 'FIRE' ? '🔥 On Fire Mode' : currentMode === 'ZEN' ? '🌿 Zen Mode' : 'AI Active'}
             </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};
