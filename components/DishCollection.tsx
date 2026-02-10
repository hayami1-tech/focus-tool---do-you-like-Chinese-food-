import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FocusRecord, ProjectCategory } from '../types';
import { FOOD_ITEMS, BREAK_ITEMS } from '../constants';
import FoodIllustration from './FoodIllustration';

interface StatsBoardProps {
  history: FocusRecord[];
  categories: ProjectCategory[];
  // 必须传入更新 history 的方法，通常是 App.tsx 里的 setHistory
  onUpdateHistory?: (newHistory: FocusRecord[]) => void;
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

const StatsBoard: React.FC<StatsBoardProps> = ({ history, categories, onUpdateHistory }) => {
  const [period, setPeriod] = useState<Period>('DAY');
  const [drillDown, setDrillDown] = useState<ProjectCategory | null>(null);
  const [editingRecord, setEditingRecord] = useState<FocusRecord | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 过滤逻辑
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

  // 编辑逻辑
  const handleUpdate = (updated: FocusRecord) => {
    if (onUpdateHistory) {
      const newHistory = history.map(r => r.id === updated.id ? updated : r);
      onUpdateHistory(newHistory);
      setEditingRecord(null);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this cooking record permanently?") && onUpdateHistory) {
      onUpdateHistory(history.filter(r => r.id !== id));
      setEditingRecord(null);
    }
  };

  useEffect(() => {
    if (period === 'DAY' && !drillDown) {
      const timer = setTimeout(() => {
        const target = document.getElementById('time-slot-0800');
        if (target && scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = target.offsetTop;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [period, drillDown]);

  const renderPieChart = () => {
    if (stats.grandTotal === 0) return (
      <div className="w-full h-full flex flex-col items-center justify-center text-[#8b4513]/10 font-bold opacity-30">
        <span className="text-4xl mb-2">🍂</span>
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
      return <path key={cat} d={pathData} fill={getCategoryColor(cat, index)} className="transition-all duration-500 hover:opacity-80 cursor-pointer" />;
    });

    return (
      <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
        {slices}
        <circle cx="0" cy="0" r="0.45" fill="#fdfbf7" />
      </svg>
    );
  };

  const renderTimeline = (records: FocusRecord[]) => {
    const pixelsPerMin = 1.5; 
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="relative border-l border-[#8b4513]/10 ml-10" style={{ height: 1440 * pixelsPerMin }}>
        {hours.map(hour => (
          <div key={hour} id={`time-slot-${hour.toString().padStart(2, '0')}00`} className="absolute w-full border-t border-[#8b4513]/5 flex items-start" style={{ top: hour * 60 * pixelsPerMin }}>
            <span className="text-[9px] font-bold opacity-20 -ml-12 -mt-2 w-10 text-right font-mono">{hour.toString().padStart(2, '0')}:00</span>
          </div>
        ))}

        {records.map((record, idx) => {
          const date = new Date(record.timestamp);
          const startMins = date.getHours() * 60 + date.getMinutes();
          const top = startMins * pixelsPerMin;
          const height = Math.max(record.duration * pixelsPerMin, 22); 
          const color = getCategoryColor(record.category, categories.indexOf(record.category));

          return (
            <div 
              key={record.id}
              onClick={() => setEditingRecord(record)}
              className="absolute left-2 right-6 rounded-md px-2 border border-white/40 shadow-sm flex flex-col justify-center overflow-hidden transition-all hover:ring-2 hover:ring-[#8b4513]/30 z-20 group cursor-pointer active:scale-[0.98]"
              style={{ 
                top, 
                height, 
                backgroundColor: `${color}18`,
                borderLeft: `4px solid ${color}`,
                zIndex: 20 + idx
              }}
            >
              <div className="flex items-baseline gap-1.5 overflow-hidden">
                <span className="text-[9px] font-bold text-[#4a3728] truncate uppercase">{record.category}</span>
                <span className="text-[7px] font-bold opacity-40 font-mono flex-none">{formatTime(record.timestamp)} • {record.duration}m</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSimpleList = (records: FocusRecord[]) => {
    if (records.length === 0) return <div className="py-20 text-center opacity-20">🍂 No history</div>;
    const grouped = records.reduce((acc, rec) => {
      const date = new Date(rec.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
      if (!acc[date]) acc[date] = [];
      acc[date].push(rec);
      return acc;
    }, {} as Record<string, FocusRecord[]>);

    return (
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, dailyRecords]) => (
          <div key={date}>
            <div className="sticky top-0 bg-[#f3eee3] py-2 z-10 border-b border-[#8b4513]/10 mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#8b4513]/50">{date}</div>
            <div className="space-y-2">
              {dailyRecords.map(rec => (
                <div key={rec.id} onClick={() => setEditingRecord(rec)} className="flex items-center gap-3 bg-white/30 p-2.5 rounded-xl border border-[#8b4513]/5 hover:bg-white transition-all cursor-pointer active:scale-[0.99]">
                  <div className="w-8 h-8 flex-none bg-white rounded-full p-1.5 border border-[#8b4513]/5 shadow-sm">
                    <FoodIllustration name={getIconByName(rec.foodName)} className="w-full h-full" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-[#4a3728] uppercase">{rec.category}</span><span className="text-[8px] font-mono opacity-30">{formatTime(rec.timestamp)}</span></div>
                    <span className="text-[8px] font-bold text-[#8b4513]/40 uppercase">{rec.duration} mins focus • {rec.foodName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl bg-[#fdfbf7] p-6 md:p-10 rounded-2xl border-4 border-[#8b4513] shadow-2xl animate-in fade-in zoom-in duration-300 relative">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest text-[#8b4513] flex items-center gap-3">📓 Hearth History</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-30 mt-1">Countryside Stove Records</p>
        </div>
        <div className="flex bg-[#e5dec9] p-1.5 rounded-xl border border-[#8b4513]/10">
          {(['DAY', 'WEEK', 'MONTH'] as Period[]).map((p) => (
            <button key={p} onClick={() => { setPeriod(p); setDrillDown(null); }} className={`px-8 py-2.5 rounded-lg text-xs font-bold transition-all tracking-widest ${period === p ? 'bg-[#8b4513] text-white shadow-md' : 'text-[#8b4513]/50 hover:text-[#8b4513]'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5 flex flex-col items-center">
           <div className="w-60 h-60 relative mb-10 group">
             {renderPieChart()}
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fdfbf7]/40 rounded-full w-24 h-24 m-auto pointer-events-none">
               <span className="text-3xl font-bold text-[#8b4513]">{stats.count}</span>
               <span className="text-[9px] font-bold opacity-30 uppercase">Pots</span>
             </div>
           </div>
           <div className="w-full space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {(Object.entries(stats.categoryTotals) as [string, number][]).sort((a, b) => b[1] - a[1]).map(([cat, val], index) => val > 0 && (
                <button key={cat} onClick={() => setDrillDown(cat)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${drillDown === cat ? 'border-[#8b4513] bg-[#f3eee3]' : 'border-transparent bg-white/40 hover:bg-white'}`}>
                  <div className="flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCategoryColor(cat, index) }} /><span className="text-[10px] font-bold text-[#4a3728] uppercase">{cat}</span></div>
                  <div className="text-right"><p className="text-[11px] font-bold text-[#8b4513]">{formatDuration(val)}</p><p className="text-[8px] opacity-20 font-bold">{(val/stats.grandTotal*100).toFixed(0)}%</p></div>
                </button>
              ))}
           </div>
        </div>

        <div className="md:col-span-7 bg-[#f3eee3] rounded-3xl p-6 md:p-8 h-[620px] flex flex-col relative overflow-hidden shadow-inner border border-[#8b4513]/5">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-base font-bold text-[#8b4513] uppercase tracking-wider">{drillDown ? `${drillDown} Log` : "Timeline"}</h3>
             {drillDown && <button onClick={() => setDrillDown(null)} className="text-[8px] font-bold text-[#8b4513]/40 hover:text-[#8b4513] uppercase tracking-widest">Show All</button>}
           </div>
           <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pr-1 custom-scrollbar scroll-smooth">
              {period === 'DAY' && !drillDown ? renderTimeline(filteredHistory) : renderSimpleList(drillDown ? filteredHistory.filter(r => r.category === drillDown) : filteredHistory)}
           </div>
        </div>
      </div>

      {/* 编辑模态框 */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#fdfbf7] w-full max-w-md rounded-3xl border-4 border-[#8b4513] p-8 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#8b4513]/20"></div>
            <h3 className="text-xl font-bold text-[#8b4513] mb-6 uppercase tracking-widest flex items-center gap-2">📝 Edit Journal</h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase opacity-40 mb-2 block">Event Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setEditingRecord({...editingRecord, category: cat})}
                      className={`py-2 px-3 rounded-xl text-[10px] font-bold border-2 transition-all ${editingRecord.category === cat ? 'bg-[#8b4513] text-white border-[#8b4513]' : 'bg-white border-[#8b4513]/10 text-[#8b4513]'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase opacity-40 mb-2 block">Duration (mins)</label>
                  <input 
                    type="number" 
                    value={editingRecord.duration}
                    onChange={(e) => setEditingRecord({...editingRecord, duration: parseInt(e.target.value) || 0})}
                    className="w-full bg-[#f3eee3] border-none rounded-xl px-4 py-3 font-bold text-[#8b4513] focus:ring-2 ring-[#8b4513]/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase opacity-40 mb-2 block">Timestamp</label>
                  <input 
                    type="time" 
                    value={formatTime(editingRecord.timestamp)}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':');
                      const newDate = new Date(editingRecord.timestamp);
                      newDate.setHours(parseInt(h), parseInt(m));
                      setEditingRecord({...editingRecord, timestamp: newDate.getTime()});
                    }}
                    className="w-full bg-[#f3eee3] border-none rounded-xl px-4 py-3 font-bold text-[#8b4513] focus:ring-2 ring-[#8b4513]/20"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={() => handleUpdate(editingRecord)}
                  className="w-full bg-[#8b4513] text-white py-4 rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                >
                  Save Changes
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setEditingRecord(null)} className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold text-xs hover:bg-gray-200">Cancel</button>
                  <button onClick={() => handleDelete(editingRecord.id)} className="flex-1 bg-red-50 text-red-500 py-3 rounded-xl font-bold text-xs hover:bg-red-100 border border-red-100">Delete Record</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsBoard;
