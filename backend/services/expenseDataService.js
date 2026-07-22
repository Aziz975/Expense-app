/**
 * Aggregates user financial data from MySQL for AI prompts.
 */

const pool = require('../config/db');

const getMonthKey = (offset = 0) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthTotals = async (userId, month) => {
  const [income] = await pool.execute(
    `SELECT COALESCE(SUM(amount), 0) as total FROM income
     WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
    [userId, month]
  );
  const [expense] = await pool.execute(
    `SELECT COALESCE(SUM(amount), 0) as total FROM expenses
     WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
    [userId, month]
  );
  const [byCategory] = await pool.execute(
    `SELECT category, SUM(amount) as total FROM expenses
     WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?
     GROUP BY category ORDER BY total DESC`,
    [userId, month]
  );

  return {
    month,
    totalIncome: parseFloat(income[0].total),
    totalExpense: parseFloat(expense[0].total),
    byCategory: byCategory.map((c) => ({
      category: c.category,
      total: parseFloat(c.total),
    })),
  };
};

const getBudgetsWithSpend = async (userId, month) => {
  const [budgets] = await pool.execute(
    'SELECT * FROM budgets WHERE user_id = ? AND month = ?',
    [userId, month]
  );

  return Promise.all(
    budgets.map(async (budget) => {
      const [spent] = await pool.execute(
        `SELECT COALESCE(SUM(amount), 0) as total FROM expenses
         WHERE user_id = ? AND category = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
        [userId, budget.category, month]
      );
      const spentAmount = parseFloat(spent[0].total);
      const budgetAmount = parseFloat(budget.budget_amount);
      return {
        category: budget.category,
        budgetAmount,
        spent: spentAmount,
        remaining: budgetAmount - spentAmount,
        percentage: budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0,
      };
    })
  );
};

const getHighestExpense = async (userId, month) => {
  const [rows] = await pool.execute(
    `SELECT id, amount, category, description, date FROM expenses
     WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?
     ORDER BY amount DESC LIMIT 1`,
    [userId, month]
  );
  return rows[0] || null;
};

const getRecentExpenses = async (userId, limit = 15) => {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 15, 1), 50);
  const [rows] = await pool.execute(
    `SELECT amount, category, description, date FROM expenses
     WHERE user_id = ? ORDER BY date DESC LIMIT ${safeLimit}`,
    [userId]
  );
  return rows;
};

/**
 * Full financial context used by analysis, insights, chat, and reports.
 */
const getFinancialContext = async (userId, month) => {
  const currentMonthKey = month || getMonthKey(0);
  const lastMonthKey = (() => {
    const [y, m] = currentMonthKey.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  const [currentMonth, lastMonth, budgets, highestExpense, recentExpenses] = await Promise.all([
    getMonthTotals(userId, currentMonthKey),
    getMonthTotals(userId, lastMonthKey),
    getBudgetsWithSpend(userId, currentMonthKey),
    getHighestExpense(userId, currentMonthKey),
    getRecentExpenses(userId, 20),
  ]);

  const categoryMap = {};
  for (const c of lastMonth.byCategory) {
    categoryMap[c.category] = { lastTotal: c.total, currentTotal: 0 };
  }
  for (const c of currentMonth.byCategory) {
    if (!categoryMap[c.category]) {
      categoryMap[c.category] = { lastTotal: 0, currentTotal: c.total };
    } else {
      categoryMap[c.category].currentTotal = c.total;
    }
  }

  const categoryComparison = Object.entries(categoryMap).map(([category, vals]) => ({
    category,
    ...vals,
  }));

  return {
    currentMonth,
    lastMonth,
    budgets,
    highestExpense,
    recentExpenses,
    categoryComparison,
  };
};

/**
 * Run smart-search filters against expenses (parameterized — never raw AI SQL).
 */
const searchExpensesByFilters = async (userId, filters) => {
  let query = 'SELECT * FROM expenses WHERE user_id = ?';
  const values = [userId];

  if (filters.category) {
    query += ' AND category = ?';
    values.push(filters.category);
  }
  if (filters.search) {
    query += ' AND (description LIKE ? OR category LIKE ?)';
    const term = `%${filters.search}%`;
    values.push(term, term);
  }
  if (filters.minAmount != null) {
    query += ' AND amount >= ?';
    values.push(filters.minAmount);
  }
  if (filters.maxAmount != null) {
    query += ' AND amount <= ?';
    values.push(filters.maxAmount);
  }
  if (filters.startDate) {
    query += ' AND date >= ?';
    values.push(filters.startDate);
  }
  if (filters.endDate) {
    query += ' AND date <= ?';
    values.push(filters.endDate);
  }
  if (filters.month) {
    query += ` AND DATE_FORMAT(date, '%Y-%m') = ?`;
    values.push(filters.month);
  }

  query += ' ORDER BY date DESC, id DESC';
  const [rows] = await pool.execute(query, values);
  return rows;
};

module.exports = {
  getMonthKey,
  getMonthTotals,
  getBudgetsWithSpend,
  getFinancialContext,
  searchExpensesByFilters,
};
