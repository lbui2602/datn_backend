const express = require('express');
const { recordAttendance, getAttendanceByUser } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect(), recordAttendance);
router.get('/:idUser', protect(), getAttendanceByUser);

module.exports = router;
