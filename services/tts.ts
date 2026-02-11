
export interface TTSOptions {
  voiceURI?: string | null;
  rate?: number;
  pitch?: number;
}

// Helper to wait for voices to load (Chrome requirement)
export const getAvailableVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        const updatedVoices = window.speechSynthesis.getVoices();
        resolve(updatedVoices);
      };
      
      // Fallback timeout in case onvoiceschanged never fires
      setTimeout(() => {
        resolve(window.speechSynthesis.getVoices());
      }, 1000);
    }
  });
};

// "Smart Pick" Algorithm to find the best sounding English voice
export const getBestVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  // Filter for English voices only first
  const englishVoices = voices.filter(v => v.lang.startsWith('en'));

  if (englishVoices.length === 0) return null;

  // Priority 1: Google US English (Usually high quality on Chrome/Android)
  const googleUS = englishVoices.find(v => v.name.includes('Google US English'));
  if (googleUS) return googleUS;

  // Priority 2: Samantha (High quality on macOS/iOS)
  const samantha = englishVoices.find(v => v.name.includes('Samantha'));
  if (samantha) return samantha;

  // Priority 3: Microsoft English (Natural on Windows)
  const microsoft = englishVoices.find(v => v.name.includes('Microsoft') && v.name.includes('United States'));
  if (microsoft) return microsoft;

  // Priority 4: Any US English
  const anyUS = englishVoices.find(v => v.lang === 'en-US');
  if (anyUS) return anyUS;

  // Fallback: First available English voice
  return englishVoices[0];
};

export const speakText = async (text: string, onEnd?: () => void, options: TTSOptions = {}) => {
  if (!('speechSynthesis' in window)) {
    console.warn('Text-to-speech not supported in this browser.');
    if (onEnd) onEnd();
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Load voices first
  const voices = await getAvailableVoices();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  
  // Apply Tuned Defaults or User Overrides
  utterance.rate = options.rate ?? 0.9;
  utterance.pitch = options.pitch ?? 1.05;

  // Select Voice
  let selectedVoice: SpeechSynthesisVoice | undefined | null;

  if (options.voiceURI) {
    selectedVoice = voices.find(v => v.voiceURI === options.voiceURI);
  }

  if (!selectedVoice) {
    selectedVoice = getBestVoice(voices);
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.error('TTS Error', e);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
};
