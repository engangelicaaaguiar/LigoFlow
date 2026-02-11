
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store';
import { sendMessageToGemini } from '../services/gemini';
import { speakText } from '../services/tts';
import { AppStatus, SpeechRecognitionEvent, SpeechRecognition, CEFRLevel, FlowMode } from '../types';
import { supabase } from '../services/supabase';

export type ConversationStatus = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';

// Helper: Determine speech speed based on level AND mood (DDA) relative to User Base Rate
const getDynamicSpeechRate = (userBaseRate: number, level: CEFRLevel, mode: FlowMode): number => {
  let levelModifier = 1.0;
  
  // CEFR Modifier (Relative)
  switch (level) {
    case 'A1': levelModifier = 0.9; break;
    case 'A2': levelModifier = 0.95; break;
    case 'B1': levelModifier = 1.0; break;
    case 'B2': levelModifier = 1.05; break;
    case 'C1': levelModifier = 1.1; break;
    case 'C2': levelModifier = 1.15; break;
  }

  // DDA Modifier (Mood)
  let moodModifier = 1.0;
  if (mode === 'FIRE') moodModifier = 1.1; 
  if (mode === 'ZEN') moodModifier = 0.9; 

  // Combine: UserPref * Level * Mood
  // Clamp between 0.5 and 2.0 for browser safety
  const finalRate = userBaseRate * levelModifier * moodModifier;
  return Math.min(Math.max(finalRate, 0.5), 2.0);
};

