const express = require('express');
const { getAllIncome, createIncome, updateIncome, deleteIncome } = require('../controllers/incomeController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { incomeValidation } = require('../utils/validators');

const router = express.Router();

router.use(authenticate);

router.get('/', getAllIncome);
router.post('/', incomeValidation, validate, createIncome);
router.put('/:id', incomeValidation, validate, updateIncome);
router.delete('/:id', deleteIncome);

module.exports = router;
