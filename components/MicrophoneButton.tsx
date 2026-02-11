import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { AppStatus } from '../types';

interface MicrophoneButtonProps {
  status: AppStatus;
  onClick: () => void;
  disabled: boolean;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({ status, onClick, disabled }) => {
  
  const getButtonContent = () => {
    switch (status) {
      case AppStatus.RECORDING:
        return <Mic className="w-8 h-8 text-white animate-pulse" />;
      case AppStatus.PROCESSING:
        return <Loader2 className="w-8 h-8 text-white animate-spin" />;
      case AppStatus.SPEAKING:
        return <MicOff className="w-8 h-8 text-gray-300" />; // Disabled while speaking
      default:
        return <Mic className="w-8 h-8 text-white" />;
    }
  };

  const getButtonStyles = () => {
    if (disabled) return 'bg-gray-300 cursor-not-allowed';
    
    switch (status) {
      case AppStatus.RECORDING:
        return 'bg-red-500 ring-4 ring-red-200 scale-110';
      case AppStatus.PROCESSING:
        return 'bg-secondary cursor-wait';
      case AppStatus.SPEAKING:
        return 'bg-gray-300 cursor-wait';
      default: // IDLE
        return 'bg-gradient-to-r from-primary to-primary-dark hover:scale-105 hover:shadow-lg shadow-md ring-4 ring-primary-light/30';
    }
  };

  return (
    <div className="relative flex justify-center items-center h-24">
       {/* Ripple Effect when Listening */}
       {status === AppStatus.RECORDING && (
        <>
          <div className="absolute w-20 h-20 bg-red-400 rounded-full animate-ping opacity-75"></div>
          <div className="absolute w-28 h-28 bg-red-200 rounded-full animate-pulse opacity-50"></div>
        </>
      )}

      <button
        onClick={onClick}
        disabled={disabled || status === AppStatus.PROCESSING || status === AppStatus.SPEAKING}
        className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${getButtonStyles()}`}
      >
        {getButtonContent()}
      </button>
      
      {status === AppStatus.IDLE && !disabled && (
        <span className="absolute -bottom-8 text-gray-400 text-sm font-semibold tracking-wide animate-bounce">
          Tap to Speak
        </span>
      )}
    </div>
  );
};