
import React, { useEffect, useState } from 'react';
import { X, Play, StopCircle, Check } from 'lucide-react';
import { useAppStore } from '../store';
import { getAvailableVoices, getBestVoice, speakText } from '../services/tts';

interface VoiceSettingsProps {
  onClose: () => void;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({ onClose }) => {
  const { ttsSettings, updateTTSSettings } = useAppStore();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    const loadVoices = async () => {
      const allVoices = await getAvailableVoices();
      // Filter primarily for English, but allow others if needed
      const enVoices = allVoices.filter(v => v.lang.startsWith('en'));
      setVoices(enVoices);
      
      // If no voice is selected yet, pick the best one automatically
      if (!ttsSettings.voiceURI) {
        const best = getBestVoice(allVoices);
        if (best) {
          updateTTSSettings({ voiceURI: best.voiceURI });
        }
      }
    };
    loadVoices();
  }, [ttsSettings.voiceURI, updateTTSSettings]);

  const handlePreview = () => {
    if (previewing) {
      window.speechSynthesis.cancel();
      setPreviewing(false);
      return;
    }

    setPreviewing(true);
    speakText(
      "Hello! This is how I sound. Do you like my voice?",
      () => setPreviewing(false),
      {
        voiceURI: ttsSettings.voiceURI,
        rate: ttsSettings.rate,
        pitch: ttsSettings.pitch
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-800 p-6 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-black text-white">AI Voice Settings</h2>
            <p className="text-slate-400 text-sm">Tune your tutor's personality</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* Voice Selector */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Voice Model</label>
            <div className="grid gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {voices.map((voice) => {
                const isSelected = ttsSettings.voiceURI === voice.voiceURI;
                // Highlight high-quality names
                const isHighQuality = voice.name.includes('Google') || voice.name.includes('Samantha') || voice.name.includes('Premium');
                
                return (
                  <button
                    key={voice.voiceURI}
                    onClick={() => updateTTSSettings({ voiceURI: voice.voiceURI })}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-between
                      ${isSelected 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-transparent bg-gray-50 hover:bg-gray-100 hover:border-gray-200'
                      }`}
                  >
                    <div className="flex flex-col">
                      <span className={`font-bold text-sm ${isSelected ? 'text-primary-dark' : 'text-slate-700'}`}>
                        {voice.name.replace('Microsoft', '').replace('English', '').trim()}
                      </span>
                      <span className="text-xs text-gray-400">{voice.lang} {isHighQuality && '✨'}</span>
                    </div>
                    {isSelected && <div className="bg-primary text-white p-1 rounded-full"><Check size={12} /></div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Speed Slider */}
          <div className="space-y-4">
             <div className="flex justify-between items-end">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Speaking Speed</label>
                <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{ttsSettings.rate.toFixed(1)}x</span>
             </div>
             <input 
               type="range" 
               min="0.5" 
               max="1.5" 
               step="0.1"
               value={ttsSettings.rate}
               onChange={(e) => updateTTSSettings({ rate: parseFloat(e.target.value) })}
               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
             />
             <div className="flex justify-between text-xs text-gray-400 font-bold">
               <span>Slow</span>
               <span>Natural</span>
               <span>Fast</span>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
          <button 
            onClick={handlePreview}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]
              ${previewing ? 'bg-red-500 shadow-red-500/30' : 'bg-slate-800 hover:bg-slate-900 shadow-slate-800/30'}
            `}
          >
            {previewing ? (
              <>
                <StopCircle size={20} /> Stop Preview
              </>
            ) : (
              <>
                <Play size={20} /> Test Voice
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
