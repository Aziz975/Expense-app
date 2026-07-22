const pool = require('../config/db');

// GET /api/budget
const getAllBudgets = async (req, res) => {
  try {
    const { month } = req.query;
    let query = 'SELECT * FROM budgets WHERE user_id = ?';
    const values = [req.user.id];

    if (month) {
      query += ' AND month = ?';
      values.push(month);
    }

    query += ' ORDER BY category ASC';
    const [budgets] = await pool.execute(query, values);

    // Calculate spent amount and progress for each budget
    const budgetsWithProgress = await Promise.all(
      budgets.map(async (budget) => {
        const [spent] = await pool.execute(
          `SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
           WHERE user_id = ? AND category = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
          [req.user.id, budget.category, budget.month]
        );

        const spentAmount = parseFloat(spent[0].total);
        const budgetAmount = parseFloat(budget.budget_amount);
        const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
        const warning = percentage >= 80;

        return {
          ...budget,
          spent: spentAmount,
          remaining: budgetAmount - spentAmount,
          percentage: Math.round(percentage * 100) / 100,
          warning,
        };
      })
    );

    res.json({ success: true, data: budgetsWithProgress });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/budget
const createBudget = async (req, res) => {
  try {
    const { category, budget_amount, month } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM budgets WHERE user_id = ? AND category = ? AND month = ?',
      [req.user.id, category, month]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Budget already exists for this category and month.',
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO budgets (user_id, category, budget_amount, month) VALUES (?, ?, ?, ?)',
      [req.user.id, category, budget_amount, month]
    );

    const [budget] = await pool.execute('SELECT * FROM budgets WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Budget created successfully.', data: budget[0] });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/budget/:id
const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, budget_amount, month } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM budgets WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Budget not found.' });
    }

    await pool.execute(
      'UPDATE budgets SET category = ?, budget_amount = ?, month = ? WHERE id = ? AND user_id = ?',
      [category, budget_amount, month, id, req.user.id]
    );

    const [budget] = await pool.execute('SELECT * FROM budgets WHERE id = ?', [id]);
    res.json({ success: true, message: 'Budget updated successfully.', data: budget[0] });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/budget/:id
const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute(
      'DELETE FROM budgets WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Budget not found.' });
    }

    res.json({ success: true, message: 'Budget deleted successfully.' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllBudgets, createBudget, updateBudget, deleteBudget };
