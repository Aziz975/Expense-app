const { body } = require('express-validator');

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required.').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character.'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match.');
    }
    return true;
  }),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

const profileValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('email').optional().trim().isEmail().withMessage('Valid email is required.'),
  body('newPassword')
    .optional()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character.'),
];

const incomeValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number.'),
  body('source').trim().notEmpty().withMessage('Source is required.'),
  body('date').isISO8601().withMessage('Valid date is required.'),
];

const expenseValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number.'),
  // Category optional — AI auto-categorizes from description when omitted
  body('category')
    .optional({ values: 'falsy' })
    .isIn(['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Education', 'Entertainment', 'Other'])
    .withMessage('Invalid category.'),
  body('date').isISO8601().withMessage('Valid date is required.'),
];

const budgetValidation = [
  body('category')
    .isIn(['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Education', 'Entertainment', 'Other'])
    .withMessage('Invalid category.'),
  body('budget_amount').isFloat({ min: 0.01 }).withMessage('Budget amount must be positive.'),
  body('month').matches(/^\d{4}-\d{2}$/).withMessage('Month must be in YYYY-MM format.'),
];

module.exports = {
  registerValidation,
  loginValidation,
  profileValidation,
  incomeValidation,
  expenseValidation,
  budgetValidation,
};
