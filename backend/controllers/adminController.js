const pool = require('../config/db');

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }

    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/admin/users/:id/expenses
const getUserExpenses = async (req, res) => {
  try {
    const { id } = req.params;
    const [expenses] = await pool.execute(
      'SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC',
      [id]
    );
    const [income] = await pool.execute(
      'SELECT * FROM income WHERE user_id = ? ORDER BY date DESC',
      [id]
    );

    res.json({ success: true, data: { expenses, income } });
  } catch (error) {
    console.error('Get user expenses error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/admin/stats
const getAdminStats = async (req, res) => {
  try {
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [totalIncome] = await pool.execute('SELECT COALESCE(SUM(amount), 0) as total FROM income');
    const [totalExpense] = await pool.execute('SELECT COALESCE(SUM(amount), 0) as total FROM expenses');
    const [recentUsers] = await pool.execute(
      'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 5'
    );

    res.json({
      success: true,
      data: {
        totalUsers: userCount[0].count,
        totalIncome: parseFloat(totalIncome[0].total),
        totalExpense: parseFloat(totalExpense[0].total),
        recentUsers,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllUsers, deleteUser, getUserExpenses, getAdminStats };
