import { Lightbulb, Loader2, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

const riskStyles = {
  high: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
  medium: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20',
  low: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20',
};

const riskIcons = {
  high: AlertTriangle,
  medium: AlertCircle,
  low: CheckCircle,
};

const BudgetSuggestionsCard = ({ data, loading }) => {
  const risk = data?.riskLevel || 'low';
  const Icon = riskIcons[risk] || CheckCircle;

  return (
    <div className={`rounded-xl border p-5 ${riskStyles[risk] || riskStyles.low}`}>
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <h3 className="text-lg font-semibold">AI Budget Suggestions</h3>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-gray-600 dark:text-gray-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Analyzing your budget...</span>
        </div>
      ) : !data ? (
        <p className="text-sm text-gray-500">Set a monthly budget to get personalized suggestions.</p>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            <Icon className="w-4 h-4" />
            <p className="text-sm font-medium">{data.summary}</p>
          </div>
          <ul className="space-y-2">
            {(data.suggestions || []).map((s, i) => (
              <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                <span className="opacity-60">→</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default BudgetSuggestionsCard;
