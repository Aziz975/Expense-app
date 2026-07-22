import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, PiggyBank, AlertTriangle, FileText, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SummaryCard from '../components/SummaryCard';
import AIInsightsCard from '../components/AIInsightsCard';
import BudgetSuggestionsCard from '../components/BudgetSuggestionsCard';
import AIReportModal from '../components/AIReportModal';
import { reportAPI, aiAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CATEGORY_COLORS } from '../utils/constants';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const [insightsSource, setInsightsSource] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [budgetAI, setBudgetAI] = useState(null);
  const [budgetAILoading, setBudgetAILoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: res } = await reportAPI.getDashboard();
        setData(res.data);
        res.data.warnings?.forEach((w) => toast.warning(w.message));
      } catch {
        toast.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    const fetchAI = async () => {
      try {
        const [insightsRes, budgetRes, analysisRes] = await Promise.all([
          aiAPI.insights(),
          aiAPI.budgetSuggestions(),
          aiAPI.analyze(),
        ]);
        setInsights(insightsRes.data.data.insights || []);
        setInsightsSource(insightsRes.data.data.source);
        setBudgetAI(budgetRes.data.data);
        setAnalysis(analysisRes.data.data);
      } catch {
        // Non-blocking — dashboard still works without AI panels
      } finally {
        setInsightsLoading(false);
        setBudgetAILoading(false);
        setAnalysisLoading(false);
      }
    };

    fetchDashboard();
    fetchAI();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </Layout>
    );
  }

  const { summary, incomeVsExpense, categoryBreakdown, monthlyTrend, recentTransactions, warnings } = data;

  const barData = [
    { name: 'Income', amount: incomeVsExpense.income },
    { name: 'Expense', amount: incomeVsExpense.expense },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setReportOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
            >
              <FileText className="w-4 h-4" />
              Generate AI Report
            </button>
            <Link
              to="/ai-assistant"
              className="flex items-center gap-2 px-4 py-2 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              AI Assistant
            </Link>
          </div>
        </div>

        {/* AI Smart Insights */}
        <AIInsightsCard insights={insights} loading={insightsLoading} source={insightsSource} />

        {/* AI Spending Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-semibold mb-2">AI Spending Analysis</h3>
          {analysisLoading ? (
            <div className="flex items-center gap-2 text-indigo-600 py-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
              <span className="text-sm">Analyzing this month&apos;s spending...</span>
            </div>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {analysis?.summary || 'No analysis available yet.'}
            </p>
          )}
        </div>

        {/* Budget Warnings */}
        {warnings?.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium mb-2">
              <AlertTriangle className="w-5 h-5" />
              Budget Alerts
            </div>
            {warnings.map((w, i) => (
              <p key={i} className="text-sm text-amber-600 dark:text-amber-300">{w.message}</p>
            ))}
          </div>
        )}

        {/* AI Budget Suggestions */}
        <BudgetSuggestionsCard data={budgetAI} loading={budgetAILoading} />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Total Income" value={formatCurrency(summary.totalIncome)} icon={TrendingUp} color="bg-green-500" />
          <SummaryCard title="Total Expense" value={formatCurrency(summary.totalExpense)} icon={TrendingDown} color="bg-red-500" />
          <SummaryCard title="Current Balance" value={formatCurrency(summary.balance)} icon={DollarSign} color="bg-blue-500" />
          <SummaryCard title="Monthly Savings" value={formatCurrency(summary.monthlySavings)} icon={PiggyBank} color="bg-purple-500" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Income vs Expense</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Expense by Category</h3>
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryBreakdown.map((entry) => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-20">No expense data for this month</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Expense Trend</h3>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-20">No trend data available</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Description</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Category</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Type</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={`${tx.type}-${tx.id}`} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="py-3 px-2">{formatDate(tx.date)}</td>
                    <td className="py-3 px-2">{tx.description || '-'}</td>
                    <td className="py-3 px-2">{tx.category}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        tx.type === 'income'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`py-3 px-2 text-right font-medium ${
                      tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
                {recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">No transactions yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AIReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
    </Layout>
  );
};

export default Dashboard;
