import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, Search, Sparkles, ScanLine, Loader2 } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import SmartSearchBar from '../components/SmartSearchBar';
import ReceiptScanner from '../components/ReceiptScanner';
import { expenseAPI, aiAPI } from '../services/api';
import { EXPENSE_CATEGORIES } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/formatters';

const emptyForm = {
  amount: '',
  category: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  autoCategory: true,
};

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [smartMode, setSmartMode] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [aiHint, setAiHint] = useState(null);

  const loadExpenses = useCallback(async () => {
    try {
      const params = { sortBy, sortOrder };
      if (search) params.search = search;
      if (category) params.category = category;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { data } = await expenseAPI.getAll(params);
      setExpenses(data.data);
    } catch {
      toast.error('Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }, [search, category, startDate, endDate, sortBy, sortOrder]);

  useEffect(() => {
    if (!smartMode) loadExpenses();
  }, [loadExpenses, smartMode]);

  const handleSmartResults = (results, active) => {
    if (active && results) {
      setSmartMode(true);
      setExpenses(results);
      setLoading(false);
    } else {
      setSmartMode(false);
      loadExpenses();
    }
  };

  const openModal = (item = null) => {
    setAiHint(null);
    if (item) {
      setEditingId(item.id);
      setForm({
        amount: item.amount,
        category: item.category,
        description: item.description || '',
        date: item.date?.slice(0, 10),
        autoCategory: false,
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setModalOpen(true);
  };

  const handleAutoCategorize = async () => {
    if (!form.description?.trim()) {
      toast.info('Enter a description first.');
      return;
    }
    setCategorizing(true);
    try {
      const { data } = await aiAPI.categorize(form.description);
      setForm((prev) => ({
        ...prev,
        category: data.data.category,
        autoCategory: false,
      }));
      setAiHint(`Suggested: ${data.data.category} (${data.data.source === 'ai' ? 'AI' : 'rules'}, ${Math.round((data.data.confidence || 0) * 100)}%)`);
      toast.success(`Category set to ${data.data.category}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Auto-categorize failed.');
    } finally {
      setCategorizing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        amount: form.amount,
        description: form.description,
        date: form.date,
      };

      // Omit category when auto-mode is on so backend AI categorizes
      if (!form.autoCategory && form.category) {
        payload.category = form.category;
      } else if (editingId && form.category) {
        payload.category = form.category;
      }

      if (editingId) {
        if (!payload.category) payload.category = form.category || 'Other';
        await expenseAPI.update(editingId, payload);
        toast.success('Expense updated successfully.');
      } else {
        const { data } = await expenseAPI.create(payload);
        const aiCat = data.aiCategorization;
        toast.success(
          aiCat
            ? `Expense added and categorized as ${aiCat.category}.`
            : 'Expense added successfully.'
        );
      }
      setModalOpen(false);
      setSmartMode(false);
      loadExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expenseAPI.delete(id);
      toast.success('Expense deleted.');
      setSmartMode(false);
      loadExpenses();
    } catch {
      toast.error('Failed to delete expense.');
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold">Expense Management</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setReceiptOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
            >
              <ScanLine className="w-4 h-4" /> Scan Receipt
            </button>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              <Plus className="w-4 h-4" /> Add Expense
            </button>
          </div>
        </div>

        {/* AI Smart Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-indigo-100 dark:border-indigo-900/40 p-4">
          <SmartSearchBar onResults={handleSmartResults} />
        </div>

        {/* Classic Filters */}
        {!smartMode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none"
            >
              <option value="">All Categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none"
            />
          </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 cursor-pointer" onClick={() => toggleSort('date')}>
                    Date {sortBy === 'date' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Description</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 cursor-pointer" onClick={() => toggleSort('amount')}>
                    Amount {sortBy === 'amount' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td></tr>
                ) : expenses.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500">No expenses found</td></tr>
                ) : expenses.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100 dark:border-gray-700/50">
                    <td className="py-3 px-4">{formatDate(item.date)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700">{item.category}</span>
                    </td>
                    <td className="py-3 px-4">{item.description || '-'}</td>
                    <td className="py-3 px-4 text-right font-medium text-red-600">{formatCurrency(item.amount)}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => openModal(item)} className="p-1.5 text-gray-500 hover:text-indigo-600"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Dominos Pizza, Uber Ride, Amazon Order"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none"
              rows={2}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">Category</label>
              {!editingId && (
                <button
                  type="button"
                  onClick={handleAutoCategorize}
                  disabled={categorizing}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 disabled:opacity-60"
                >
                  {categorizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  AI Suggest
                </button>
              )}
            </div>

            {!editingId && (
              <label className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={form.autoCategory}
                  onChange={(e) => setForm({ ...form, autoCategory: e.target.checked })}
                />
                Auto-categorize with AI if no category selected
              </label>
            )}

            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value, autoCategory: false })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none"
            >
              <option value="">{form.autoCategory ? 'Auto (AI)' : 'Select category'}</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {aiHint && <p className="text-xs text-indigo-600 mt-1">{aiHint}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none"
            />
          </div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">
            {editingId ? 'Update' : 'Add'} Expense
          </button>
        </form>
      </Modal>

      <ReceiptScanner
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        onCreated={() => {
          setSmartMode(false);
          loadExpenses();
        }}
      />
    </Layout>
  );
};

export default Expenses;
