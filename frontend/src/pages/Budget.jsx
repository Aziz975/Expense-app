import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { budgetAPI } from '../services/api';
import { EXPENSE_CATEGORIES } from '../utils/constants';
import { formatCurrency, getCurrentMonth } from '../utils/formatters';

const emptyForm = { category: 'Food', budget_amount: '', month: getCurrentMonth() };

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterMonth, setFilterMonth] = useState(getCurrentMonth());

  const fetchBudgets = useCallback(async () => {
    try {
      const { data } = await budgetAPI.getAll({ month: filterMonth });
      setBudgets(data.data);
      data.data.filter((b) => b.warning).forEach((b) => {
        toast.warning(`Warning: Budget Limit Reached for ${b.category} (${b.percentage}%)`);
      });
    } catch {
      toast.error('Failed to load budgets.');
    } finally {
      setLoading(false);
    }
  }, [filterMonth]);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setForm({ category: item.category, budget_amount: item.budget_amount, month: item.month });
    } else {
      setEditingId(null);
      setForm({ ...emptyForm, month: filterMonth });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await budgetAPI.update(editingId, form);
        toast.success('Budget updated successfully.');
      } else {
        await budgetAPI.create(form);
        toast.success('Budget created successfully.');
      }
      setModalOpen(false);
      fetchBudgets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await budgetAPI.delete(id);
      toast.success('Budget deleted.');
      fetchBudgets();
    } catch {
      toast.error('Failed to delete budget.');
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold">Budget Management</h1>
          <div className="flex gap-3">
            <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none" />
            <button onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
              <Plus className="w-4 h-4" /> Add Budget
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No budgets set for this month</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((budget) => (
              <div key={budget.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6 ${
                  budget.warning ? 'border-amber-300 dark:border-amber-700' : 'border-gray-200 dark:border-gray-700'
                }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{budget.category}</h3>
                    {budget.warning && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openModal(budget)} className="p-1.5 text-gray-500 hover:text-indigo-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(budget.id)} className="p-1.5 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="flex justify-between text-sm mb-2">
                  <span>Spent: {formatCurrency(budget.spent)}</span>
                  <span>Budget: {formatCurrency(budget.budget_amount)}</span>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                  <div
                    className={`h-3 rounded-full transition-all ${getProgressColor(budget.percentage)}`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-gray-500">
                  <span>{budget.percentage}% used</span>
                  <span>Remaining: {formatCurrency(budget.remaining)}</span>
                </div>

                {budget.warning && (
                  <p className="mt-3 text-sm text-amber-600 dark:text-amber-400 font-medium">
                    Warning: Budget Limit Reached
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Budget' : 'Create Budget'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none">
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Budget Amount</label>
            <input type="number" step="0.01" required value={form.budget_amount}
              onChange={(e) => setForm({ ...form, budget_amount: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Month</label>
            <input type="month" required value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none" />
          </div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">
            {editingId ? 'Update' : 'Create'} Budget
          </button>
        </form>
      </Modal>
    </Layout>
  );
};

export default Budget;
