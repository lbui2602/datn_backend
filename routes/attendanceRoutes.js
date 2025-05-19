const express = require('express');
const { recordAttendance, getAttendanceByUser,getAttendanceByUserIdAndDate,getAllAttendance,getAllAttendanceWithFilter  } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadAttendanceMiddleware');

const router = express.Router();

router.post('/', protect(),upload.single('image_file'), recordAttendance);
router.get('/:userId', protect(), getAttendanceByUser);
router.post('/getByDate', protect(), getAttendanceByUserIdAndDate);
router.post('/getAll', protect(), getAllAttendance);
router.post('/getAllWithFilter', protect(), getAllAttendanceWithFilter);

module.exports = router;
