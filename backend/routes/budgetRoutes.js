const express = require('express');
const { getAllBudgets, createBudget, updateBudget, deleteBudget } = require('../controllers/budgetController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { budgetValidation } = require('../utils/validators');

const router = express.Router();

router.use(authenticate);

router.get('/', getAllBudgets);
router.post('/', budgetValidation, validate, createBudget);
router.put('/:id', budgetValidation, validate, updateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
