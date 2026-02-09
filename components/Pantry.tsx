
import React from 'react';
import { FoodItem } from '../types';
import FoodIllustration from './FoodIllustration';

interface PantryProps {
  items: FoodItem[];
  selectedId: string;
  onSelect: (item: FoodItem) => void;
  title: string;
}

const Pantry: React.FC<PantryProps> = ({ items, selectedId, onSelect, title }) => {
  return (
    <div className="bg-[#fdfbf7] p-6 rounded-lg border-2 border-[#8b4513]/20 shadow-sm">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 heytea-font">
        <span className="text-2xl">🧺</span> {title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
            <div className="w-16 h-16 mb-2">
              <FoodIllustration name={item.iconName} className="w-full h-full" />
            </div>
            <span className="text-sm font-bold heytea-font tracking-wider">{item.name}</span>
            <span className={`text-[10px] mt-1 heytea-font ${selectedId === item.id ? 'opacity-80' : 'text-gray-400'}`}>
              {item.duration} 分钟
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Pantry;
