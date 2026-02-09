import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TimerMode, FoodItem, TimerStatus, ProjectCategory, FocusRecord } from './types';
import { FOOD_ITEMS, BREAK_ITEMS } from './constants';
import Stove from './components/Stove';
import Pantry from './components/Pantry';
import TimerDisplay from './components/TimerDisplay';
import StatsBoard from './components/StatsBoard';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FOCUS' | 'HISTORY'>('FOCUS');
  const [mode, setMode] = useState<TimerMode>(TimerMode.FOCUS);
  const [status, setStatus] = useState<TimerStatus>('IDLE');
  const [selectedFood, setSelectedFood] = useState<FoodItem>(FOOD_ITEMS[0]);
  
  const [categories, setCategories] = useState<ProjectCategory[]>(() => {
    const saved = localStorage.getItem('zao-tai-categories');
    return saved ? JSON.parse(saved) : ['Work', 'Study', 'Health', 'Zen'];
  });
  const [currentCategory, setCurrentCategory] = useState<ProjectCategory>(categories[0]);
  
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem('zao-tai-time-left');
    return saved ? parseInt(saved) : FOOD_ITEMS[0].duration * 60;
  });
  
  const [sessionDurationMins, setSessionDurationMins] = useState(selectedFood.duration);

  const [history, setHistory] = useState<FocusRecord[]>(() => {
    const saved = localStorage.getItem('zao-tai-history');
    return saved ? JSON.parse(saved) : [];
  });

  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState<string>('');
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    localStorage.setItem('zao-tai-time-left', timeLeft.toString());
  }, [timeLeft]);

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
    const totalSecs = food.duration * 60;
    setTimeLeft(totalSecs);
    setSessionDurationMins(food.duration);
    localStorage.setItem('zao-tai-time-left', totalSecs.toString());
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
      if (window.confirm('Cooking in progress. Are you sure you want to change the pot?')) {
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
      alert("Keep at least one event type.");
      return;
    }
    const hasHistory = history.some(r => r.category === cat);
    if (hasHistory) {
      setCategoryToDelete(cat);
      const firstTarget = categories.find(c => c !== cat) || '';
      setMergeTarget(firstTarget);
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
    if (currentCategory === cat) setCurrentCategory(updated[0]);
    setShowMergeModal(false);
    setCategoryToDelete(null);
  };

  return (
    <div className="min-h-screen bg-[#f3eee3] text-[#4a3728] p-4 md:p-8 flex flex-col items-center font-sans">
      <header className="w-full max-w-6xl flex flex-col items-center mb-10 gap-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-[0.2em] text-[#8b4513] text-center uppercase">
          Grandma’s Stove
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-6 w-full justify-between border-t border-[#8b4513]/10 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-white/40 px-4 py-2 rounded-full border border-[#8b4513]/20 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Event:</span>
                <select value={currentCategory} onChange={(e) => setCurrentCategory(e.target.value)} className="bg-transparent border-none text-xs font-bold text-[#8b4513] focus:ring-0 cursor-pointer p-0 pr-6">
                  {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
            </div>
            <button onClick={() => setShowCatModal(true)} className="w-8 h-8 flex items-center justify-center bg-[#e5dec9] hover:bg-[#dcd1b3] rounded-full text-[#8b4513]">⚙️</button>
          </div>
          <nav className="flex bg-[#e5dec9] p-1 rounded-full shadow-inner">
            <button onClick={() => setActiveTab('FOCUS')} className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'FOCUS' ? 'bg-[#8b4513] text-white shadow-md' : 'text-[#8b4513]/60'}`}>Focus</button>
            <button onClick={() => setActiveTab('HISTORY')} className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'HISTORY' ? 'bg-[#8b4513] text-white shadow-md' : 'text-[#8b4513]/60'}`}>History</button>
          </nav>
        </div>
      </header>

      {activeTab === 'FOCUS' ? (
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 flex flex-col items-center">
            <Stove isCooking={status === 'RUNNING'} food={selectedFood} status={status} />
            <div className="mt-8 w-full">
              <TimerDisplay timeLeft={timeLeft} status={status} onStart={startTimer} onPause={pauseTimer} onReset={() => resetTimer()} onTimeChange={handleManualTimeChange} mode={mode} />
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex justify-center gap-4 bg-[#e5dec9] p-2 rounded-full shadow-inner mb-8">
              <button onClick={() => toggleMode(TimerMode.FOCUS)} className={`px-6 py-2 rounded-full transition-all text-sm font-bold ${mode === TimerMode.FOCUS ? 'bg-[#8b4513] text-white shadow-md' : 'hover:bg-[#dcd1b3]'}`}>Focus Mode</button>
              <button onClick={() => toggleMode(TimerMode.SHORT_BREAK)} className={`px-6 py-2 rounded-full transition-all text-sm font-bold ${mode !== TimerMode.FOCUS ? 'bg-[#8b4513] text-white shadow-md' : 'hover:bg-[#dcd1b3]'}`}>Break Mode</button>
            </div>
            <Pantry items={mode === TimerMode.FOCUS ? FOOD_ITEMS : BREAK_ITEMS} selectedId={selectedFood.id} onSelect={handleFoodSelect} title={mode === TimerMode.FOCUS ? "Select Ingredients" : "Select Snacks"} />
          </div>
        </div>
      ) : (
        <StatsBoard history={history} categories={categories} />
      )}

      {showCatModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#f3eee3] w-full max-w-md rounded-2xl border-4 border-[#8b4513] shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6"><h2 className="font-bold text-[#8b4513] uppercase tracking-wider">Manage Events</h2><button onClick={() => setShowCatModal(false)} className="text-2xl">&times;</button></div>
            <div className="flex gap-2 mb-6">
              <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="New event name..." className="flex-1 px-4 py-2 rounded-lg border-2 border-[#8b4513]/20 bg-white text-sm outline-none" />
              <button onClick={addCategory} className="bg-[#8b4513] text-white px-4 py-2 rounded-lg font-bold text-sm">Add</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.map(cat => (<div key={cat} className="flex justify-between items-center bg-white/60 p-3 rounded-lg"><span className="font-bold text-sm">{cat}</span><button onClick={() => deleteCategoryRequest(cat)} className="text-red-600 text-xs font-bold uppercase">Delete</button></div>))}
            </div>
          </div>
        </div>
      )}

      {showMergeModal && categoryToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl border-t-8 border-[#8b4513]">
            <h3 className="text-xl font-bold text-center mb-4 text-[#8b4513]">Merge History?</h3>
            <p className="text-sm text-center mb-6 opacity-70">Move history from "{categoryToDelete}" to:</p>
            <select value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)} className="w-full bg-[#f3eee3] border-none text-sm font-bold text-[#8b4513] rounded-lg mb-6">
              {categories.filter(c => c !== categoryToDelete).map(cat => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
            <div className="flex flex-col gap-3">
              <button onClick={() => executeDelete(categoryToDelete, mergeTarget)} className="w-full bg-[#8b4513] text-white py-3 rounded-xl font-bold shadow-lg">Merge and Delete</button>
              <button onClick={() => setShowMergeModal(false)} className="w-full bg-gray-100 text-gray-500 py-3 rounded-xl font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-20 mb-10 text-center opacity-40 text-xs italic">
        <p>“Stay Focused, Stay Hungry, Your Chinese food is cooking...”</p>
      </footer>
    </div>
  );
};

export default App;
