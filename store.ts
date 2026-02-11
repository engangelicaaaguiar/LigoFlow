
import { create } from 'zustand';
import { Message, UserProgress, AppStatus, CEFRLevel, FlowState, FlowMode, TTSSettings, UserProfile, SessionHistoryItem, VocabularyItem } from './types';
import { supabase } from './services/supabase';

interface AppStore {
  user: UserProgress | null;
  userProfile: UserProfile | null;
  status: AppStatus;
  messages: Message[];
  
  // Dashboard Data
  recentSessions: SessionHistoryItem[];
  recentVocabulary: VocabularyItem[];
  
  // Context Data for AI
  pastTopics: string[];

  // Session State
  sessionId: string | null;
  currentTopic: string;
  targetLevel: CEFRLevel;
  
  // Infinity Flow State (DDA)
  flowState: FlowState;
  
  // TTS State
  ttsSettings: TTSSettings;

  // Drill State
  lastFailedMessageId: string | null;

  // Actions
  initUser: (userId: string, email?: string) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  fetchDashboardData: () => Promise<void>;
  startSession: (topic: string, level: CEFRLevel) => Promise<void>;
  addMessage: (message: Message) => Promise<void>;
  setStatus: (status: AppStatus) => void;
  updateProgress: (text: string) => Promise<number>; 
  setErrorState: () => void;
  updateTTSSettings: (settings: Partial<TTSSettings>) => void;
  
  // Helper to update flow based on last assessment
  updateFlowState: (score: number) => void;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useAppStore = create<AppStore>((set, get) => ({
  user: null,
  userProfile: null,
  status: AppStatus.LOGIN,
  messages: [],
  sessionId: null,
  currentTopic: 'General',
  targetLevel: 'A1',
  lastFailedMessageId: null,
  
  recentSessions: [],
  recentVocabulary: [],
  pastTopics: [],

  flowState: {
    comboCount: 0,
    mistakeCount: 0,
    currentMode: 'NEUTRAL',
    sessionWordCount: 0
  },

  // Default "Tuned" Persona Settings
  ttsSettings: {
    voiceURI: null,
    rate: 0.9,   // Slightly slower for clarity
    pitch: 1.05  // Slightly friendlier/energetic
  },

  setStatus: (status) => set({ status }),
  setErrorState: () => set({ status: AppStatus.CONFIG_ERROR }),
  updateTTSSettings: (settings) => set((state) => ({ ttsSettings: { ...state.ttsSettings, ...settings } })),

  initUser: async (userId, email) => {
    let attempts = 0;
    let progressData = null;
    let profileData = null;

    while (attempts < 3 && !progressData) {
      // Fetch Game Progress
      const progressQuery = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // Fetch User Profile
      const profileQuery = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!progressQuery.error && progressQuery.data) {
        progressData = progressQuery.data;
        profileData = profileQuery.data; 
      } else {
        if (progressQuery.error && (progressQuery.error.code === 'PGRST301' || progressQuery.error.message.includes('API key'))) {
             console.error("Critical Auth Error:", progressQuery.error.message);
             set({ status: AppStatus.CONFIG_ERROR });
             return;
        }
        await delay(1000); 
        attempts++;
      }
    }

    // Fetch Context: Last 5 distinct topics to build "User Memory"
    const topicsQuery = await supabase
      .from('learning_sessions')
      .select('topic')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20); // Fetch more to deduplicate locally if needed
    
    // Deduplicate topics
    const rawTopics = topicsQuery.data?.map(t => t.topic) || [];
    const distinctTopics = Array.from(new Set(rawTopics)).slice(0, 5);

    set({
      user: {
        userId,
        currentLevel: progressData?.current_level || 'A1',
        totalUniqueWords: progressData?.total_unique_words || 0,
        wordsRequiredForNextLevel: progressData?.words_to_next_level || 700
      },
      userProfile: profileData ? {
        id: profileData.id,
        email: profileData.email || email || '',
        fullName: profileData.full_name || '',
        aboutMe: profileData.about_me || '',
        profession: profileData.profession || '',
        address: profileData.address || '',
        phone: profileData.phone || ''
      } : {
        id: userId,
        email: email || '',
        fullName: '',
        aboutMe: '',
        profession: '',
        address: '',
        phone: ''
      },
      pastTopics: distinctTopics,
      status: AppStatus.SETUP
    });
  },

  updateUserProfile: async (updatedFields) => {
    const { userProfile } = get();
    if (!userProfile) return;

    const newProfile = { ...userProfile, ...updatedFields };

    set({ userProfile: newProfile });

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: newProfile.fullName,
        about_me: newProfile.aboutMe,
        profession: newProfile.profession,
        address: newProfile.address,
        phone: newProfile.phone
      })
      .eq('id', userProfile.id);

