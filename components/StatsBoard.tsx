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

  const stats = useMemo(() => {
    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    const periodMs = period === 'DAY' ? msInDay : period === 'WEEK' ? msInDay * 7 : msInDay * 30;
    
    const records = history.filter(r => now - r.timestamp <= periodMs);
    
    const categoryTotals: Record<string, number> = {};
    const allSeenCategories = new Set([...categories, ...records.map(r => r.category)]);
    allSeenCategories.forEach(cat => categoryTotals[cat] = 0);

    records.forEach(r => {
      categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.duration;
    });

    const grandTotal = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

    return { categoryTotals, grandTotal, count: records.length };
  }, [history, period, categories]);

  const detailData = useMemo(() => {
    if (!drillDown) return null;
    const categoryRecords = history.filter(r => r.category === drillDown);
    const dateGroups: Record<string, number> = {};
    categoryRecords.forEach(r => {
      const dateStr = new Date(r.timestamp).toLocaleDateString();
      dateGroups[dateStr] = (dateGroups[dateStr] || 0) + r.duration;
    });
    const totalCategoryMins = categoryRecords.reduce((a, b) => a + b.duration, 0);
    return { dateGroups, totalCategoryMins };
  }, [history, drillDown]);

  const getCategoryColor = (cat: string, index: number) => {
    const baseColors = ['#8b4513', '#4a3728', '#166534', '#a67c52', '#5d4037', '#3e2723', '#2e7d32'];
    return baseColors[index % baseColors.length];
  };

  const renderPieChart = () => {
    // 修正：如果没数据，返回一个透明的圆环，防止内容重叠
    if (stats.grandTotal === 0) {
      return (
        <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
          <circle cx="0" cy="0" r="0.9" fill="transparent" stroke="#8b4513" strokeWidth="0.1" strokeDasharray="0.1 0.2" className="opacity-10" />
        </svg>
      );
    }
    
    let cumulativePercent = 0;
    const slices = Object.entries(stats.categoryTotals).map(([cat, val], index) => {
      if (val === 0) return null;
      const startPercent = cumulativePercent;
      const percent = val / stats.grandTotal;
      cumulativePercent += percent;

      const startX = Math.cos(2 * Math.PI * startPercent);
      const startY = Math.sin(2 * Math.PI * startPercent);
      const endX = Math.cos(2 * Math.PI * cumulativePercent);
      const endY = Math.sin(2 * Math.PI * cumulativePercent);

      const largeArcFlag = percent > 0.5 ? 1 : 0;
      const pathData = [
        `M 0 0`,
        `L ${startX} ${startY}`,
        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        `Z`,
      ].join(' ');

      return <path key={cat} d={pathData} fill={getCategoryColor(cat, index)} />;
    });

    return (
      <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
        {slices}
        <circle cx="0" cy="0" r="0.4" fill="#fdfbf7" />
      </svg>
    );
  };

  return (
    <div className="w-full max-w-5xl bg-[#fdfbf7] p-8 rounded-2xl border-4 border-[#8b4513] shadow-2xl animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold heytea-font uppercase tracking-widest text-[#8b4513]">Kitchen Journal</h2>
          <p className="text-sm opacity-60 font-medium">Total focus time: {formatDuration(stats.grandTotal)}</p>
        </div>
        
        <div className="flex bg-[#e5dec9] p-1.5 rounded-xl shadow-inner border border-[#8b4513]/10">
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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
        <div className="md:col-span-5 flex flex-col items-center">
           <div className="w-64 h-64 relative mb-8 flex items-center justify-center">
             {renderPieChart()}
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-3xl font-bold text-[#8b4513]">{stats.count}</span>
               <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Pots Done</span>
               {stats.grandTotal === 0 && (
                 <span className="text-[10px] text-[#8b4513]/40 mt-1 font-bold italic">No Data</span>
               )}
             </div>
           </div>
           
           <div className="w-full space-y-3 max-h-80 overflow-y-auto pr-1">
              {Object.entries(stats.categoryTotals).sort((a,b) => b[1] - a[1]).map(([cat, val], index) => {
                if (val === 0 && !categories.includes(cat)) return null;
                const pct = stats.grandTotal > 0 ? (val / stats.grandTotal) * 100 : 0;
                return (
                  <button 
                    key={cat}
                    onClick={() => setDrillDown(cat)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all hover:scale-[1.02]
                      ${drillDown === cat ? 'border-[#8b4513] bg-[#f3eee3]' : 'border-transparent bg-white/40 hover:bg-white'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(cat, index) }} />
                      <span className="text-sm font-bold heytea-font">{cat}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">{formatDuration(val)}</p>
                      <p className="text-[9px] opacity-40 font-bold">{pct.toFixed(1)}%</p>
                    </div>
                  </button>
                );
              })}
           </div>
        </div>

        <div className="md:col-span-7 bg-[#f3eee3] rounded-2xl p-6 border-2 border-[#8b4513]/10 h-full min-h-[400px]">
           {drillDown && detailData ? (
             <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold heytea-font text-[#8b4513] uppercase tracking-wider">{drillDown} History</h3>
                  <button onClick={() => setDrillDown(null)} className="text-xs font-bold opacity-40 hover:opacity-100">CLOSE ×</button>
                </div>
                
                <div className="bg-[#8b4513] text-white p-4 rounded-xl mb-8 shadow-md">
                   <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-70">Selected Total</p>
                   <p className="text-3xl font-bold">{formatDuration(detailData.totalCategoryMins)}</p>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] uppercase font-bold tracking-widest opacity-50 mb-2">Daily Distribution</h4>
                   {Object.entries(detailData.dateGroups).sort((a,b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()).map(([date, mins]) => (
                     <div key={date} className="flex justify-between items-center bg-white/60 p-3 rounded-lg border border-[#8b4513]/5">
                        <span className="text-xs font-bold opacity-70">{date}</span>
                        <span className="text-sm font-bold text-[#8b4513]">{formatDuration(mins)}</span>
                     </div>
                   ))}
                </div>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-[#8b4513]/30 space-y-4 py-20">
                <div className="w-20 h-20 opacity-20">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-center px-10 leading-loose">
                  Click an event on the left to see total hours and daily distributions.
                </p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default StatsBoard;
