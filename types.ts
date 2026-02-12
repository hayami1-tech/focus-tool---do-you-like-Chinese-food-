
export enum TimerMode {
  FOCUS = 'FOCUS',
  SHORT_BREAK = 'SHORT_BREAK',
  LONG_BREAK = 'LONG_BREAK',
  COUNT_UP = 'COUNT_UP'
}

// Changed to string for dynamic user management
export type ProjectCategory = string;

export interface FoodItem {
  id: string;
  name: string;
  iconName: string;
  duration: number; // in minutes
  color: string;
  category?: ProjectCategory;
}

export interface FocusRecord {
  id: string;
  category: ProjectCategory;
  duration: number;
  timestamp: number;
  foodName: string;
}

export type TimerStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'FINISHED';
