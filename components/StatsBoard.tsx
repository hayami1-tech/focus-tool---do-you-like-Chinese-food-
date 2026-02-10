
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FocusRecord, ProjectCategory } from '../types';
import { FOOD_ITEMS, BREAK_ITEMS } from '../constants';
import FoodIllustration from './FoodIllustration';

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

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const getIconByName = (name: string) => {
  const allItems = [...FOOD_ITEMS, ...BREAK_ITEMS];
  const item = allItems.find(f => f.name === name);
  return item ? item.iconName : 'default';
};

const StatsBoard: React.FC<StatsBoardProps> = ({ history, categories }) => {
  const [period, setPeriod] = useState<Period>('DAY');
  const [drillDown, setDrillDown] = useState<ProjectCategory | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 过滤历史记录
  const filteredHistory = useMemo(() => {
    const now = new Date();
    if (period === 'DAY') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return history.filter(r => r.timestamp >= todayStart);
    } else if (period === 'WEEK') {
      const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      return history.filter(r => r.timestamp >= weekAgo);
    } else {
      const monthAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
      return history.filter(r => r.timestamp >= monthAgo);
    }
  }, [history, period]);

  const stats = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    filteredHistory.forEach(r => {
      categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.duration;
    });
    const grandTotal = Object.values(categoryTotals).reduce((a: number, b: number) => a + b, 0);
    return { categoryTotals, grandTotal, count: filteredHistory.length };
  }, [filteredHistory]);

  const getCategoryColor = (cat: string, index: number) => {
    const baseColors = ['#8b4513', '#a67c52', '#5d4037', '#3e2723', '#166534', '#2e7d32'];
    const idx = categories.indexOf(cat);
    return baseColors[idx >= 0 ? idx % baseColors.length : index % baseColors.length];
  };

  // 精准定位到 08:00
  useEffect(() => {
    if (period === 'DAY' && !drillDown) {
      const performScroll = () => {
        const target = document.getElementById('time-slot-0800');
        const container = scrollContainerRef.current;
        if (target && container) {
          container.scrollTop = target.offsetTop;
        }
      };

      // 针对 React 渲染时机和可能存在的 CSS transition 延迟执行
      const timer = setTimeout(performScroll, 50);
      return () => clearTimeout(timer);
    }
  }, [period, drillDown]);

  const renderPieChart = () => {
    if (stats.grandTotal === 0) return (
      <div className="w-full h-full flex flex-col items-center justify-center text-[#8b4513]/10 font-bold opacity-40">
        <span className="text-4xl mb-2">🕰️</span>
        <p className="text-[10px] uppercase tracking-widest text-center px-4">No records</p>
      </div>
    );
    
    let cumulativePercent = 0;
    const slices = (Object.entries(stats.categoryTotals) as [string, number][]).map(([cat, val], index) => {
      if (val === 0) return null;
      const startPercent = cumulativePercent;
      const percent = val / stats.grandTotal;
      cumulativePercent += percent;

      const startX = Math.cos(2 * Math.PI * startPercent);
      const startY = Math.sin(2 * Math.PI * startPercent);
      const endX = Math.cos(2 * Math.PI * cumulativePercent);
      const endY = Math.sin(2 * Math.PI * cumulativePercent);

      const largeArcFlag = percent > 0.5 ? 1 : 0;
      const pathData = [`M 0 0`, `L ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `Z`].join(' ');
      return <path key={cat} d={pathData} fill={getCategoryColor(cat, index)} className="transition-all duration-500 hover:opacity-80" />;
    });

    return (
      <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
        {slices}
        <circle cx="0" cy="0" r="0.4" fill="#fdfbf7" />
      </svg>
    );
  };

  const renderTimeline = (records: FocusRecord[]) => {
    // 调小每分钟像素高度，配合去图标设计，视觉更“细”更精致
    const pixelsPerMin = 1.6; 
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="relative border-l border-[#8b4513]/10 ml-10" style={{ height: 1440 * pixelsPerMin }}>
        {hours.map(hour => (
          <div 
            key={hour} 
            id={`time-slot-${hour.toString().padStart(2, '0')}00`}
            className="absolute w-full border-t border-[#8b4513]/5 flex items-start" 
            style={{ top: hour * 60 * pixelsPerMin }}
          >
            <span className="text-[10px] font-bold opacity-20 -ml-12 -mt-2.5 w-10 text-right font-mono">
              {hour.toString().padStart(2, '0')}:00
            </span>
          </div>
        ))}

        {records.map((record) => {
          const date = new Date(record.timestamp);
          const startMins = date.getHours() * 60 + date.getMinutes();
          const top = startMins * pixelsPerMin;
          const height = Math.max(record.duration * pixelsPerMin, 28); 
          const color = getCategoryColor(record.category, categories.indexOf(record.category));

          return (
            <div 
              key={record.id}
              className="absolute left-2 right-6 rounded-lg px-2.5 py-1 border border-white/50 shadow-[0_2px_5px_rgba(0,0,0,0.03)] flex flex-col justify-center overflow-hidden transition-all hover:ring-2 hover:ring-[#8b4513]/20 z-20"
              style={{ 
                top, 
                height, 
                backgroundColor: `${color}15`,
                borderLeft: `4px solid ${color}` 
              }}
            >
              <div className="flex items-baseline gap-2 overflow-hidden">
                <span className="text-[10px] font-bold text-[#4a3728] truncate uppercase tracking-wider">{record.category}</span>
                <span className="text-[9px] font-bold opacity-30 font-mono flex-none">{formatTime(record.timestamp)} • {record.duration}m</span>
              </div>
            </div>
          );
        })}

        {/* 当前时间指示器 */}
        <div 
          className="absolute left-0 right-0 border-t border-red-500/30 z-30 pointer-events-none flex items-center"
          style={{ top: (new Date().getHours() * 60 + new Date().getMinutes()) * pixelsPerMin }}
        >
          <div className="w-2 h-2 bg-red-500 rounded-full -ml-1 shadow-sm border border-white"></div>
        </div>
      </div>
    );
  };

  const renderSimpleList = (records: FocusRecord[]) => {
    if (records.length === 0) return (
      <div className="flex flex-col items-center justify-center py-20 opacity-20">
        <span className="text-3xl mb-2">🍂</span>
        <p className="text-[10px] font-bold uppercase tracking-widest">No history recorded</p>
      </div>
    );

    const grouped = records.reduce((acc, rec) => {
      const date = new Date(rec.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
      if (!acc[date]) acc[date] = [];
      acc[date].push(rec);
      return acc;
    }, {} as Record<string, FocusRecord[]>);

    return (
      <div className="space-y-8">
        {Object.entries(grouped).map(([date, dailyRecords]) => (
          <div key={date}>
            <div className="sticky top-0 bg-[#f3eee3] py-2 z-10 border-b border-[#8b4513]/10 mb-4 flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b4513]/60">{date}</span>
              <span className="text-[9px] font-bold opacity-30 uppercase">{dailyRecords.length} sessions</span>
            </div>
            <div className="space-y-2">
              {dailyRecords.map(rec => (
                <div key={rec.id} className="flex items-center gap-4 bg-white/40 p-3 rounded-xl border border-[#8b4513]/5 hover:bg-white transition-all group">
                  <div className="w-8 h-8 flex-none bg-white rounded-full p-1.5 border border-[#8b4513]/5 shadow-inner">
                    <FoodIllustration name={getIconByName(rec.foodName)} className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-[#4a3728] uppercase tracking-wider">{rec.category}</span>
                      <span className="text-[9px] font-mono opacity-30">{formatTime(rec.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <span className="text-[9px] font-bold text-[#8b4513]/40 uppercase tracking-widest">{rec.duration} mins focus</span>
                    </div>
                  </div>
                  <div 
                    className="w-1 h-4 rounded-full opacity-40" 
                    style={{ backgroundColor: getCategoryColor(rec.category, categories.indexOf(rec.category)) }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl bg-[#fdfbf7] p-6 md:p-10 rounded-2xl border-4 border-[#8b4513] shadow-2xl animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold heytea-font uppercase tracking-widest text-[#8b4513] flex items-center gap-3">
            <span className="text-3xl">📓</span> Hearth History
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-30 mt-1">Countryside Stove Records</p>
        </div>
        
        <div className="flex bg-[#e5dec9] p-1.5 rounded-xl shadow-inner border border-[#8b4513]/10">
          {(['DAY', 'WEEK', 'MONTH'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setDrillDown(null); }}
              className={`px-8 py-2.5 rounded-lg text-xs font-bold transition-all heytea-font tracking-widest ${period === p ? 'bg-[#8b4513] text-white shadow-md scale-105' : 'text-[#8b4513]/50 hover:text-[#8b4513]'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        {/* 左侧：汇总 */}
        <div className="md:col-span-5 flex flex-col items-center">
           <div className="w-64 h-64 relative mb-10 group">
             {renderPieChart()}
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-3xl font-bold text-[#8b4513] group-hover:scale-110 transition-transform">{stats.count}</span>
               <span className="text-[9px] font-bold opacity-40 uppercase tracking-[0.2em]">Pots Cooked</span>
             </div>
           </div>
           
           <div className="w-full space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30 mb-3 px-1">Distribution</div>
              {(Object.entries(stats.categoryTotals) as [string, number][]).sort((a, b) => b[1] - a[1]).map(([cat, val], index) => {
                if (val === 0) return null;
                const pct = (val / stats.grandTotal) * 100;
                return (
                  <button 
                    key={cat}
                    onClick={() => setDrillDown(cat)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all group
                      ${drillDown === cat ? 'border-[#8b4513] bg-[#f3eee3] shadow-sm' : 'border-transparent bg-white/40 hover:bg-white'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(cat, index) }} />
                      <span className="text-[11px] font-bold text-[#4a3728] uppercase tracking-wider">{cat}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#8b4513]">{formatDuration(val)}</p>
                      <p className="text-[9px] opacity-20 font-bold group-hover:opacity-60">{pct.toFixed(0)}%</p>
                    </div>
                  </button>
                );
              })}
           </div>
           
           <div className="mt-8 pt-6 border-t border-[#8b4513]/10 w-full text-center">
             <span className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">Total Simmering: {formatDuration(stats.grandTotal)}</span>
           </div>
        </div>

        {/* 右侧：Timeline / List */}
        <div className="md:col-span-7 bg-[#f3eee3] rounded-3xl p-6 md:p-8 border-2 border-[#8b4513]/5 h-[650px] flex flex-col relative overflow-hidden shadow-inner">
           <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-4">
               <h3 className="text-lg font-bold text-[#8b4513] uppercase tracking-wider">
                 {period === 'DAY' && !drillDown ? "Today's Timeline" : (drillDown ? `${drillDown} History` : "Archive Journal")}
               </h3>
             </div>
             {drillDown && (
               <button 
                 onClick={() => setDrillDown(null)} 
                 className="text-[9px] font-bold text-[#8b4513]/50 hover:text-[#8b4513] uppercase tracking-widest"
               >
                 Clear Filter
               </button>
             )}
           </div>

           <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
              {period === 'DAY' && !drillDown 
                ? renderTimeline(filteredHistory) 
                : renderSimpleList(
                    drillDown 
                      ? filteredHistory.filter(r => r.category === drillDown) 
                      : filteredHistory
                  )
              }
           </div>
           
           <div className="mt-6 pt-4 border-t border-[#8b4513]/10 flex justify-between items-center opacity-30 italic">
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {period === 'DAY' ? 'Simmering Schedule (08:00 - 20:00)' : 'Historical Log'}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {stats.count} Total
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBoard;

