const WorkingDay = require('../models/WorkingDay');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');

// Lấy danh sách ngày làm việc của một nhân viên
const getWorkingDaysByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const workingDays = await WorkingDay.find({ userId }).populate('attendances');

    res.json({code:'1',workingDays});
  } catch (error) {
    res.status(500).json({ message: 'Server error: '+error.message,code:'0' });
  }
};
const getByUserIdAndMonthYear = async (req, res) => {
  try {
    const { userId, month, year } = req.query;

    const monthStr = month.padStart(2, '0');
    const yearStr = year.toString();

    const dateRegex = new RegExp(`^\\d{2}-${monthStr}-${yearStr}$`);

    const workingDays = await WorkingDay.find({
      userId: new mongoose.Types.ObjectId(userId), // ép kiểu nè!
      date: { $regex: dateRegex }
    }).populate('attendances');

    res.json({ code: '1', workingDays });
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message, code: '0' });
  }
};


// Lấy tất cả ngày làm việc của tất cả nhân viên
const getAllWorkingDays = async (req, res) => {
  try {
    const workingDays = await WorkingDay.find().populate('userId', 'name email').populate('attendances');

    res.json({code:'1',workingDays});
  } catch (error) {
    res.status(500).json({ message: 'Server error: '+error.message,code:'0' });
  }
};

// Tính tổng số giờ làm việc trong một ngày
const calculateWorkingHours = async (req, res) => {
  try {
    const { userId, date } = req.params;
    const workingDay = await WorkingDay.findOne({ userId, date }).populate('attendances');

    if (!workingDay) {
      return res.json({ message: "No working day found for this user on this date.",code:"0" });
    }

    let totalHours = 0;
    let lastCheckIn = null;

    workingDay.attendances.forEach(attendance => {
      if (attendance.type === 'check_in') {
        lastCheckIn = new Date(`${attendance.date} ${attendance.time}`);
      } else if (attendance.type === 'check_out' && lastCheckIn) {
        const checkOutTime = new Date(`${attendance.date} ${attendance.time}`);
        totalHours += (checkOutTime - lastCheckIn) / (1000 * 60 * 60);
        lastCheckIn = null;
      }
    });

    workingDay.totalHours = totalHours;
    await workingDay.save();

    res.json({ message: "Total working hours updated",code:'1', workingDay });
  } catch (error) {
    res.status(500).json({ message: 'Server error: '+error.message, code:'0' });
  }
};

const getTotalAttendance = async (req, res) => {
  try {
    const { userId, date } = req.params;
    
    // Tìm ngày làm việc theo idUser và date
    const workingDay = await WorkingDay.findOne({ userId, date }).populate('attendances');

    // Nếu không có dữ liệu, trả về 0
    if (!workingDay) {
      return res.json({ message: "Không có bản ghi nào trong ngày hôm nay.",code:'1', totalAttendance: 0 });
    }

    // Lấy tổng số lần chấm công
    const totalAttendance = workingDay.attendances.length;

    res.json({ message: "Total attendance count retrieved",code:'1', totalAttendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error: '+error.message,code:'0' });
  }
};

module.exports = { 
  getWorkingDaysByUser, 
  getAllWorkingDays, 
  calculateWorkingHours, 
  getTotalAttendance,
  getByUserIdAndMonthYear };

