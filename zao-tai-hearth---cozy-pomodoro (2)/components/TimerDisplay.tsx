
import React, { useState } from 'react';
import { TimerStatus, TimerMode } from '../types';

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
  timeLeft, 
  status, 
  onStart, 
  onPause, 
  onReset,
  onFinishCountUp,
  onTimeChange,
  mode,
  onModeChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isCountUp = mode === TimerMode.COUNT_UP;

  const getStatusText = () => {
    if (status === 'IDLE') return isCountUp ? 'Fire is Ready' : 'Ready to Cook';
    if (status === 'RUNNING') {
      if (isCountUp) return 'Simmering freely...';
      return mode === TimerMode.FOCUS ? 'Cooking by recipe...' : 'Tea Time';
    }
    if (status === 'PAUSED') return 'Keeping Warm...';
    return 'Pot Ready!';
  };

  const handleEditStart = () => {
    if (status === 'IDLE' && !isCountUp) {
      setIsEditing(true);
      setEditValue(minutes.toString());
    }
  };

  const handleEditSubmit = () => {
    const newMinutes = parseInt(editValue, 10);
    if (!isNaN(newMinutes) && newMinutes >= 0 && newMinutes <= 999) {
      onTimeChange(newMinutes * 60);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Mode Switcher */}
      <div className="flex bg-[#e5dec9] p-1 rounded-full mb-6 shadow-inner border border-[#8b4513]/10">
        <button 
          onClick={() => status === 'IDLE' && onModeChange(TimerMode.FOCUS)}
          className={`px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${!isCountUp ? 'bg-[#8b4513] text-white shadow-md' : 'text-[#8b4513]/40'}`}
          disabled={status !== 'IDLE'}
        >
          Timed
        </button>
        <button 
          onClick={() => status === 'IDLE' && onModeChange(TimerMode.COUNT_UP)}
          className={`px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${isCountUp ? 'bg-[#8b4513] text-white shadow-md' : 'text-[#8b4513]/40'}`}
          disabled={status !== 'IDLE'}
        >
          Free
        </button>
      </div>

      {/* The Timer Board */}
      <div className="relative w-full bg-[#fdfbf7] p-8 rounded-3xl border-4 border-[#8b4513] shadow-2xl flex flex-col items-center">
         {/* Top Hanging Decoration */}
         <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-[#8b4513] rounded-t-xl flex justify-center items-center gap-2">
           <div className="w-2 h-2 bg-[#f3eee3] rounded-full"></div>
           <div className="w-2 h-2 bg-[#f3eee3] rounded-full"></div>
           <div className="w-2 h-2 bg-[#f3eee3] rounded-full"></div>
         </div>
         
         <div className="mt-4 mb-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b4513]/40 heytea-font">
           {getStatusText()}
         </div>

         <div className="text-8xl md:text-9xl font-mono font-bold tracking-tight text-[#4a3728] tabular-nums flex justify-center items-center h-32 w-full">
           {isEditing ? (
             <div className="flex items-center">
                <input
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value.replace(/\D/g, ''))}
                  onBlur={handleEditSubmit}
                  onKeyDown={handleKeyDown}
                  className="w-40 bg-transparent border-b-4 border-[#8b4513] outline-none text-center"
                />
                <span className="text-2xl ml-2 opacity-30 heytea-font">m</span>
             </div>
           ) : (
             <span 
               onClick={handleEditStart}
               className={`${status === 'IDLE' && !isCountUp ? 'cursor-pointer hover:text-[#8b4513] transition-colors border-b-2 border-transparent hover:border-[#8b4513]/20' : 'pointer-events-none'}`}
             >
               {formattedTime}
             </span>
           )}
         </div>

         {/* Integrated Controls */}
         <div className="mt-6 flex items-center justify-center gap-6 w-full py-4 border-t border-[#8b4513]/5">
            {status === 'IDLE' || status === 'PAUSED' || status === 'FINISHED' ? (
              <button 
                onClick={status === 'FINISHED' ? (isCountUp ? onFinishCountUp : onReset) : onStart}
                className="w-16 h-16 bg-[#8b4513] text-white rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
              >
                {status === 'FINISHED' ? (
                  <svg className="w-8 h-8 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            ) : (
              <button 
                onClick={onPause}
                className="w-16 h-16 bg-[#a67c52] text-white rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
              >
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              </button>
            )}

            {(status === 'RUNNING' || status === 'PAUSED') && (
              <button 
                onClick={isCountUp ? onFinishCountUp : onReset}
                className="w-12 h-12 bg-white border-2 border-[#8b4513]/20 text-[#8b4513] hover:border-[#8b4513]/40 rounded-full shadow-sm transition-all flex flex-col items-center justify-center group"
                title={isCountUp ? "Finish and Serve" : "Reset Stove"}
              >
                {isCountUp ? (
                  <span className="text-[8px] font-bold uppercase tracking-tighter leading-none group-hover:scale-110 transition-transform">Finish</span>
                ) : (
                  <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            )}
         </div>
      </div>
      
      {status === 'IDLE' && !isCountUp && (
        <p className="mt-4 text-[9px] font-bold text-[#8b4513]/30 uppercase tracking-[0.3em]">
          Click time to customize minutes
        </p>
      )}
      {status === 'IDLE' && isCountUp && (
        <p className="mt-4 text-[9px] font-bold text-[#8b4513]/30 uppercase tracking-[0.3em]">
          Free cooking: count your deep focus
        </p>
      )}
    </div>
  );
};

export default TimerDisplay;
