import { Sparkles, Loader2 } from 'lucide-react';

const AIInsightsCard = ({ insights = [], loading, source }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-950/40 dark:to-sky-950/30 border border-indigo-100 dark:border-indigo-800/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-200">Smart Insights</h3>
        </div>
        {source && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/70 dark:bg-gray-800/70 text-gray-500">
            {source === 'ai' ? 'AI' : 'Smart Rules'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300 py-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Generating insights...</span>
        </div>
      ) : insights.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">No insights available yet. Add expenses to get started.</p>
      ) : (
        <ul className="space-y-2">
          {insights.map((insight, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-indigo-500 mt-0.5">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AIInsightsCard;
