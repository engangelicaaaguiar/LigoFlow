export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  correction?: string;
  xpGained?: number;
  timestamp: number;
}

export interface UserState {
  xp: number;
  level: number;
  dailyMessages: number;
  isPro: boolean;
  streak: number;
}

export interface GeminiResponse {
  reply: string;
  correction: string | null;
  xp: number;
}

export enum GameStatus {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  PROCESSING = 'PROCESSING',
  SPEAKING = 'SPEAKING',
}