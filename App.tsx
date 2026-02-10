import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TimerMode, FoodItem, TimerStatus, ProjectCategory, FocusRecord } from './types';
import { FOOD_ITEMS, BREAK_ITEMS } from './constants';
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

  useEffect(() => {
    localStorage.setItem('zao-tai-history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('zao-tai-categories', JSON.stringify(categories));
  }, [categories]);

  const startTimer = () => setStatus('RUNNING');
  const pauseTimer = () => setStatus('PAUSED');

  const resetTimer = useCallback((newFood?: FoodItem, targetMode?: TimerMode) => {
    const currentMode = targetMode || mode;
    const food = newFood || selectedFood;
    setStatus('IDLE');
    
    if (currentMode === TimerMode.COUNT_UP) {
      setTimeLeft(0);
      setSessionDurationMins(0);
    } else {
      setTimeLeft(food.duration * 60);
      setSessionDurationMins(food.duration);
    }
    
    if (timerRef.current) clearInterval(timerRef.current);
  }, [selectedFood, mode]);

  const toggleMode = (newMode: TimerMode) => {
    setMode(newMode);
    if (newMode === TimerMode.COUNT_UP) {
      resetTimer(selectedFood, TimerMode.COUNT_UP);
    } else {
      const isBreak = newMode === TimerMode.SHORT_BREAK || newMode === TimerMode.LONG_BREAK;
      const newFood = isBreak ? BREAK_ITEMS[0] : FOOD_ITEMS[0];
      setSelectedFood(newFood);
      resetTimer(newFood, newMode);
    }
  };

  const handleFinishCountUp = () => {
    const durationMins = Math.floor(timeLeft / 60);
    // 核心逻辑：小于 1 分钟就不算了
    if (durationMins >= 1) { 
      const record: FocusRecord = {
        id: Date.now().toString(),
        category: currentCategory,
        duration: durationMins,
        timestamp: Date.now() - (timeLeft * 1000),
        foodName: 'Countryside Steamed Rice' 
      };
      setHistory(prev => [record, ...prev]);
      setStatus('IDLE');
      setTimeLeft(0);
      alert("Rice steamed successfully! Record saved.");
    } else {
      alert("Focus time is too short to steam a bowl of rice. Keep going!");
      resetTimer();
    }
  };

  const handleManualTimeChange = (newTotalSeconds: number) => {
    if (status === 'IDLE' && mode !== TimerMode.COUNT_UP) {
      const mins = Math.ceil(newTotalSeconds / 60);
      setTimeLeft(newTotalSeconds);
      setSessionDurationMins(mins);
    }
  };

  const updateHistory = (newHistory: FocusRecord[]) => setHistory(newHistory);

  useEffect(() => {
    if (status === 'RUNNING') {
      timerRef.current = setInterval(() => {
        if (mode === TimerMode.COUNT_UP) {
          setTimeLeft((prev) => prev + 1);
        } else {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              const record: FocusRecord = {
                id: Date.now().toString(),
                category: currentCategory,
                duration: sessionDurationMins,
                timestamp: Date.now() - (sessionDurationMins * 60000),
                foodName: selectedFood.name
              };
              setHistory(prevHist => [record, ...prevHist]);
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
      if (confirm('Cooking in progress. Are you sure?')) {
        setSelectedFood(food);
        resetTimer(food, TimerMode.FOCUS);
      }
    } else {
      setSelectedFood(food);
      resetTimer(food, TimerMode.FOCUS);
    }
  };

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
    if (currentCategory === cat) setCurrentCategory(updated[0]);
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
            <div className="flex items-center gap-3 bg-white/40 px-4 py-2 rounded-full border border-[#8b4513]/20 shadow-sm">
               <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Event:</span>
               <select 
                 value={currentCategory}
                 onChange={(e) => setCurrentCategory(e.target.value)}
                 className="bg-transparent border-none text-xs font-bold heytea-font text-[#8b4513] focus:ring-0 cursor-pointer p-0 pr-6"
               >
                 {categories.map(cat => (
                   <option key={cat} value={cat}>{cat}</option>
                 ))}
               </select>
            </div>
            <button onClick={() => setShowCatModal(true)} className="w-8 h-8 flex items-center justify-center bg-[#e5dec9] hover:bg-[#dcd1b3] rounded-full text-[#8b4513] transition-colors">⚙️</button>
          </div>

          <nav className="flex bg-[#e5dec9] p-1 rounded-full shadow-inner">
            <button onClick={() => setActiveTab('FOCUS')} className={`px-8 py-2.5 rounded-full text-sm font-bold heytea-font transition-all ${activeTab === 'FOCUS' ? 'bg-[#8b4513] text-white shadow-md' : 'text-[#8b4513]/60 hover:text-[#8b4513]'}`}>Focus</button>
            <button onClick={() => setActiveTab('HISTORY')} className={`px-8 py-2.5 rounded-full text-sm font-bold heytea-font transition-all ${activeTab === 'HISTORY' ? 'bg-[#8b4513] text-white shadow-md' : 'text-[#8b4513]/60 hover:text-[#8b4513]'}`}>History</button>
          </nav>
        </div>
      </header>

      {activeTab === 'FOCUS' ? (
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-7 flex flex-col items-center relative">
            <Stove 
              isCooking={status === 'RUNNING'} 
              food={mode === TimerMode.COUNT_UP ? (FOOD_ITEMS.find(f => f.id === 'free-rice') || FOOD_ITEMS[0]) : selectedFood} 
              status={status} 
            />
            <div className="mt-8 w-full">
              <TimerDisplay 
                timeLeft={timeLeft} 
                status={status} 
                onStart={startTimer} 
                onPause={pauseTimer} 
                onReset={() => resetTimer()} 
                onFinishCountUp={handleFinishCountUp}
                onTimeChange={handleManualTimeChange}
                mode={mode} 
                onModeChange={toggleMode}
              />
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-0 h-full lg:mt-24">
            <Pantry 
              items={mode === TimerMode.SHORT_BREAK || mode === TimerMode.LONG_BREAK ? BREAK_ITEMS : FOOD_ITEMS.filter(f => f.id !== 'free-rice')} 
              selectedId={selectedFood.id} 
              onSelect={handleFoodSelect} 
              title={mode === TimerMode.SHORT_BREAK || mode === TimerMode.LONG_BREAK ? "Snacks" : "Ingredients"}
              mode={mode}
              onModeToggle={toggleMode}
            />
            <DishCollection history={history} />
          </div>
        </div>
      ) : (
        <StatsBoard history={history} categories={categories} onUpdateHistory={updateHistory} />
      )}
      {/* 弹窗代码省略以保持简洁... */}
    </div>
  );
};

export default App;
