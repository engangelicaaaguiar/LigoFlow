
import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, max, label }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));

  return (
    <div className="w-full flex flex-col gap-1">
      {label && (
        <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-neutral-light">
          <span>{label}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="h-2.5 w-full bg-neutral-offWhite border border-white/60 rounded-full shadow-inner overflow-hidden relative">
        <motion.div 
          className="h-full bg-cta absolute left-0 top-0 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        {/* Shine effect on bar */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-full pointer-events-none" />
      </div>
    </div>
  );
};
