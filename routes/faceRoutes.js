const express = require('express');
const { verifyFace, compareFaces } = require('../controllers/faceController');
const upload = require('../middleware/baseMiddleware');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/verify-face',protect(), upload.single('file'), verifyFace);
router.post('/compare-faces',protect() ,upload.single('image'), compareFaces);

module.exports = router;
