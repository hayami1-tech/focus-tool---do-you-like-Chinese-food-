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
  
  // --- 关键修改：初始化时间从缓存读取 ---
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

  // --- 关键修改：实时保存当前倒计时 ---
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

  // 后面的 handleFoodSelect, addCategory 等函数保持不变...
  const handleFoodSelect = (food: FoodItem) => {
    if (status === 'RUNNING') {
      if (confirm('Cooking in progress. Are you sure you want to change the pot?')) {
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
    <div className="min-h-screen bg-[#f3eee3] text-[#4a3728] p-4 md:p-8 flex flex-col items-center">
      {/* 这里保持你原本所有的 Return 结构，包括 header, Stove, TimerDisplay, StatsBoard 等... */}
      {/* 注意：因为代码太长，我会直接保留你原本的 UI 渲染逻辑 */}
      <header className="w-full max-w-6xl flex flex-col items-center mb-10 gap-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-[0.2em] text-[#8b4513] text-center uppercase">
          Grandma’s Stove
        </h1>
        {/* ... (此处省略部分重复的导航代码，请确保粘贴你原本完整的 return 内容) ... */}
        <div className="flex flex-col md:flex-row items-center gap-6 w-full justify-between border-t border-[#8b4513]/10 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-white/40 px-4 py-2 rounded-full border border-[#8b4513]/20 shadow-sm">
               <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Event:</span>
               <select 
                 value={currentCategory}
                 onChange={(e) => setCurrentCategory(e.target.value)}
                 className="bg-transparent border-none text-xs font-bold text-[#8b4513] focus:ring-0 cursor-pointer p-0 pr-6"
               >
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
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col items-center relative">
            <Stove isCooking={status === 'RUNNING'} food={selectedFood} status={status} />
            <div className="mt-8 w-full">
              <TimerDisplay timeLeft={timeLeft} status={status} onStart={startTimer} onPause={pauseTimer} onReset={() => resetTimer()} onTimeChange={handleManualTimeChange} mode={mode} />
            </div>
          </div>
          <div className="lg:col-span-5 space-y-8">
            <Pantry items={mode === TimerMode.FOCUS ? FOOD_ITEMS : BREAK_ITEMS} selectedId={selectedFood.id} onSelect={handleFoodSelect} title={mode === TimerMode.FOCUS ? "Select Ingredients" : "Select Snacks"} />
          </div>
        </div>
      ) : (
        <StatsBoard history={history} categories={categories} />
      )}

      {/* 此处省略你原来的两个 Modal 代码，请务必保留它们 */}
      <footer className="mt-20 mb-10 text-center opacity-40 text-xs italic">
        <p>“当我想起中国食物时，我会想起外婆监督我做作业的童年。和我一起回到那个没有手机，没有AI，没有移动互联网的时代。”</p>
      </footer>
    </div>
  );
};

export default App;
