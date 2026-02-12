import React, { useState } from 'react';
import { TimerStatus, TimerMode } from '../types'; // 确保是 ../types

interface TimerDisplayProps {
  timeLeft: number;
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onFinishCountUp: () => void;
  onTimeChange: (newTotalSeconds: number) => void;
  mode: TimerMode;
  onModeChange: (mode: TimerMode) => void;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  timeLeft, status, onStart, onPause, onReset, onFinishCountUp, onTimeChange, mode, onModeChange 
}) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isCountUp = mode === TimerMode.COUNT_UP;

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* 这里的切换按钮会触发 App.tsx 的 toggleMode */}
      <div className="flex bg-[#e5dec9] p-1 rounded-full mb-6 shadow-inner border border-[#8b4513]/10">
        <button 
          onClick={() => status === 'IDLE' && onModeChange(TimerMode.FOCUS)}
          className={`px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${!isCountUp ? 'bg-[#8b4513] text-white shadow-md' : 'text-[#8b4513]/40'}`}
          disabled={status !== 'IDLE'}
        >Timed</button>
        <button 
          onClick={() => status === 'IDLE' && onModeChange(TimerMode.COUNT_UP)}
          className={`px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${isCountUp ? 'bg-[#8b4513] text-white shadow-md' : 'text-[#8b4513]/40'}`}
          disabled={status !== 'IDLE'}
        >Free</button>
      </div>

      <div className="relative w-full bg-[#fdfbf7] p-8 rounded-3xl border-4 border-[#8b4513] shadow-2xl flex flex-col items-center">
         <div className="mt-4 mb-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b4513]/40">
           {status === 'RUNNING' ? (isCountUp ? 'Free Simmering...' : 'Cooking...') : 'Ready'}
         </div>
         <div className="text-8xl md:text-9xl font-mono font-bold text-[#4a3728] h-32 flex items-center">
           {formattedTime}
         </div>

         <div className="mt-6 flex items-center justify-center gap-6 w-full py-4 border-t border-[#8b4513]/5">
            {status !== 'RUNNING' ? (
              <button onClick={status === 'FINISHED' ? onReset : onStart} className="w-16 h-16 bg-[#8b4513] text-white rounded-full flex items-center justify-center text-2xl shadow-xl">
                {status === 'FINISHED' ? "🔄" : "▶️"}
              </button>
            ) : (
              <button onClick={onPause} className="w-16 h-16 bg-[#a67c52] text-white rounded-full flex items-center justify-center text-2xl shadow-xl">⏸️</button>
            )}

            {(status === 'RUNNING' || status === 'PAUSED') && (
              <button 
                onClick={isCountUp ? onFinishCountUp : onReset}
                className="w-12 h-12 bg-white border-2 border-[#8b4513]/20 text-[#8b4513] rounded-full flex items-center justify-center font-bold text-[8px]"
              >
                {isCountUp ? "FINISH" : "RESET"}
              </button>
            )}
         </div>
      </div>
    </div>
  );
};

export default TimerDisplay;
