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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- 关键函数：重置计时器 ---
  const resetTimer = useCallback((newFood?: FoodItem, targetMode?: TimerMode) => {
    const currentMode = targetMode !== undefined ? targetMode : mode;
    const food = newFood || selectedFood;
    
    setStatus('IDLE');
    if (timerRef.current) clearInterval(timerRef.current);

    if (currentMode === TimerMode.COUNT_UP) {
      setTimeLeft(0); // 彻底修复：正计时强制归零
      setSessionDurationMins(0);
    } else {
      setTimeLeft(food.duration * 60);
      setSessionDurationMins(food.duration);
    }
  }, [selectedFood, mode]);

  // --- 关键函数：切换模式 ---
  const toggleMode = (newMode: TimerMode) => {
    setMode(newMode);
    // 切换模式时，必须传入 newMode 强制重置
    resetTimer(selectedFood, newMode); 
  };

  const startTimer = () => setStatus('RUNNING');
  const pauseTimer = () => setStatus('PAUSED');

  const handleFinishCountUp = () => {
    const durationMins = Math.floor(timeLeft / 60);
    if (durationMins >= 1) { 
      const record: FocusRecord = {
        id: Date.now().toString(),
        category: currentCategory,
        duration: durationMins,
        timestamp: Date.now() - (timeLeft * 1000),
        foodName: 'Free Steaming' 
      };
      setHistory(prev => [record, ...prev]);
      resetTimer(); 
      alert(`Cooking done! You focused for ${durationMins} minutes.`);
    } else {
      alert("Too short to cook anything! Keep going.");
      // 不做重置，让用户可以继续
    }
  };

  const handleManualTimeChange = (newTotalSeconds: number) => {
    if (status === 'IDLE' && mode !== TimerMode.COUNT_UP) {
      setTimeLeft(newTotalSeconds);
      setSessionDurationMins(Math.ceil(newTotalSeconds / 60));
    }
  };

  // --- 核心计时逻辑 ---
  useEffect(() => {
    if (status === 'RUNNING') {
      timerRef.current = setInterval(() => {
        if (mode === TimerMode.COUNT_UP) {
          setTimeLeft((prev) => prev + 1); // 正计时递增
        } else {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              // 倒计时结束逻辑...
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

  // 其余代码保持不变 (handleFoodSelect, addCategory 等)...
  const handleFoodSelect = (food: FoodItem) => {
    if (mode === TimerMode.COUNT_UP) setMode(TimerMode.FOCUS);
    setSelectedFood(food);
    resetTimer(food, TimerMode.FOCUS);
  };

  return (
    <div className="min-h-screen bg-[#f3eee3] text-[#4a3728] p-4 md:p-8 flex flex-col items-center">
      {/* Header 部分保持不变... */}
      <header className="w-full max-w-6xl flex flex-col items-center mb-10 gap-6">
        <h1 className="text-3xl md:text-4xl heytea-font font-bold tracking-[0.2em] text-[#8b4513] text-center uppercase">Grandma’s Stove</h1>
        <nav className="flex bg-[#e5dec9] p-1 rounded-full shadow-inner">
           <button onClick={() => setActiveTab('FOCUS')} className={`px-8 py-2.5 rounded-full text-sm font-bold heytea-font transition-all ${activeTab === 'FOCUS' ? 'bg-[#8b4513] text-white shadow-md' : 'text-[#8b4513]/60 hover:text-[#8b4513]'}`}>Focus</button>
           <button onClick={() => setActiveTab('HISTORY')} className={`px-8 py-2.5 rounded-full text-sm font-bold heytea-font transition-all ${activeTab === 'HISTORY' ? 'bg-[#8b4513] text-white shadow-md' : 'text-[#8b4513]/60 hover:text-[#8b4513]'}`}>History</button>
        </nav>
      </header>

      {activeTab === 'FOCUS' ? (
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 flex flex-col items-center">
            <Stove isCooking={status === 'RUNNING'} food={selectedFood} status={status} />
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
          <div className="lg:col-span-5">
            <Pantry items={FOOD_ITEMS} selectedId={selectedFood.id} onSelect={handleFoodSelect} mode={mode} onModeToggle={toggleMode} />
            <DishCollection history={history} />
          </div>
        </div>
      ) : (
        <StatsBoard history={history} categories={categories} onUpdateHistory={setHistory} />
      )}
    </div>
  );
};

export default App;
