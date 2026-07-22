import { useState } from 'react';
import { toast } from 'react-toastify';
import { FileText, Download, Loader2, HeartPulse } from 'lucide-react';
import Modal from './Modal';
import { aiAPI } from '../services/api';
import { formatCurrency, downloadBlob, getCurrentMonth } from '../utils/formatters';

const AIReportModal = ({ isOpen, onClose }) => {
  const [month, setMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [report, setReport] = useState(null);
  const [source, setSource] = useState(null);

  const generate = async () => {
    setLoading(true);
    setReport(null);
    try {
      const { data } = await aiAPI.report({ month });
      setReport(data.data.report);
      setSource(data.data.source);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate AI report.');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const { data } = await aiAPI.exportReportPDF({ month });
      downloadBlob(data, `ai-report-${month}.pdf`);
      toast.success('AI report PDF downloaded.');
    } catch {
      toast.error('Failed to export PDF.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Monthly Report" size="lg">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 outline-none"
          />
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Generate
          </button>
        </div>

        {report && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-500" />
                <span className="font-semibold">Health Score: {report.financialHealthScore}/100</span>
              </div>
              {source && (
                <span className="text-xs text-gray-500">{source === 'ai' ? 'AI Generated' : 'Smart Analysis'}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500">Total Income</p>
                <p className="font-semibold text-green-600">{formatCurrency(report.totalIncome)}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500">Total Expenses</p>
                <p className="font-semibold text-red-600">{formatCurrency(report.totalExpenses)}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500">Highest Category</p>
                <p className="font-semibold">{report.highestSpendingCategory}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500">Lowest Category</p>
                <p className="font-semibold">{report.lowestSpendingCategory}</p>
              </div>
            </div>

            <div>
              <p className="font-medium mb-1">Budget Status</p>
              <p className="text-gray-600 dark:text-gray-300">{report.budgetStatus}</p>
            </div>
            <div>
              <p className="font-medium mb-1">Monthly Comparison</p>
              <p className="text-gray-600 dark:text-gray-300">{report.monthlyComparison}</p>
            </div>
            <div>
              <p className="font-medium mb-1">Summary</p>
              <p className="text-gray-600 dark:text-gray-300">{report.summary}</p>
            </div>

            {report.savingsTips?.length > 0 && (
              <div>
                <p className="font-medium mb-1">Savings Tips</p>
                <ul className="space-y-1">
                  {report.savingsTips.map((tip, i) => (
                    <li key={i} className="text-gray-600 dark:text-gray-300">• {tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={exportPDF}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg font-medium disabled:opacity-60"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export as PDF
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AIReportModal;
