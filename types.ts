
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Assessment {
  grammarScore: number; // 0-10
  phoneticsScore: number; // 0-10
  finalScore: number; // 0-10
  correction: string | null;
  explanation: string | null;
  isPerfect: boolean;
  wordCount: number; // Number of valid words in the sentence
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  assessment?: Assessment;
  audioUrl?: string;
  timestamp: number;
  xpGained?: number; // Representing new unique words found
}

export interface UserProgress {
  userId: string;
  currentLevel: CEFRLevel;
  totalUniqueWords: number;
  wordsRequiredForNextLevel: number;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  aboutMe: string;
  profession: string;
  address: string;
  phone: string;
}

export interface SessionHistoryItem {
  id: string;
  topic: string;
  target_level: CEFRLevel;
  created_at: string;
  message_count?: number; // Calculated field
}

export interface VocabularyItem {
  word: string;
  first_spoken_at: string;
}

export enum AppStatus {
  LOGIN = 'LOGIN',
  SETUP = 'SETUP', // Selecting Topic/Level
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  SPEAKING = 'SPEAKING',
  PAUSED = 'PAUSED', // New Paused State
  DRILL_LOCKED = 'DRILL_LOCKED', // "Trava" active
  CONFIG_ERROR = 'CONFIG_ERROR', // New status for missing API keys
}

// --- Infinity Flow Types ---
export type FlowMode = 'NEUTRAL' | 'FIRE' | 'ZEN';

export interface FlowState {
  comboCount: number;      // Consecutive perfect/good answers
  mistakeCount: number;    // Consecutive bad answers
  currentMode: FlowMode;
  sessionWordCount: number; // Words in THIS session (for soft landing)
}

export interface GeminiContext {
  targetLevel: CEFRLevel;
  topic: string;
  isDrillRetry: boolean;
  flowState: FlowState;
  // New User Context Fields
  userVocabularySize: number;
  userPastTopics: string[]; // List of recent topics the user discussed
}

export interface GeminiResponse {
  reply: string; // The conversational reply OR the drill instruction
  assessment: Assessment;
}

// --- TTS Settings ---
export interface TTSSettings {
  voiceURI: string | null; // ID of the selected voice
  rate: number; // 0.5 to 2.0
  pitch: number; // 0.5 to 2.0
}

// --- Web Speech API Types ---
export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: any;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: any) => any) | null;
}

export interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
  }
}
