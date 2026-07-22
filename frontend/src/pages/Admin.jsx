import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Users, DollarSign, TrendingDown, Trash2, Eye } from 'lucide-react';
import Layout from '../components/Layout';
import SummaryCard from '../components/SummaryCard';
import Modal from '../components/Modal';
import { adminAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewUser, setViewUser] = useState(null);
  const [userExpenses, setUserExpenses] = useState(null);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data);
    } catch {
      toast.error('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This will remove all their data.`)) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success('User deleted successfully.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleViewExpenses = async (user) => {
    try {
      const { data } = await adminAPI.getUserExpenses(user.id);
      setViewUser(user);
      setUserExpenses(data.data);
    } catch {
      toast.error('Failed to load user expenses.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard title="Total Users" value={stats?.totalUsers} icon={Users} color="bg-indigo-500" />
          <SummaryCard title="Total Income" value={formatCurrency(stats?.totalIncome)} icon={DollarSign} color="bg-green-500" />
          <SummaryCard title="Total Expenses" value={formatCurrency(stats?.totalExpense)} icon={TrendingDown} color="bg-red-500" />
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold">All Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Joined</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-100 dark:border-gray-700/50">
                    <td className="py-3 px-4 font-medium">{u.name}</td>
                    <td className="py-3 px-4">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>{u.role}</span>
                    </td>
                    <td className="py-3 px-4">{formatDate(u.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleViewExpenses(u)} className="p-1.5 text-gray-500 hover:text-indigo-600" title="View Expenses">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteUser(u.id, u.name)} className="p-1.5 text-gray-500 hover:text-red-600" title="Delete User">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View User Expenses Modal */}
      <Modal isOpen={!!viewUser} onClose={() => { setViewUser(null); setUserExpenses(null); }}
        title={`${viewUser?.name}'s Transactions`}>
        {userExpenses && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <h4 className="font-medium mb-2 text-green-600">Income ({userExpenses.income?.length || 0})</h4>
              {userExpenses.income?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-700">
                  <span>{formatDate(item.date)} - {item.source}</span>
                  <span className="text-green-600">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-medium mb-2 text-red-600">Expenses ({userExpenses.expenses?.length || 0})</h4>
              {userExpenses.expenses?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-700">
                  <span>{formatDate(item.date)} - {item.category}</span>
                  <span className="text-red-600">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default Admin;
