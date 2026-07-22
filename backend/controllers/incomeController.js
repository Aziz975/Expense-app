const pool = require('../config/db');
const { buildFilterQuery, parseSort } = require('../utils/helpers');

// GET /api/income
const getAllIncome = async (req, res) => {
  try {
    const { search, source, startDate, endDate, month, sortBy, sortOrder } = req.query;
    const filters = { search, source, startDate, endDate, month };

    let baseQuery = 'SELECT * FROM income WHERE user_id = ?';
    const { query, values } = buildFilterQuery(baseQuery, filters, [req.user.id]);

    const { field, order } = parseSort(sortBy, sortOrder, ['amount', 'date', 'source']);
    const finalQuery = `${query} ORDER BY ${field} ${order}`;

    const [income] = await pool.execute(finalQuery, values);
    res.json({ success: true, data: income });
  } catch (error) {
    console.error('Get income error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/income
const createIncome = async (req, res) => {
  try {
    const { amount, source, description, date } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO income (user_id, amount, source, description, date) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, amount, source, description || '', date]
    );

    const [income] = await pool.execute('SELECT * FROM income WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Income added successfully.', data: income[0] });
  } catch (error) {
    console.error('Create income error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/income/:id
const updateIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, source, description, date } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM income WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Income record not found.' });
    }

    await pool.execute(
      'UPDATE income SET amount = ?, source = ?, description = ?, date = ? WHERE id = ? AND user_id = ?',
      [amount, source, description || '', date, id, req.user.id]
    );

    const [income] = await pool.execute('SELECT * FROM income WHERE id = ?', [id]);
    res.json({ success: true, message: 'Income updated successfully.', data: income[0] });
  } catch (error) {
    console.error('Update income error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/income/:id
const deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute(
      'DELETE FROM income WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Income record not found.' });
    }

    res.json({ success: true, message: 'Income deleted successfully.' });
  } catch (error) {
    console.error('Delete income error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllIncome, createIncome, updateIncome, deleteIncome };
