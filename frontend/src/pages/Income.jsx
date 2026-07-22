import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { incomeAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

const emptyForm = { amount: '', source: '', description: '', date: new Date().toISOString().slice(0, 10) };

const Income = () => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchIncome = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { data } = await incomeAPI.getAll(params);
      setIncomes(data.data);
    } catch {
      toast.error('Failed to load income records.');
    } finally {
      setLoading(false);
    }
  }, [search, startDate, endDate]);

  useEffect(() => { fetchIncome(); }, [fetchIncome]);

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        amount: item.amount,
        source: item.source,
        description: item.description || '',
        date: item.date?.slice(0, 10),
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await incomeAPI.update(editingId, form);
        toast.success('Income updated successfully.');
      } else {
        await incomeAPI.create(form);
        toast.success('Income added successfully.');
      }
      setModalOpen(false);
      fetchIncome();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this income record?')) return;
    try {
      await incomeAPI.delete(id);
      toast.success('Income deleted.');
      fetchIncome();
    } catch {
      toast.error('Failed to delete income.');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold">Income Management</h1>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Income
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by description, source, amount..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none" />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Source</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Description</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td></tr>
                ) : incomes.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500">No income records found</td></tr>
                ) : incomes.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100 dark:border-gray-700/50">
                    <td className="py-3 px-4">{formatDate(item.date)}</td>
                    <td className="py-3 px-4">{item.source}</td>
                    <td className="py-3 px-4">{item.description || '-'}</td>
                    <td className="py-3 px-4 text-right font-medium text-green-600">{formatCurrency(item.amount)}</td>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Income' : 'Add Income'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input type="number" step="0.01" required value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Source</label>
            <input type="text" required value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-indigo-500" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input type="date" required value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">
            {editingId ? 'Update' : 'Add'} Income
          </button>
        </form>
      </Modal>
    </Layout>
  );
};

export default Income;