    if (error) {
      console.error('Failed to update profile:', error);
    }
  },

  fetchDashboardData: async () => {
    const { user } = get();
    if (!user) return;

    // Fetch Last 10 Sessions
    const sessionsQuery = await supabase
      .from('learning_sessions')
      .select('id, topic, target_level, created_at')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch Last 30 Learned Words
    const vocabQuery = await supabase
      .from('user_vocabulary')
      .select('word, first_spoken_at')
      .eq('user_id', user.userId)
      .order('first_spoken_at', { ascending: false })
      .limit(30);

    set({
      recentSessions: sessionsQuery.data || [],
      recentVocabulary: vocabQuery.data || []
    });
  },

  startSession: async (topic, level) => {
    const { user } = get();
    if (!user) return;

    // Reset Flow State on new session
    set({
      flowState: {
        comboCount: 0,
        mistakeCount: 0,
        currentMode: 'NEUTRAL',
        sessionWordCount: 0
      }
    });

    const { data: session, error } = await supabase
      .from('learning_sessions')
      .insert({
        user_id: user.userId,
        topic,
        target_level: level,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.warn('Failed to start session in DB (Offline mode?):', error.message);
      if (error.message.includes('API key')) {
          set({ status: AppStatus.CONFIG_ERROR });
          return;
      }
      set({
        sessionId: 'offline-' + Date.now(),
        currentTopic: topic,
        targetLevel: level,
        messages: [{
          id: 'intro',
          role: 'assistant',
          text: `Welcome to your ${level} session about "${topic}". Let's start!`,
          timestamp: Date.now()
        }],
        status: AppStatus.IDLE
      });
      return;
    }

    set({
      sessionId: session.id,
      currentTopic: topic,
      targetLevel: level,
      messages: [{
        id: 'intro',
        role: 'assistant',
        text: `Welcome to your ${level} session about "${topic}". Let's start!`,
        timestamp: Date.now()
      }],
      status: AppStatus.IDLE
    });
  },

  addMessage: async (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
    
    // If it's an assistant message with assessment, update flow logic
    if (message.role === 'assistant' && message.assessment) {
      get().updateFlowState(message.assessment.finalScore);
    }
  },

  updateFlowState: (score: number) => {
    const { flowState } = get();
    let { comboCount, mistakeCount, currentMode } = flowState;

    // Logic for DDA (Dynamic Difficulty Adjustment)
    if (score >= 8) {
      // Good performance
      comboCount += 1;
      mistakeCount = 0;
    } else if (score < 6) {
      // Struggle
      mistakeCount += 1;
      comboCount = 0;
    } else {
      // Neutral (6-7) - reset strict combos but don't punish too hard
      if (comboCount > 0) comboCount = 0; // Lost the streak
    }

    // Determine Mode
    if (comboCount >= 3) {
      currentMode = 'FIRE'; // User is "On Fire"
    } else if (mistakeCount >= 2) {
      currentMode = 'ZEN'; // User needs support
    } else {
      currentMode = 'NEUTRAL';
    }

    set({
      flowState: {
        ...flowState,
        comboCount,
        mistakeCount,
        currentMode
      }
    });
  },

  updateProgress: async (text: string) => {
     const { user, flowState } = get();
     if(!user) return 0;

     // Estimate word count for Soft Landing
     const wordsInMsg = text.trim().split(/\s+/).length;
     const newSessionWordCount = flowState.sessionWordCount + wordsInMsg;
     
     // Update session count locally
     set({ flowState: { ...flowState, sessionWordCount: newSessionWordCount }});

     // Call DB function
     const { data, error } = await supabase
        .rpc('submit_correct_sentence', { p_text: text });

     if (error) {
       console.error("Failed to update progress via RPC:", error.message);
       if (error.message.includes('API key')) {
          set({ status: AppStatus.CONFIG_ERROR });
       }
       return 0;
     }

     const newWordsCount = data.new_words_count || 0;

     set({
       user: {
         ...user,
         totalUniqueWords: data.total_unique_words,
         currentLevel: data.current_level,
         wordsRequiredForNextLevel: data.words_to_next_level
       }
     });

     return newWordsCount;
  }
}));
