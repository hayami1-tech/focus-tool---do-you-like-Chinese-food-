
import React from 'react';
import { FoodItem, TimerStatus } from '../types';
import FoodIllustration from './FoodIllustration';

interface StoveProps {
  isCooking: boolean;
  food: FoodItem;
  status: TimerStatus;
}

const Stove: React.FC<StoveProps> = ({ isCooking, food, status }) => {
  return (
    <div className="relative w-full aspect-[4/3] max-w-2xl mx-auto flex items-center justify-center">
      <div className="relative w-full h-full flex items-end justify-center">
        
        {/* 灶台底座 */}
        <div className="relative w-[65%] h-[65%] bg-[#a67c52] rounded-sm border-b-8 border-[#8b5e3c] shadow-2xl flex flex-col overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="grid grid-cols-3 gap-1 h-full w-full p-1">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-black/30 rounded-sm"></div>
              ))}
            </div>
          </div>

          {/* 灶口 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-36 bg-[#4a3728] rounded-t-lg border-x-4 border-t-4 border-[#8b5e3c] shadow-[inset_0_4px_20px_rgba(0,0,0,0.6)] flex items-end justify-center overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-t from-orange-900 to-transparent transition-opacity duration-1000 ${isCooking ? 'opacity-100' : 'opacity-40'}`}></div>
            
            {/* 三簇火焰 (Three-cluster fire) */}
            {isCooking && (
              <div className="relative w-full h-full flex justify-center items-end pb-3 gap-1 px-1">
                {/* Left Flame */}
                <div className="fire-flicker relative w-8 h-16 opacity-80" style={{ animationDelay: '0.2s' }}>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-14 bg-orange-700 rounded-full blur-md"></div>
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-10 bg-orange-500 rounded-full blur-sm"></div>
                </div>
                {/* Main Center Flame */}
                <div className="fire-flicker relative w-12 h-24 z-10">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-24 bg-orange-600 rounded-full blur-md opacity-60"></div>
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-18 bg-orange-400 rounded-full blur-sm"></div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-10 bg-yellow-300 rounded-full blur-[1px]"></div>
                </div>
                {/* Right Flame */}
                <div className="fire-flicker relative w-8 h-16 opacity-80" style={{ animationDelay: '0.5s' }}>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-14 bg-orange-700 rounded-full blur-md"></div>
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-10 bg-orange-500 rounded-full blur-sm"></div>
                </div>
              </div>
            )}

            {/* 木柴 */}
            <div className="absolute bottom-0 w-24 h-6 flex gap-1 justify-center z-10">
              <div className="w-8 h-3 bg-[#2d1b0d] rounded-full rotate-12 -translate-y-1"></div>
              <div className="w-10 h-4 bg-[#3d2b1f] rounded-full -rotate-6"></div>
              <div className="w-8 h-3 bg-[#2d1b0d] rounded-full rotate-45 translate-x-1"></div>
            </div>
          </div>
        </div>

        {/* 灶台顶面 */}
        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[70%] h-14 bg-[#5c5c5c] rounded-t-xl border-b-4 border-[#333] shadow-lg z-10">
          <div className="absolute top-4 left-[24%] w-9 h-4 border-[3px] border-[#222] rounded-full -rotate-12 z-0"></div>
          <div className="absolute top-4 right-[24%] w-9 h-4 border-[3px] border-[#222] rounded-full rotate-12 z-0"></div>

          {/* 锅内食材 - 始终存在 */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-[42%] h-10 border-4 border-[#1a1a1a] bg-[#1a1a1a] rounded-[100%] shadow-inner overflow-hidden flex items-center justify-center z-10">
             <div className="relative w-full h-full opacity-90">
               <FoodIllustration 
                 name={food.iconName} 
                 className="w-full h-full scale-110 translate-y-1" 
                 inPot={true} 
               />
               {isCooking && <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] animate-pulse"></div>}
             </div>
          </div>

          {/* 锅盖 */}
          <div 
            className={`absolute top-[1px] left-1/2 w-[48%] h-12 transition-all duration-1000 ease-in-out z-20 cursor-pointer
              ${(isCooking || status === 'FINISHED') 
                ? 'translate-x-[65%] -translate-y-12 rotate-[-25deg] opacity-0 pointer-events-none' 
                : '-translate-x-1/2 translate-y-0 rotate-0 opacity-100'}`}
          >
             <svg viewBox="0 0 100 30" className="w-full h-full drop-shadow-xl">
               <ellipse cx="50" cy="15" rx="49" ry="14" fill="#c4a484" stroke="#8b5e3c" strokeWidth="1" />
               <g stroke="#8b5e3c" strokeWidth="0.5" opacity="0.4">
                 <line x1="10" y1="8" x2="90" y2="8" />
                 <line x1="5" y1="15" x2="95" y2="15" />
                 <line x1="10" y1="22" x2="90" y2="22" />
               </g>
               <rect x="25" y="8" width="50" height="6" rx="2" fill="#8b5e3c" />
               <rect x="25" y="8" width="50" height="2" fill="#ffffff" opacity="0.1" />
             </svg>
          </div>

          {/* 锅铲 */}
          <div className="absolute top-2 left-4 w-14 h-7 -rotate-12 opacity-80 pointer-events-none">
            <svg viewBox="0 0 40 20" className="w-full h-full drop-shadow-sm">
              <rect x="0" y="8" width="20" height="3" fill="#8b5e3c" rx="1" />
              <path d="M18 5 L35 5 Q40 10 35 15 L18 15 Z" fill="#d1d5db" stroke="#9ca3af" strokeWidth="0.5" />
            </svg>
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[70%] h-8 bg-black/10 blur-2xl rounded-full"></div>
    </div>
  );
};

export default Stove;
