const express = require('express');
const { recordAttendance, getAttendanceByUser } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadAttendanceMiddleware');

const router = express.Router();

router.post('/', protect(),upload.single('image_file'), recordAttendance);
router.get('/:idUser', protect(), getAttendanceByUser);

module.exports = router;
