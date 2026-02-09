
import { FoodItem } from './types';

export const FOOD_ITEMS: FoodItem[] = [
  { id: 'lurou', name: '古法卤肉饭 Braised Pork Rice', iconName: 'lurou', duration: 25, color: '#f8fafc' },
  { id: 'rice', name: '竹筒糯米饭 Bamboo Sticky Rice', iconName: 'rice', duration: 15, color: '#fef3c7' },
  { id: 'stew', name: '浓汤腌笃鲜 Bamboo Shoot & Pork Soup', iconName: 'stew', duration: 45, color: '#7c2d12' },
  { id: 'cake', name: '腊肉炒年糕 Stir-fried Rice Cake', iconName: 'cake', duration: 20, color: '#fde047' },
  { id: 'fish', name: '豆腐鱼头汤 Fish Head Tofu Soup', iconName: 'fish', duration: 10, color: '#166534' },
  { id: 'noodle', name: '番茄鸡蛋面 Tomato Egg Noodles', iconName: 'noodle', duration: 25, color: '#f5f5f5' },
];

export const BREAK_ITEMS: FoodItem[] = [
  { id: 'break-tea', name: '珍珠奶茶 Pearl Milk Tea', iconName: 'milktea', duration: 5, color: '#166534' },
  { id: 'break-apple', name: '脆红富士 Fuji Apple', iconName: 'apple', duration: 15, color: '#dc2626' },
];
