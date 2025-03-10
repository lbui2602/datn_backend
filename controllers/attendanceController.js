const Attendance = require('../models/Attendance');
const WorkingDay = require('../models/WorkingDay');
const path = require('path');

// Ghi nhận chấm công
const recordAttendance = async (req, res) => {
  try {
    const { idUser, time } = req.body;
    const date = getFormattedDate();

    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng tải ảnh lên!",code:'0' });
    }

    const imagePath = req.file.path.replace(/\\/g, "/"); // Chuẩn hóa đường dẫn

    // Tìm ngày làm việc hiện tại của user
    let workingDay = await WorkingDay.findOne({ idUser, date }).populate('attendances');

    if (!workingDay) {
      workingDay = await WorkingDay.create({ idUser, date, attendances: [], totalHours: 0 });
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
    const attendance = await Attendance.create({ idUser, date, time, type, image: imagePath });
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
    res.status(201).json({ message: "Attendance recorded successfully",code:'1', attendance, workingDay });
  } catch (error) {
    res.status(500).json({ message: "Server error", code:'0' });
  }
};

// Lấy danh sách chấm công theo user
const getAttendanceByUser = async (req, res) => {
  try {
    const { idUser } = req.params;
    const attendances = await Attendance.find({ idUser }).sort({ date: -1 });

    res.json({code:'1',attendances});
  } catch (error) {
    res.status(500).json({ message: "Server error", code:'0' });
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

const getFormattedDate = () => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
};

module.exports = { recordAttendance, getAttendanceByUser };
