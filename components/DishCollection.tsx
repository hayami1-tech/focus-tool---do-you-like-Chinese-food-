import React from 'react';
import { FocusRecord } from '../types';

interface DishCollectionProps {
  history: FocusRecord[];
}

const DishCollection: React.FC<DishCollectionProps> = ({ history }) => {
  // 不再使用 .slice(0, 5)，直接使用完整的 history 数组
  // 我们依然保留一个简单的容器，并加上滚动条，防止菜太多把页面撑爆
  return (
    <div className="mt-8 bg-white/40 rounded-2xl p-5 border border-[#8b4513]/10 shadow-inner">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b4513] mb-4 opacity-60">
        All Served Dishes
      </h3>
      
      {/* 添加 max-h 和 overflow-y-auto，这样如果菜多得像满汉全席，你可以上下滚动查看 */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {history.length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed border-[#8b4513]/5 rounded-xl">
            <p className="text-[10px] italic opacity-30 uppercase tracking-widest">
              The table is waiting...
            </p>
          </div>
        ) : (
          history.map((record) => (
            <div 
              key={record.id} 
              className="flex items-center justify-between bg-white/60 p-3 rounded-xl border border-[#8b4513]/5 hover:scale-[1.02] transition-transform animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🍲</span>
                <div>
                  <p className="text-xs font-bold text-[#8b4513]">{record.foodName || 'Special Dish'}</p>
                  <p className="text-[9px] opacity-50 font-medium">
                    {new Date(record.timestamp).toLocaleDateString()} {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="bg-[#8b4513]/10 text-[#8b4513] text-[9px] font-bold px-2 py-1 rounded-md">
                {record.duration}m
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-[9px] text-center mt-4 opacity-30 font-bold italic uppercase tracking-widest">
        Total {history.length} dishes served
      </p>
    </div>
  );
};

export default DishCollection;
