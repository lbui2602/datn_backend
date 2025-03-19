const Attendance = require('../models/Attendance');
const WorkingDay = require('../models/WorkingDay');
const path = require('path');

// Ghi nhận chấm công
const recordAttendance = async (req, res) => {
  try {
    const { userId, time, date } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng tải ảnh lên!", code: '0' });
    }

    const imagePath = `/uploads/attendances/${req.file.filename}`;

    // Tìm ngày làm việc hiện tại của user
    let workingDay = await WorkingDay.findOne({ userId, date }).populate('attendances');

    if (!workingDay) {
      workingDay = await WorkingDay.create({ userId, date, attendances: [], totalHours: 0 });
    }

    workingDay.totalHours = workingDay.totalHours || 0;

    // Kiểm tra lần chấm công trước đó
    const lastAttendance = workingDay.attendances.length > 0
      ? await Attendance.findById(workingDay.attendances[workingDay.attendances.length - 1])
      : null;

    let type = 'check_in';
    if (lastAttendance && lastAttendance.type === 'check_in') {
      type = 'check_out';
    }

    // Tạo bản ghi chấm công mới
    const attendance = await Attendance.create({ userId, date, time, type, image: imagePath });

    // Lưu vào danh sách chấm công
    workingDay.attendances.push(attendance._id);

    // Tính tổng số giờ làm
    if (type === 'check_out' && lastAttendance) {
      const hoursWorked = calculateHours(lastAttendance.time, time);
      if (!isNaN(hoursWorked) && hoursWorked > 0) {
        workingDay.totalHours += hoursWorked;
      }
    }

    await workingDay.save();

    // Lấy lại danh sách attendances theo ngày
    const updatedWorkingDay = await WorkingDay.findOne({ userId, date })
      .populate('attendances')
      .lean();

    res.status(201).json({
      message: "Điểm danh thành công!",
      code: '1',
      attendance: attendance,
      attendances: updatedWorkingDay.attendances,
      totalHours: updatedWorkingDay.totalHours
    });

  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, code: '0' });
  }
};

// Lấy danh sách chấm công theo user
const getAttendanceByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const attendances = await Attendance.find({ userId }).sort({ date: -1 });

    res.json({code:'1',attendances});
  } catch (error) {
    res.status(500).json({ message: "Server error: "+error.message, code:'0' });
  }
};

function calculateHours(startTime, endTime) {
  const toMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
  };

  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);

  return (endMinutes - startMinutes) / 60;
}

module.exports = { recordAttendance, getAttendanceByUser };