export const useConversation = () => {
  const store = useAppStore();
  
  const [status, setStatus] = useState<ConversationStatus>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // --- FLICKER FIX: State Separation ---
  const finalTranscriptRef = useRef(''); 
  const currentFullTranscriptRef = useRef(''); 

  const isActiveRef = useRef(false);
  const statusRef = useRef<ConversationStatus>('IDLE');

  const SILENCE_TIMEOUT = 2000;
  const SLA_TIMEOUT = 10000; // OPTIMIZATION 1: 10s Hard Limit

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const mapStatusToApp = (): AppStatus => {
      switch (status) {
        case 'LISTENING': return AppStatus.RECORDING;
        case 'PROCESSING': return AppStatus.PROCESSING;
        case 'SPEAKING': return AppStatus.SPEAKING;
        case 'ERROR': return AppStatus.CONFIG_ERROR;
        default: return store.status === AppStatus.DRILL_LOCKED ? AppStatus.DRILL_LOCKED : AppStatus.IDLE;
      }
    };
    
    if (store.status !== AppStatus.SETUP && store.status !== AppStatus.LOGIN) {
       store.setStatus(mapStatusToApp());
    }
  }, [status, store.setStatus]);

  const processUserSpeech = async (text: string) => {
    if (!text || !text.trim()) return;

    setStatus('PROCESSING');
    
    finalTranscriptRef.current = '';
    currentFullTranscriptRef.current = '';
    setTranscript('');
    
    store.addMessage({
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    });

    try {
      const isRetry = store.status === AppStatus.DRILL_LOCKED;
      
      // OPTIMIZATION 1: The Watchdog (Promise.race)
      // If the API takes longer than 10s, we kill it and restart.
      const apiCall = sendMessageToGemini(text, {
        targetLevel: store.targetLevel,
        topic: store.currentTopic,
        isDrillRetry: isRetry,
        flowState: store.flowState,
        // --- NEW USER CONTEXT ---
        userVocabularySize: store.user?.totalUniqueWords || 0,
        userPastTopics: store.pastTopics || []
      });

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("SLA_TIMEOUT")), SLA_TIMEOUT)
      );

      const response = await Promise.race([apiCall, timeoutPromise]);

      // --- Success Path ---
      let newWords = 0;
      if (response.assessment.finalScore < 10) {
        store.setStatus(AppStatus.DRILL_LOCKED);
      } else {
        newWords = await store.updateProgress(text);
        if (store.status === AppStatus.DRILL_LOCKED) {
           store.setStatus(AppStatus.IDLE);
        }
      }

      store.addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.reply,
        assessment: response.assessment,
        timestamp: Date.now(),
        xpGained: newWords
      });

      if (store.sessionId) {
        await supabase.from('interactions').insert({
          session_id: store.sessionId,
          user_text_transcribed: text,
          ai_response_text: response.reply,
          final_score: response.assessment.finalScore,
          new_words_count: newWords
        });
      }

      speakAndListen(response.reply);

    } catch (err: any) {
      if (err.message === "SLA_TIMEOUT") {
        console.warn("⏱️ Watchdog: API took too long. Auto-restarting.");
        setError("Network slow... trying again");
        // Fail Fast Strategy: Don't let the user hang.
        // Immediately go back to listening mode so they can retry.
        setTimeout(() => {
          setError(null);
          if (isActiveRef.current) {
            startRecognition(); 
          } else {
            setStatus('IDLE');
          }
        }, 1500); // Short visual feedback
      } else {
        console.error('❌ Processing error:', err);
        setError('AI Connection Failed');
        setStatus('IDLE');
        isActiveRef.current = false;
      }
    }
  };

  const startRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Browser not supported. Use Chrome/Edge/Safari.');
      setStatus('ERROR');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) { }
    }

    if (!isActiveRef.current) {
        finalTranscriptRef.current = '';
        currentFullTranscriptRef.current = '';
        setTranscript('');
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setStatus('LISTENING');
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptChunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcriptChunk + ' ';
        } else {
          interimTranscript += transcriptChunk;
        }
      }
      const combinedTranscript = (finalTranscriptRef.current + interimTranscript).replace(/\s+/g, ' ');
      setTranscript(combinedTranscript);
      currentFullTranscriptRef.current = combinedTranscript;

      if (combinedTranscript.trim()) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          recognition.stop();
        }, SILENCE_TIMEOUT);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied.');
        setStatus('ERROR');
        isActiveRef.current = false;
      }
      if (event.error === 'no-speech' && isActiveRef.current) {
         // ignore
      }
    };

    recognition.onend = () => {
      if (!isActiveRef.current) {
        setStatus('IDLE');
        return;
      }
      const textToProcess = currentFullTranscriptRef.current.trim();
      if (textToProcess) {
        processUserSpeech(textToProcess);
      } else {
        const currentStatus = statusRef.current;
        if (currentStatus !== 'PROCESSING' && currentStatus !== 'SPEAKING') {
           try { recognition.start(); } catch (e) { }
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();

  }, []);

  const speakAndListen = useCallback((text: string) => {
    setStatus('SPEAKING');
    
    const rate = getDynamicSpeechRate(
      store.ttsSettings.rate, 
      store.targetLevel, 
      store.flowState.currentMode
    );

    speakText(
      text, 
      () => {
        isActiveRef.current = true;
        startRecognition();
      }, 
      {
        voiceURI: store.ttsSettings.voiceURI,
        rate: rate,
        pitch: store.ttsSettings.pitch
      }
    );
  }, [startRecognition, store.targetLevel, store.flowState.currentMode, store.ttsSettings]);

  const toggleSession = useCallback(() => {
    if (isActiveRef.current) {
      isActiveRef.current = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) recognitionRef.current.abort();
      window.speechSynthesis.cancel();
      setStatus('IDLE');
      setTranscript('');
      finalTranscriptRef.current = '';
      currentFullTranscriptRef.current = '';
    } else {
      isActiveRef.current = true;
      startRecognition();
    }
  }, [startRecognition]);

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) recognitionRef.current.abort();
      window.speechSynthesis.cancel();
    };
  }, []);

  return {
    status,
    transcript,
    error,
    toggleSession,
    speakAndListen,
    isSessionActive: isActiveRef.current
  };
};
