
import React from 'react';
import { FocusRecord } from '../types';
import { FOOD_ITEMS } from '../constants';
import FoodIllustration from './FoodIllustration';

interface DishCollectionProps {
  history: FocusRecord[];
}

const DishCollection: React.FC<DishCollectionProps> = ({ history }) => {
  // 显示专注模式产生的菜肴，包括自由烹饪的米饭
  const completedDishes = history.filter(record => 
    FOOD_ITEMS.some(item => item.name === record.foodName)
  );

  // 获取对应的图标名
  const getIconByName = (name: string) => {
    const item = FOOD_ITEMS.find(f => f.name === name);
    return item ? item.iconName : 'default';
  };

  return (
    <div className="mt-6 bg-[#fdfbf7] p-6 rounded-lg border-4 border-[#8b4513] shadow-lg flex flex-col h-[300px]">
      <h3 className="text-xl font-bold flex items-center gap-2 heytea-font text-[#8b4513] mb-4">
        <span className="text-2xl">🍱</span> Completed Dishes
      </h3>
      
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {completedDishes.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {completedDishes.map((dish, index) => (
              <div 
                key={dish.id} 
                className="group relative flex flex-col items-center animate-in zoom-in duration-300"
                title={`${dish.foodName} (${new Date(dish.timestamp).toLocaleDateString()})`}
              >
                <div className="relative w-12 h-12 bg-white rounded-full shadow-sm border border-[#8b4513]/10 flex items-center justify-center p-1 group-hover:scale-110 transition-transform overflow-hidden">
                  <FoodIllustration name={getIconByName(dish.foodName)} className="w-full h-full" />
                  
                  {/* Badge showing index in reversed list order */}
                  <div className="absolute bottom-0 inset-x-0 h-4 bg-[#8b4513]/80 flex items-center justify-center">
                    <span className="text-[7px] font-bold text-white leading-none">
                      {completedDishes.length - index}
                    </span>
                  </div>
                </div>
                
                <div className="absolute -bottom-1 bg-[#8b4513] text-white text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  {dish.duration}m
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-[#8b4513] italic">
            <span className="text-4xl mb-2">🍳</span>
            <p className="text-xs font-bold tracking-widest">Stay Hungry, Stay Patient, the food is cooking...</p>
          </div>
        )}
      </div>
      
      {completedDishes.length > 0 && (
        <div className="mt-3 pt-2 border-t border-[#8b4513]/10 text-right">
          <span className="text-[10px] font-bold text-[#8b4513]/50 uppercase tracking-widest">
            Total: {completedDishes.length} Dishes
          </span>
        </div>
      )}
    </div>
  );
};

export default DishCollection;
