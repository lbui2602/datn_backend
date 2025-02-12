const WorkingDay = require('../models/WorkingDay');
const Attendance = require('../models/Attendance');

// Lấy danh sách ngày làm việc của một nhân viên
const getWorkingDaysByUser = async (req, res) => {
  try {
    const { idUser } = req.params;
    const workingDays = await WorkingDay.find({ idUser }).populate('attendances');

    res.json(workingDays);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Lấy tất cả ngày làm việc của tất cả nhân viên
const getAllWorkingDays = async (req, res) => {
  try {
    const workingDays = await WorkingDay.find().populate('idUser', 'name email').populate('attendances');

    res.json(workingDays);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Tính tổng số giờ làm việc trong một ngày
const calculateWorkingHours = async (req, res) => {
  try {
    const { idUser, date } = req.params;
    const workingDay = await WorkingDay.findOne({ idUser, date }).populate('attendances');

    if (!workingDay) {
      return res.status(404).json({ message: "No working day found for this user on this date." });
    }

    let totalHours = 0;
    let lastCheckIn = null;

    workingDay.attendances.forEach(attendance => {
      if (attendance.type === 'check_in') {
        lastCheckIn = new Date(`${attendance.date} ${attendance.time}`);
      } else if (attendance.type === 'check_out' && lastCheckIn) {
        const checkOutTime = new Date(`${attendance.date} ${attendance.time}`);
        totalHours += (checkOutTime - lastCheckIn) / (1000 * 60 * 60); // Chuyển milliseconds sang giờ
        lastCheckIn = null;
      }
    });

    workingDay.totalHours = totalHours;
    await workingDay.save();

    res.json({ message: "Total working hours updated", workingDay });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getWorkingDaysByUser, getAllWorkingDays, calculateWorkingHours };
