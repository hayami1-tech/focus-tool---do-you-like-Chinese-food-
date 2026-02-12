
import React from 'react';
import { FoodItem, TimerMode } from '../types';
import FoodIllustration from './FoodIllustration';

interface PantryProps {
  items: FoodItem[];
  selectedId: string;
  onSelect: (item: FoodItem) => void;
  title: string;
  mode: TimerMode;
  onModeToggle: (mode: TimerMode) => void;
}

const Pantry: React.FC<PantryProps> = ({ items, selectedId, onSelect, title, mode, onModeToggle }) => {
  const isFocusLike = mode === TimerMode.FOCUS || mode === TimerMode.COUNT_UP;
  const isBreakLike = mode === TimerMode.SHORT_BREAK || mode === TimerMode.LONG_BREAK;

  return (
    <div className="bg-[#fdfbf7] p-6 rounded-lg border-4 border-[#8b4513] shadow-lg flex flex-col h-[380px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-xl font-bold flex items-center gap-2 heytea-font text-[#8b4513]">
          <span className="text-2xl">🧺</span> {title}
        </h3>
        
        <div className="flex bg-[#e5dec9]/50 p-1 rounded-full border border-[#8b4513]/10">
          <button 
            onClick={() => onModeToggle(TimerMode.FOCUS)} 
            className={`px-4 py-1.5 rounded-full transition-all heytea-font text-[10px] font-bold uppercase tracking-wider ${isFocusLike ? 'bg-[#8b4513] text-white shadow-sm' : 'text-[#8b4513]/60 hover:text-[#8b4513]'}`}
          >
            Focus
          </button>
          <button 
            onClick={() => onModeToggle(TimerMode.SHORT_BREAK)} 
            className={`px-4 py-1.5 rounded-full transition-all heytea-font text-[10px] font-bold uppercase tracking-wider ${isBreakLike ? 'bg-[#8b4513] text-white shadow-sm' : 'text-[#8b4513]/60 hover:text-[#8b4513]'}`}
          >
            Break
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={`
                flex flex-col items-center p-3 rounded-lg transition-all border-2
                ${selectedId === item.id 
                  ? 'bg-[#8b4513] text-white border-[#8b4513] scale-105 shadow-md' 
                  : 'bg-white text-[#4a3728] border-transparent hover:border-[#8b4513]/30 hover:bg-[#f3eee3]'
                }
              `}
            >
              <div className="w-14 h-14 mb-2">
                <FoodIllustration name={item.iconName} className="w-full h-full" />
              </div>
              <span className="text-[11px] font-bold heytea-font tracking-wider text-center leading-tight mb-1">{item.name}</span>
              <span className={`text-[9px] font-bold heytea-font ${selectedId === item.id ? 'opacity-80' : 'text-gray-400'}`}>
                {item.duration > 0 ? `${item.duration}m` : 'Free'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pantry;
