import { create } from 'zustand';
import { Message, UserState, GameStatus } from './types';

interface AppStore {
  messages: Message[];
  user: UserState;
  status: GameStatus;
  
  // Actions
  addMessage: (message: Message) => void;
  updateUserXP: (xp: number) => void;
  incrementDailyMessages: () => void;
  setStatus: (status: GameStatus) => void;
  togglePro: () => void;
  resetDaily: () => void;
}

const calculateLevel = (xp: number) => Math.floor(xp / 100) + 1;

export const useAppStore = create<AppStore>((set) => ({
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hi there! I'm Lingo, your English tutor. Tap the microphone and say something to start practicing!",
      timestamp: Date.now(),
      xpGained: 0
    }
  ],
  user: {
    xp: 0,
    level: 1,
    dailyMessages: 0,
    isPro: false,
    streak: 3
  },
  status: GameStatus.IDLE,

  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),

  updateUserXP: (amount) => set((state) => {
    const newXP = state.user.xp + amount;
    return {
      user: {
        ...state.user,
        xp: newXP,
        level: calculateLevel(newXP)
      }
    };
  }),

  incrementDailyMessages: () => set((state) => ({
    user: { ...state.user, dailyMessages: state.user.dailyMessages + 1 }
  })),

  setStatus: (status) => set({ status }),

  togglePro: () => set((state) => ({
    user: { ...state.user, isPro: !state.user.isPro }
  })),

  resetDaily: () => set((state) => ({
    user: { ...state.user, dailyMessages: 0 }
  }))
}));