const PDFDocument = require('pdfkit');
const aiService = require('../services/aiService');
const expenseDataService = require('../services/expenseDataService');
const pool = require('../config/db');

// POST /api/ai/categorize
const categorize = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || !String(description).trim()) {
      return res.status(400).json({ success: false, message: 'Description is required.' });
    }

    const result = await aiService.categorizeExpense(description);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI categorize error:', error);
    res.status(500).json({ success: false, message: 'Failed to categorize expense.' });
  }
};

// GET /api/ai/analyze?month=YYYY-MM
const analyze = async (req, res) => {
  try {
    const month = req.query.month || expenseDataService.getMonthKey(0);
    const context = await expenseDataService.getFinancialContext(req.user.id, month);
    const result = await aiService.analyzeSpending(context);
    res.json({
      success: true,
      data: {
        month,
        summary: result.summary,
        source: result.source,
        totals: context.currentMonth,
      },
    });
  } catch (error) {
    console.error('AI analyze error:', error);
    res.status(500).json({ success: false, message: 'Failed to analyze spending.' });
  }
};

// GET /api/ai/budget-suggestions?month=YYYY-MM
const budgetSuggestions = async (req, res) => {
  try {
    const month = req.query.month || expenseDataService.getMonthKey(0);
    const context = await expenseDataService.getFinancialContext(req.user.id, month);
    const result = await aiService.suggestBudget(context);
    res.json({
      success: true,
      data: {
        month,
        ...result,
        budgets: context.budgets,
      },
    });
  } catch (error) {
    console.error('AI budget suggestions error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate budget suggestions.' });
  }
};

// GET /api/ai/insights?month=YYYY-MM
const insights = async (req, res) => {
  try {
    const month = req.query.month || expenseDataService.getMonthKey(0);
    const context = await expenseDataService.getFinancialContext(req.user.id, month);
    const result = await aiService.generateInsights(context);
    res.json({
      success: true,
      data: {
        month,
        insights: result.insights,
        source: result.source,
      },
    });
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate insights.' });
  }
};

// GET /api/ai/report?month=YYYY-MM
const monthlyReport = async (req, res) => {
  try {
    const month = req.query.month || expenseDataService.getMonthKey(0);
    const context = await expenseDataService.getFinancialContext(req.user.id, month);
    const result = await aiService.generateMonthlyReport(context);
    res.json({
      success: true,
      data: {
        month,
        report: result.report,
        source: result.source,
      },
    });
  } catch (error) {
    console.error('AI report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate AI report.' });
  }
};

// GET /api/ai/report/pdf?month=YYYY-MM
const exportReportPDF = async (req, res) => {
  try {
    const month = req.query.month || expenseDataService.getMonthKey(0);
    const context = await expenseDataService.getFinancialContext(req.user.id, month);
    const { report } = await aiService.generateMonthlyReport(context);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ai-report-${month}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('AI Monthly Financial Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Month: ${month}`);
    doc.text(`Financial Health Score: ${report.financialHealthScore}/100`);
    doc.moveDown();

    doc.fontSize(14).text('Overview');
    doc.fontSize(11);
    doc.text(`Total Income: ₹${Number(report.totalIncome || 0).toLocaleString('en-IN')}`);
    doc.text(`Total Expenses: ₹${Number(report.totalExpenses || 0).toLocaleString('en-IN')}`);
    doc.text(`Highest Category: ${report.highestSpendingCategory}`);
    doc.text(`Lowest Category: ${report.lowestSpendingCategory}`);
    doc.moveDown();

    doc.fontSize(14).text('Budget Status');
    doc.fontSize(11).text(report.budgetStatus || 'N/A');
    doc.moveDown();

    doc.fontSize(14).text('Monthly Comparison');
    doc.fontSize(11).text(report.monthlyComparison || 'N/A');
    doc.moveDown();

    doc.fontSize(14).text('Summary');
    doc.fontSize(11).text(report.summary || '');
    doc.moveDown();

    if (report.insights?.length) {
      doc.fontSize(14).text('Insights');
      report.insights.forEach((tip) => doc.fontSize(11).text(`• ${tip}`));
      doc.moveDown();
    }

    if (report.savingsTips?.length) {
      doc.fontSize(14).text('Savings Tips');
      report.savingsTips.forEach((tip) => doc.fontSize(11).text(`• ${tip}`));
    }

    doc.end();
  } catch (error) {
    console.error('AI report PDF error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to export AI report PDF.' });
    }
  }
};

// POST /api/ai/chat
const chat = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const month = req.body.month || expenseDataService.getMonthKey(0);
    const context = await expenseDataService.getFinancialContext(req.user.id, month);
    const result = await aiService.chatAboutFinances(
      message,
      context,
      Array.isArray(history) ? history : []
    );

    res.json({
      success: true,
      data: {
        answer: result.answer,
        source: result.source,
      },
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ success: false, message: 'Failed to process chat message.' });
  }
};

// POST /api/ai/smart-search
const smartSearch = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !String(query).trim()) {
      return res.status(400).json({ success: false, message: 'Search query is required.' });
    }

    const { filters, source } = await aiService.parseSmartSearch(query);
    const expenses = await expenseDataService.searchExpensesByFilters(req.user.id, filters);

    res.json({
      success: true,
      data: {
        query,
        filters,
        source,
        count: expenses.length,
        expenses,
      },
    });
  } catch (error) {
    console.error('AI smart search error:', error);
    res.status(500).json({ success: false, message: 'Failed to run smart search.' });
  }
};

// POST /api/ai/scan-receipt  (JSON: { image: base64, mimeType? })
const scanReceipt = async (req, res) => {
  try {
    const { image, mimeType } = req.body;

    if (!aiService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Receipt scanning requires OPENAI_API_KEY to be configured.',
      });
    }

    const extracted = await aiService.scanReceipt(image, mimeType || 'image/jpeg');

    res.json({
      success: true,
      data: extracted,
      message: 'Receipt scanned successfully. Confirm to create the expense.',
    });
  } catch (error) {
    console.error('AI scan receipt error:', error);
    const message =
      error.message === 'AI_NOT_CONFIGURED'
        ? 'Receipt scanning requires OPENAI_API_KEY to be configured.'
        : 'Failed to scan receipt. Please try a clearer image.';
    res.status(500).json({ success: false, message });
  }
};

// POST /api/ai/scan-receipt/confirm — create expense from confirmed scan data
const confirmReceipt = async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;

    if (!amount || !category || !date) {
      return res.status(400).json({
        success: false,
        message: 'Amount, category, and date are required.',
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO expenses (user_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, amount, category, description || '', date]
    );

    const [expense] = await pool.execute('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
    res.status(201).json({
      success: true,
      message: 'Expense created from receipt.',
      data: expense[0],
    });
  } catch (error) {
    console.error('Confirm receipt error:', error);
    res.status(500).json({ success: false, message: 'Failed to create expense from receipt.' });
  }
};

module.exports = {
  categorize,
  analyze,
  budgetSuggestions,
  insights,
  monthlyReport,
  exportReportPDF,
  chat,
  smartSearch,
  scanReceipt,
  confirmReceipt,
};
