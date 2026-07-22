const pool = require('../config/db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// GET /api/reports/monthly
const getMonthlyReport = async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const userId = req.user.id;

    const [income] = await pool.execute(
      `SELECT COALESCE(SUM(amount), 0) as total FROM income 
       WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
      [userId, targetMonth]
    );

    const [expenses] = await pool.execute(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
       WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
      [userId, targetMonth]
    );

    const totalIncome = parseFloat(income[0].total);
    const totalExpense = parseFloat(expenses[0].total);
    const savings = totalIncome - totalExpense;

    res.json({
      success: true,
      data: {
        month: targetMonth,
        totalIncome,
        totalExpense,
        savings,
      },
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/reports/category
const getCategoryReport = async (req, res) => {
  try {
    const { month, startDate, endDate } = req.query;
    const userId = req.user.id;

    let query = `SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ?`;
    const values = [userId];

    if (month) {
      query += ` AND DATE_FORMAT(date, '%Y-%m') = ?`;
      values.push(month);
    }
    if (startDate) {
      query += ' AND date >= ?';
      values.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      values.push(endDate);
    }

    query += ' GROUP BY category ORDER BY total DESC';
    const [categories] = await pool.execute(query, values);

    const grandTotal = categories.reduce((sum, c) => sum + parseFloat(c.total), 0);
    const breakdown = categories.map((c) => ({
      category: c.category,
      total: parseFloat(c.total),
      percentage: grandTotal > 0 ? Math.round((parseFloat(c.total) / grandTotal) * 10000) / 100 : 0,
    }));

    res.json({ success: true, data: { categories: breakdown, grandTotal } });
  } catch (error) {
    console.error('Category report error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/reports/export/pdf
const exportPDF = async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const userId = req.user.id;

    const [income] = await pool.execute(
      `SELECT COALESCE(SUM(amount), 0) as total FROM income 
       WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
      [userId, targetMonth]
    );
    const [expenses] = await pool.execute(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
       WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
      [userId, targetMonth]
    );
    const [categoryData] = await pool.execute(
      `SELECT category, SUM(amount) as total FROM expenses 
       WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?
       GROUP BY category`,
      [userId, targetMonth]
    );

    const totalIncome = parseFloat(income[0].total);
    const totalExpense = parseFloat(expenses[0].total);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${targetMonth}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('Expense Tracker Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Month: ${targetMonth}`);
    doc.moveDown();
    doc.text(`Total Income: $${totalIncome.toFixed(2)}`);
    doc.text(`Total Expense: $${totalExpense.toFixed(2)}`);
    doc.text(`Savings: $${(totalIncome - totalExpense).toFixed(2)}`);
    doc.moveDown();
    doc.text('Category Breakdown:');
    categoryData.forEach((c) => {
      doc.text(`  ${c.category}: $${parseFloat(c.total).toFixed(2)}`);
    });

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/reports/export/excel
const exportExcel = async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const userId = req.user.id;

    const [incomeRows] = await pool.execute(
      `SELECT * FROM income WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
      [userId, targetMonth]
    );
    const [expenseRows] = await pool.execute(
      `SELECT * FROM expenses WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
      [userId, targetMonth]
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Expense Tracker';

    const incomeSheet = workbook.addWorksheet('Income');
    incomeSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Source', key: 'source', width: 20 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 },
    ];
    incomeRows.forEach((row) => incomeSheet.addRow(row));

    const expenseSheet = workbook.addWorksheet('Expenses');
    expenseSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 },
    ];
    expenseRows.forEach((row) => expenseSheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=report-${targetMonth}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/dashboard - Dashboard summary data
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentMonth = new Date().toISOString().slice(0, 7);

    const [totalIncome] = await pool.execute(
      'SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = ?',
      [userId]
    );
    const [totalExpense] = await pool.execute(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ?',
      [userId]
    );
    const [monthlyIncome] = await pool.execute(
      `SELECT COALESCE(SUM(amount), 0) as total FROM income 
       WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
      [userId, currentMonth]
    );
    const [monthlyExpense] = await pool.execute(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
       WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
      [userId, currentMonth]
    );

    // Monthly trend - last 6 months
    const [monthlyTrend] = await pool.execute(
      `SELECT DATE_FORMAT(date, '%Y-%m') as month, 
              COALESCE(SUM(amount), 0) as total 
       FROM expenses WHERE user_id = ? 
       AND date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(date, '%Y-%m') ORDER BY month ASC`,
      [userId]
    );

    // Income vs Expense for current month
    const incomeVsExpense = {
      income: parseFloat(monthlyIncome[0].total),
      expense: parseFloat(monthlyExpense[0].total),
    };

    // Category breakdown for current month
    const [categoryBreakdown] = await pool.execute(
      `SELECT category, SUM(amount) as total FROM expenses 
       WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?
       GROUP BY category`,
      [userId, currentMonth]
    );

    // Recent transactions (last 10)
    const [recentIncome] = await pool.execute(
      `SELECT id, date, description, source as category, 'income' as type, amount 
       FROM income WHERE user_id = ? ORDER BY date DESC LIMIT 5`,
      [userId]
    );
    const [recentExpenses] = await pool.execute(
      `SELECT id, date, description, category, 'expense' as type, amount 
       FROM expenses WHERE user_id = ? ORDER BY date DESC LIMIT 5`,
      [userId]
    );

    const recentTransactions = [...recentIncome, ...recentExpenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // Budget warnings
    const [budgets] = await pool.execute(
      'SELECT * FROM budgets WHERE user_id = ? AND month = ?',
      [userId, currentMonth]
    );
    const warnings = [];
    for (const budget of budgets) {
      const [spent] = await pool.execute(
        `SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
         WHERE user_id = ? AND category = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
        [userId, budget.category, currentMonth]
      );
      const spentAmount = parseFloat(spent[0].total);
      const percentage = (spentAmount / parseFloat(budget.budget_amount)) * 100;
      if (percentage >= 80) {
        warnings.push({
          category: budget.category,
          message: `Warning: Budget Limit Reached for ${budget.category} (${Math.round(percentage)}%)`,
        });
      }
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalIncome: parseFloat(totalIncome[0].total),
          totalExpense: parseFloat(totalExpense[0].total),
          balance: parseFloat(totalIncome[0].total) - parseFloat(totalExpense[0].total),
          monthlySavings: parseFloat(monthlyIncome[0].total) - parseFloat(monthlyExpense[0].total),
        },
        incomeVsExpense,
        categoryBreakdown: categoryBreakdown.map((c) => ({
          category: c.category,
          total: parseFloat(c.total),
        })),
        monthlyTrend: monthlyTrend.map((m) => ({
          month: m.month,
          total: parseFloat(m.total),
        })),
        recentTransactions,
        warnings,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getMonthlyReport,
  getCategoryReport,
  exportPDF,
  exportExcel,
  getDashboard,
};
