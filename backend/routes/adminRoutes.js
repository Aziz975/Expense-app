const express = require('express');
const { getAllUsers, deleteUser, getUserExpenses, getAdminStats } = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, isAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.get('/users/:id/expenses', getUserExpenses);

module.exports = router;
