
import { FoodItem } from './types';

export const FOOD_ITEMS: FoodItem[] = [
  { id: 'lurou', name: 'Braised Pork Rice', iconName: 'lurou', duration: 25, color: '#f8fafc' },
  { id: 'rice', name: 'Bamboo Sticky Rice', iconName: 'rice', duration: 15, color: '#fef3c7' },
  { id: 'stew', name: 'Bamboo Shoot & Pork Soup', iconName: 'stew', duration: 45, color: '#7c2d12' },
  { id: 'cake', name: 'Stir-fried Rice Cake', iconName: 'cake', duration: 20, color: '#fde047' },
  { id: 'fish', name: 'Fish Head Tofu Soup', iconName: 'fish', duration: 10, color: '#166534' },
  { id: 'noodle', name: 'Tomato Egg Noodles', iconName: 'noodle', duration: 25, color: '#f5f5f5' },
  { id: 'free-rice', name: 'Countryside Steamed Rice', iconName: 'steamed-rice', duration: 0, color: '#ffffff' },
];

export const BREAK_ITEMS: FoodItem[] = [
  { id: 'break-tea', name: 'Pearl Milk Tea', iconName: 'milktea', duration: 5, color: '#166534' },
  { id: 'break-apple', name: 'Fuji Apple', iconName: 'apple', duration: 15, color: '#dc2626' },
];
