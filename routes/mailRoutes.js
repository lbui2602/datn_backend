const express = require('express');
const router = express.Router();
const controller = require('../controllers/mailController');

router.post('/send-otp', controller.sendOtp);
router.post('/verify-otp', controller.verifyOtp);

module.exports = router;
