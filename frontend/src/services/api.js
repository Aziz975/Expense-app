import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Income API
export const incomeAPI = {
  getAll: (params) => api.get('/income', { params }),
  create: (data) => api.post('/income', data),
  update: (id, data) => api.put(`/income/${id}`, data),
  delete: (id) => api.delete(`/income/${id}`),
};

// Expense API
export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// Budget API
export const budgetAPI = {
  getAll: (params) => api.get('/budget', { params }),
  create: (data) => api.post('/budget', data),
  update: (id, data) => api.put(`/budget/${id}`, data),
  delete: (id) => api.delete(`/budget/${id}`),
};

// Reports API
export const reportAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getMonthly: (params) => api.get('/reports/monthly', { params }),
  getCategory: (params) => api.get('/reports/category', { params }),
  exportPDF: (params) => api.get('/reports/export/pdf', { params, responseType: 'blob' }),
  exportExcel: (params) => api.get('/reports/export/excel', { params, responseType: 'blob' }),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getUserExpenses: (id) => api.get(`/admin/users/${id}/expenses`),
};

// AI API
export const aiAPI = {
  categorize: (description) => api.post('/ai/categorize', { description }),
  analyze: (params) => api.get('/ai/analyze', { params }),
  budgetSuggestions: (params) => api.get('/ai/budget-suggestions', { params }),
  insights: (params) => api.get('/ai/insights', { params }),
  report: (params) => api.get('/ai/report', { params }),
  exportReportPDF: (params) => api.get('/ai/report/pdf', { params, responseType: 'blob' }),
  chat: (data) => api.post('/ai/chat', data),
  smartSearch: (query) => api.post('/ai/smart-search', { query }),
  scanReceipt: (data) => api.post('/ai/scan-receipt', data),
  confirmReceipt: (data) => api.post('/ai/scan-receipt/confirm', data),
};

export default api;
