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

const StatsBoard: React.FC<StatsBoardProps> = ({ 
  history = [], 
  categories = [], 
  onUpdateHistory 
}) => {
  const [period, setPeriod] = useState<Period>('DAY');
  const [drillDown, setDrillDown] = useState<ProjectCategory | null>(null);
  const [editingRecord, setEditingRecord] = useState<FocusRecord | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 🛡️ 第一重防护：确保 categories 永远是数组
  const safeCategories = useMemo(() => Array.isArray(categories) ? categories : [], [categories]);

  const filteredHistory = useMemo(() => {
    const safeHistory = Array.isArray(history) ? history : [];
    const now = new Date();
    if (period === 'DAY') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return safeHistory.filter(r => r.timestamp >= todayStart);
    } else if (period === 'WEEK') {
      const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      return safeHistory.filter(r => r.timestamp >= weekAgo);
    } else {
      const monthAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
      return safeHistory.filter(r => r.timestamp >= monthAgo);
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
    // 🛡️ 第二重防护：在 indexOf 前检查 safeCategories
    const idx = safeCategories.indexOf(cat);
    return baseColors[idx >= 0 ? idx % baseColors.length : index % baseColors.length];
  };

  const handleUpdate = (updated: FocusRecord) => {
    if (onUpdateHistory) {
      const newHistory = (Array.isArray(history) ? history : []).map(r => r.id === updated.id ? updated : r);
      onUpdateHistory(newHistory);
      setEditingRecord(null);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this cooking record?") && onUpdateHistory) {
      onUpdateHistory((Array.isArray(history) ? history : []).filter(r => r.id !== id));
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
          const color = getCategoryColor(record.category, idx);

          return (
            <div 
              key={record.id}
              onClick={() => setEditingRecord(record)}
              className="absolute left-2 right-6 rounded-md px-2 border border-white/40 shadow-sm flex flex-col justify-center overflow-hidden transition-all hover:ring-2 hover:ring-[#8b4513]/30 z-20 group cursor-pointer active:scale-[0.98]"
              style={{ 
                top: startMins * pixelsPerMin, 
                height: Math.max(record.duration * pixelsPerMin, 22), 
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
    if (records.length === 0) return <div className="py-20 text-center opacity-20 italic">🍂 No history in this period</div>;
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
    <div className="w-full max-w-6xl bg-[#fdfbf7] p-6 md:p-10 rounded-2xl border-
