/**
 * Reusable AI service — OpenAI-compatible LLM client via native fetch.
 * Supports OpenAI, Groq, Together, Azure OpenAI, or any compatible base URL.
 * Falls back to rule-based logic when no API key is configured.
 */

const { EXPENSE_CATEGORIES } = require('../utils/helpers');

const AI_CATEGORIES = [
  'Food', 'Shopping', 'Travel', 'Entertainment', 'Bills',
  'Medical', 'Education', 'Salary', 'Investment', 'Other',
];

/** Map AI labels onto DB ENUM values (Health covers Medical). */
const CATEGORY_TO_DB = {
  Food: 'Food',
  Shopping: 'Shopping',
  Travel: 'Travel',
  Entertainment: 'Entertainment',
  Bills: 'Bills',
  Medical: 'Health',
  Health: 'Health',
  Education: 'Education',
  Salary: 'Other',
  Investment: 'Other',
  Other: 'Other',
};

const getApiKey = () => process.env.OPENAI_API_KEY || '';
const getBaseURL = () => (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const getModel = () => process.env.OPENAI_MODEL || 'gpt-4o-mini';
const getVisionModel = () => process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';

const isConfigured = () => Boolean(getApiKey());

/**
 * Call OpenAI-compatible chat completions API.
 */
const chatCompletion = async (messages, options = {}) => {
  if (!isConfigured()) {
    throw new Error('AI_NOT_CONFIGURED');
  }

  const body = {
    model: options.model || getModel(),
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 1500,
  };
  if (options.json) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(`${getBaseURL()}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API error ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
};

const parseJSON = (text) => {
  if (!text) throw new Error('Empty AI response');
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned);
};

/* ---------- Rule-based fallbacks (no API key) ---------- */

const CATEGORY_KEYWORDS = {
  Food: [
    'pizza', 'dominos', 'domino', 'burger', 'mcdonald', 'restaurant', 'cafe', 'coffee',
    'food', 'lunch', 'dinner', 'breakfast', 'swiggy', 'zomato', 'grocery', 'kirana',
    'starbucks', 'kfc', 'subway', 'biryani', 'meal',
  ],
  Shopping: [
    'amazon', 'flipkart', 'myntra', 'shop', 'mall', 'clothing', 'shoes', 'order',
    'purchase', 'store', 'ajio', 'meesho',
  ],
  Travel: [
    'uber', 'ola', 'taxi', 'flight', 'train', 'bus', 'metro', 'petrol', 'fuel',
    'hotel', 'travel', 'trip', 'cab', 'airbnb', 'irctc', 'parking',
  ],
  Entertainment: [
    'netflix', 'spotify', 'movie', 'cinema', 'game', 'concert', 'entertainment',
    'youtube', 'hotstar', 'prime video', 'playstation', 'xbox',
  ],
  Bills: [
    'electricity', 'water bill', 'internet', 'wifi', 'phone bill', 'recharge',
    'rent', 'emi', 'utility', 'gas bill', 'broadband', 'insurance premium',
  ],
  Health: [
    'pharmacy', 'apollo', 'hospital', 'doctor', 'medical', 'medicine', 'clinic',
    'dental', 'health', 'lab test', 'prescription',
  ],
  Education: [
    'school', 'college', 'tuition', 'course', 'udemy', 'book', 'education',
    'exam', 'university', 'fees', 'coursera',
  ],
};

const ruleBasedCategorize = (description) => {
  const lower = (description || '').toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return { category, confidence: 0.7, source: 'rules' };
    }
  }
  return { category: 'Other', confidence: 0.4, source: 'rules' };
};

const toDbCategory = (label) => {
  if (!label) return 'Other';
  const normalized = String(label).trim();
  if (EXPENSE_CATEGORIES.includes(normalized)) return normalized;
  return CATEGORY_TO_DB[normalized] || 'Other';
};

const categorizeExpense = async (description) => {
  if (!description?.trim()) {
    return { category: 'Other', confidence: 0, source: 'default' };
  }

  try {
    const text = await chatCompletion(
      [
        {
          role: 'system',
          content: `You are an expense categorization assistant. Classify the expense description into exactly one category.
Valid categories: ${AI_CATEGORIES.join(', ')}.
Map Medical-related to Medical, salary income-like to Salary, investments to Investment.
Respond ONLY with JSON: {"category":"...","confidence":0.0-1.0}`,
        },
        { role: 'user', content: description },
      ],
      { json: true, temperature: 0.1, maxTokens: 100 }
    );

    const parsed = parseJSON(text);
    return {
      category: toDbCategory(parsed.category),
      aiCategory: parsed.category,
      confidence: parsed.confidence ?? 0.8,
      source: 'ai',
    };
  } catch (err) {
    if (err.message !== 'AI_NOT_CONFIGURED') {
      console.error('AI categorize error:', err.message);
    }
    return ruleBasedCategorize(description);
  }
};

const analyzeSpending = async (financialContext) => {
  try {
    const text = await chatCompletion(
      [
        {
          role: 'system',
          content: `You are a personal finance advisor. Given the user's monthly expense data, write a concise 3-5 sentence human-readable spending summary.
Include total spent, top category share, notable changes vs last month, and one actionable tip.
Use ₹ for currency. Be specific with numbers from the data. Do not invent data.`,
        },
        { role: 'user', content: JSON.stringify(financialContext) },
      ],
      { temperature: 0.5, maxTokens: 400 }
    );
    return { summary: text, source: 'ai' };
  } catch (err) {
    if (err.message !== 'AI_NOT_CONFIGURED') {
      console.error('AI analyze error:', err.message);
    }
    return { summary: buildFallbackAnalysis(financialContext), source: 'rules' };
  }
};

const buildFallbackAnalysis = (ctx) => {
  const total = ctx.currentMonth?.totalExpense || 0;
  const cats = ctx.currentMonth?.byCategory || [];
  const top = cats[0];
  const prev = ctx.lastMonth?.totalExpense || 0;
  const pctChange = prev > 0 ? Math.round(((total - prev) / prev) * 100) : 0;
  const topShare = top && total > 0 ? Math.round((top.total / total) * 100) : 0;

  let summary = `You spent ₹${total.toLocaleString('en-IN')} this month.`;
  if (top) {
    summary += ` ${top.category} accounts for ${topShare}% of your expenses.`;
  }
  if (prev > 0) {
    summary += pctChange > 0
      ? ` Spending increased by ${pctChange}% compared to last month.`
      : pctChange < 0
        ? ` Spending decreased by ${Math.abs(pctChange)}% compared to last month.`
        : ' Spending is about the same as last month.';
  }
  summary += ' Consider reviewing your top spending category for savings opportunities.';
  return summary;
};

const suggestBudget = async (financialContext) => {
  try {
    const text = await chatCompletion(
      [
        {
          role: 'system',
          content: `You are a budget coach. Based on budget vs actual spending data, return JSON:
{"suggestions":["...","..."],"riskLevel":"low|medium|high","summary":"one sentence"}
Give 3-5 specific, actionable suggestions with ₹ amounts when possible. Do not invent categories not in the data.`,
        },
        { role: 'user', content: JSON.stringify(financialContext) },
      ],
      { json: true, temperature: 0.4, maxTokens: 500 }
    );
    const parsed = parseJSON(text);
    return { ...parsed, source: 'ai' };
  } catch (err) {
    if (err.message !== 'AI_NOT_CONFIGURED') {
      console.error('AI budget suggest error:', err.message);
    }
    return buildFallbackBudgetSuggestions(financialContext);
  }
};

const buildFallbackBudgetSuggestions = (ctx) => {
  const suggestions = [];
  const budgets = ctx.budgets || [];
  let riskLevel = 'low';

  for (const b of budgets) {
    const remaining = b.budgetAmount - b.spent;
    if (b.spent >= b.budgetAmount) {
      suggestions.push(`You have exceeded your ${b.category} budget by ₹${Math.abs(remaining).toLocaleString('en-IN')}.`);
      riskLevel = 'high';
    } else if (b.percentage >= 80) {
      suggestions.push(`You are likely to exceed your ${b.category} budget (used ${Math.round(b.percentage)}%).`);
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    } else if (remaining > 0 && b.percentage >= 50) {
      suggestions.push(`Reduce ${b.category} by approximately ₹${Math.round(remaining * 0.3).toLocaleString('en-IN')} to stay comfortably under budget.`);
    }
  }

  const comparisons = ctx.categoryComparison || [];
  for (const c of comparisons) {
    if (c.lastTotal > 0 && c.currentTotal >= c.lastTotal * 2) {
      suggestions.push(`Your ${c.category} expenses have doubled since last month.`);
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }
  }

  if (suggestions.length === 0) {
    suggestions.push('You are currently within your budgets. Keep tracking daily expenses.');
  }

  return {
    suggestions,
    riskLevel,
    summary: riskLevel === 'high'
      ? 'You are at high risk of overspending this month.'
      : riskLevel === 'medium'
        ? 'Some categories need attention to stay on budget.'
        : 'Your spending looks healthy relative to your budgets.',
    source: 'rules',
  };
};

const generateMonthlyReport = async (financialContext) => {
  try {
    const text = await chatCompletion(
      [
        {
          role: 'system',
          content: `You are a financial analyst. Produce a detailed monthly report as JSON with keys:
totalExpenses (number), totalIncome (number), highestSpendingCategory (string), lowestSpendingCategory (string),
budgetStatus (string), monthlyComparison (string), savingsTips (string[]), financialHealthScore (0-100),
summary (string), insights (string[]).
Use the provided data only. Currency ₹.`,
        },
        { role: 'user', content: JSON.stringify(financialContext) },
      ],
      { json: true, temperature: 0.4, maxTokens: 900 }
    );
    const parsed = parseJSON(text);
    return { report: enrichReportWithFacts(parsed, financialContext), source: 'ai' };
  } catch (err) {
    if (err.message !== 'AI_NOT_CONFIGURED') {
      console.error('AI report error:', err.message);
    }
    return { report: buildFallbackReport(financialContext), source: 'rules' };
  }
};

const enrichReportWithFacts = (report, ctx) => {
  const cats = ctx.currentMonth?.byCategory || [];
  return {
    ...report,
    totalExpenses: ctx.currentMonth?.totalExpense ?? report.totalExpenses,
    totalIncome: ctx.currentMonth?.totalIncome ?? report.totalIncome,
    highestSpendingCategory: cats[0]?.category || report.highestSpendingCategory || 'N/A',
    lowestSpendingCategory: cats.length ? cats[cats.length - 1].category : report.lowestSpendingCategory || 'N/A',
  };
};

const buildFallbackReport = (ctx) => {
  const totalExpenses = ctx.currentMonth?.totalExpense || 0;
  const totalIncome = ctx.currentMonth?.totalIncome || 0;
  const cats = ctx.currentMonth?.byCategory || [];
  const prev = ctx.lastMonth?.totalExpense || 0;
  const savings = totalIncome - totalExpenses;
  const budgetTotal = (ctx.budgets || []).reduce((s, b) => s + b.budgetAmount, 0);
  const spentVsBudget = budgetTotal > 0 ? (totalExpenses / budgetTotal) * 100 : null;

  let score = 70;
  if (savings > 0) score += 10;
  if (savings < 0) score -= 20;
  if (spentVsBudget !== null) {
    if (spentVsBudget > 100) score -= 15;
    else if (spentVsBudget < 80) score += 10;
  }
  if (prev > 0 && totalExpenses > prev * 1.2) score -= 10;
  score = Math.max(0, Math.min(100, score));

  const pctChange = prev > 0 ? Math.round(((totalExpenses - prev) / prev) * 100) : 0;

  return {
    totalExpenses,
    totalIncome,
    highestSpendingCategory: cats[0]?.category || 'N/A',
    lowestSpendingCategory: cats.length ? cats[cats.length - 1].category : 'N/A',
    budgetStatus: spentVsBudget === null
      ? 'No budget set for this month.'
      : spentVsBudget > 100
        ? `Over budget by ${Math.round(spentVsBudget - 100)}%.`
        : `Within budget (${Math.round(spentVsBudget)}% used).`,
    monthlyComparison: prev > 0
      ? `Expenses ${pctChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(pctChange)}% vs last month (₹${prev.toLocaleString('en-IN')} → ₹${totalExpenses.toLocaleString('en-IN')}).`
      : 'No previous month data for comparison.',
    savingsTips: [
      'Track daily small expenses — they often add up unnoticed.',
      cats[0] ? `Review ${cats[0].category} spending for the biggest savings potential.` : 'Set category budgets to control spending.',
      'Aim to save at least 20% of your monthly income.',
    ],
    financialHealthScore: score,
    summary: `Income ₹${totalIncome.toLocaleString('en-IN')}, expenses ₹${totalExpenses.toLocaleString('en-IN')}, net ₹${savings.toLocaleString('en-IN')}.`,
    insights: [
      cats[0] ? `${cats[0].category} is your largest expense category.` : 'No expenses recorded this month.',
      savings >= 0 ? `You saved ₹${savings.toLocaleString('en-IN')} this month.` : `You overspent income by ₹${Math.abs(savings).toLocaleString('en-IN')}.`,
    ],
  };
};

const generateInsights = async (financialContext) => {
  try {
    const text = await chatCompletion(
      [
        {
          role: 'system',
          content: `Generate 3-5 short dashboard insights as JSON: {"insights":["..."]}.
Each insight is one sentence with a specific number from the data. Use ₹.`,
        },
        { role: 'user', content: JSON.stringify(financialContext) },
      ],
      { json: true, temperature: 0.4, maxTokens: 350 }
    );
    const parsed = parseJSON(text);
    return { insights: parsed.insights || [], source: 'ai' };
  } catch (err) {
    if (err.message !== 'AI_NOT_CONFIGURED') {
      console.error('AI insights error:', err.message);
    }
    return { insights: buildFallbackInsights(financialContext), source: 'rules' };
  }
};

const buildFallbackInsights = (ctx) => {
  const insights = [];
  const total = ctx.currentMonth?.totalExpense || 0;
  const prev = ctx.lastMonth?.totalExpense || 0;
  const cats = ctx.currentMonth?.byCategory || [];
  const totalIncome = ctx.currentMonth?.totalIncome || 0;
  const budgetTotal = (ctx.budgets || []).reduce((s, b) => s + b.budgetAmount, 0);

  if (prev > 0) {
    const pct = Math.round(((total - prev) / prev) * 100);
    insights.push(
      pct >= 0
        ? `You spent ${pct}% more than last month.`
        : `You spent ${Math.abs(pct)}% less than last month.`
    );
  }
  if (cats[0]) {
    insights.push(`${cats[0].category} is your largest expense category (₹${cats[0].total.toLocaleString('en-IN')}).`);
  }
  const comparisons = ctx.categoryComparison || [];
  const biggestJump = comparisons
    .filter((c) => c.lastTotal > 0)
    .map((c) => ({ ...c, delta: c.currentTotal - c.lastTotal }))
    .sort((a, b) => b.delta - a.delta)[0];
  if (biggestJump && biggestJump.delta > 0) {
    insights.push(`${biggestJump.category} increased by ₹${biggestJump.delta.toLocaleString('en-IN')}.`);
  }
  if (budgetTotal > 0) {
    const saved = budgetTotal - total;
    insights.push(
      saved >= 0
        ? `You saved ₹${saved.toLocaleString('en-IN')} compared to your budget.`
        : `You are ₹${Math.abs(saved).toLocaleString('en-IN')} over your total budget.`
    );
  }
  if (totalIncome > 0) {
    insights.push(`Monthly income: ₹${totalIncome.toLocaleString('en-IN')}.`);
  }
  if (insights.length === 0) {
    insights.push('Add expenses and budgets to unlock personalized insights.');
  }
  return insights;
};

const chatAboutFinances = async (question, financialContext, history = []) => {
  try {
    const messages = [
      {
        role: 'system',
        content: `You are an AI finance assistant for an expense tracker app.
Answer ONLY using the provided user financial data. Be concise and specific with ₹ amounts.
If the data cannot answer the question, say so clearly.
Data snapshot:
${JSON.stringify(financialContext)}`,
      },
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: question },
    ];
    const answer = await chatCompletion(messages, { temperature: 0.3, maxTokens: 600 });
    return { answer, source: 'ai' };
  } catch (err) {
    if (err.message !== 'AI_NOT_CONFIGURED') {
      console.error('AI chat error:', err.message);
    }
    return { answer: buildFallbackChatAnswer(question, financialContext), source: 'rules' };
  }
};

const buildFallbackChatAnswer = (question, ctx) => {
  const q = (question || '').toLowerCase();
  const total = ctx.currentMonth?.totalExpense || 0;
  const cats = ctx.currentMonth?.byCategory || [];
  const prev = ctx.lastMonth?.totalExpense || 0;
  const income = ctx.currentMonth?.totalIncome || 0;
  const highest = ctx.highestExpense;

  if (q.includes('food')) {
    const food = cats.find((c) => c.category === 'Food');
    return food
      ? `You spent ₹${food.total.toLocaleString('en-IN')} on Food this month.`
      : 'No Food expenses recorded this month.';
  }
  if (q.includes('most') || q.includes('largest') || q.includes('highest category')) {
    return cats[0]
      ? `${cats[0].category} costs you the most this month at ₹${cats[0].total.toLocaleString('en-IN')}.`
      : 'No expense categories found for this month.';
  }
  if (q.includes('highest expense') || q.includes('largest expense') || q.includes('biggest expense')) {
    return highest
      ? `Your highest expense is ₹${Number(highest.amount).toLocaleString('en-IN')} on ${highest.category} (${highest.description || 'no description'}) dated ${highest.date}.`
      : 'No expenses found.';
  }
  if (q.includes('compare') || q.includes('last month')) {
    const pct = prev > 0 ? Math.round(((total - prev) / prev) * 100) : null;
    return pct === null
      ? `This month you spent ₹${total.toLocaleString('en-IN')}. No last-month data available.`
      : `This month: ₹${total.toLocaleString('en-IN')}. Last month: ₹${prev.toLocaleString('en-IN')} (${pct >= 0 ? '+' : ''}${pct}%).`;
  }
  if (q.includes('overspend') || q.includes('budget')) {
    const over = (ctx.budgets || []).filter((b) => b.spent > b.budgetAmount);
    if (over.length) {
      return `Yes — you overspent in: ${over.map((b) => `${b.category} (₹${b.spent.toLocaleString('en-IN')} / ₹${b.budgetAmount.toLocaleString('en-IN')})`).join(', ')}.`;
    }
    return 'You are within your set budgets for this month.';
  }
  if (q.includes('tip') || q.includes('saving') || q.includes('save')) {
    return cats[0]
      ? `Tip: Focus on reducing ${cats[0].category} spending first — it is your largest category. Also review subscriptions and set daily spending limits.`
      : 'Start by logging expenses daily and setting category budgets.';
  }
  if (q.includes('income')) {
    return `Your total income this month is ₹${income.toLocaleString('en-IN')}.`;
  }
  if (q.includes('spend') || q.includes('this month') || q.includes('how much')) {
    return `You spent ₹${total.toLocaleString('en-IN')} this month across ${cats.length} categories.`;
  }
  return `This month you spent ₹${total.toLocaleString('en-IN')} with income ₹${income.toLocaleString('en-IN')}. Ask about a category, budget, or comparison for more detail.`;
};

const parseSmartSearch = async (query) => {
  const fallback = ruleBasedSmartSearch(query);

  try {
    const text = await chatCompletion(
      [
        {
          role: 'system',
          content: `Convert a natural-language expense search into JSON filters only.
Allowed keys (omit unused): category (one of ${EXPENSE_CATEGORIES.join(', ')}),
search (keyword for description), minAmount (number), maxAmount (number),
startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), month (YYYY-MM).
Respond ONLY with JSON.`,
        },
        {
          role: 'user',
          content: `Query: "${query}"\nToday: ${new Date().toISOString().slice(0, 10)}`,
        },
      ],
      { json: true, temperature: 0.1, maxTokens: 250 }
    );
    const parsed = parseJSON(text);
    return { filters: sanitizeSearchFilters(parsed), source: 'ai' };
  } catch (err) {
    if (err.message !== 'AI_NOT_CONFIGURED') {
      console.error('AI smart search error:', err.message);
    }
    return { filters: fallback, source: 'rules' };
  }
};

const sanitizeSearchFilters = (raw) => {
  const filters = {};
  if (raw.category && EXPENSE_CATEGORIES.includes(raw.category)) {
    filters.category = raw.category;
  }
  if (raw.search && typeof raw.search === 'string') {
    filters.search = raw.search.slice(0, 100);
  }
  if (raw.minAmount != null && !Number.isNaN(Number(raw.minAmount))) {
    filters.minAmount = Number(raw.minAmount);
  }
  if (raw.maxAmount != null && !Number.isNaN(Number(raw.maxAmount))) {
    filters.maxAmount = Number(raw.maxAmount);
  }
  if (raw.startDate && /^\d{4}-\d{2}-\d{2}$/.test(raw.startDate)) {
    filters.startDate = raw.startDate;
  }
  if (raw.endDate && /^\d{4}-\d{2}-\d{2}$/.test(raw.endDate)) {
    filters.endDate = raw.endDate;
  }
  if (raw.month && /^\d{4}-\d{2}$/.test(raw.month)) {
    filters.month = raw.month;
  }
  return filters;
};

const ruleBasedSmartSearch = (query) => {
  const filters = {};
  const lower = (query || '').toLowerCase();
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);

  for (const cat of EXPENSE_CATEGORIES) {
    if (lower.includes(cat.toLowerCase())) {
      filters.category = cat;
      break;
    }
  }
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('pizza')) {
    filters.category = filters.category || 'Food';
  }
  if (lower.includes('medical') || lower.includes('pharmacy') || lower.includes('doctor')) {
    filters.category = 'Health';
  }
  if (lower.includes('amazon')) filters.search = 'amazon';

  const aboveMatch = lower.match(/(?:above|over|greater than|>)\s*₹?\s*([\d,]+)/);
  if (aboveMatch) filters.minAmount = Number(aboveMatch[1].replace(/,/g, ''));

  const belowMatch = lower.match(/(?:below|under|less than|<)\s*₹?\s*([\d,]+)/);
  if (belowMatch) filters.maxAmount = Number(belowMatch[1].replace(/,/g, ''));

  if (lower.includes('last month')) {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    filters.month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  } else if (lower.includes('this month')) {
    filters.month = thisMonth;
  }

  return filters;
};

/**
 * Extract expense fields from a receipt image (base64, no data-URL prefix required).
 */
const scanReceipt = async (base64Image, mimeType = 'image/jpeg') => {
  if (!isConfigured()) {
    throw new Error('AI_NOT_CONFIGURED');
  }

  const cleanBase64 = String(base64Image).replace(/^data:image\/\w+;base64,/, '');

  const text = await chatCompletion(
    [
      {
        role: 'system',
        content: `Extract expense details from this receipt image. Return JSON only:
{"merchantName":"...","amount":number,"date":"YYYY-MM-DD","category":"one of ${AI_CATEGORIES.join(', ')}","description":"...","confidence":0-1}
If a field is unclear, use null. Amount must be the total paid.`,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract merchant, amount, date, and category from this receipt.' },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${cleanBase64}` },
          },
        ],
      },
    ],
    { model: getVisionModel(), json: true, temperature: 0.1, maxTokens: 400 }
  );

  const parsed = parseJSON(text);
  return {
    merchantName: parsed.merchantName || null,
    amount: parsed.amount != null ? Number(parsed.amount) : null,
    date: parsed.date || new Date().toISOString().slice(0, 10),
    category: toDbCategory(parsed.category),
    description: parsed.description || parsed.merchantName || 'Receipt scan',
    confidence: parsed.confidence ?? 0.7,
    source: 'ai',
  };
};

module.exports = {
  categorizeExpense,
  analyzeSpending,
  suggestBudget,
  generateMonthlyReport,
  generateInsights,
  chatAboutFinances,
  parseSmartSearch,
  scanReceipt,
  toDbCategory,
  AI_CATEGORIES,
  isConfigured,
};
