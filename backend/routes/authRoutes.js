const express = require('express');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerValidation, loginValidation, profileValidation } = require('../utils/validators');

const router = express.Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, profileValidation, validate, updateProfile);

module.exports = router;
