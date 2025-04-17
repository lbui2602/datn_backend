const express = require('express');
const { verifyFace } = require('../controllers/faceController');
const upload = require('../middleware/baseMiddleware');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/verify-face',protect(), upload.single('file'), verifyFace);

module.exports = router;
