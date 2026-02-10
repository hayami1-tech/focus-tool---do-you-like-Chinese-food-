import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FocusRecord, ProjectCategory } from '../types';
import { FOOD_ITEMS, BREAK_ITEMS } from '../constants';
import FoodIllustration from './FoodIllustration';

interface StatsBoardProps {
  history: FocusRecord[];
  categories: ProjectCategory[];
  onUpdateHistory?: (newHistory: FocusRecord[]) => void;
}

type Period = 'DAY' | 'WEEK' | 'MONTH';

const formatDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const formatTime = (timestamp: number) => {
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch (e) {
    return '--:--';
  }
};

const getIconByName = (name: string) => {
  const allItems = [...FOOD_ITEMS, ...BREAK_ITEMS];
  const item = allItems.find(f => f.name === name);
  return item ? item.iconName : 'default';
};

const StatsBoard: React.FC<StatsBoardProps> = ({ 
  history = [], 
  categories = [], 
  onUpdateHistory 
}) => {
  const [period, setPeriod] = useState<Period>('DAY');
  const [drillDown, setDrillDown] = useState<ProjectCategory | null>(null);
  const [editingRecord, setEditingRecord] = useState<FocusRecord | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 🛡️ 强制检查，确保这些变量在任何时候都是数组
  const safeHistory = useMemo(() => Array.isArray(history) ? history : [], [history]);
  const safeCategories = useMemo(() => Array.isArray(categories) ? categories : [], [categories]);

  const filteredHistory = useMemo(() => {
    const now = new Date();
    if (period === 'DAY') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return safeHistory.filter(r => r && r.timestamp >= todayStart);
    } else if (period === 'WEEK') {
      const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      return safeHistory.filter(r => r && r.timestamp >= weekAgo);
    } else {
      const monthAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
      return safeHistory.filter(r => r && r.timestamp >= monthAgo);
    }
  }, [safeHistory, period]);

  const stats = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    filteredHistory.forEach(r => {
      if (r && r.category) {
        categoryTotals[r.category] = (categoryTotals[r.category] || 0) + (r.duration || 0);
      }
    });
    const grandTotal = Object.values(categoryTotals).reduce((a: number, b: number) => a + b, 0);
    return { categoryTotals, grandTotal, count: filteredHistory.length };
  }, [filteredHistory]);

  const getCategoryColor = (cat: string, index: number) => {
    const baseColors = ['#8b4513', '#a67c52', '#5d4037', '#3e2723', '#166534', '#2e7d32'];
    // 🛡️ 极其关键的修复：如果 safeCategories 为空或未定义，绝不执行 indexOf
    if (!safeCategories || safeCategories.length === 0) return baseColors[index % baseColors.length];
    const idx = safeCategories.indexOf(cat);
    return baseColors[idx >= 0 ? idx % baseColors.length : index % baseColors.length];
  };

  const handleUpdate = (updated: FocusRecord) => {
    if (onUpdateHistory && updated) {
      const newHistory = safeHistory.map(r => r.id === updated.id ? updated : r);
      onUpdateHistory(newHistory);
      setEditingRecord(null);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this cooking record?") && onUpdateHistory) {
      onUpdateHistory(safeHistory.filter(r => r.id !== id));
      setEditingRecord(null);
    }
  };

  // 自动滚动到早 8 点
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
          if (!record) return null;
          const date = new Date(record.timestamp);
          const startMins = date.getHours() * 60 + date.getMinutes();
          const color = getCategoryColor(record.category, idx);
          return (
            <div 
              key={record.id}
              onClick={() => setEditingRecord(record)}
              className="absolute left-2 right-6 rounded-md px-2 border border-white/40 shadow-sm flex flex-col justify-center overflow-hidden transition-all hover:ring-2 hover:ring-[#8b4513]/30 z-20 group cursor-pointer active:scale-[0.98]"
              style={{ 
                top: startMins * pixelsPerMin, 
                height: Math.max((record.duration || 0) * pixelsPerMin, 22), 
                backgroundColor: `${color}18`,
                borderLeft: `4px solid ${color}`
              }}
            >
              <div className="flex items-baseline gap-1.5 overflow-hidden">
                <span className="text-[9px] font-bold text-[#4a3728] truncate uppercase">{record.category}</span>
                <span className="text-[7px] font-bold opacity-40 font-mono flex-none">{formatTime(record.timestamp)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSimpleList = (records: FocusRecord[]) => {
    const validRecords = records.filter(r => r);
    if (validRecords.length === 0) return <div className="py-20 text-center opacity-20 italic">🍂 No history here</div>;
    
    const grouped = validRecords.reduce((acc, rec) => {
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
                <div key={rec.id} onClick={() => setEditingRecord(rec)} className="flex items-center gap-3 bg-white/30 p-2.5 rounded-xl border border-[#8b4513]/5 hover:bg-white transition-all cursor-pointer">
                  <div className="w-8 h-8 flex-none bg-white rounded-full p-1.5 border border-[#8b4513]/5">
                    <FoodIllustration name={getIconByName(rec.foodName)} className="w-full h-full" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-[#4a3728] uppercase">{rec.category}</span><span className="text-[8px] font-mono opacity-30">{formatTime(rec.timestamp)}</span></div>
                    <span className="text-[8px] font-bold text-[#8b4513]/40 uppercase">{rec.duration}m • {rec.foodName}</span>
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
        </div>
        <div className="flex bg-[#e5dec9] p-1.5 rounded-xl border border-[#8b4513]/10">
          {(['DAY', 'WEEK', 'MONTH'] as Period[]).map((p) => (
            <button key={p} onClick={() => { setPeriod(p); setDrillDown(null); }} className={`px-8 py-2.5 rounded-lg text-xs font-bold transition-all tracking-widest ${period === p ? 'bg-[#8b4513] text-white shadow-md' : 'text-[#8b4513]/50 hover:text-[#8b4513]'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5 flex flex-col items-center">
           <div className="w-60 h-60 relative mb-10">
             {stats.grandTotal > 0 ? (
                <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
                  {Object.entries(stats.categoryTotals).map(([cat, val], index) => {
                    let cumulative = 0;
                    const totals = Object.values(stats.categoryTotals);
                    for (let i = 0; i < index; i++) cumulative += totals[i] / stats.grandTotal;
                    const percent = val / stats.grandTotal;
                    const startX = Math.cos(2 * Math.PI * cumulative);
                    const startY = Math.sin(2 * Math.PI * cumulative);
                    const endX = Math.cos(2 * Math.PI * (cumulative + percent));
                    const endY = Math.sin(2 * Math.PI * (cumulative + percent));
                    return <path key={cat} d={`M 0 0 L ${startX} ${startY} A 1 1 0 ${percent > 0.5 ? 1 : 0} 1 ${endX} ${endY} Z`} fill={getCategoryColor(cat, index)} className="hover:opacity-80 cursor-pointer" />;
                  })}
                  <circle cx="0" cy="0" r="0.45" fill="#fdfbf7" />
                </svg>
             ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#8b4513]/20 border-2 border-dashed border-[#8b4513]/10 rounded-full">
                  <span className="text-4xl">🍂</span>
                  <p className="text-[9px] mt-2 font-bold uppercase tracking-widest">Empty Stove</p>
                </div>
             )}
           </div>
           
           <div className="w-full space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(stats.categoryTotals).sort((a,b) => b[1]-a[1]).map(([cat, val], index) => val > 0 && (
                <button key={cat} onClick={() => setDrillDown(cat)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${drillDown === cat ? 'border-[#8b4513] bg-[#f3eee3]' : 'border-transparent bg-white/40 hover:bg-white'}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCategoryColor(cat, index) }} />
                    <span className="text-[10px] font-bold text-[#4a3728] uppercase">{cat}</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#8b4513]">{formatDuration(val)}</span>
                </button>
              ))}
           </div>
        </div>

        <div className="md:col-span-7 bg-[#f3eee3] rounded-3xl p-6 md:p-8 h-[620px] flex flex-col relative overflow-hidden shadow-inner border border-[#8b4513]/5">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-base font-bold text-[#8b4513] uppercase tracking-wider">{drillDown ? `${drillDown} Log` : "Timeline"}</h3>
             {drillDown && <button onClick={() => setDrillDown(null)} className="text-[8px] font-bold text-[#8b4513]/40 hover:text-[#8b4513] uppercase">Show All</button>}
           </div>
           <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {period === 'DAY' && !drillDown ? renderTimeline(filteredHistory) : renderSimpleList(drillDown ? filteredHistory.filter(r => r && r.category === drillDown) : filteredHistory)}
           </div>
        </div>
      </div>

      {editingRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#fdfbf7] w-full max-w-md rounded-3xl border-4 border-[#8b4513] p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-[#8b4513] mb-6 uppercase tracking-widest">📝 Edit Record</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase opacity-40 mb-2 block">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {safeCategories.map(cat => (
                    <button key={cat} onClick={() => setEditingRecord({...editingRecord, category: cat})} className={`py-2 px-3 rounded-xl text-[10px] font-bold border-2 transition-all ${editingRecord.category === cat ? 'bg-[#8b4513] text-white border-[#8b4513]' : 'bg-white border-[#8b4513]/10 text-[#8b4513]'}`}>{cat}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase opacity-40 mb-2 block">Duration (min)</label>
                  <input type="number" value={editingRecord.duration} onChange={(e) => setEditingRecord({...editingRecord, duration: parseInt(e.target.value) || 0})} className="w-full bg-[#f3eee3] border-none rounded-xl px-4 py-3 font-bold text-[#8b4513]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase opacity-40 mb-2 block">Time</label>
                  <input type="time" value={formatTime(editingRecord.timestamp)} onChange={(e) => {
                    const [h, m] = e.target.value.split(':');
                    const d = new Date(editingRecord.timestamp);
                    d.setHours(parseInt(h), parseInt(m));
                    setEditingRecord({...editingRecord, timestamp: d.getTime()});
                  }} className="w-full bg-[#f3eee3] border-none rounded-xl px-4 py-3 font-bold text-[#8b4513]" />
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <button onClick={() => handleUpdate(editingRecord)} className="w-full bg-[#8b4513] text-white py-4 rounded-2xl font-bold text-sm shadow-lg">Update Journal</button>
                <div className="flex gap-3">
                  <button onClick={() => setEditingRecord(null)} className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold text-xs">Back</button>
                  <button onClick={() => handleDelete(editingRecord.id)} className="flex-1 bg-red-50 text-red-500 py-3 rounded-xl font-bold text-xs border border-red-100">Delete</button>
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
