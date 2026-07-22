const express = require('express');
const {
  getMonthlyReport,
  getCategoryReport,
  exportPDF,
  exportExcel,
  getDashboard,
} = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', getDashboard);
router.get('/monthly', getMonthlyReport);
router.get('/category', getCategoryReport);
router.get('/export/pdf', exportPDF);
router.get('/export/excel', exportExcel);

module.exports = router;
