const pool = require('../config/db');
const { buildFilterQuery, parseSort } = require('../utils/helpers');
const { categorizeExpense } = require('../services/aiService');

// GET /api/expenses
const getAllExpenses = async (req, res) => {
  try {
    const { search, category, startDate, endDate, month, sortBy, sortOrder } = req.query;
    const filters = { search, category, startDate, endDate, month };

    let baseQuery = 'SELECT * FROM expenses WHERE user_id = ?';
    const { query, values } = buildFilterQuery(baseQuery, filters, [req.user.id]);

    const { field, order } = parseSort(sortBy, sortOrder, ['amount', 'date', 'category']);
    const finalQuery = `${query} ORDER BY ${field} ${order}`;

    const [expenses] = await pool.execute(finalQuery, values);
    res.json({ success: true, data: expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/expenses
const createExpense = async (req, res) => {
  try {
    let { amount, category, description, date } = req.body;

    // Auto-categorize via AI when category is not provided
    let aiMeta = null;
    if (!category) {
      aiMeta = await categorizeExpense(description || '');
      category = aiMeta.category;
    }

    const [result] = await pool.execute(
      'INSERT INTO expenses (user_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, amount, category, description || '', date]
    );

    const [expense] = await pool.execute('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
    res.status(201).json({
      success: true,
      message: aiMeta
        ? `Expense added and categorized as ${category}.`
        : 'Expense added successfully.',
      data: expense[0],
      aiCategorization: aiMeta || undefined,
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, description, date } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM expenses WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Expense record not found.' });
    }

    await pool.execute(
      'UPDATE expenses SET amount = ?, category = ?, description = ?, date = ? WHERE id = ? AND user_id = ?',
      [amount, category, description || '', date, id, req.user.id]
    );

    const [expense] = await pool.execute('SELECT * FROM expenses WHERE id = ?', [id]);
    res.json({ success: true, message: 'Expense updated successfully.', data: expense[0] });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute(
      'DELETE FROM expenses WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Expense record not found.' });
    }

    res.json({ success: true, message: 'Expense deleted successfully.' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllExpenses, createExpense, updateExpense, deleteExpense };
