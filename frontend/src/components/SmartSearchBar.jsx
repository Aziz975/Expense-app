import { useState } from 'react';
import { toast } from 'react-toastify';
import { Sparkles, Search, Loader2, X } from 'lucide-react';
import { aiAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

const SmartSearchBar = ({ onResults }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);
  const [meta, setMeta] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const { data } = await aiAPI.smartSearch(query.trim());
      setActive(true);
      setMeta({
        filters: data.data.filters,
        count: data.data.count,
        source: data.data.source,
      });
      onResults?.(data.data.expenses, true);
      toast.success(`Found ${data.data.count} matching expense(s).`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Smart search failed.');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setActive(false);
    setMeta(null);
    onResults?.(null, false);
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Smart search: "restaurant expenses", "above ₹5000", "Amazon last month"...'
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
        {active && (
          <button
            type="button"
            onClick={clearSearch}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Clear smart search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {meta && (
        <p className="text-xs text-gray-500">
          {meta.count} result(s) via {meta.source === 'ai' ? 'AI' : 'rules'}
          {meta.filters && Object.keys(meta.filters).length > 0 && (
            <> · Filters: {Object.entries(meta.filters).map(([k, v]) => `${k}=${v}`).join(', ')}</>
          )}
        </p>
      )}
    </div>
  );
};

export const SmartSearchResultHint = ({ expenses }) => {
  if (!expenses) return null;
  return (
    <div className="text-xs text-gray-500 mb-2">
      Showing AI smart search results
      {expenses[0] && ` · e.g. ${expenses[0].description || expenses[0].category} (${formatCurrency(expenses[0].amount)} on ${formatDate(expenses[0].date)})`}
    </div>
  );
};

export default SmartSearchBar;
