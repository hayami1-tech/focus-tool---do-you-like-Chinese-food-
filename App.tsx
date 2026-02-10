import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TimerMode, FoodItem, TimerStatus, ProjectCategory, FocusRecord } from './types';
import { FOOD_ITEMS, BREAK_ITEMS } from './constants';

import Stove from './components/Stove';
import Pantry from './components/Pantry';
import TimerDisplay from './components/TimerDisplay';
import StatsBoard from './components/StatsBoard';
import DishCollection from './components/DishCollection';

const App: React.FC = () => {
  // --- 状态管理 ---
  const [activeTab, setActiveTab] = useState<'FOCUS' | 'HISTORY'>('FOCUS');
  const [mode, setMode] = useState<TimerMode>(TimerMode.FOCUS);
  const [status, setStatus] = useState<TimerStatus>('IDLE');
  const [selectedFood, setSelectedFood] = useState<FoodItem>(FOOD_ITEMS[0]);
  
  const [categories, setCategories] = useState<ProjectCategory[]>(() => {
    const saved = localStorage.getItem('zao-tai-categories');
    return saved ? JSON.parse(saved) : ['Work', 'Study', 'Health', 'Zen'];
  });
  const [currentCategory, setCurrentCategory] = useState<ProjectCategory>(categories[0]);
  
  const [timeLeft, setTimeLeft] = useState(selectedFood.duration * 60);
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

  // --- 计算逻辑 ---
  
  // 🌟 核心优化：自动计算“今日战绩”，传给 DishCollection
  const dailyHistory = useMemo(() => {
    const today = new Date().toDateString();
    return history.filter(record => new Date(record.timestamp).toDateString() === today);
  }, [history]);

  // 安全获取正向计时的默认食材
  const freeRiceItem = useMemo(() => 
    FOOD_ITEMS.find(f => f.id === 'free-rice') || FOOD_ITEMS[0], 
  []);

  // --- 副作用 (持久化) ---
  useEffect(() => {
    localStorage.setItem('zao-tai-history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('zao-tai-categories', JSON.stringify(categories));
  }, [categories]);

  // --- 控制逻辑 ---
  const startTimer = () => setStatus('RUNNING');
  const pauseTimer = () => setStatus('PAUSED');

  const resetTimer = useCallback((newFood?: FoodItem, targetMode?: TimerMode) => {
    const currentMode = targetMode || mode;
    const food = newFood || selectedFood;
    
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('IDLE');
    
    if (currentMode === TimerMode.COUNT_UP) {
      setTimeLeft(0);
      setSessionDurationMins(0);
    } else {
      setTimeLeft(food.duration * 60);
      setSessionDurationMins(food.duration);
    }
  }, [selectedFood, mode]);

  const toggleMode = (newMode: TimerMode) => {
    setMode(newMode);
    if (newMode === TimerMode.COUNT_UP) {
      resetTimer(freeRiceItem, TimerMode.COUNT_UP);
    } else {
      const newFood = (newMode === TimerMode.SHORT_BREAK || newMode === TimerMode.LONG_BREAK) 
        ? BREAK_ITEMS[0] 
        : FOOD_ITEMS[0];
      setSelectedFood(newFood);
      resetTimer(newFood, newMode);
    }
  };

  const handleFinishCountUp = () => {
    const durationMins = Math.floor(timeLeft / 60);
    if (durationMins > 0) {
      const record: FocusRecord = {
        id: Date.now().toString(),
        category: currentCategory,
        duration: durationMins,
        timestamp: Date.now(),
        foodName: freeRiceItem.name
      };
      setHistory(prev => [record, ...prev]);
      setStatus('FINISHED');
    } else {
      resetTimer();
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleManualTimeChange = (newTotalSeconds: number) => {
    if (status === 'IDLE' && mode !== TimerMode.COUNT_UP) {
      const mins = Math.ceil(newTotalSeconds / 60);
      setTimeLeft(newTotalSeconds);
      setSessionDurationMins(mins);
    }
  };

  // --- 核心计时器逻辑优化 ---
  useEffect(() => {
    if (status === 'RUNNING') {
      timerRef.current = setInterval(() => {
        if (mode === TimerMode.COUNT_UP) {
          setTimeLeft(prev => prev + 1);
        } else {
          setTimeLeft(prev => {
            if (prev <= 1) {
              // 倒计时结束
              if (mode === TimerMode.FOCUS) {
                const record: FocusRecord = {
                  id: Date.now().toString(),
                  category: currentCategory,
                  duration: sessionDurationMins,
                  timestamp: Date.now(),
                  foodName: selectedFood.name
                };
                setHistory(hist => [record, ...hist]);
              }
              setStatus('FINISHED');
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, mode, currentCategory, selectedFood, sessionDurationMins]);

  const handleFoodSelect = (food: FoodItem) => {
    if (mode === TimerMode.COUNT_UP) setMode(TimerMode.FOCUS);
    if (status === 'RUNNING') {
      if (window.confirm('Cooking in progress. Change the pot?')) {
        setSelectedFood(food);
        resetTimer(food, TimerMode.FOCUS);
      }
    } else {
      setSelectedFood(food);
      resetTimer(food, TimerMode.FOCUS);
    }
  };

  // --- 分类管理逻辑 ---
  const addCategory = () => {
    const trimmed = newCatName.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setNewCatName('');
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

  return (
    <div className="min-h-screen bg-[#f3eee3] text-[#4a3728] p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-6xl flex flex-col items-center mb-10 gap-6">
        <h1 className="text-3xl md:text-4xl heytea-font font-bold tracking-[0.2em] text-[#8b4513] text-center uppercase">
          Grandma’s Stove
        </h1>

        <div className="flex flex-col md:flex-row items-center gap-6 w-full justify-between border-t border-[#8b4513]/10 pt-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/40 px-4 py-2 rounded-full border border-[#8b4513]/20 flex items-center shadow-sm">
               <span className="text-[10px] ml-2 font-bold uppercase opacity-50">Event:</span>
               <select 
                 value={currentCategory}
                 onChange={(e) => setCurrentCategory(e.target.value as ProjectCategory)}
                 className="bg-transparent border-none text-xs font-bold text-[#8b4513] focus:ring-0 cursor-pointer p-2"
               >
                 {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
               </select>
            </div>
            <button onClick={() => setShowCatModal(true)} className="w-8 h-8 bg-[#e5dec9] hover:bg-[#dcd1b3] rounded-full">⚙️</button>
          </div>

          <nav className="flex bg-[#e5dec9] p-1 rounded-full shadow-inner">
            <button onClick={() => setActiveTab('FOCUS')} className={`px-8 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'FOCUS' ? 'bg-[#8b4513] text-white shadow-md' : 'text-[#8b4513]/60'}`}>Focus</button>
            <button onClick={() => setActiveTab('HISTORY')} className={`px-8 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'HISTORY' ? 'bg-[#8b4513] text-white shadow-md' : 'text-[#8b4513]/60'}`}>History</button>
          </nav>
        </div>
      </header>

      {activeTab === 'FOCUS' ? (
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-500">
          {/* 左侧：灶台 */}
          <div className="lg:col-span-7 flex flex-col items-center relative">
            <Stove 
              isCooking={status === 'RUNNING'} 
              food={mode === TimerMode.COUNT_UP ? freeRiceItem : selectedFood} 
              status={status} 
            />
            <div className="mt-8 w-full">
              <TimerDisplay 
                timeLeft={timeLeft} status={status} 
                onStart={startTimer} onPause={pauseTimer} onReset={() => resetTimer()} 
                onFinishCountUp={handleFinishCountUp}
                onTimeChange={handleManualTimeChange}
                mode={mode} onModeChange={toggleMode}
              />
            </div>
          </div>

          {/* 右侧：食材库 & 今日菜碟 */}
          <div className="lg:col-span-5 flex flex-col gap-4 h-full lg:mt-24">
            <Pantry 
              items={(mode === TimerMode.SHORT_BREAK || mode === TimerMode.LONG_BREAK) ? BREAK_ITEMS : FOOD_ITEMS.filter(f => f.id !== 'free-rice')} 
              selectedId={selectedFood.id} onSelect={handleFoodSelect} 
              title={(mode === TimerMode.SHORT_BREAK || mode === TimerMode.LONG_BREAK) ? "Snacks" : "Ingredients"}
              mode={mode} onModeToggle={toggleMode}
            />
            
            {/* ✅ 这里传递过滤后的 dailyHistory */}
            <DishCollection history={dailyHistory} />
          </div>
        </div>
      ) : (
        <StatsBoard history={history} categories={categories} onUpdateHistory={setHistory} />
      )}

      {/* 所有的弹窗组件 (Modals) 保持原样即可 */}
      {/* ... (此处省略 CatModal 和 MergeModal 代码，逻辑与你之前一致) ... */}
    </div>
  );
};

export default App;
