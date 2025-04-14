const express = require('express');
const { getWorkingDaysByUser, 
    getAllWorkingDays, 
    calculateWorkingHours, 
    getTotalAttendance,
    getByUserIdAndMonthYear,
    getWorkingDayById
 } = require('../controllers/workingDayController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/user/:userId', protect(), getWorkingDaysByUser);
router.get('/', protect(), getByUserIdAndMonthYear); //query
router.get('/', protect(), getAllWorkingDays);
router.get('/:workingDayId', protect(), getWorkingDayById);
router.get('/calculate/:idUser/:date', protect(), calculateWorkingHours);
router.get('/attendance-count/:idUser/:date',protect(), getTotalAttendance);

module.exports = router;
