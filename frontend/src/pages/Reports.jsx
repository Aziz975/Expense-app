import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import Layout from '../components/Layout';
import SummaryCard from '../components/SummaryCard';
import { reportAPI } from '../services/api';
import { CATEGORY_COLORS } from '../utils/constants';
import { formatCurrency, getCurrentMonth, downloadBlob } from '../utils/formatters';
import { DollarSign, TrendingDown, PiggyBank } from 'lucide-react';

const Reports = () => {
  const [month, setMonth] = useState(getCurrentMonth());
  const [monthlyData, setMonthlyData] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [monthlyRes, categoryRes] = await Promise.all([
          reportAPI.getMonthly({ month }),
          reportAPI.getCategory({ month }),
        ]);
        setMonthlyData(monthlyRes.data.data);
        setCategoryData(categoryRes.data.data);
      } catch {
        toast.error('Failed to load reports.');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [month]);

  const handleExportPDF = async () => {
    setExporting('pdf');
    try {
      const { data } = await reportAPI.exportPDF({ month });
      downloadBlob(data, `report-${month}.pdf`);
      toast.success('PDF exported successfully.');
    } catch {
      toast.error('Failed to export PDF.');
    } finally {
      setExporting('');
    }
  };

  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      const { data } = await reportAPI.exportExcel({ month });
      downloadBlob(data, `report-${month}.xlsx`);
      toast.success('Excel exported successfully.');
    } catch {
      toast.error('Failed to export Excel.');
    } finally {
      setExporting('');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold">Reports</h1>
          <div className="flex flex-wrap gap-3">
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none" />
            <button onClick={handleExportPDF} disabled={exporting === 'pdf'}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50">
              <FileDown className="w-4 h-4" /> {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
            </button>
            <button onClick={handleExportExcel} disabled={exporting === 'excel'}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
              <FileSpreadsheet className="w-4 h-4" /> {exporting === 'excel' ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading reports...</div>
        ) : (
          <>
            {/* Monthly Report */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Monthly Report - {month}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryCard title="Total Income" value={formatCurrency(monthlyData?.totalIncome)} icon={DollarSign} color="bg-green-500" />
                <SummaryCard title="Total Expense" value={formatCurrency(monthlyData?.totalExpense)} icon={TrendingDown} color="bg-red-500" />
                <SummaryCard title="Savings" value={formatCurrency(monthlyData?.savings)} icon={PiggyBank} color="bg-purple-500" />
              </div>
            </div>

            {/* Category Report */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
                {categoryData?.categories?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={categoryData.categories} dataKey="total" nameKey="category"
                        cx="50%" cy="50%" outerRadius={100}
                        label={({ category, percentage }) => `${category} ${percentage}%`}>
                        {categoryData.categories.map((entry) => (
                          <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || '#6b7280'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-20">No category data</p>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-4">Category Details</h3>
                <div className="space-y-3">
                  {categoryData?.categories?.map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.category] }} />
                        <span className="font-medium">{cat.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{formatCurrency(cat.total)}</span>
                        <span className="text-sm text-gray-500 ml-2">({cat.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                  {categoryData?.categories?.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No expenses this month</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Reports;
