import React from 'react';

interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, max, label }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));

  return (
    <div className="w-full">
      {label && <div className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">{label}</div>}
      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary-light to-primary-dark transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};