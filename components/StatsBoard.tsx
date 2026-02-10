import React, { useState, useMemo } from 'react';
import { FocusRecord, ProjectCategory } from '../types';

interface StatsBoardProps {
  history: FocusRecord[];
  categories: ProjectCategory[];
}

type Period = 'DAY' | 'WEEK' | 'MONTH';

const formatDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const StatsBoard: React.FC<StatsBoardProps> = ({ history, categories }) => {
  const [period, setPeriod] = useState<Period>('DAY');
  const [drillDown, setDrillDown] = useState<ProjectCategory | null>(null);

  // 1. 核心过滤逻辑修改：实现 DAY 只看今天，WEEK/MONTH 看历史
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    
    const records = history.filter(r => {
      const rDate = new Date(r.timestamp);
      if (period === 'DAY') {
        return rDate.toDateString() === todayStr; // 严格匹配今天
      } else if (period === 'WEEK') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return rDate >= weekAgo;
      } else {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return rDate >= monthAgo;
      }
    });

    const categoryTotals: Record<string, number> = {};
    categories.forEach(cat => categoryTotals[cat] = 0);
    records.forEach(r => {
      categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.duration;
    });

    return { 
      records, // 返回过滤后的原始记录用于 Timeline
      categoryTotals, 
      grandTotal: Object.values(categoryTotals).reduce((a, b) => a + b, 0),
      count: records.length 
    };
  }, [history, period, categories]);

  // 2. 渲染 Timeline 视图 (参考 Apple Calendar)
  const renderTimeline = () => {
    const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 显示 8 AM - 10 PM
    
    return (
      <div className="relative border-l border-[#8b4513]/20 ml-12 mt-4">
        {hours.map(hour => (
          <div key={hour} className="relative h-16 border-t border-[#8b4513]/10">
            <span className="absolute -left-12 -top-2 text-[10px] font-bold opacity-40 text-[#8b4513]">
              {hour}:00
            </span>
          </div>
        ))}
        
        {/* 渲染当天的专注块 */}
        {stats.records.map(record => {
          const date = new Date(record.timestamp);
          const startHour = date.getHours();
          const startMin = date.getMinutes();
          // 计算位置：(小时 - 8) * 64px + (分钟/60) * 64px
          const topPosition = (startHour - 8) * 64 + (startMin / 60) * 64;
          const height = (record.duration / 60) * 64;

          if (startHour < 8 || startHour > 22) return null;

          return (
            <div 
              key={record.id}
              className="absolute left-2 right-2 rounded-md p-2 text-[10px] font-bold border-l-4 shadow-sm overflow-hidden transition-all hover:scale-[1.01]"
              style={{ 
                top: `${topPosition}px`, 
                height: `${Math.max(height, 24)}px`,
                backgroundColor: '#ffffffcc',
                borderColor: '#8b4513',
                color: '#8b4513',
                zIndex: 10
              }}
            >
              <div className="flex justify-between items-start">
                <span>{record.foodName}</span>
                <span className="opacity-60">{record.duration}m</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl bg-[#fdfbf7] p-8 rounded-2xl border-4 border-[#8b4513] shadow-2xl">
      {/* Header 部分保持不变 */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div>
          <h2 className="text-2xl font-bold heytea-font uppercase tracking-widest text-[#8b4513]">Kitchen Journal</h2>
          <p className="text-sm opacity-60 font-medium">Total: {formatDuration(stats.grandTotal)} ({period})</p>
        </div>
        
        <div className="flex bg-[#e5dec9] p-1.5 rounded-xl border border-[#8b4513]/10">
          {(['DAY', 'WEEK', 'MONTH'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setDrillDown(null); }}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all heytea-font ${period === p ? 'bg-[#8b4513] text-white shadow' : 'text-[#8b4513]/50 hover:text-[#8b4513]'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* 左侧：如果选 DAY，显示 Timeline；否则显示饼图 */}
        <div className="md:col-span-5 border-r border-[#8b4513]/5 pr-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#8b4513] mb-4 opacity-50">
            {period === 'DAY' ? "Today's Timeline" : "Category Stats"}
          </h3>
          {period === 'DAY' ? (
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {renderTimeline()}
            </div>
          ) : (
             <div className="flex flex-col items-center">
                {/* 这里放你之前的饼图逻辑 */}
                <p className="text-[10px] italic opacity-40 mt-4">Switch to DAY to see timeline</p>
             </div>
          )}
        </div>

        {/* 右侧：显示详细列表或 DrillDown 详情 */}
        <div className="md:col-span-7 bg-[#f3eee3] rounded-2xl p-6 border-2 border-[#8b4513]/10 min-h-[500px]">
          <h3 className="text-xl font-bold heytea-font text-[#8b4513] uppercase mb-6">
            {period} Summary
          </h3>
          
          <div className="space-y-3">
            {stats.records.length === 0 ? (
              <div className="text-center py-20 opacity-30 italic text-sm">No dishes served in this period.</div>
            ) : (
              stats.records.map(record => (
                <div key={record.id} className="bg-white/60 p-4 rounded-xl flex justify-between items-center border border-[#8b4513]/5">
                  <div>
                    <p className="text-sm font-bold text-[#8b4513]">{record.foodName}</p>
                    <p className="text-[10px] opacity-50">
                      {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {record.category}
                    </p>
                  </div>
                  <span className="bg-[#8b4513]/10 text-[#8b4513] px-3 py-1 rounded-full text-[10px] font-bold">
                    {record.duration} min
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBoard;
