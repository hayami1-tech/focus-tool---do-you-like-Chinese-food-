import React from 'react';
import { FocusRecord } from '../types';
import { FOOD_ITEMS, BREAK_ITEMS } from '../constants';
import FoodIllustration from './FoodIllustration';

interface DishCollectionProps {
  history: FocusRecord[];
}

const getIconByName = (name: string) => {
  const allItems = [...FOOD_ITEMS, ...BREAK_ITEMS];
  const item = allItems.find(f => f.name === name);
  return item ? item.iconName : 'default';
};

const DishCollection: React.FC<DishCollectionProps> = ({ history }) => {
  // 只显示最近的 4-6 个，避免撑破首页布局
  const recentHistory = history.slice(0, 6);

  return (
    <div className="w-full bg-white/30 rounded-3xl p-6 border border-[#8b4513]/10 shadow-inner">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b4513]/50 mb-4 text-center">
        Today's Dishes 🍲
      </h3>
      
      <div className="grid grid-cols-3 gap-3">
        {recentHistory.length > 0 ? (
          recentHistory.map((record) => (
            <div 
              key={record.id} 
              className="aspect-square bg-white rounded-2xl p-2 border border-[#8b4513]/5 shadow-sm flex flex-col items-center justify-center group hover:scale-105 transition-transform"
              title={`${record.foodName} - ${record.duration}m`}
            >
              <div className="w-10 h-10">
                <FoodIllustration name={getIconByName(record.foodName)} className="w-full h-full" />
              </div>
              <span className="text-[7px] font-bold text-[#8b4513]/40 mt-1 uppercase truncate w-full text-center">
                {record.foodName}
              </span>
            </div>
          ))
        ) : (
          /* 空状态显示 */
          <div className="col-span-3 py-10 flex flex-col items-center opacity-20">
            <span className="text-2xl mb-2">🍽️</span>
            <span className="text-[8px] font-bold uppercase tracking-widest">Waiting for Chef</span>
          </div>
        )}
      </div>

      {recentHistory.length > 0 && (
        <p className="text-[7px] text-center mt-4 opacity-30 font-bold uppercase tracking-tighter">
          Check History for full log
        </p>
      )}
    </div>
  );
};

export default DishCollection;
