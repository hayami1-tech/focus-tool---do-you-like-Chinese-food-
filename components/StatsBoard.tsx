
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FocusRecord, ProjectCategory } from '../types';

interface StatsBoardProps {
  history: FocusRecord[];
  categories: ProjectCategory[];
  onUpdateHistory: (newHistory: FocusRecord[]) => void;
}

type Period = 'DAY' | 'WEEK' | 'MONTH';

const PIXELS_PER_MIN = 1.0; 

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

const StatsBoard: React.FC<StatsBoardProps> = ({ history, categories, onUpdateHistory }) => {
  const [period, setPeriod] = useState<Period>('DAY');
  const [drillDown, setDrillDown] = useState<ProjectCategory | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [editingRecord, setEditingRecord] = useState<FocusRecord | null>(null);
  const [selectionRange, setSelectionRange] = useState<{ startMins: number; endMins: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  useEffect(() => {
    if (period === 'DAY' && !drillDown) {
      const performScroll = () => {
        const target = document.getElementById('time-slot-0800');
        const container = scrollContainerRef.current;
        if (target && container) container.scrollTop = target.offsetTop;
      };
      const timer = setTimeout(performScroll, 60);
      return () => clearTimeout(timer);
    }
  }, [period, drillDown]);

  const handleEditSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRecord) return;
    const form = e.currentTarget;
    const startStr = (form.elements.namedItem('start') as HTMLInputElement).value;
    const durationStr = (form.elements.namedItem('duration') as HTMLInputElement).value;
    const catStr = (form.elements.namedItem('category') as HTMLSelectElement).value;

    const [h, m] = startStr.split(':').map(Number);
    const startDate = new Date(editingRecord.timestamp);
    startDate.setHours(h, m, 0, 0);

    const updated: FocusRecord = {
      ...editingRecord,
      timestamp: startDate.getTime(),
      duration: parseInt(durationStr),
      category: catStr
    };

    onUpdateHistory(history.map(r => r.id === updated.id ? updated : r));
    setEditingRecord(null);
  };

  const handleDelete = () => {
    if (!editingRecord) return;
    if (confirm("Confirm to delete this record?")) {
      onUpdateHistory(history.filter(r => r.id !== editingRecord.id));
      setEditingRecord(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (period !== 'DAY' || drillDown) return;
    if ('touches' in e && e.touches.length !== 1) return;

    const container = e.currentTarget as HTMLDivElement;
    const rect = container.getBoundingClientRect();
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const y = clientY - rect.top + container.scrollTop;
    const mins = Math.floor(y / PIXELS_PER_MIN);
    
    setIsDragging(true);
    setSelectionRange({ startMins: mins, endMins: mins + 15 });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !selectionRange) return;
    const container = e.currentTarget as HTMLDivElement;
    const rect = container.getBoundingClientRect();
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const y = clientY - rect.top + container.scrollTop;
    const mins = Math.floor(y / PIXELS_PER_MIN);
    
    setSelectionRange({ ...selectionRange, endMins: mins });
  };

  const handleMouseUp = () => {
    if (!isDragging || !selectionRange) return;
    setIsDragging(false);
    
    const start = Math.min(selectionRange.startMins, selectionRange.endMins);
    const end = Math.max(selectionRange.startMins, selectionRange.endMins);
    const dur = Math.max(end - start, 5); 

    const today = new Date();
    today.setHours(Math.floor(start / 60), start % 60, 0, 0);
    
    setEditingRecord({
      id: 'NEW',
      category: categories[0],
      duration: dur,
      timestamp: today.getTime(),
      foodName: 'Custom Entry'
    });
    setSelectionRange(null);
  };

  const handleNewSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRecord) return;
    const form = e.currentTarget;
    const startStr = (form.elements.namedItem('start') as HTMLInputElement).value;
    const durationStr = (form.elements.namedItem('duration') as HTMLInputElement).value;
    const catStr = (form.elements.namedItem('category') as HTMLSelectElement).value;

    const [h, m] = startStr.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(h, m, 0, 0);

    const newRec: FocusRecord = {
      id: Date.now().toString(),
      category: catStr,
      duration: parseInt(durationStr),
      timestamp: startDate.getTime(),
      foodName: 'Manually Added'
    };

    onUpdateHistory([newRec, ...history]);
    setEditingRecord(null);
  };

  const renderPieChart = () => {
    if (stats.grandTotal === 0) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#8b4513" strokeWidth="1" strokeDasharray="1 3" opacity="0.1" />
        </svg>
      );
    }
    let cumulativePercent = 0;
    const slices = (Object.entries(stats.categoryTotals) as [string, number][]).map(([cat, val], index) => {
      const pct = val / stats.grandTotal;
      const startX = Math.cos(2 * Math.PI * cumulativePercent);
      const startY = Math.sin(2 * Math.PI * cumulativePercent);
      cumulativePercent += pct;
      const endX = Math.cos(2 * Math.PI * cumulativePercent);
      const endY = Math.sin(2 * Math.PI * cumulativePercent);
      const largeArcFlag = pct > 0.5 ? 1 : 0;
      const pathData = [`M 50 50`,`L ${50 + 45 * startX} ${50 + 45 * startY}`,`A 45 45 0 ${largeArcFlag} 1 ${50 + 45 * endX} ${50 + 45 * endY}`,`Z`].join(' ');
      return <path key={cat} d={pathData} fill={getCategoryColor(cat, index)} className="transition-all duration-500 hover:opacity-80 cursor-pointer" />;
    });
    return <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">{slices}<circle cx="50" cy="50" r="28" fill="#fdfbf7" /></svg>;
  };

  const renderTimeline = (records: FocusRecord[]) => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return (
      <div 
        className="relative border-l border-[#8b4513]/10 ml-10 select-none cursor-crosshair" 
        style={{ height: 1440 * PIXELS_PER_MIN }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        {hours.map(hour => (
          <div key={hour} id={`time-slot-${hour.toString().padStart(2, '0')}00`} className="absolute w-full border-t border-[#8b4513]/5 flex items-start pointer-events-none" style={{ top: hour * 60 * PIXELS_PER_MIN }}>
            <span className="text-[9px] font-bold opacity-20 -ml-12 -mt-2 w-10 text-right font-mono tabular-nums">{hour.toString().padStart(2, '0')}:00</span>
          </div>
        ))}
        {selectionRange && (
          <div className="absolute left-0 right-0 bg-[#8b4513]/5 border-y border-[#8b4513]/20 z-10 pointer-events-none" style={{ top: Math.min(selectionRange.startMins, selectionRange.endMins) * PIXELS_PER_MIN, height: Math.abs(selectionRange.endMins - selectionRange.startMins) * PIXELS_PER_MIN }} />
        )}
        {records.map((record) => {
          const date = new Date(record.timestamp);
          const startMins = date.getHours() * 60 + date.getMinutes();
          const top = startMins * PIXELS_PER_MIN;
          const height = Math.max(record.duration * PIXELS_PER_MIN, 20);
          return (
            <div 
              key={record.id}
              onMouseDown={(e) => e.stopPropagation()} // 关键修复：防止触发背景的拖拽新建逻辑
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setEditingRecord(record); }}
              className="absolute left-1 right-1 bg-white/60 border border-[#8b4513]/10 rounded px-2 flex items-center shadow-sm z-20 cursor-pointer hover:bg-white active:scale-[0.99] transition-all"
              style={{ top, height }}
            >
              <div className="flex flex-col justify-center overflow-hidden pointer-events-none w-full">
                <div className="flex justify-between items-center w-full">
                  <span className="text-[9px] font-bold text-[#4a3728] truncate uppercase tracking-tighter">{record.category}</span>
                  <span className="text-[7px] font-bold opacity-40 font-mono tabular-nums">{formatTime(record.timestamp)} • {record.duration}m</span>
                </div>
              </div>
            </div>
          );
        })}
        <div className="absolute left-0 right-0 border-t border-red-500/20 z-30 pointer-events-none" style={{ top: (new Date().getHours() * 60 + new Date().getMinutes()) * PIXELS_PER_MIN }} />
      </div>
    );
  };

  const renderSimpleList = (records: FocusRecord[]) => {
    if (records.length === 0) return (
      <div className="flex flex-col items-center justify-center py-20 opacity-20">
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
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, dailyRecords]) => (
          <div key={date}>
            <div className="sticky top-0 bg-[#f3eee3] py-2 z-10 border-b border-[#8b4513]/10 mb-3 flex justify-between items-center">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8b4513]/50">{date}</span>
              <span className="text-[8px] font-bold opacity-20 uppercase">{dailyRecords.length} records</span>
            </div>
            <div className="space-y-1.5">
              {dailyRecords.map(rec => (
                <div key={rec.id} onClick={() => setEditingRecord(rec)} className="flex flex-col bg-white/30 p-3 rounded-lg border border-[#8b4513]/5 hover:bg-white transition-all cursor-pointer">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-[#4a3728] uppercase tracking-wider">{rec.category}</span>
                    <span className="text-[8px] font-mono opacity-40">{formatTime(rec.timestamp)}</span>
                  </div>
                  <span className="text-[9px] font-bold text-[#8b4513]/50 uppercase tracking-widest">{rec.duration} minutes</span>
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
          <h2 className="text-2xl font-bold heytea-font uppercase tracking-widest text-[#8b4513]">
            Hearth History
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-30 mt-1">Countryside Stove Records</p>
        </div>
        <div className="flex bg-[#e5dec9] p-1.5 rounded-xl shadow-inner border border-[#8b4513]/10">
          {(['DAY', 'WEEK', 'MONTH'] as Period[]).map((p) => (
            <button key={p} onClick={() => { setPeriod(p); setDrillDown(null); }} className={`px-8 py-2.5 rounded-lg text-xs font-bold transition-all heytea-font tracking-widest ${period === p ? 'bg-[#8b4513] text-white shadow-md scale-105' : 'text-[#8b4513]/50 hover:text-[#8b4513]'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        <div className="md:col-span-4 flex flex-col items-center">
           <div className="w-56 h-56 relative mb-10 group">{renderPieChart()}<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-3xl font-bold text-[#8b4513] group-hover:scale-110 transition-transform">{stats.count}</span><span className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em]">Sessions</span></div></div>
           <div className="w-full space-y-1.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-20 mb-2 px-1">Allocation</div>
              {(Object.entries(stats.categoryTotals) as [string, number][]).sort((a, b) => b[1] - a[1]).map(([cat, val], index) => {
                if (val === 0) return null;
                const pct = (val / stats.grandTotal) * 100;
                return (
                  <button key={cat} onClick={() => setDrillDown(cat)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all group ${drillDown === cat ? 'border-[#8b4513] bg-[#f3eee3] shadow-sm' : 'border-transparent bg-white/40 hover:bg-white'}`}>
                    <div className="flex items-center gap-2.5"><span className="text-[10px] font-bold text-[#4a3728] uppercase tracking-wider">{cat}</span></div>
                    <div className="text-right"><p className="text-[11px] font-bold text-[#8b4513]">{formatDuration(val)}</p><p className="text-[8px] opacity-20 font-bold group-hover:opacity-60">{pct.toFixed(0)}%</p></div>
                  </button>
                );
              })}
           </div>
        </div>

        <div className="md:col-span-8 bg-[#f3eee3] rounded-3xl p-6 md:p-8 border-2 border-[#8b4513]/5 h-[600px] flex flex-col relative overflow-hidden shadow-inner">
           <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-4"><h3 className="text-base font-bold text-[#8b4513] uppercase tracking-wider">{period === 'DAY' && !drillDown ? "Timeline" : (drillDown ? `${drillDown} History` : "Archives")}</h3></div>
             {drillDown && (<button onClick={() => setDrillDown(null)} className="text-[8px] font-bold text-[#8b4513]/40 hover:text-[#8b4513] uppercase tracking-widest">Show All</button>)}
           </div>
           <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pr-1 custom-scrollbar scroll-smooth">
              {period === 'DAY' && !drillDown ? renderTimeline(filteredHistory) : renderSimpleList(drillDown ? filteredHistory.filter(r => r.category === drillDown) : filteredHistory)}
           </div>
        </div>
      </div>

      {editingRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#fdfbf7] w-full max-w-sm rounded-3xl border-4 border-[#8b4513] shadow-2xl p-8 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6"><h3 className="heytea-font font-bold text-[#8b4513] uppercase tracking-widest">{editingRecord.id === 'NEW' ? 'Add Record' : 'Record Details'}</h3><button onClick={() => setEditingRecord(null)} className="text-2xl">&times;</button></div>
            <form onSubmit={editingRecord.id === 'NEW' ? handleNewSave : handleEditSave} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase opacity-40 mb-1 block">Time Started</label>
                  <input name="start" type="time" defaultValue={new Date(editingRecord.timestamp).toTimeString().slice(0, 5)} className="w-full bg-white border-2 border-[#8b4513]/10 px-4 py-2.5 rounded-xl font-mono font-bold text-[#8b4513]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase opacity-40 mb-1 block">Duration</label>
                  <div className="relative">
                    <input name="duration" type="number" defaultValue={editingRecord.duration} className="w-full bg-white border-2 border-[#8b4513]/10 px-4 py-2.5 rounded-xl font-bold text-[#8b4513] pr-12" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30 uppercase">min</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase opacity-40 mb-1 block">Category</label>
                  <select name="category" defaultValue={editingRecord.category} className="w-full bg-white border-2 border-[#8b4513]/10 px-4 py-2.5 rounded-xl font-bold text-[#8b4513]">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <button type="submit" className="w-full bg-[#8b4513] text-white py-3 rounded-xl font-bold shadow-lg hover:bg-[#6d3510] active:scale-95 transition-all">
                  {editingRecord.id === 'NEW' ? 'Create' : 'Save Changes'}
                </button>
                {editingRecord.id !== 'NEW' && (
                  <button type="button" onClick={handleDelete} className="w-full text-red-500 font-bold text-xs uppercase tracking-widest hover:underline py-2">
                    Delete Record
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsBoard;
