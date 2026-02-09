
import React, { useState, useEffect } from 'react';
import { TimerStatus, TimerMode } from '../types';

interface TimerDisplayProps {
  timeLeft: number;
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onTimeChange: (newTotalSeconds: number) => void;
  mode: TimerMode;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  timeLeft, 
  status, 
  onStart, 
  onPause, 
  onReset,
  onTimeChange,
  mode
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const getStatusText = () => {
    if (status === 'IDLE') return 'Ready to Cook (Click time to edit)';
    if (status === 'RUNNING') {
      return mode === TimerMode.FOCUS ? 'Simmering...' : 'Enjoying a break';
    }
    if (status === 'PAUSED') return 'Low Fire...';
    return 'Done!';
  };

  const handleEditStart = () => {
    if (status === 'IDLE') {
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
    <div className="flex flex-col items-center gap-6">
      {/* The Timer Board */}
      <div className="relative bg-[#fdfbf7] px-12 py-8 rounded-xl border-4 border-[#8b4513] shadow-lg">
         <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#8b4513] rounded-t-lg flex justify-center items-center">
           <div className="w-1.5 h-1.5 bg-[#f3eee3] rounded-full mx-1"></div>
           <div className="w-1.5 h-1.5 bg-[#f3eee3] rounded-full mx-1"></div>
         </div>
         
         <div className="text-7xl md:text-8xl font-mono font-bold tracking-tight text-[#4a3728] tabular-nums flex justify-center items-center h-24 min-w-[200px]">
           {isEditing ? (
             <div className="flex items-center">
                <input
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value.replace(/\D/g, ''))}
                  onBlur={handleEditSubmit}
                  onKeyDown={handleKeyDown}
                  className="w-32 bg-transparent border-b-4 border-[#8b4513] outline-none text-center"
                />
                <span className="text-2xl ml-2 opacity-30">min</span>
             </div>
           ) : (
             <span 
               onClick={handleEditStart}
               className={`${status === 'IDLE' ? 'cursor-edit hover:text-[#8b4513] transition-colors cursor-pointer' : ''}`}
             >
               {formattedTime}
             </span>
           )}
         </div>
         
         <div className="mt-2 text-center text-sm font-bold uppercase tracking-widest text-[#8b4513]/60 heytea-font">
           {getStatusText()}
         </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {status === 'IDLE' || status === 'PAUSED' ? (
          <button 
            onClick={onStart}
            className="w-16 h-16 bg-green-700 hover:bg-green-800 text-white rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center group"
          >
            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        ) : status === 'RUNNING' ? (
          <button 
            onClick={onPause}
            className="w-16 h-16 bg-orange-700 hover:bg-orange-800 text-white rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
          >
            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </button>
        ) : (
          <button 
            onClick={onReset}
            className="w-16 h-16 bg-blue-700 hover:bg-blue-800 text-white rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
          >
            <svg className="w-8 h-8 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}

        {status !== 'IDLE' && (
          <button 
            onClick={onReset}
            className="w-12 h-12 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full shadow-md transition-all flex items-center justify-center"
            title="Reset"
          >
            <svg className="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default TimerDisplay;
