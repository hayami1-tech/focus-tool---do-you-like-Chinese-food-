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
  } catch { return '--:--'; }
};

const getIconByName = (name: string) => {
  const item = [...FOOD_ITEMS, ...BREAK_ITEMS].find(f => f.name === name);
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

  // 🛡️ 核心修复：强制局部转换，防止 indexOf 崩溃
  const safeHistory = useMemo(() => (Array.isArray(history) ? history : []), [history]);
  const safeCategories = useMemo(() => (Array.isArray(categories) ? categories : []), [categories]);

  const getCategoryColor = (cat: string, index: number) => {
    const baseColors = ['#8b4513', '#a67c52', '#5d4037', '#3e2723', '#166534', '#2e7d32'];
    if (!cat || safeCategories.length === 0) return baseColors[index % baseColors.length];
    const idx = safeCategories.indexOf(cat);
    return baseColors[idx >= 0 ? idx % baseColors.length : index % baseColors.length];
  };

  const filteredHistory = useMemo(() => {
    const now = new Date();
    const records = safeHistory.filter(r => r && typeof r.timestamp === 'number');
    if (period === 'DAY') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return records.filter(r => r.timestamp >= todayStart);
    } else if (period === 'WEEK') {
      const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      return records.filter(r => r.timestamp >= weekAgo);
    }
    return records.filter(r => r.timestamp >= now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }, [safeHistory, period]);

  const stats = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredHistory.forEach(r => {
      if (r?.category) totals[r.category] = (totals[r.category] || 0) + (r.duration || 0);
    });
    const grand = Object.values(totals).reduce((a, b) => a + b, 0);
    return { totals, grand, count: filteredHistory.length };
  }, [filteredHistory]);

  const handleUpdate = (updated: FocusRecord) => {
    if (onUpdateHistory) {
      onUpdateHistory(safeHistory.map(r => r.id === updated.id ? updated : r));
      setEditingRecord(null);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this record?") && onUpdateHistory) {
      onUpdateHistory(safeHistory.filter(r => r.id !== id));
      setEditingRecord(null);
    }
  };

  return (
    <div className="w-full max-w-6xl bg-[#fdfbf7] p-6 md:p-10 rounded-2xl border-4 border-[#8b4513] shadow-2xl animate-in fade-in zoom-in duration-300 relative">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <h2 className="text-2xl font-bold uppercase tracking-widest text-[#8b4513]">📓 Hearth History</h2>
        <div className="flex bg-[#e5dec9] p-1.5 rounded-xl border border-[#8b4513]/10">
          {(['DAY', 'WEEK', 'MONTH'] as Period[]).map((p) => (
            <button key={p} onClick={() => { setPeriod(p); setDrillDown(null); }} className={`px-8 py-2.5 rounded-lg text-xs font-bold transition-all ${period === p ? 'bg-[#8b4513] text-white shadow-md' : 'text-[#8b4513]/50'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5 flex flex-col items-center">
           <div className="w-60 h-60 relative mb-10">
             {stats.grand > 0 ? (
                <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
                  {Object.entries(stats.totals).map(([cat, val], i) => {
                    let cumulative = 0;
                    const allVals = Object.values(stats.totals);
                    for (let j = 0; j < i; j++) cumulative += allVals[j] / stats.grand;
                    const p = val / stats.grand;
                    const x1 = Math.cos(2 * Math.PI * cumulative);
                    const y1 = Math.sin(2 * Math.PI * cumulative);
                    const x2 = Math.cos(2 * Math.PI * (cumulative + p));
                    const y2 = Math.sin(2 * Math.PI * (cumulative + p));
                    return <path key={cat} d={`M 0 0 L ${x1} ${y1} A 1 1 0 ${p > 0.5 ? 1 : 0} 1 ${x2} ${y2} Z`} fill={getCategoryColor(cat, i)} />;
                  })}
                  <circle cx="0" cy="0" r="0.45" fill="#fdfbf7" />
                </svg>
             ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#8b4513]/20 border-2 border-dashed border-[#8b4513]/10 rounded-full italic">🍂 Empty Stove</div>
             )}
           </div>
           <div className="w-full space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(stats.totals).sort((a,b)=>b[1]-a[1]).map(([cat, val], i) => (
                <button key={cat} onClick={() => setDrillDown(cat)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${drillDown === cat ? 'border-[#8b4513] bg-[#f3eee3]' : 'bg-white/40'}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCategoryColor(cat, i) }} />
                    <span className="text-[10px] font-bold text-[#4a3728] uppercase">{cat}</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#8b4513]">{formatDuration(val)}</span>
                </button>
              ))}
           </div>
        </div>

        <div className="md:col-span-7 bg-[#f3eee3] rounded-3xl p-6 h-[620px] flex flex-col border border-[#8b4513]/5">
           <div className="flex-1 overflow-y-auto custom-scrollbar">
              {(drillDown ? filteredHistory.filter(r => r.category === drillDown) : filteredHistory).map((rec) => (
                <div key={rec.id} onClick={() => setEditingRecord(rec)} className="mb-2 flex items-center gap-3 bg-white/30 p-2.5 rounded-xl cursor-pointer hover:bg-white transition-all">
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
      </div>

      {editingRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#fdfbf7] w-full max-w-md rounded-3xl border-4 border-[#8b4513] p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-[#8b4513] mb-6 uppercase">📝 Edit Record</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-2">
                {safeCategories.map(cat => (
                  <button key={cat} onClick={() => setEditingRecord({...editingRecord, category: cat})} className={`py-2 px-3 rounded-xl text-[10px] font-bold border-2 ${editingRecord.category === cat ? 'bg-[#8b4513] text-white border-[#8b4513]' : 'bg-white border-[#8b4513]/10 text-[#8b4513]'}`}>{cat}</button>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => handleUpdate(editingRecord)} className="bg-[#8b4513] text-white py-4 rounded-xl font-bold shadow-lg">Save Changes</button>
                <button onClick={() => handleDelete(editingRecord.id)} className="text-red-500 font-bold text-xs uppercase">Delete Permanently</button>
                <button onClick={() => setEditingRecord(null)} className="text-gray-400 text-xs">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsBoard;
