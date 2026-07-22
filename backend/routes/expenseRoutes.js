const express = require('express');
const { getAllExpenses, createExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { expenseValidation } = require('../utils/validators');

const router = express.Router();

router.use(authenticate);

router.get('/', getAllExpenses);
router.post('/', expenseValidation, validate, createExpense);
router.put('/:id', expenseValidation, validate, updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
