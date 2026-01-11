const express = require('express');
const router = express.Router();
const { register, login,forgotPassword, resetPassword} = require('../controllers/authController'); 

router.post('/register', register);
router.post('/login', login);
// Forgot password - send reset link
router.post('/forgot-password', forgotPassword);

// Reset password - with token
router.post('/reset-password', resetPassword);

module.exports = router;
