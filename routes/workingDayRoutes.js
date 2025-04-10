const express = require('express');
const { getWorkingDaysByUser, getAllWorkingDays, calculateWorkingHours, getTotalAttendance,getByUserIdAndMonthYear } = require('../controllers/workingDayController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/user/:userId', protect(), getWorkingDaysByUser);
router.get('/', protect(), getByUserIdAndMonthYear);
router.get('/', protect(), getAllWorkingDays);
router.get('/calculate/:idUser/:date', protect(), calculateWorkingHours);
router.get('/', protect(), getAllWorkingDays);
router.get('/attendance-count/:idUser/:date',protect(), getTotalAttendance);

module.exports = router;
