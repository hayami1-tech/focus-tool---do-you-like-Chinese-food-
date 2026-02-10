import React, { useState, useEffect, useCallback, useRef } from 'react';
// 🛡️ 路径保护：确保 "./types" 和 "./constants" 对应你 src 下的小写文件名
import { TimerMode, FoodItem, TimerStatus, ProjectCategory, FocusRecord } from './types';
import { FOOD_ITEMS, BREAK_ITEMS } from './constants';

// 组件引用
import Stove from './components/Stove';
import Pantry from './components/Pantry';
import TimerDisplay from './components/TimerDisplay';
import StatsBoard from './components/StatsBoard';
import DishCollection from './components/DishCollection';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FOCUS' | 'HISTORY'>('FOCUS');
  const [mode, setMode] = useState<TimerMode>(TimerMode.FOCUS);
  const [status, setStatus] = useState<TimerStatus>('IDLE');
  const [selectedFood, setSelectedFood] = useState<FoodItem>(FOOD_ITEMS[0]);
  
  // 🛡️ 初始化安全阀：防止 localStorage 损坏导致白屏
  const [categories, setCategories] = useState<ProjectCategory[]>(() => {
    try {
      const saved = localStorage.getItem('zao-tai-categories');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 
        ? parsed 
        : ['Work', 'Study', 'Health', 'Zen'];
    } catch {
      return ['Work', 'Study', 'Health', 'Zen'];
    }
  });

  const [currentCategory, setCurrentCategory] = useState<ProjectCategory>(() => {
    return (Array.isArray(categories) && categories.length > 0) ? categories[0] : 'Work';
  });
  
  const [timeLeft, setTimeLeft] = useState(selectedFood.duration * 60);
  const [sessionDurationMins, setSessionDurationMins] = useState(selectedFood.duration);

  const [history, setHistory] = useState<FocusRecord[]>(() => {
    try {
      const saved = localStorage.getItem('zao-tai-history');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState<string>('');
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 持久化存储
  useEffect(() => {
    localStorage.setItem('zao-tai-history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('zao-tai-categories', JSON.stringify(categories));
  }, [categories]);

  const startTimer = () => setStatus('RUNNING');
  const pauseTimer = () => setStatus('PAUSED');

  const resetTimer = useCallback((newFood?: FoodItem) => {
    const food = newFood || selectedFood;
    setStatus('IDLE');
    setTimeLeft(food.duration * 60);
    setSessionDurationMins(food.duration);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [selectedFood]);

  const toggleMode = (newMode: TimerMode) => {
    setMode(newMode);
    const newFood = newMode === TimerMode.FOCUS ? FOOD_ITEMS[0] : BREAK_ITEMS[0];
    setSelectedFood(newFood);
    resetTimer(newFood);
  };

  const handleManualTimeChange = (newTotalSeconds: number) => {
    if (status === 'IDLE') {
      const mins = Math.ceil(newTotalSeconds / 60);
      setTimeLeft(newTotalSeconds);
      setSessionDurationMins(mins);
    }
  };

  // 计时器逻辑
  useEffect(() => {
    if (status === 'RUNNING' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && status === 'RUNNING') {
      setStatus('FINISHED');
      if (mode === TimerMode.FOCUS) {
        const record: FocusRecord = {
          id: Date.now().toString(),
          category: currentCategory,
          duration: sessionDurationMins,
          timestamp: Date.now(),
          foodName: selectedFood.name
        };
        setHistory(prev => [record, ...prev]);
      }
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, timeLeft, mode, currentCategory, selectedFood, sessionDurationMins]);

  const handleFoodSelect = (food: FoodItem) => {
    if (status === 'RUNNING') {
      if (window.confirm('Cooking in progress. Change the pot?')) {
        setSelectedFood(food);
        resetTimer(food);
      }
    } else {
      setSelectedFood(food);
      resetTimer(food);
    }
  };

  const addCategory = () => {
    const trimmed = newCatName.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setNewCatName('');
    }
  };

  const deleteCategoryRequest = (cat: string) => {
    if (categories.length <= 1) {
      alert("Keep at least one category.");
      return;
    }
    if (history.some(r => r.category === cat)) {
      setCategoryToDelete(cat);
      setMergeTarget(categories.find(c => c !== cat) || '');
      setShowMergeModal(true);
    } else {
      executeDelete(cat);
    }
  };

  const executeDelete = (cat: string, mergeInto?: string) => {
    if (mergeInto) {
      setHistory(prev => prev.map(r => r.category === cat ? { ...r, category: mergeInto } : r));
    } else {
      setHistory(prev => prev.filter(r => r.category !== cat));
    }
    const updated = categories.filter(c => c !== cat);
    setCategories(updated);
    if (currentCategory === cat) setCurrentCategory(updated[0] || 'Work');
    setShowMergeModal(false);
    setCategoryToDelete(null);
  };

  const dailyHistory = history.filter(record => 
    new Date(record.timestamp).toDateString() === new Date().toDateString()
  );

  return (
    <div className="min-h-screen bg-[#f3eee3] text-[#4a3728] p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-6xl flex flex-col items-center mb-10 gap-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-[0.2em] text-[#8b4513] text-center uppercase">
          Grandma’s Stove
        </h1>

        <div className="flex flex-col md:flex-row items-center gap-6 w-full justify-between border-t border-[#8b4513]/10 pt-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/40 px-4 py-2 rounded-full border border-[#8b4513]/20 flex items-center gap-2">
               <span className="text-[10px] font-bold uppercase opacity-50">Event:</span>
               <select 
                 value={currentCategory}
                 onChange={(e) => setCurrentCategory(e.target.value)}
                 className="bg-transparent border-none text-xs font-bold text-[#8b4513] focus:ring-0 cursor-pointer p-0 pr-6"
               >
                 {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
               </select>
            </div>
            <button onClick={() => setShowCatModal(true)} className="w-8 h-8 flex items-center justify-center bg-[#e5dec9] hover:bg-[#dcd1b3] rounded-full text-[#8b4513] transition-colors">⚙️</button>
          </div>

          <nav className="flex bg-[#e5dec9] p-1 rounded-full shadow-inner">
            <button onClick={() => setActiveTab('FOCUS')} className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'FOCUS' ? 'bg-[#8b4513] text-white shadow-md' : 'text-[#8b4513]/60'}`}>Focus</button>
            <button onClick={() => setActiveTab('HISTORY')} className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'HISTORY' ? 'bg-[#8b4513] text-white shadow-md' : 'text-[#8b4513]/60'}`}>History</button>
          </nav>
        </div>
      </header>

      {activeTab === 'FOCUS' ? (
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-500">
          <div className="lg:col-span-7 flex flex-col items-center">
            <Stove isCooking={status === 'RUNNING'} food={selectedFood} status={status} />
            <div className="mt-8 w-full">
              <TimerDisplay timeLeft={timeLeft} status={status} onStart={startTimer} onPause={pauseTimer} onReset={() => resetTimer()} onTimeChange={handleManualTimeChange} mode={mode} />
            </div>
          </div>
          <div className="lg:col-span-5 lg:mt-24 flex flex-col gap-4">
            <Pantry items={mode === TimerMode.FOCUS ? FOOD_ITEMS : BREAK_ITEMS} selectedId={selectedFood.id} onSelect={handleFoodSelect} title={mode === TimerMode.FOCUS ? "Ingredients" : "Snacks"} mode={mode} onModeToggle={toggleMode} />
            <DishCollection history={dailyHistory} />
          </div>
        </div>
      ) : (
        <StatsBoard history={history} categories={categories} onUpdateHistory={setHistory} />
      )}

      {/* 弹窗代码保持原样 */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#f3eee3] w-full max-w-md rounded-2xl border-4 border-[#8b4513] shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-[#8b4513] uppercase">Manage Events</h2>
              <button onClick={() => setShowCatModal(false)} className="text-2xl">&times;</button>
            </div>
            <div className="flex gap-2 mb-6">
              <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="New event..." className="flex-1 px-4 py-2 rounded-lg border-2 border-[#8b4513]/20 text-sm" />
              <button onClick={addCategory} className="bg-[#8b4513] text-white px-4 py-2 rounded-lg font-bold">Add</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.map(cat => (
                <div key={cat} className="flex justify-between items-center bg-white/60 p-3 rounded-lg">
                  <span className="font-bold text-sm">{cat}</span>
                  <button onClick={() => deleteCategoryRequest(cat)} className="text-red-600 text-xs font-bold uppercase">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showMergeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 border-t-8 border-[#8b4513]">
            <h3 className="text-xl font-bold text-center mb-4 text-[#8b4513]">Merge History?</h3>
            <select value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)} className="w-full bg-[#f3eee3] p-3 rounded-xl mb-6">
              {categories.filter(c => c !== categoryToDelete).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button onClick={() => executeDelete(categoryToDelete!, mergeTarget)} className="w-full bg-[#8b4513] text-white py-3 rounded-xl font-bold mb-3">Merge and Delete</button>
            <button onClick={() => setShowMergeModal(false)} className="w-full text-gray-400 text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
