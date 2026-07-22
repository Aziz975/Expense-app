const express = require('express');
const { body } = require('express-validator');
const {
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
} = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { EXPENSE_CATEGORIES } = require('../utils/helpers');

const router = express.Router();

router.use(authenticate);

router.post(
  '/categorize',
  [body('description').trim().notEmpty().withMessage('Description is required.')],
  validate,
  categorize
);

router.get('/analyze', analyze);
router.get('/budget-suggestions', budgetSuggestions);
router.get('/insights', insights);
router.get('/report', monthlyReport);
router.get('/report/pdf', exportReportPDF);

router.post(
  '/chat',
  [body('message').trim().notEmpty().withMessage('Message is required.')],
  validate,
  chat
);

router.post(
  '/smart-search',
  [body('query').trim().notEmpty().withMessage('Search query is required.')],
  validate,
  smartSearch
);

// Accept base64 image in JSON body (avoids multer dependency)
router.post(
  '/scan-receipt',
  [
    body('image').notEmpty().withMessage('Receipt image (base64) is required.'),
    body('mimeType')
      .optional()
      .isIn(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'])
      .withMessage('Invalid image type.'),
  ],
  validate,
  scanReceipt
);

router.post(
  '/scan-receipt/confirm',
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number.'),
    body('category').isIn(EXPENSE_CATEGORIES).withMessage('Invalid category.'),
    body('date').isISO8601().withMessage('Valid date is required.'),
  ],
  validate,
  confirmReceipt
);

module.exports = router;
