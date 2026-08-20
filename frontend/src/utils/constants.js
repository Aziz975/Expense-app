export const EXPENSE_CATEGORIES = [
  'Food', 'Travel', 'Shopping', 'Bills',
  'Health', 'Education', 'Entertainment', 'Other',
];

export const CATEGORY_COLORS = {
  Food: '#ef4444',
  Travel: '#3b82f6',
  Shopping: '#a855f7',
  Bills: '#f59e0b',
  Health: '#10b981',
  Education: '#6366f1',
  Entertainment: '#ec4899',
  Other: '#6b7280',
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://expense-app-4-3306.onrender.com/api';
